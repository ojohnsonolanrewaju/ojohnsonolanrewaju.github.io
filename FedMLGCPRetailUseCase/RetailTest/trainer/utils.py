import os
import logging

from hdbcli import dbapi

import pandas as pd
import numpy as np
import time

from sklearn import model_selection
import joblib
import pickle
from google.cloud import storage
from fedml_gcp import DbConnection
from sklearn.model_selection import train_test_split

# HELPER FUNCTIONS #
def get_dwc_data(table_name,table_size,package_name):
    db = DbConnection(package_name=package_name)
    start_time = time.time()
    data = db.get_data_with_headers(table_name=table_name, size=table_size)
    print("--- %s seconds ---" % (time.time() - start_time))
    data = pd.DataFrame(data[0], columns=data[1])
    return data

def create_lags_year(df, lag_variables):
    df = df.sort_values(['retailer', 'productsku',
                            'calendar_year', 'calendar_month'])
    lag_per = [1]
    for lag_col in lag_variables:
        for lag in lag_per:
            df[lag_col + '_lag_' + str(lag)] = calc_lags(
                df, ['retailer', 'productsku', 'calendar_year'], lag_col, lag)
    return df

def calc_cum_mean(df, groupby_cols, col):
    cum_mean = df.groupby(groupby_cols)[col].apply(
        lambda x: x.expanding().mean().fillna(value=0))
    return np.log1p(cum_mean.values)

def calc_lags(df, groupby_cols, on_col, lag):
    lags = df.groupby(groupby_cols)[on_col].shift(periods=lag).fillna(value=0)
    return np.log1p(lags.values)

def encode_cats(df, cat_cols):
    for cat in cat_cols:
        df[cat] = df[cat].astype('category')
    #return df

def upload_blob(bucket_name, source_file_name, destination_blob_name):

    storage_client = storage.Client()
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(destination_blob_name)

    blob.upload_from_filename(source_file_name)

    logging.info(
        "File {} uploaded to {}.".format(
            source_file_name, destination_blob_name
        )
    )

# MAIN FUNCTION CALLS #
def get_data(args):
    
    print('\n\n********* Handling Data - Splitting into Train and Test *********n\n')
    print(args['dist_table'])
    dist_data = get_dwc_data(args['dist_table'], float(args['dist_size']),args['package_name'])
    print('got dist_data')
    product_data = get_dwc_data(args['product_table'], float(args['product_size']),args['package_name'])
    print('got product_data')
    retailer_data = get_dwc_data(args['retailer_table'], float(args['retailer_size']),args['package_name'])
    print('got retailer_data')

    retail_master = get_dwc_data(args['combined_retailer_table'], float(args['combined_retailer_size']),args['package_name'])
    print('got retail_master_data')

    
    
    master_dist = dist_data.merge(product_data, how='left', left_on='productsku', right_on='Product').drop('Product', axis=1)
    master_dist = master_dist.merge(retailer_data, how='left', left_on='retailer', right_on='RetailID').drop('RetailID', axis=1)

    master_dist = master_dist[['productsku', 'retailer', 'Retailer', 'Type', 'calendar_year', 'calendar_month', 'max_allocation',
        'inventory_requested', 'mtd_consumption',  'Color',
        'Collection', 'Style', 'Season', 'Demographic', 'Fit', 'Material',
        ]]

    retail_master['previous_mo'] = retail_master['calendar_month'] - 1
    master_dist['previous_mo'] = master_dist['calendar_month'] - 1

    master_dist = master_dist.merge(retail_master, left_on=['productsku', 'retailer', 'calendar_year', 'previous_mo'], right_on=['productsku', 'retailer', 'calendar_year', 'previous_mo'] )

    master_dist = master_dist[['productsku', 'retailer', 'Retailer', 'Type', 'calendar_year',
           'calendar_month_x','inventory', 'sales', 'max_allocation', 'inventory_requested',
           'mtd_consumption', 'Color', 'Collection', 'Style', 'Season',
           'Demographic', 'Fit', 'Material']]

    master_dist = master_dist.rename(columns={'calendar_month_x': 'calendar_month', 'inventory': 'last_mo_inventory', 'sales': 'last_mo_sales' })

    return master_dist

def preprocess_data(master_dist):
    data = create_lags_year(df = master_dist, lag_variables = ['mtd_consumption'])
    data['Last_Mo_Sales_Avg'] = calc_cum_mean(data, ['productsku', 'calendar_year', 'calendar_month'], 'last_mo_sales')

    model_data = data[['productsku', 'retailer', 'Retailer', 'Type', 'calendar_year',
        'calendar_month', 'last_mo_inventory', 'last_mo_sales', 'Last_Mo_Sales_Avg',
        'mtd_consumption_lag_1',
        'max_allocation', 'inventory_requested', 'mtd_consumption', 'Color',
        'Collection', 'Style', 'Season', 'Demographic', 'Fit', 'Material']]

    cat_cols = ['productsku', 'retailer','Type', 'calendar_year',
        'calendar_month', 'Color',
        'Collection', 'Style', 'Season', 'Demographic', 'Fit', 'Material']


    log_cols = ['last_mo_inventory', 'last_mo_sales', 'mtd_consumption', 'max_allocation' ]
    for x in log_cols:
        model_data[x] = np.log1p(model_data[x])

    encode_cats(model_data, cat_cols)
    return model_data

def train_test_split(df):
    df_test = df[(df['calendar_year'] == 2020) & (df['calendar_month'].isin([10, 11, 12]))]
    df_train = df[~(((df['calendar_year'] == 2020)) & (df['calendar_month'].isin([10, 11, 12])))]
    results_df = df_test[['retailer', 'productsku', 'calendar_year',
                            'calendar_month', 'mtd_consumption']]
    return df_train, df_test,results_df



def dump_model(object_to_dump, output_path, flags):
    """Pickle the object and save to the output_path.
    Args:
      object_to_dump: Python object to be pickled
      output_path: (string) output path which can be Google Cloud Storage
    Returns:
      None
    """
        
    with open('model.pkl', 'wb') as model_file:
        pickle.dump(object_to_dump, model_file)
    
    upload_blob(flags.bucket_name, 'model.pkl', output_path+'model.pkl' )

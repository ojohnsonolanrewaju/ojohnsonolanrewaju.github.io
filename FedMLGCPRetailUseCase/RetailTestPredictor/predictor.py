import os
import pickle

import numpy as np
import joblib
import pandas as pd
from fedml_gcp import DbConnection
import time
from google.cloud.aiplatform.prediction.predictor import Predictor
from google.cloud.aiplatform.utils import prediction_utils



## PREDICTOR CLASS ##
class MyPredictor(Predictor):
    """An example Predictor for an AI Platform custom prediction routine."""

    def __init__(self):
        """Stores artifacts for prediction. Only initialized via `from_path`.
        """
        return

    # HELPER FUNCTIONS #
    def get_dwc_data(self, table_name,table_size):
        db = DbConnection(url='config.json')
        start_time = time.time()
        data = db.get_data_with_headers(table_name=table_name, size=table_size)
        print("--- %s seconds ---" % (time.time() - start_time))
        data = pd.DataFrame(data[0], columns=data[1])
        return data

    def calc_lags(self, df, groupby_cols, on_col, lag):
        lags = df.groupby(groupby_cols)[on_col].shift(periods=lag).fillna(value=0)
        return np.log1p(lags.values)

    def create_lags_year(self, df, lag_variables):
        print('in create_lag_year')
        df = df.sort_values(['retailer', 'productsku', 'calendar_year', 'calendar_month'])
        lag_per = [1]
        for lag_col in lag_variables:
            for lag in lag_per:
                df[lag_col + '_lag_' + str(lag)] = self.calc_lags(df, ['retailer', 'productsku', 'calendar_year'], lag_col, lag)
                return df

    def calc_cum_mean(self, df, groupby_cols, col):
        print('in calc_cum_mean')
        cum_mean = df.groupby(groupby_cols)[col].apply(lambda x: x.expanding().mean().fillna(value=0))
        return np.log1p(cum_mean.values)

    def encode_cats(self, df, cat_cols):
        for cat in cat_cols:
            df[cat] = df[cat].astype('category')   

    def test_split(self, df):
        df_test = df[pd.isnull(df['inventory_requested'])]
        results_df = df_test[['retailer', 'productsku', 'calendar_year','calendar_month', 'mtd_consumption']]
        return df_test, results_df
    
    # PREDICTION ROUTINE #
    def predict(self, instances):
        """Performs custom prediction.
        Preprocesses inputs, then performs prediction using the trained
        scikit-learn model.
        Args:
            instances: A list of prediction input instances.
        Returns:
            A list of outputs containing the prediction results.
        """
        arguments = {}
        instances = instances['instances']
        for i in instances:
            arguments[list(i.keys())[0]] = list(i.values())[0]

        distributor_data = self.get_dwc_data(arguments['dist_table'], float(arguments['dist_size']))
        print('distributor_data loaded')

        product_data = self.get_dwc_data(arguments['product_table'], float(arguments['product_size']))
        print('product_data loaded')

        retailer_data = self.get_dwc_data(arguments['retailer_table'], float(arguments['retailer_size']))
        print('retailer_data loaded')

        retail_master = self.get_dwc_data(arguments['combined_retailer_table'], float(arguments['combined_retailer_size']))
        print('retail_master loaded')
        
        master_dist = distributor_data.merge(product_data, how='left', left_on='productsku', right_on='Product').drop('Product', axis=1)
        master_dist = master_dist.merge(retailer_data, how='left', left_on='retailer', right_on='RetailID').drop('RetailID', axis=1)

        master_dist = master_dist[['productsku', 'retailer', 'Retailer', 'Type', 'calendar_year', 'calendar_month', 'max_allocation','inventory_requested', 'mtd_consumption',  'Color','Collection', 'Style', 'Season', 'Demographic', 'Fit', 'Material']]
        
        retail_master['previous_mo'] = retail_master['calendar_month'] - 1
        master_dist['previous_mo'] = master_dist['calendar_month'] - 1
        
        master_dist = master_dist.merge(retail_master, left_on=['productsku', 'retailer', 'calendar_year', 'previous_mo'], right_on=['productsku', 'retailer', 'calendar_year', 'previous_mo'])
        print('master_dist merged')

        
        master_dist = master_dist[['productsku', 'retailer', 'Retailer', 'Type', 'calendar_year','calendar_month_x', 'inventory', 'sales', 'max_allocation', 'inventory_requested','mtd_consumption', 'Color', 'Collection', 'Style', 'Season','Demographic', 'Fit', 'Material']]
        master_dist = master_dist.rename(columns={'calendar_month_x': 'calendar_month', 'inventory': 'last_mo_inventory', 'sales': 'last_mo_sales'})
        print('master_dist renamed columns')

        data = self.create_lags_year(df=master_dist, lag_variables=['mtd_consumption'])
        data['Last_Mo_Sales_Avg'] = self.calc_cum_mean(data, ['productsku', 'calendar_year', 'calendar_month'], 'last_mo_sales')
        model_data = data[['productsku', 'retailer', 'Retailer', 'Type', 'calendar_year','calendar_month', 'last_mo_inventory', 'last_mo_sales', 'Last_Mo_Sales_Avg','mtd_consumption_lag_1','max_allocation', 'inventory_requested', 'mtd_consumption', 'Color','Collection', 'Style', 'Season', 'Demographic', 'Fit', 'Material']]
        cat_cols = ['productsku', 'retailer', 'Type','calendar_year','calendar_month','Color','Collection', 'Style', 'Season', 'Demographic', 'Fit', 'Material']
        log_cols = ['last_mo_inventory', 'last_mo_sales','mtd_consumption', 'max_allocation']
        for x in log_cols:
            model_data[x] = np.log1p(model_data[x])
        self.encode_cats(model_data, cat_cols)
        print('encoded_cat columns')
        test, results = self.test_split(model_data)
        print('data split into test and results')
        print('test data')
        print('results data')

        del test['mtd_consumption']
        del test['inventory_requested']
        del test['Retailer']
        print('deleted 3 columns from test data')
        print('test data')

        print('predicting....')
        y_pred = np.expm1(self._model.predict(test))
        y_pred = [0 if i < 0 else i for i in y_pred]
        y_pred = [max_allocation if yp >= max_allocation else yp for yp, max_allocation in zip(y_pred,np.expm1(test['max_allocation']))]
        results['Prediction'] = y_pred
        print("assigned results['Prediction']")
        del results['mtd_consumption']
        print('deleted mtd_consumption from results')

        print('about to json.dumps()')
        return {"predictions": results.values.tolist()}

    def load(self, artifacts_uri: str):
        """
        This loads artifacts that have been copied from your model directory in
        Cloud Storage. MyPredictor uses them during prediction.
        """
        prediction_utils.download_model_artifacts(artifacts_uri)
        self._model = joblib.load("model.pkl")
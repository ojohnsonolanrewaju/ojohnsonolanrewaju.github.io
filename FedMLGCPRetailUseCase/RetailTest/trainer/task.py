import argparse
import logging
import os
import sys

import numpy as np

from trainer import model
from trainer import utils


def _train_and_evaluate(estimator, model_data, flags):
    train, test, results = utils.train_test_split(model_data)
    
    print('successfully data split into train and test.')
    train_y = train['mtd_consumption']
    test_y = test['mtd_consumption']

    del train['mtd_consumption']
    del train['inventory_requested']
    del train['Retailer']

    del test['mtd_consumption']
    del test['inventory_requested']
    del test['Retailer']

    print('fitting the model...')

    estimator.fit(train, train_y)
    
    y_pred = np.expm1(estimator.predict(test))
    y_pred = [0 if i < 0 else i for i in y_pred]
    results['Prediction'] = y_pred

    results['mtd_consumption'] = np.expm1(results['mtd_consumption'])

    utils.dump_model(estimator, flags.bucket_folder+'/model/', flags)
    logging.info('saved model!')



def run_experiment(flags):
    arguments = {'dist_table': flags.dist_table,
                 'dist_size': float(flags.dist_size),
                 'product_table': flags.product_table,
                 'product_size': float(flags.product_size),
                 'retailer_table': flags.retailer_table,
                 'retailer_size': float(flags.retailer_size),
                 'combined_retailer_table': flags.combined_retailer_table,
                 'combined_retailer_size': float(flags.combined_retailer_size),
                 'package_name': flags.package_name}
    
    model_data = utils.get_data(arguments)
    preprocessed_data = utils.preprocess_data(model_data)

    logging.info('data retrieved successfully')
    

    estimator = model.get_estimator(flags.lgbmregression_objective)

    _train_and_evaluate(estimator, preprocessed_data, flags)


def _parse_args(argv):
    """Parses command-line arguments."""

    parser = argparse.ArgumentParser()

    parser.add_argument('--dist_table', type=str)
    parser.add_argument('--dist_size', type=str)
    parser.add_argument('--product_table', type=str)
    parser.add_argument('--product_size', type=str)
    parser.add_argument('--retailer_table', type=str)
    parser.add_argument('--retailer_size', type=str)

    parser.add_argument('--combined_retailer_table', type=str)
    parser.add_argument('--combined_retailer_size', type=str)
    
    parser.add_argument('--bucket_name', type=str)
    parser.add_argument('--lgbmregression_objective', type=str)
    parser.add_argument('--job-dir', type=str)
    parser.add_argument('--bucket_folder', type=str)
    parser.add_argument('--package_name', type=str)
    
    return parser.parse_args(argv)


def main():
    """Entry point."""
    logging.info('model starting')

    flags = _parse_args(sys.argv[1:])
    
    logging.basicConfig(level='INFO')
    run_experiment(flags)


if __name__ == '__main__':
    main()

import lightgbm as lgb

def get_estimator(obj):
    estimator = lgb.LGBMRegressor(objective=obj)
    return estimator

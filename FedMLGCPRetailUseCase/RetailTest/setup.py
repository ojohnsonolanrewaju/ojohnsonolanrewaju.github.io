import setuptools


REQUIRED_PACKAGES = [
    'fedml_gcp',
    'pandas',
    'numpy',
    'hdbcli',
    'pandas-gbq',
    'lightgbm'

]

setuptools.setup(
    name='dwc_gcp_model_v4',
    version='v4',
    install_requires=REQUIRED_PACKAGES,
    packages=setuptools.find_packages(),
    include_package_data=True,
    description='dwc_gcp_model_training',
    package_data={'trainer': ['config.json']}
)

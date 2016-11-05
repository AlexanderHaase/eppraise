# eppraise: An Ebay Appraiser #

## About ##
Eppraise is a library to help estimate value of items based on sold ebay 
listings. It uses the python-ebay API to connect and query data, then provides
convience wrappers for extracting features.

## Install ##
Required debian packages are listed in packages.lst.

Install Steps:

  - Install dependencies: 'sudo apt-get install $( cat ./packages.lst )'
  - Install ebay library:
    - Clone the repo: 'git clone https://github.com/timotheus/ebaysdk-python'
    - Install the repo: 'cd ebayskd-python; python setup.py install --user'

## Configure ##
Configuration Steps:
  - Obtain an Ebay API App ID: 'https://developer.ebay.com/signin?return_to=%2FDevZone%2Faccount%2F'
  - Create a config file: 'cp config.yaml.example config.yaml'
  - Place an App ID in the config file: 'ebay: { id: "my-app-id" }'

## Stand-alone Usage ##
Stand-alone use centers around querying and updating ranges from xlsx spreadsheets:
  'eppraise.py -c config.yaml -f mySpreadsheet.xlsx -i A2:A200 -o B2:B200'

See 'eppraise.py --help' for details.

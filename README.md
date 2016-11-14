# eppraise: An Ebay Appraiser #

## About ##
Eppraise is a library to help estimate value of items based on sold ebay 
listings. It uses the python-ebay API to connect and query data, SQL storage
(default sqlite) to collect data over time, and serval convenience classes for
working with data. It also provides several command line features for high
level usage.

## Install ##
Eppraise is python3-based. Required debian packages are listed in packages.lst.

Install Steps:

  - Install dependencies: `sudo apt-get install $( cat ./packages.lst )`
  - Install ebay library:
    - Clone the repo: `git clone https://github.com/timotheus/ebaysdk-python`
    - Install the repo: `cd ebayskd-python; python3 setup.py install --user`

## Configure ##
Configuration Steps:
  - Obtain an [Ebay API App ID](https://developer.ebay.com/signin?return_to=%2FDevZone%2Faccount%2F)
  - Create a config file: `cp config.yaml.example config.yaml`
  - Place an App ID in the config file: `ebay: { id: "my-app-id-key-9876543210" }`

## Usage ##
As an application, eppraise expresses several subcommands, simiarl to git and
svn. Commands faciliate administrating watches, bulk IO, collecting data, and
a local web server. Peruse it's help documentation for details around each 
command.

All commands are database-relative. By default, the database is assumed to
reside at `./eppraise.db`; use the `--database-url` switch to specify 
otherwise. Database URLs should use SQLAlchemy syntax. Database schema is
auto-created on connect as appropriate.

### Example Workflow ###

Add or enable a watch:
```
eppraise.py watch "Some Ebay keywords"
```

Disable a watch:
```
eppraise.py watch "Some Ebay keywords" --disable
```

Add many watches from a spreadsheet:
```
eppraise.py xlsx mySpreadsheet.xlsx --input-range='A2:A200'
```

Add watches and output estimates from/to a spreadsheet:
```
eppraise.py xlsx mySpreadsheet.xlsx --input-range='A2:A200' --output-range='B2:B200'
```

Query ebay for watch results:
```
eppraise.py update
```

Start the webserver on port 5000:
```
eppraise.py web
```

Manually specify configuration, database, or verbosity:
```
eppraise.py --verbose=DEBUG --config=myConfig.yaml --database-url=myDB.db [SUBCOMMAND] ...
```


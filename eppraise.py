#!/usr/bin/python3
from ebaysdk.finding import Connection as Finding
from ebaysdk.exception import ConnectionError

import itertools
import functools
import openpyxl
import sys
import re
import yaml
import argparse
import logging
import json
import datetime
from sqlalchemy.ext.declarative import declarative_base, declared_attr, as_declarative
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, create_engine
from sqlalchemy.orm import relationship

logger = logging.getLogger( __name__ )

#
# Setup SQL Schema
#
@as_declarative()
class SQLBase( object ):
	'''Common properties for all sql objects'''
	@declared_attr
	def __tablename__(cls):
		return cls.__name__.lower()

	id = Column( Integer, primary_key = True, autoincrement = True )


class JSONProps( object ):
	'''Mix-in for text<->json'''
	
	text = Column( String, nullable = False )

	@property
	def json( self ):
		return json.loads( self.text )

	@json.setter
	def json( self, data ):
		text = json.dumps( data )

class Query( SQLBase ):
	'''Saved watch for items'''
	keywords = Column( String )

class QueryResult( SQLBase, JSONProps ):
	'''Record of executing a query. Future-proofing our data!'''
	keywords = Column( String )
	retrieved = Column( DateTime, default = datetime.datetime.utcnow, nullable = False )

class Item( SQLBase, JSONProps ):
	'''Record from ebay. We're watching completed items, so one per item is enough.'''
	ebayID = Column( String, primary_key = True, nullable = False )

	query_id = Column( Integer, ForeignKey( Query.id ), nullable = False )
	query = relationship( Query, back_populates = "items" )

	
#
# Ebay connections
#

class Estimate( object ):
	'''
	Estimate for a single search result, focusing on sold items. Mostly
	focuses on dynamically extracting features from data, rather than
	statically compution/storing them.
	
	'''

	def __init__( self, keyword, result ):
		self.raw = result
		self.keyword = keyword
		self.items = result.dict()[ 'searchResult' ].get( 'item', tuple() )


	def sold( self ):
		'''Fetch an iterator of sold items'''
		return filter( (lambda item: item[ 'sellingStatus' ][ 'sellingState' ] == 'EndedWithSales' ), self.items )

	def prices( self ):
		'''Fetch an iterator of sold prices'''
		return map( (lambda item: item[ 'sellingStatus' ][ 'currentPrice' ][ 'value' ] ), self.sold() )

	def mean( self ):
		'''Mean sold price'''
		(total, qty) = functools.reduce( (lambda accum, price: ( accum[ 0 ] + float(price), accum[ 1 ] + 1.0 ) ), self.prices(), ( 0.0, 0.0 ) )
		return total / qty if qty > 0 else None
		

class Connection( object ):
	'''Syntatic sugar for interacting with the ebay sdk'''

	def __init__( self, **kwargs ):
		self.api = Finding( **kwargs )

	def query( self, item ):
		return self.api.execute( 'findCompletedItems', {'keywords': item, } )

	def estimate( self, item ):
		'''Create an estimate for the given item'''
		return Estimate( item, self.query( item ) )

	def estimateFile( self, file, inputRange, outputRange ):
		'''Proof of concept method for dumping this to/from a file'''
		wb = openpyxl.load_workbook( file )
		sheet = wb.active
		ioRange = zip( sheet[ inputRange ], sheet[ outputRange ] )
		
		def handleElement( ioElement ):
			keys = re.sub( '(\s)', ' ', ioElement[ 0 ][ 0 ].value ).split()
			filtered = map( lambda key: re.sub( '(\W)', '', key ), keys )
			key = ' '.join( filter( None, filtered ) )
			sys.stderr.write( key )
			est = self.estimate( key )
			mean = est.mean()
			sys.stderr.write( ': {}\n'.format( mean ) )
			ioElement[ 1 ][ 0 ].value = mean

		functools.reduce( lambda x,y: None, map( handleElement, ioRange ) )
		wb.save( file )


if __name__ == '__main__':

	# Setup parser
	parser = argparse.ArgumentParser()
	parser.add_argument('-c','--config', required = True, help = "Configuration for ebay API" )
	parser.add_argument('-f','--file', required = True, help = "Input spreadsheet" )
	parser.add_argument('-i', '--input-range', required = True, help = "Range of items in spreadsheet to estimate, one per cell" )
	parser.add_argument('-o', '--output-range', required = True, help = "Range for output estimates in sheet, same size as input range" )

	# parse args
	args = parser.parse_args();

	# read config
	with open( args.config, 'r' ) as handle:
		config = yaml.safe_load( handle )

	# connect
	con = Connection( config_file = None, appid = config[ 'ebay' ][ 'id' ] )

	# estimate
	con.estimateFile( args.file, args.input_range, args.output_range )




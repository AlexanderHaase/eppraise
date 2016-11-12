$( document ).ready( function() {

	var getProp = function( name )
	{
		return function( obj ) {
			return obj[ name ];
		};
	};

	var currency = function( number )
	{
		if( number == null || typeof( number ) == "undefined" )
		{
			return "<italic>Unknown</italic>";
		}
		else
		{
			return "$" + Math.round( number * 100.0 ) / 100.0;
		}
	};

	var autoHeight = function( selector, offset )
	{
		offset = typeof( offset ) == 'undefined' ? 0.95 : offset;

		var obj = $( selector );
		var onResize = function() { 
			obj.height( window.innerHeight * offset - obj.offset().top ); 
		};
		$( window ).resize( onResize );
		onResize();
	};

	var graphController = {
		id: null,
		data: [],
		render: function( id )
		{
			d3.json( '/watch/' + id + '/items', function( error, data ) 
			{
				data.forEach( function( element )
				{
					element.date = new Date( element.date );
				} );

				var panel = d3.select( "#watch-graph" );

				panel.selectAll( "h1" ).remove();
				panel.selectAll( "svg" ).remove();

				var svg = panel.append( 'svg' )
					.attr( 'width', "100%" )
					.attr( 'id', 'watch-svg' );

				autoHeight( '#watch-svg' );

				var xValue = function( element ) { return element.date.getTime(); };
				var yValue = function( element ) { return Number( element.price ); };

				var dataInfo = function( elem, data, xValue, yValue, buffer )
				{
					var axisInfo = function( attr, data, getter, buffer ) {
						var min = d3.min( data, getter );
						var max = d3.max( data, getter );
						return {
							domain: {
								min: function() { return min; },
								max: function() { return max; },
								scale: function() { return this.max() - this.min(); },
							},
							range: {
								min: function() { return buffer; },
								max: function() { return attr - buffer; },
								scale: function() { return this.max() - this.min(); },
							},
							scale: function() { return this.range.scale() / this.domain.scale(); },
							offset: function() { return this.range.min() - this.scale() * this.domain.min(); },
							map: function( element ) { return this.scale() * getter( element ) + this.offset(); },
						};
					};

					return {
						x: axisInfo( elem.width(), data, xValue, buffer ),
						y: axisInfo( elem.height(), data, yValue, buffer ),
					};
				};

				var root = svg.append( 'g' )
					;//.attr( 'transform', 'matrix(' + xInfo.scale() + ',0,0,' + yInfo.scale() + ',' + xInfo.offset() + ',' + yInfo.offset() + ')' );

				var radius = 4;

				var points = root.selectAll( "g" )
					.data( data )
					.enter()
					.append( 'g' )
					//.attr( 'transform', function( data ) { return 'translate(' + info.x.map( data ) + ',' + info.y.map( data ) + ')'; } )
					.on( 'click', function( data ) {
						window.open(data.url, '_blank').focus();
					} )
					.on( 'mouseover', function( data ) {
						var circle = d3.select( this ).select( 'circle' );
						d3.select( this )
							.append( 'text' )
							.attr( 'dx', radius )
							.attr( 'dy', radius * 2 )
							.text( currency( data.price ) + ' ' + data.date );
					} )
					.on( 'mouseout', function( data ) {
						d3.select( this )
							.selectAll( 'text' )
							.remove();
					} );

				var circles = points.append( 'circle' )
					.attr( 'r', radius )
					.attr( 'fill', 'black' );

				if( typeof( this.onResize ) != 'undefined' )
				{
					$( window ).off( 'resize', this.onResize );
				}

				this.onResize = function() {
					var info = dataInfo( $( '#watch-svg' ), data, xValue, yValue, 10 );
					points.attr( 'transform', function( data ) { return 'translate(' + info.x.map( data ) + ',' + info.y.map( data ) + ')'; } )
					/*circles.attr( 'cx', info.x.map.bind( info.x ) )
						.attr( 'cy', info.y.map.bind( info.y ) );*/
				};

				this.onResize();
				$( window ).resize( onResize );
			} );
		},
	};


	d3.json( '/watch', function( error, data ) {

		var table = d3.select( "#watch-table" )
		table.selectAll( "tbody" ).remove()


		var thead = table.append( "thead" );
		var tbody = table.append( "tbody" );

		if( data.length == 0 )
		{
			tbody.selectAll( "tr" ).append( "tr" ).data( [{"text":"No Data"}] ).enter().append( "td" ).html( function( element ) { return "<italic>" + element.text + "</italic>"; } );
		}
		else
		{
			// Touch up data
			//
			data.forEach( function( element ) {

				element.estimate = currency( element.estimate );
				delete element.enabled;
				element.load = '<div class="btn-group btn-group-xs" role="group"><a href="#" class="btn btn-default watch-load" id="watch-load-' + element.id + '" role="button">Load</a></div>';
			} );

			// Render table
			//
			var columns = Object.keys( data[ 0 ] )

			thead.append( "tr" ).selectAll( "th" ).data( columns ).enter().append( 'th' ).text( function( data ) { return data; });

			var tr = tbody.selectAll( "tr" )
				.data( data )
				.enter()
				.append( "tr" );

			var td = tr.selectAll( 'td' )
				.data( function( row, index ) { 
					return columns.map( function( column ) { return { column: column, value: row[ column ] }; } );
				} )
				.enter()
				.append( 'td' )
				.html( getProp( 'value' ) );

			// Activate buttons
			//
			$( ".watch-load" ).click( function( event ) {
				event.preventDefault();
				var id = $( this ).attr( 'id' ).split( '-' )[ 2 ];
				graphController.render( id );
			} );

			// TODO: Vertical scroll
			//
			var jqTbody = $( "#watch-table > tbody" );
			jqTbody.css( "overflow-y", "auto" );
			var onResize = function() { 
				jqTbody.height( window.innerHeight *.95 - jqTbody.offset().top ); 
			};
			$( window ).resize( onResize );
			onResize();
		}
		
		window.data = data;
		console.log( "hi" );
	});
});

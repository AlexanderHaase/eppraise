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
		fetch: function( id )
		{
			d3.json( '/watch/' + id + '/items', (function( error, data ) 
			{
				data.forEach( function( element )
				{
					element.date = d3.isoParse( element.date );
				} );

				this.id = id;
				this.data = data;
				this.render();
			}).bind( this ) );
		},
		render: function()
		{
			var panel = d3.select( "#watch-graph" );

			panel.selectAll( "h1" ).remove();
			panel.selectAll( "svg" ).remove();

			if( this.data.length == 0 )
			{
				panel.append( "h1" )
					.attr( "style", "text-align:center;" )
					.html( "<small>No Data</small>" );
				return;
			}

			var svg = panel.append( 'svg' )
				.attr( 'width', "100%" )
				.attr( 'id', 'watch-svg' );

			autoHeight( '#watch-svg' );

			var xValue = getProp( 'date' );
			var yValue = function( element ) { return Number( element.price ); };

			var radius = 4;
			var padding = 50;

			var dom = $( '#watch-svg' );

			var margin = {
				top: padding,
				bottom: padding,
				left: padding,
				right: padding,
			};

			var size = {
				width: dom.width() - margin.left - margin.right,
				height: dom.width() - margin.top - margin.bottom,
			};

			var scale = {
				x: d3.scaleLinear()
					.domain( [ d3.min( this.data, xValue ), d3.max( this.data, xValue ) ] )
					.range( [ 0, size.width ] ),
				y: d3.scaleTime()
					.domain( [ d3.min( this.data, yValue ), d3.max( this.data, yValue ) ] )
					.range( [ size.height, 0 ] ),
			};

			var axis = {
				x: d3.axisBottom()
					.scale( scale.x ),
				y: d3.axisLeft()
					.scale( scale.y ),
			};

			var root = svg.append( 'g'  )
				.attr( 'transform', 'translate(' + margin.left + ',' + margin.top + ')' );

			root.append( 'g' )
				.attr( 'transform', 'translate(0,' + size.height + ')' )
				.call( axis.x );

			root.append( 'g' )
				.call( axis.y );

			var radius = 4;

			var points = root.append( 'g' )
				.attr( 'class', 'points' )
				.selectAll( "g" )
				.data( this.data )
				.enter()
				.append( 'g' )
				.attr( 'transform', function( data ) { return 'translate(' + scale.x( xValue( data ) ) + ',' + scale.y( yValue( data ) ) + ')'; } )
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
		},
	};

	$( window ).resize( function() { graphController.render(); } );

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
				graphController.fetch( id );
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

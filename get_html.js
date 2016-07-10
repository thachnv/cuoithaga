var system = require( "system" );

var page = require( "webpage" ).create();

var url = system.args[1];

page.settings.resourceTimeout = 30000;

page.open( url, function( status ) {

    var pageContent = page.evaluate( function() {

        return document.getElementsByTagName( "html" )[0].innerHTML;

    } );

    console.log( pageContent );

    phantom.exit();

} );


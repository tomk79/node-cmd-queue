/**
 * server.js
 */
var urlParse = require('url-parse');

var fs = require('fs');
var path = require('path');
var utils79 = require('utils79');
var express = require('express'),
	app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

app.use( require('body-parser')({"limit": "1024mb"}) );
app.use( '/common/dist/', express.static( path.resolve(__dirname, '../../../dist/') ) );
app.use( '/common/jquery/', express.static( path.resolve(__dirname, '../../../node_modules/jquery/dist/') ) );

app.use( express.static( __dirname+'/../client/' ) );

app.use( '/apis/cmdQueue', require('./apis/cmd-queue.js')({
	socketIo: io
}) );

// 8080番ポートでLISTEN状態にする
server.listen( 8080, function(){
	console.log('server-standby');
} );

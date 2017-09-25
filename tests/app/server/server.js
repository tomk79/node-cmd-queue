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

// io.on('connection', function(socket){
// 	console.log('a user connected');
// 	socket.on('disconnect', function(){
// 		console.log('user disconnected');
// 	});
// 	socket.on('chat message', function(msg){
// 		console.log('message: ' + msg);
// 		io.emit('some event', { for: 'everyone' });
// 		socket.broadcast.emit('some event', { for: 'broadcast' });
// 	});
// });

app.use( require('body-parser')({"limit": "1024mb"}) );
app.use( '/common/dist/', express.static( path.resolve(__dirname, '../../../dist/') ) );
app.use( '/common/jquery/', express.static( path.resolve(__dirname, '../../../node_modules/jquery/dist/') ) );

app.use( express.static( __dirname+'/../client/' ) );

app.use( '/apis/commandQueue', require('./apis/command-queue.js')({
	socketIo: io
}) );

// 3000番ポートでLISTEN状態にする
server.listen( 3000, function(){
	console.log('server-standby');
} );

var socket = io();
var commandQueue = new CommandQueue(
	{
		'gpiBridge': function(message, done){
			// クライアントからサーバーへのメッセージ送信を仲介

			var data = '';
			$.ajax({
				'url': '/apis/commandQueue',
				'data': {
					'message': message
				},
				'success': function(result){
					data += result;
				},
				'complete': function(){
					console.log(JSON.parse(data));
					done();
				}
			});
		}
	}
);
socket.on('command-queue-message', function(message){
	// console.log('====== command-queue-message');
	// console.log(message);
	commandQueue.gpi(message);
});

var terminal = commandQueue.createTerminal( document.getElementById('finder1') );
// console.log(commandQueue);

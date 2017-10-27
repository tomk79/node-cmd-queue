var socket = io();
var cmdQueue = new CmdQueue(
	{
		'gpiBridge': function(message, done){
			// クライアントからサーバーへのメッセージ送信を仲介

			// アプリケーションの拡張項目
			message.extra = message.extra || {};
			message.extra.extraClientValue = 'client-test-value';

			var data = '';
			$.ajax({
				'url': '/apis/cmdQueue',
				'data': {
					'message': message
				},
				'success': function(result){
					data += result;
				},
				'complete': function(){
					var result = JSON.parse(data);
					console.log(result);
					done(result);
				}
			});
		}
	}
);
socket.on('command-queue-message', function(message){
	// console.log('====== command-queue-message');
	// console.log(message);
	cmdQueue.gpi(message);
});

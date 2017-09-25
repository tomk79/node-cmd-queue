/**
 * command-queue.js
 */
module.exports = function(opts){

	var CommandQueue = require('../../../../node/main.js');
	var commandQueue = new CommandQueue({
		'cd': {
			'default': process.cwd()
		},
		'allowedCommands': [
			'ls',
			'pwd',
			['git', 'status'],
			['git', 'log'],
			['npm', 'update']
		],
		'checkCommand': function(cmd, callback){
			callback(cmd);
		},
		'gpiBridge': function(message, done){
			// サーバーからクライアントへのメッセージ送信を仲介
			opts.socketIo.emit('command-queue-message', message);
			done();
			return;
		}
	});

	return function(req, res, next){
		// console.log(req.body);
		// console.log(req.query.cmd);

		res
			.status(200)
			.set('Content-Type', 'text/plain')
		;

		// クライアントから受け取ったメッセージをGPIへ送る
		commandQueue.gpi(req.query.message, function(){
			console.error('onClose.');
			res.end();
		});

		return;
	}

}

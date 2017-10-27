/**
 * command-queue.js
 */
module.exports = function(opts){

	var CommandQueue = require('../../../../node/main.js');
	var commandQueue = new CommandQueue({
		'cd': {
			'default': process.cwd(),
			'tests': process.cwd()+'/tests'
		},
		'allowedCommands': [
			'ls',
			'pwd',
			['git', 'status'],
			['git', 'log'],
			['npm', 'update']
		],
		'preprocess': function(cmd, callback){
			// 実行前の加工などの処理があれば記述
			// console.log(cmd);
			if( cmd.command[0] == 'preprocess_test' ){
				cmd.stdout('This is NOT a command.');
				cmd.stdout("\n");
				setTimeout(function(){
					cmd.stdout('...');
					setTimeout(function(){
						cmd.stdout("\r");
						cmd.stdout('Preprocess option replied.');
						cmd.complete(0);
						callback(false);
					}, 2000);
				}, 2000);
				return;
			}
			callback(cmd);
			return;
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

		// アプリケーションの拡張項目
		req.query.message.extra = req.query.message.extra || {};
		req.query.message.extra.extraServerValue = 'test-value';

		// クライアントから受け取ったメッセージをGPIへ送る
		commandQueue.gpi(req.query.message, function(result){
			// console.error('onClose.');
			res.write( JSON.stringify(result) );
			res.flushHeaders();
			res.end();
		});

		return;
	}

}

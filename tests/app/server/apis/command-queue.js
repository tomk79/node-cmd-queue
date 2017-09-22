/**
 * command-queue.js
 */
module.exports = function(opts){

	var CommandQueue = require('../../../../node/main.js');

	return function(req, res, next){
		// console.log(req.body);

		var commandQueue = new CommandQueue({
			'cd': process.cwd(),
			'allowedCommands': [
				'ls',
				'pwd',
				['git', 'status'],
				['git', 'log'],
				['npm', 'update']
			],
			'checkCommand': function(cmd, callback){
				callback(cmd);
			}
		});

		// console.log(req.query.cmd);

		res
			.status(200)
			.set('Content-Type', 'text/plain')
		;

		commandQueue.cmd({
			'command': req.query.cmd,
			'stdout': function(data){
				// console.error('onData.', data.toString());
				res.write( data );
				res.flushHeaders();
			},
			'stderr': function(data){
				// console.error('onError.', data.toString());
				res.write( data );
				res.flushHeaders();
			},
			'complete': function(){
				// console.error('onClose.');
				res.end();
			}
		});

		return;
	}

}

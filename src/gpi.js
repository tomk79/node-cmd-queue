/**
 * command-queue - gpi.js
 */
module.exports = function(commandQueue, message, callback){
	callback = callback || function(){};
	console.log(message);

	switch(message.command){
		case 'stdout':
		case 'stderr':
			commandQueue.sendToTerminals(message, function(){
				callback();
			});
			break;
		case 'close':
			console.log('command closed.', message.queryInfo.id, message.tags);
			callback();
			break;
		default:
			callback();
			break;
	}
	return;
}

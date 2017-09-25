/**
 * command-queue - gpi.js
 */
module.exports = function(commandQueue, message, callback){
	callback = callback || function(){};

	switch(message.command){
		case 'query':
			commandQueue.query(message, function(result){
				callback(result);
			});
			break;
		default:
			callback(false);
			break;
	}
	return;
}

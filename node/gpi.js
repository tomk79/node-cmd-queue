/**
 * command-queue - gpi.js
 */
module.exports = function(commandQueue, message, callback){
	callback = callback || function(){};

	switch(message.command){
		case 'query':
			commandQueue.query(message, function(){
				callback();
			});
			break;
		default:
			callback();
			break;
	}
	return;
}

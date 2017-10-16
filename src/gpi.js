/**
 * cmd-queue - gpi.js
 */
module.exports = function(commandQueue, message, callback){
	callback = callback || function(){};
	// console.log(message);

	switch(message.command){
		case 'open':
		case 'stdout':
		case 'stderr':
		case 'close':
			commandQueue.sendToTerminals(message, function(result){
				callback(result);
			});
			break;
		default:
			callback(false);
			break;
	}
	return;
}

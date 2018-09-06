/**
 * cmd-queue - gpi.js
 */
module.exports = function(commandQueue, message, callback){
	callback = callback || function(){};

	switch(message.command){
		case 'add_queue_item':
			commandQueue.query(message, function(result){
				callback(result);
			});
			break;
		case 'kill_queue_item':
			commandQueue.kill(message.queueItemId, function(result){
				callback(result);
			});
			break;
		case 'get_output_log':
			var rtn = commandQueue.getOutputLog();
			callback(rtn);
			break;
		default:
			callback(false);
			break;
	}
	return;
}

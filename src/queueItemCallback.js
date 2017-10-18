/**
 * cmd-queue - queueItemCallback.js
 */
module.exports = function(commandQueue){
	var queueItemCallback = {};

	/**
	 * md5ハッシュを求める
	 */
	function md5( str ){
		str = str.toString();
		var crypto = require('crypto');
		var md5 = crypto.createHash('md5');
		md5.update(str, 'utf8');
		return md5.digest('hex');
	}

	/**
	 * コールバック関数を登録する
	 */
	this.addListener = function( callbacks ){

		var queueItemCallbackId;
		while(1){
			var microtimestamp = (new Date).getTime();
			queueItemCallbackId = microtimestamp + '-' + md5( microtimestamp );
			if( status[queueItemCallbackId] ){
				// 登録済みの Queue ID は発行不可
				continue;
			}
			break;
		}

		queueItemCallback[queueItemCallbackId] = callbacks || {};
		queueItemCallback[queueItemCallbackId].open = queueItemCallback[queueItemCallbackId].open || function(){};
		queueItemCallback[queueItemCallbackId].stdout = queueItemCallback[queueItemCallbackId].stdout || function(){};
		queueItemCallback[queueItemCallbackId].stderr = queueItemCallback[queueItemCallbackId].stderr || function(){};
		queueItemCallback[queueItemCallbackId].close = queueItemCallback[queueItemCallbackId].close || function(){};
		return queueItemCallbackId;
	}

	/**
	 * コールバック関数を実行する
	 */
	this.trigger = function(message){
		var queueItemCallbackId = message.queueItemCallbackId;
		if(!queueItemCallback[queueItemCallbackId]){
			return;
		}
		switch(message.command){
			case 'open':
				queueItemCallback[queueItemCallbackId].open(message);
				break;
			case 'stdout':
				queueItemCallback[queueItemCallbackId].stdout(message);
				break;
			case 'stderr':
				queueItemCallback[queueItemCallbackId].stderr(message);
				break;
			case 'close':
				queueItemCallback[queueItemCallbackId].close(message);

				queueItemCallback[queueItemCallbackId] = undefined;
				delete(queueItemCallback[queueItemCallbackId]);
				break;
		}
	}
}

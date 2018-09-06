/**
 * cmd-queue.js
 */
window.CmdQueue = function(options){
	var _this = this;
	var $ = require('jquery');
	var Terminal = require('./terminal.js');
	var terminals = [];
	var queueItemCallbacks = new (require('./queueItemCallback.js'))(this);

	// オプションの正規化
	options = options||{};
	var gpiBridge = options.gpiBridge||function(param, done){
		done();
		return;
	};


	/**
	 * 端末オブジェクトを生成する
	 */
	this.createTerminal = function(elm, options){
		var terminal = new Terminal(this, elm, options);
		terminals.push(terminal);
		return terminal;
	}

	/**
	 * 端末にメッセージを送信する
	 */
	this.sendToTerminals = function(message){
		if(message.command == 'open' || message.command == 'close' || message.command == 'add_queue_item' || message.command == 'kill_queue_item'){
			queueItemCallbacks.trigger(message);
			for(var idx in terminals){
				terminals[idx].write(message);
			}
			return;
		}

		var data = message.data;
		var dataAry = [];

		while(1){
			var matched = data.match(/^([\s\S]*?)(\r\n|\r|\n)([\s\S]*)$/);
			// console.log(matched);

			if( !matched ){
				dataAry.push(data);
				break;
			}
			var row = matched[1];
			var lf = matched[2];
			data = matched[3];

			dataAry.push(row);
			dataAry.push(lf);
		}

		message.data = dataAry;

		queueItemCallbacks.trigger(message);
		for(var idx in terminals){
			terminals[idx].write(message);
		}
		return;
	}

	/**
	 * コマンド実行要求を送信する
	 */
	this.addQueueItem = function(cmd, options){
		options = options || {};
		var cdName = options.cdName || undefined;
		var tags = options.tags || [];
		var accept = options.accept || function(){};

		var queueItemCallbackId = queueItemCallbacks.addListener(options);

		gpiBridge({
			'command': 'add_queue_item',
			'cmd': cmd,
			'cdName': cdName,
			'tags': tags,
			'queueItemCallbackId': queueItemCallbackId
		}, function(queueId){
			accept(queueId);
		});

		return;
	} // addQueueItem()

	/**
	 * コマンド停止要求を送信する
	 */
	this.killQueueItem = function(queueItemId){
		gpiBridge({
			'command': 'kill_queue_item',
			'queueItemId': queueItemId
		}, function(result){
			console.log('kill result...: ', result);
		});
		return;
	} // killQueueItem()

	/**
	 * サーバー上から標準出力履歴を取得する
	 */
	this.getOutputLog = function(cond, callback){
		callback = callback || function(){};
		gpiBridge({
			'command': 'get_output_log'
		}, function(messages){
			var rtn = [];
			for(var idx in messages){
				if(!_this.isMessageMatchTerminalConditions(cond, messages[idx])){
					continue;
				}
				rtn.push(messages[idx]);
			}
			callback(rtn);
		});
		return;
	}

	/**
	 * メッセージが端末の要求する条件に合致するか調べる
	 */
	this.isMessageMatchTerminalConditions = function(cond, message){
		if(!isMessageMatchQueueId(cond, message)){
			return false;
		}
		if(!isMessageMatchTags(cond, message)){
			return false;
		}
		return true;
	}

	/**
	 * 指定 Queue ID にマッチするメッセージか検証する
	 */
	function isMessageMatchQueueId(cond, message){
		if( cond.queueId === null ){
			return true;
		}
		if( message.queueItemInfo.id != cond.queueId ){
			return false;
		}
		return true;
	}

	/**
	 * タグにマッチするメッセージか検証する
	 */
	function isMessageMatchTags(cond, message){
		if( !cond.tags || !cond.tags.length ){
			return true;
		}
		if( !message.tags || !message.tags.length ){
			return false;
		}
		for( var idx in cond.tags ){
			var isMatch = false;
			for( var idx2 in message.tags ){
				if( cond.tags[idx] == message.tags[idx2] ){
					isMatch = true;
				}
			}
			if(!isMatch){
				return false;
			}
		}
		return true;
	}

	/**
	 * GPI
	 * サーバーからのメッセージを受けて処理する
	 */
	this.gpi = function(message){
		var Gpi = require('./gpi.js');
		return Gpi(this, message);
	};
}

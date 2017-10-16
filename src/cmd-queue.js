/**
 * cmd-queue.js
 */
window.CmdQueue = function(options){
	var $ = require('jquery');
	var Terminal = require('./terminal.js');
	var terminals = [];

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
		// console.log(message);

		if(message.command == 'open' || message.command == 'close'){
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

		gpiBridge({
			'command': 'add_queue_item',
			'cmd': cmd,
			'cdName': cdName,
			'tags': tags
		}, function(queueId){
			accept(queueId);
		});

		return;
	} // addQueueItem()

	/**
	 * サーバー上から標準出力履歴を取得する
	 */
	this.getOutputLog = function(callback){
		callback = callback || function(){};
		gpiBridge({
			'command': 'get_output_log'
		}, function(result){
			// console.log('-------', result);
			callback(result);
		});
		return;
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

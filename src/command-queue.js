/**
 * command-queue.js
 */
window.CommandQueue = function(options){
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
	this.createTerminal = function(elm){
		var terminal = new Terminal(this, elm);
		terminals.push(terminal);
		return terminal;
	}

	/**
	 * 端末にメッセージを送信する
	 */
	this.sendToTerminals = function(message){
		console.log(message);
		var data = message.data;
		var dataAry = [];

		if(message.command == 'open'){
			for(var idx in terminals){
				terminals[idx].open(data, message.queryInfo);
			}
			return;
		}

		if(message.command == 'close'){
			for(var idx in terminals){
				terminals[idx].close(data, message.queryInfo);
			}
			return;
		}

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

		for(var idx in terminals){
			terminals[idx].write(dataAry, message.queryInfo);
		}
		return;
	}

	/**
	 * コマンド実行要求を送信する
	 */
	this.query = function(cmd, options){
		options = options || {};
		var cdName = options.cdName || undefined;
		var tags = options.tags || [];
		var done = options.done || function(){};

		gpiBridge({
			'command': 'query',
			'cmd': cmd,
			'cdName': cdName,
			'tags': tags
		}, function(){
			done();
		});

		return;
	} // query()

	/**
	 * GPI
	 * サーバーからのメッセージを受けて処理する
	 */
	this.gpi = function(message){
		var Gpi = require('./gpi.js');
		return Gpi(this, message);
	};
}

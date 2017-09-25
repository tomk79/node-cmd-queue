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
		for(var idx in terminals){
			terminals[idx].write(message.data);
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

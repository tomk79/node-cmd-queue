/**
 * command-queue.js
 */
window.CommandQueue = function(options){
	var $ = require('jquery'),
		it79 = require('iterate79'),
		queue = new it79.queue({
			'threadLimit': 1 , // 並行処理する場合のスレッド数上限
			'process': function(cmdAry, done){
				options.gpiBridge(
					cmdAry,
					function(data){
						// console.log(data);
						for(var idx in terminals){
							terminals[idx].write(data);
						}
					},
					function(){
						done();
					}
				);
			}
		});

	var Terminal = require('./terminal.js');
	var terminals = [];

	// オプションの正規化
	options = options||{};
	options.gpiBridge = options.gpiBridge||function(param, chunk, done){
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
	 * コマンド実行要求を送信する
	 */
	this.query = function(cmdAry){
		// キュー処理に追加する
		queue.push(cmdAry);
		return;
	}
}

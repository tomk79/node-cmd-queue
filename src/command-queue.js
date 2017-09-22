/**
 * command-queue.js
 */
window.CommandQueue = function(elm, options){
	var $ = require('jquery'),
		it79 = require('iterate79'),
		queue = new it79.queue({
			'threadLimit': 1 , // 並行処理する場合のスレッド数上限
			'process': function(cmdAry, done){
				options.gpiBridge(
					cmdAry,
					function(data){
						console.log(data);
						var $elm = $(elm);
						$elm.append( $('<div>')
							.text(data)
							.addClass('command-queue__row')
						);
						rows.push(data);

						while(1){
							var rowSize = rows.length;
							if(rowSize <= maxRows){
								break;
							}
							$elm.find('>div.command-queue__row').get(0).remove();
							rows.shift();
						}
					},
					function(){
						done();
					}
				);
			}
		}),
		maxRows = 400, // 表示する最大行数
		rows = [];

	var $elm = $(elm);
	$elm.addClass('command-queue');

	// オプションの正規化
	options = options||{};
	options.gpiBridge = options.gpiBridge||function(param, chunk, done){
		done();
		return;
	};


	/**
	 * コマンド実行要求を送信する
	 */
	this.query = function(cmdAry){
		// キュー処理に追加する
		queue.push(cmdAry);
		return;
	}
}

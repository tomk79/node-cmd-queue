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
						$elm.append( $('<div>')
							.text(data)
							.css({'white-space': 'pre'})
						);
					},
					function(){
						console.log('done.');
						setTimeout(function(){
							done();
						}, 1000);
					}
				);
			}
		});

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

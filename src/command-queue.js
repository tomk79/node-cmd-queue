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
						// console.log(data);
						var $elm = $(elm);

						while(1){
							var matched = data.match(/^([\s\S]*?)(\r\n|\r|\n)([\s\S]*)$/);
							// console.log(matched);

							if( !matched ){
								appendNewRow(data);
								break;
							}
							var row = matched[1];
							var lf = matched[2];
							data = matched[3];

							appendNewRow(row);
						}

						removeOldRow();
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
	 * 新しい行を追加する
	 */
	function appendNewRow(row){
		var $elm = $(elm);
		$elm.append( $('<div>')
			.text(row)
			.addClass('command-queue__row')
		);
		rows.push(row);
		return;
	}

	/**
	 * 古い行を削除する
	 */
	function removeOldRow(){
		var $elm = $(elm);
		while(1){
			var rowSize = rows.length;
			if(rowSize <= maxRows){
				break;
			}
			$elm.find('>div.command-queue__row').get(0).remove();
			rows.shift();
		}
		return;
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

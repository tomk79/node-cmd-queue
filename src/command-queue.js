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
						var isDoScrollEnd = isScrollEnd();

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
							if( lf.match(/^\r$/) ){
								removeNewestRow();
							}
							appendNewRow(row);
						}

						removeOldRow();
						if(isDoScrollEnd){
							scrollEnd();
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
	$elm.append('<div class="command-queue__console">');

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
		var $console = $(elm).find('>.command-queue__console');
		$console.append( $('<div>')
			.text(row)
			.addClass('command-queue__row')
		);
		rows.push(row);
		return;
	}

	/**
	 * CR処理
	 */
	function cr(row){
		var $console = $(elm).find('>.command-queue__console');
		$console.append( $('<div>')
			.text(row)
			.addClass('command-queue__row')
		);
		rows.push(row);
		return;
	}

	/**
	 * 最も新しい行を削除する
	 */
	function removeNewestRow(){
		var $console = $(elm).find('>.command-queue__console');

		var rowSize = rows.length;
		$console.find('>div.command-queue__row').get(rowSize-1).remove();
		rows.unshift();

		return;
	}

	/**
	 * 古い行を削除する
	 */
	function removeOldRow(){
		var $console = $(elm).find('>.command-queue__console');
		while(1){
			var rowSize = rows.length;
			if(rowSize <= maxRows){
				break;
			}
			$console.find('>div.command-queue__row').get(0).remove();
			rows.shift();
		}
		return;
	}

	/**
	 * 終端へスクロールする
	 */
	function scrollEnd(){
		var $elm = $(elm);
		var $console = $elm.find('>.command-queue__console');
		$elm.scrollTop( $console.outerHeight()-$elm.innerHeight() );
	}

	/**
	 * 終端へスクロールするべきか調べる
	 */
	function isScrollEnd(){
		var $elm = $(elm);
		var $console = $elm.find('>.command-queue__console');
		var scrollTop = $elm.scrollTop();
		if( $console.outerHeight()-$elm.innerHeight() < scrollTop + 100 ){
			return true;
		}
		return false;
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

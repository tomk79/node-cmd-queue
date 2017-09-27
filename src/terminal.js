/**
 * command-queue - terminal.js
 */
module.exports = function(commandQueue, elm){
	var $ = require('jquery');
	var $elm = $(elm);
	var memoryLineSizeLimit = 1000, // 表示する最大行数
		rows = [];

	$elm.addClass('command-queue');
	$elm.append('<div class="command-queue__console">');

	/**
	 * 新しいコマンドの開始を宣言する
	 */
	this.open = function(command, queryInfo){
		var isDoScrollEnd = isScrollEnd();
		appendNewRow(command, 'open');
		if(isDoScrollEnd){
			scrollEnd();
		}
		return;
	}

	/**
	 * コマンドの終了を宣言する
	 */
	this.close = function(status, queryInfo){
		var isDoScrollEnd = isScrollEnd();
		appendNewRow(status, 'close');
		if(isDoScrollEnd){
			scrollEnd();
		}
		return;
	}

	/**
	 * 新しい行を書き込む
	 */
	this.write = function(dataAry, queryInfo){
		// console.log(queryInfo);
		var isDoScrollEnd = isScrollEnd();

		for(var i = 0; i < dataAry.length; i ++){
			var row = dataAry[i];
			if( row.match(/^\r$/) ){
				removeNewestRow();
			}else if( row.match(/^(?:\r\n|\n)$/) ){
				// removeNewestRow(row);
			}else{
				appendNewRow(row);
			}
		}

		removeOldRow();
		if(isDoScrollEnd){
			scrollEnd();
		}
		return;
	}

	/**
	 * 新しい行を追加する
	 */
	function appendNewRow(row, type){
		var $console = $(elm).find('>.command-queue__console');
		type = type || 'row';
		var $row = $('<div>')
			.addClass('command-queue__row');

		if(type){
			$row.addClass('command-queue__'+type);
		}
		if(type == 'close'){
			var status = row;
			row = '---- command closed width status '+JSON.stringify(status)+' ----';
			if( status !== 0 ){
				$row.addClass('command-queue__err');
			}
		}

		$row.text(row);

		$console.append($row);
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

		var memoryLineSize = rows.length;
		$console.find('>div.command-queue__row').get(memoryLineSize-1).remove();
		rows.unshift();

		return;
	}

	/**
	 * 古い行を削除する
	 */
	function removeOldRow(){
		var $console = $(elm).find('>.command-queue__console');
		while(1){
			var memoryLineSize = rows.length;
			if(memoryLineSize <= memoryLineSizeLimit){
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

}

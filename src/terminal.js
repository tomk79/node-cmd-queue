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

	var $console = $(elm).find('>.command-queue__console');

	/**
	 * 新しい行を書き込む
	 */
	this.write = function(message){
		// console.log(message);
		var isDoScrollEnd = isScrollEnd();

		if(message.command == 'open'){
			appendNewRow('open', message.data);
			appendNewRow('row');
			if(isDoScrollEnd){
				scrollEnd();
			}
			return;
		}
		if(message.command == 'close'){
			appendNewRow('close', message.data);
			if(isDoScrollEnd){
				scrollEnd();
			}
			return;
		}


		var dataAry = message.data;

		for(var i = 0; i < dataAry.length; i ++){
			var row = dataAry[i];
			if( row.match(/^\r$/) ){
				removeNewestRow();
			}else if( row.match(/^(?:\r\n|\n)$/) ){
				appendNewRow('row');
			}else{
				writeToNewestRow(row);
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
	function appendNewRow(type, row){
		type = type || 'row';
		var $row = $('<div>')
			.addClass('command-queue__row');

		var memoryLineSize = rows.length;
		$console.find('>div.command-queue__row').eq(memoryLineSize-1).append( $('<br />') );

		if(type == 'open'){
			$row.addClass('command-queue__'+type);
			$row.text(row);
		}else if(type == 'close'){
			$row.addClass('command-queue__'+type);
			var status = row;
			row = '---- command closed width status '+JSON.stringify(status)+' ----';
			if( status !== 0 ){
				$row.addClass('command-queue__err');
			}
			$row.text(row);
		}

		$console.append($row);
		return;
	}

	/**
	 * 最も新しい行を削除する
	 */
	function removeNewestRow(){
		var memoryLineSize = rows.length;
		$console.find('>div.command-queue__row').get(memoryLineSize-1).remove();
		rows.unshift();

		return;
	}

	/**
	 * 最も新しい行に追記する
	 */
	function writeToNewestRow(text){
		var memoryLineSize = rows.length;
		$console.find('>div.command-queue__row').eq(memoryLineSize-1).append( $('<span>').text(text) );
		return;
	}

	/**
	 * 古い行を削除する
	 */
	function removeOldRow(){
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

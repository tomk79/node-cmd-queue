/**
 * command-queue - terminal.js
 */
module.exports = function(commandQueue, elm, options){
	var $ = require('jquery');
	var $elm = $(elm);
	var memoryLineSizeLimit = 1000; // 表示する最大行数
	var _this = this;
	options = options || {};
	options.tags = options.tags || [];

	$elm.addClass('command-queue');
	$elm.append('<div class="command-queue__console">');

	var $console = $(elm).find('>.command-queue__console');

	commandQueue.getOutputLog(function(messages){
		// console.log(messages);
		for(var idx in messages){
			_this.write(messages[idx]);
		}
	});

	/**
	 * 新しい行を書き込む
	 */
	this.write = function(message){
		// console.log(message);
		if( !isMessageMatchTags( message ) ){
			return;
		}
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
			if( row.match(/^(?:\r\n|\n)$/) ){
				appendNewRow();
			}else if( row.match(/^\r$/) ){
				removeNewestRow();
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
	 * タグにマッチするメッセージか検証する
	 */
	function isMessageMatchTags(message){
		if( !options.tags || !options.tags.length ){
			return true;
		}

		if( !message.tags || !message.tags.length ){
			return false;
		}
		for( var idx in options.tags ){
			var isMatch = false;
			for( var idx2 in message.tags ){
				if( options.tags[idx] == message.tags[idx2] ){
					isMatch = true;
				}
			}
			if(!isMatch){
				return false;
			}
		}
		return true;
	}

	/**
	 * 新しい行を追加する
	 */
	function appendNewRow(type, row){
		type = type || 'row';
		var $row = $('<div>')
			.addClass('command-queue__row');

		var $rows = $console.find('>div.command-queue__row');
		var memoryLineSize = $rows.length;
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
		var $rows = $console.find('>div.command-queue__row');
		var memoryLineSize = $rows.length;
		try {
			$rows.get(memoryLineSize-1).remove();
			$rows.eq(memoryLineSize-2).find('br').remove();
		} catch (e) {
		}
		appendNewRow();
		return;
	}

	/**
	 * 最も新しい行に追記する
	 */
	function writeToNewestRow(text){
		var $rows = $console.find('>div.command-queue__row');
		var memoryLineSize = $rows.length;
		$console.find('>div.command-queue__row').eq(memoryLineSize-1).append( $('<span>').text(text) );
		return;
	}

	/**
	 * 古い行を削除する
	 */
	function removeOldRow(){
		var $rows = $console.find('>div.command-queue__row');
		while(1){
			var memoryLineSize = $rows.length;
			if(memoryLineSize <= memoryLineSizeLimit){
				break;
			}
			$console.find('>div.command-queue__row').get(0).remove();
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

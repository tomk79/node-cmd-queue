/**
 * cmd-queue - terminal.js
 */
module.exports = function(commandQueue, elm, options){
	var $ = require('jquery');
	var $elm = $(elm);
	var memoryLineSizeLimit = 1000; // 表示する最大行数
	var _this = this;
	options = options || {};
	options.queueId = options.queueId || null;
	options.tags = options.tags || [];

	$elm.addClass('cmd-queue');
	$elm.append('<div class="cmd-queue__console">');

	var $console = $(elm).find('>.cmd-queue__console');

	commandQueue.getOutputLog({'queueId': options.queueId, 'tags':options.tags}, function(messages){
		// console.log(messages);
		for(var idx in messages){
			_this.write(messages[idx]);
		}
	});

	/**
	 * 新しい行を書き込む
	 */
	this.write = function(message){
		console.log(message);
		if( !commandQueue.isMessageMatchTerminalConditions({'queueId': options.queueId, 'tags':options.tags}, message) ){
			return;
		}
		var isDoScrollEnd = isScrollEnd();

		if(message.command == 'add_queue_item'){
			console.log('add_queue_item message', message);//TODO: 端末に処理待ちの行を追加する予定
			if(isDoScrollEnd){
				scrollEnd();
			}
			return;
		}

		if(message.command == 'open'){
			appendNewRow('open', message);
			appendNewRow('row');
			if(isDoScrollEnd){
				scrollEnd();
			}
			return;
		}
		if(message.command == 'close'){
			appendNewRow('close', message);
			if(isDoScrollEnd){
				scrollEnd();
			}
			return;
		}


		var dataAry = message.data;

		if(dataAry && dataAry.length){
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
	function appendNewRow(type, message){
		type = type || 'row';
		var $row = $('<div>')
			.addClass('cmd-queue__row');

		var $rows = $console.find('>div.cmd-queue__row');
		var memoryLineSize = $rows.length;
		$console.find('>div.cmd-queue__row').eq(memoryLineSize-1).append( $('<br />') );

		if(type == 'open'){
			$row.addClass('cmd-queue__'+type);
			$row.attr('data-queue-id', message.queueItemInfo.id);
			$row.append( $('<div>').text(message.data) );
			$row.append( $('<div>').append(
				$('<button>')
					.text('kill')
					.attr('data-queue-id', message.queueItemInfo.id)
					.on('click', function(){
						$this = $(this);
						var queueId = $this.attr('data-queue-id');
						// alert('kill this.' + queueId);
						commandQueue.killQueueItem(queueId);
						$this.attr('disabled', 'disabled');
					})
			) );
		}else if(type == 'close'){
			$row.addClass('cmd-queue__'+type);
			var status = message.data;
			var row = '---- command closed width status '+JSON.stringify(status)+' ----';
			if( status !== 0 ){
				$row.addClass('cmd-queue__err');
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
		var $rows = $console.find('>div.cmd-queue__row');
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
		var $rows = $console.find('>div.cmd-queue__row');
		var memoryLineSize = $rows.length;
		$console.find('>div.cmd-queue__row').eq(memoryLineSize-1).append( $('<span>').text(text) );
		return;
	}

	/**
	 * 古い行を削除する
	 */
	function removeOldRow(){
		var $rows = $console.find('>div.cmd-queue__row');
		while(1){
			var memoryLineSize = $rows.length;
			if( memoryLineSize <= memoryLineSizeLimit ){
				break;
			}
			$console.find('>div.cmd-queue__row').get(0).remove();
		}
		return;
	}

	/**
	 * 終端へスクロールする
	 */
	function scrollEnd(){
		var $elm = $(elm);
		var $console = $elm.find('>.cmd-queue__console');
		$elm.scrollTop( $console.outerHeight()-$elm.innerHeight() );
	}

	/**
	 * 終端へスクロールするべきか調べる
	 */
	function isScrollEnd(){
		var $elm = $(elm);
		var $console = $elm.find('>.cmd-queue__console');
		var scrollTop = $elm.scrollTop();
		if( $console.outerHeight()-$elm.innerHeight() < scrollTop + 100 ){
			return true;
		}
		return false;
	}

}

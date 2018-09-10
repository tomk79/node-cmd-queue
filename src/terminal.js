/**
 * cmd-queue - terminal.js
 */
module.exports = function(commandQueue, elm, options){
	var _this = this;
	var $ = require('jquery');
	var $elm = false;
	var $console = false;
	var memoryLineSizeLimit = 1000; // 表示する最大行数
	options = options || {};
	options.queueId = options.queueId || null;
	options.tags = options.tags || [];
	options.write = options.write || function(){};

	if(elm){
		$elm = $(elm);

		$elm.addClass('cmd-queue');
		$elm.append('<div class="cmd-queue__console">');

		$console = $(elm).find('>.cmd-queue__console');
	}

	commandQueue.getOutputLog({'queueId': options.queueId, 'tags':options.tags}, function(messages){
		// console.log(messages);
		setTimeout(function(){ // GPIが非同期のとき、setTimeout() しないと _this.write() を呼びだせずに落ちる。
			for(var idx in messages){
				_this.write(messages[idx]);
			}
		}, 0);
	});

	/**
	 * 新しい行を書き込む
	 */
	this.write = function(message){
		// console.log(message);
		if( !commandQueue.isMessageMatchTerminalConditions({'queueId': options.queueId, 'tags':options.tags}, message) ){
			return;
		}
		var isDoScrollEnd = isScrollEnd();

		// 呼び出し側に同じメッセージを転送する
		options.write(message);

		if( !$elm ){
			// $elmが指定されない場合、
			// ターミナル画面を処理しない。
			return;
		}

		if(message.command == 'add_queue_item'){
			// console.log('add_queue_item message', message);
			$queue_unit = queueUnitConsole(message.queueItemInfo.id, message.data);//キュー単位のまとまりを生成する

			if(isDoScrollEnd){
				scrollEnd();
			}
			return;
		}

		if(message.command == 'open'){
			appendNewRow('open', message);
			appendNewRow('row', message);
			if(isDoScrollEnd){
				scrollEnd();
			}
			return;
		}
		if(message.command == 'kill_queue_item'){
			var $queue_unit = $console.find('[data-queue-id='+message.queueItemInfo.id+']');
			if($queue_unit.length){
				$queue_unit.find('.cmd-queue__unit-status').text('Canceled');
			}

			if(isDoScrollEnd){
				scrollEnd();
			}
			return;
		}
		if(message.command == 'close'){
			appendNewRow('close', message);
			$('[data-queue-id='+message.queueItemInfo.id+'] .cmd-queue__unit-status').text('Done');
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
					appendNewRow('row', message);
				}else if( row.match(/^\r$/) ){
					removeNewestRow(message);
				}else{
					writeToNewestRow(row, message);
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
	 * ターミナルに queue unit を追加する
	 */
	function queueUnitConsole(queueId, label){
		if( !queueId ){
			return false;
		}
		var $queue_unit = $console.find('[data-queue-id='+queueId+']');
		if($queue_unit.length){
			return $queue_unit.eq(0).find('.cmd-queue__unit-console');
		}

		if(!label){
			label = 'Untitled';
		}
		var $queue_unit = $('<div>')
			.addClass('cmd-queue__unit');
		$queue_unit.attr('data-queue-id', queueId);
		$queue_unit.append(
			$('<div>').addClass('cmd-queue__unit-header')
				.append( $('<div>').addClass('cmd-queue__unit-label').text(label) )
				.append( $('<div>').addClass('cmd-queue__unit-status').append(
					$('<button>')
						.text('kill')
						.attr('data-queue-id', queueId)
						.on('click', function(){
							$this = $(this);
							var queueId = $this.attr('data-queue-id');
							// alert('kill this.' + queueId);
							commandQueue.killQueueItem(queueId);
							$this.attr('disabled', 'disabled');
						})
				) )
		);
		$queue_unit.append( $('<div>').addClass('cmd-queue__unit-console') );
		$console.append($queue_unit);
		return $queue_unit.find('.cmd-queue__unit-console');
	}

	/**
	 * 新しい行を追加する
	 */
	function appendNewRow(type, message){
		// console.log(message);
		type = type || 'row';
		var $row = $('<div>')
			.addClass('cmd-queue__row');

		// 該当する queueId の unit を探す。なければ作られる。
		var $targetConsole = queueUnitConsole(message.queueItemInfo.id, message.data);

		var $rows = $targetConsole.find('.cmd-queue__row');
		var memoryLineSize = $rows.length;
		$targetConsole.find('.cmd-queue__row').eq(memoryLineSize-1).append( $('<br />') );
		// console.log(message);

		if(type == 'open'){
		}else if(type == 'close'){
			$row.addClass('cmd-queue__'+type);
			var status = message.data;
			var row = '---- command closed width status '+JSON.stringify(status)+' ----';
			if( status !== 0 ){
				$row.addClass('cmd-queue__err');
			}
			$row.text(row);
		}

		$targetConsole.append($row);
		return;
	}

	/**
	 * 最も新しい行を削除する
	 */
	function removeNewestRow(message){
		// 該当する queueId の unit を探す。なければ作られる。
		$targetConsole = queueUnitConsole(message.queueItemInfo.id, message.data);

		var $rows = $targetConsole.find('.cmd-queue__row');
		var memoryLineSize = $rows.length;
		try {
			$rows.get(memoryLineSize-1).remove();
			$rows.eq(memoryLineSize-2).find('br').remove();
		} catch (e) {
		}
		appendNewRow('row', message);
		return;
	}

	/**
	 * 最も新しい行に追記する
	 */
	function writeToNewestRow(text, message){
		// 該当する queueId の unit を探す。なければ作られる。
		$targetConsole = queueUnitConsole(message.queueItemInfo.id, message.data);

		var $rows = $targetConsole.find('.cmd-queue__row');
		var memoryLineSize = $rows.length;
		$targetConsole.find('.cmd-queue__row').eq(memoryLineSize-1).append( $('<span>').text(text) );
		return;
	}

	/**
	 * 古い行を削除する
	 */
	function removeOldRow(){
		while(1){
			var $rows = $console.find('.cmd-queue__row');
			var memoryLineSize = $rows.length;
			if( memoryLineSize <= memoryLineSizeLimit ){
				break;
			}
			var $oldestUnitRow = $console.find('.cmd-queue__unit').eq(0).find('.cmd-queue__unit-console .cmd-queue__row');
			var $targetelm;
			if($oldestUnitRow.length){
				$targetelm = $oldestUnitRow.get(0);
				$targetelm.remove();
				if( !$console.find('.cmd-queue__unit').eq(0).find('.cmd-queue__unit-console .cmd-queue__row').length ){
					$console.find('.cmd-queue__unit').get(0).remove();
				}
				continue;;
			}
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

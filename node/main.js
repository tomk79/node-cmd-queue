/**
 * cmd-queue - main.js
 */
module.exports = function(config){
	var Promise = require("es6-promise").Promise;
	var _this = this;
	config = config||{};
	var allowedCommands = config.allowedCommands||[];
	var pathDefaultCurrentDir = process.cwd();
	var currentDirs = config.cd||{'default': pathDefaultCurrentDir};
	var preprocess = config.preprocess||function(cmd, callback){
		callback(cmd);
	};
	var prekill = config.prekill||function(cmd, callback){
		callback(cmd);
	};
	var gpiBridge = config.gpiBridge||function(){};
	var outputLog = [];
	var addQueueItemLog = {};
	var maxOutputLogMessageCount = 100;
	var pids = {};

	var it79 = require('iterate79'),
		queue = new it79.queue({
			'threadLimit': 1 , // 並行処理する場合のスレッド数上限
			'process': function(cmdOpt, done, queueItemInfo){
				// console.log('=-=-=-=-=-=-=-=-= prosess');
				// console.log(cmdOpt, queueItemInfo);

				var openMsg = {
					'command': 'open',
					'cmd': cmdOpt.cmd,
					'cd': cmdOpt.cdName,
					'queueItemInfo': queueItemInfo,
					'tags': cmdOpt.tags,
					'extra': cmdOpt.extra,
					'data': cmdOpt.cmd.join(' '),
					'queueItemCallbackId': cmdOpt.queueItemCallbackId
				};
				outputLogPush(openMsg);
				gpiBridge(
					openMsg,
					function(){}
				);
				cmdOpt.id = queueItemInfo.id;

				_this.cmd({
					'command': cmdOpt.cmd,
					'cd': cmdOpt.cdName,
					'tags': cmdOpt.tags,
					'queueItemInfo': queueItemInfo,
					'extra': cmdOpt.extra,
					'stdout': function(data){
						// console.error('onData.', data.toString());
						var msg = {
							'command': 'stdout',
							'cmd': cmdOpt.cmd,
							'cd': cmdOpt.cdName,
							'queueItemInfo': queueItemInfo,
							'tags': cmdOpt.tags,
							'extra': cmdOpt.extra,
							'data': data.toString(),
							'queueItemCallbackId': cmdOpt.queueItemCallbackId
						};
						outputLogPush(msg);
						gpiBridge(
							msg,
							function(){}
						);

					},
					'stderr': function(data){
						// console.error('onError.', data.toString());
						var msg = {
							'command': 'stderr',
							'cmd': cmdOpt.cmd,
							'cd': cmdOpt.cdName,
							'queueItemInfo': queueItemInfo,
							'tags': cmdOpt.tags,
							'extra': cmdOpt.extra,
							'data': data.toString(),
							'queueItemCallbackId': cmdOpt.queueItemCallbackId
						};
						outputLogPush(msg);
						gpiBridge(
							msg,
							function(){}
						);
					},
					'complete': function(status){
						// console.error('onClose.', status);
						var msg = {
							'command': 'close',
							'cmd': cmdOpt.cmd,
							'cd': cmdOpt.cdName,
							'queueItemInfo': queueItemInfo,
							'tags': cmdOpt.tags,
							'extra': cmdOpt.extra,
							'data': status,
							'queueItemCallbackId': cmdOpt.queueItemCallbackId
						};
						outputLogPush(msg);

						// pidを忘れる
						pids[queueItemInfo.id] = undefined;
						delete(pids[queueItemInfo.id]);

						gpiBridge(
							msg,
							function(){
								done();
							}
						);
					}
				});

			}
		});


	/**
	 * GPI
	 * クライアントからのメッセージを受けて処理する
	 */
	this.gpi = function(message, callback){
		callback = callback || function(){};
		var Gpi = require('./gpi.js');
		return Gpi(this, message, callback);
	};

	/**
	 * 出力ログに行を追加する
	 */
	function outputLogPush(msg){
		if( outputLog.length >= maxOutputLogMessageCount ){
			outputLog.shift(); // 上限を超えていたら、先頭の1件を削除する
		}
		return outputLog.push(msg);
	}

	/**
	 * 許可されたコマンドかどうか確認する
	 */
	function isCommandAllowed(cmdAry, allowedCommands){
		for(var idx in allowedCommands){
			if( typeof(allowedCommands[idx]) === typeof('') ){
				if( allowedCommands[idx] === cmdAry[0] ){
					return true;
				}
			}else if( typeof(allowedCommands[idx]) === typeof([]) && allowedCommands[idx][0] === cmdAry[0] ){
				var isHit = true;
				for( var cmdIdx in allowedCommands[idx] ){
					if( allowedCommands[idx][cmdIdx] !== cmdAry[cmdIdx] ){
						isHit = false;
						break;
					}
				}
				if( isHit ){
					return true;
				}
			}
		}
		return false;
	}

	/**
	 * カレントディレクトリ設定を追加または上書きする
	 */
	this.setCurrentDir = function(cdName, cd){
		currentDirs[cdName] = cd;
		return true;
	}

	/**
	 * カレントディレクトリ設定を取得する
	 */
	this.getCurrentDir = function(cdName){
		return currentDirs[cdName];
	}

	/**
	 * カレントディレクトリ設定を削除する
	 */
	this.removeCurrentDir = function(cdName){
		currentDirs[cdName] = undefined;
		delete(currentDirs[cdName]);
		return true;
	}

	/**
	 * カレントディレクトリ設定の全件を取得する
	 */
	this.getAllCurrentDirs = function(){
		return currentDirs;
	}

	/**
	 * カレントディレクトリ設定をすべて消去する
	 */
	this.clearAllCurrentDirs = function(){
		currentDirs = {};
		return true;
	}

	/**
	 * 許可コマンドのパターンを追加する
	 */
	this.addAllowedCommand = function( cmdAry ){
		for(var idx1 in allowedCommands){
			if( JSON.stringify(allowedCommands[idx1]) === JSON.stringify(cmdAry) ){
				// 既に登録されている
				return true;
			}
		}
		allowedCommands.push(cmdAry);
		return true;
	}

	/**
	 * 許可コマンドのパターンを削除する
	 */
	this.removeAllowedCommand = function( cmdAry ){
		for(var idx1 in allowedCommands){
			if( JSON.stringify(allowedCommands[idx1]) === JSON.stringify(cmdAry) ){
				allowedCommands[idx1] = undefined;
				delete(allowedCommands[idx1]);
				return true;
			}
		}
		return false;
	}

	/**
	 * 許可コマンドのパターンをすべて消去する
	 */
	this.getAllAllowedCommands = function(){
		return allowedCommands;
	}

	/**
	 * 許可コマンドのパターンをすべて消去する
	 */
	this.clearAllAllowedCommands = function(){
		allowedCommands = [];
		return true;
	}

	/**
	 * クエリを追加する
	 */
	this.query = function(params, callback){
		callback = callback || function(){};

		new Promise(function(rlv){rlv();}).then(function(){ return new Promise(function(rlv, rjt){
			if(params.cdName){
				params.cdName = currentDirs[params.cdName];
			}else{
				params.cdName = currentDirs['default'];
			}
			var queueId = queue.push(params);

			addQueueItemLog[queueId] = params;

			gpiBridge(
				{
					"command": "add_queue_item",
					'cmd': params.cmd,
					'cd': params.cdName,
					'queueItemInfo': {
						'id': queueId
					},
					'tags': params.tags,
					'extra': params.extra,
					'data': params.cmd,
					'queueItemCallbackId': params.queueItemCallbackId
				},
				function(){}
			);
			callback(queueId); // gpiBridgeの完了を待たず返す

		}); });
		return;
	}

	/**
	 * 標準出力ログを取得する
	 */
	this.getOutputLog = function(){
		var rtn = JSON.parse(JSON.stringify(outputLog));
		var queueItemStatus = queue.getAllStatus();
		for(var idx in queueItemStatus){
			if(queueItemStatus[idx] == 2 || !addQueueItemLog[idx]){
				continue;
			}
			rtn.push(addQueueItemLog[idx]);
		}
		return rtn;
	}

	/**
	 * PID(Process ID) を登録する
	 */
	this.setPid = function(queueId, pid){
		pids[queueId] = pid;
		return true;
	}

	/**
	 * コマンドを実行する
	 */
	this.cmd = function(options){
		options = options || {};
		options.command = options.command || {};
		options.stdout = options.stdout || function(){};
		options.stderr = options.stderr || function(){};
		options.complete = options.complete || function(){};
		options.queueItemInfo = options.queueItemInfo || {};
		var queueId = options.queueItemInfo.id;

		preprocess(
			options,
			function(options){
				if(options === false){
					if( queueId && addQueueItemLog[queueId] ){
						addQueueItemLog[queueId] = undefined; delete(addQueueItemLog[queueId]);
					}
					return;
				}
				var cmdAry = options.command || null;
				if( cmdAry === null ){
					// コマンドが指定されていない
					options.complete("ERROR: Command NOT given.");
					return;
				}
				if( !isCommandAllowed(cmdAry, allowedCommands) ){
					// 許可されていないコマンド
					options.complete("ERROR: Unallowed command.");
					return;
				}
				var cmdTags = options.tags || [];
				var child_process = require('child_process');
				var cmd = cmdAry.shift();

				var tmpCd = options.cd;
				if( tmpCd ){
					process.chdir( tmpCd );
				}

				var proc = require('child_process').spawn(cmd, cmdAry);
				_this.setPid(queueId, proc.pid); // process ID を記憶する
				proc.stdout.on('data', function(text){
					options.stdout(text);
				});
				proc.stderr.on('data', function(text){
					options.stderr(text);
				});
				proc.on('close', function(code){
					addQueueItemLog[queueId] = undefined; delete(addQueueItemLog[queueId]);
					options.complete(code);
				});

				process.chdir( pathDefaultCurrentDir );

			}
		);
		return;
	}

	/**
	 * コマンドを中断する
	 */
	this.kill = function(queueId, callback){
		// console.log('kill request recieved. (queueId = '+queueId+')');
		new Promise(function(rlv){rlv();})
			.then(function(){ return new Promise(function(rlv, rjt){
				// まず、 queue から削除。
				// まだ順番待ちなら true が返ってくる。
				queue.remove(queueId);
				rlv();
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				// preprocess() が実行したかもしれない処理を kill してもらう。
				// どの queueId をどう停止させるかは、 preprocess() 側で管理してもらう。
				// 実行している内容が別のプロセスであるとは限らないので、停止の手段がkillコマンドであるとは限らない。
				// かつ、まだ実行されていないかもしれない。
				prekill(addQueueItemLog[queueId], function(cmd){
					rlv();
				});
			}); })
			.then(function(){ return new Promise(function(rlv, rjt){

				if(!pids[queueId]){
					// pidが関連づいていなければ、
					// プロセスは存在しないものとみなしてスキップする
					rlv();
					return;
				}

				// kill コマンドを発行
				var pid = pids[queueId];
				var cmdAry = ['kill', pid];
				if( require('fs').realpathSync('/') != '/' ){
					// windows では taskkill コマンド
					cmdAry = ['taskkill', '/F', '/pid', pid]; // Windows では 強制(/F)しないと落ちてくれなかった
				}
				// console.log('kill process (queueId = '+queueId+', pid = '+pid+')');
				var killCommand = cmdAry.shift();
				var proc = require('child_process').spawn(killCommand, cmdAry);
				proc.stdout.on('data', function(text){
					// console.log(text);
				});
				proc.stderr.on('data', function(text){
					// console.error(text);
				});
				proc.on('close', function(code){
					// console.info(code);

					// killし終わったら pidを忘れる
					pids[queueId] = undefined;
					delete(pids[queueId]);
					rlv();
				});
				return;

			}); })
			.then(function(){ return new Promise(function(rlv, rjt){

				// queue のリストからも忘れる
				addQueueItemLog[queueId] = undefined;
				delete(addQueueItemLog[queueId]);

				rlv();
				return;

			}); })
			.then(function(){ return new Promise(function(rlv, rjt){
				gpiBridge(
					{
						"command": "kill_queue_item",
						'queueItemInfo': {
							'id': queueId
						}
					},
					function(){}
				);
				// console.log('kill queueId = '+queueId+' done.');
				callback(true); // gpiBridgeの完了を待たず返す

			}); })
		;

		return;
	}

}

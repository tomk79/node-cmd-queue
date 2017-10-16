/**
 * command-queue - main.js
 */
module.exports = function(config){
	var _this = this;
	config = config||{};
	var allowedCommands = config.allowedCommands||[];
	var pathDefaultCurrentDir = process.cwd();
	var currentDirs = config.cd||{'default': pathDefaultCurrentDir};
		preprocess = config.preprocess||function(cmd, callback){
			callback(cmd);
		};
	var gpiBridge = config.gpiBridge||function(){};
	var outputLog = [];
	var maxOutputLogMessageCount = 100;

	var it79 = require('iterate79'),
		queue = new it79.queue({
			'threadLimit': 1 , // 並行処理する場合のスレッド数上限
			'process': function(cmdOpt, done, queueItemInfo){
				// console.log('=-=-=-=-=-=-=-=-= prosess');
				// console.log(cmdOpt, queueItemInfo);

				var openMsg = {
					'command': 'open',
					'queueItemInfo': queueItemInfo,
					'tags': cmdOpt.tags,
					'data': cmdOpt.cmd.join(' ')
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
					'stdout': function(data){
						// console.error('onData.', data.toString());
						var msg = {
							'command': 'stdout',
							'queueItemInfo': queueItemInfo,
							'tags': cmdOpt.tags,
							'data': data.toString()
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
							'queueItemInfo': queueItemInfo,
							'tags': cmdOpt.tags,
							'data': data.toString()
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
							'queueItemInfo': queueItemInfo,
							'tags': cmdOpt.tags,
							'data': status
						};
						outputLogPush(msg);
						gpiBridge(
							msg,
							function(){
								setTimeout(function(){
									done();
								}, 0);
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
		if(params.cdName){
			params.cdName = currentDirs[params.cdName];
		}else{
			params.cdName = currentDirs['default'];
		}
		var queueId = queue.push(params);
		callback(queueId);
		return;
	}

	/**
	 * 標準出力ログを取得する
	 */
	this.getOutputLog = function(){
		return outputLog;
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
		var tmpCd = options.cd;
		if( tmpCd ){
			process.chdir( tmpCd );
		}

		preprocess(
			options,
			function(options){
				if(options === false){
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

				var proc = require('child_process').spawn(cmd, cmdAry);
				proc.stdout.on('data', function(text){
					options.stdout(text);
				});
				proc.stderr.on('data', function(text){
					options.stderr(text);
				});
				proc.on('close', function(code){
					process.chdir( pathDefaultCurrentDir );
					options.complete(code);
				});

			}
		);
		return;
	}
}

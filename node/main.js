/**
 * command-queue - main.js
 */
module.exports = function(config){
	var _this = this;
	config = config||{};
	var allowedCommands = config.allowedCommands||[];
	config.checkCommand = config.checkCommand||function(){};
	var gpiBridge = config.gpiBridge||function(){};

	var it79 = require('iterate79'),
		queue = new it79.queue({
			'threadLimit': 1 , // 並行処理する場合のスレッド数上限
			'process': function(cmdOpt, done, queryInfo){
				// console.log('=-=-=-=-=-=-=-=-= prosess');
				// console.log(cmdOpt, queryInfo);

				gpiBridge(
					{
						'command': 'open',
						'queryInfo': queryInfo,
						'tags': cmdOpt.tags,
						'data': cmdOpt.cmd.join(' ')
					},
					function(){
					}
				);

				_this.cmd({
					'command': cmdOpt,
					'stdout': function(data){
						// console.error('onData.', data.toString());
						gpiBridge(
							{
								'command': 'stdout',
								'queryInfo': queryInfo,
								'tags': cmdOpt.tags,
								'data': data.toString()
							},
							function(){
							}
						);

					},
					'stderr': function(data){
						// console.error('onError.', data.toString());
						gpiBridge(
							{
								'command': 'stderr',
								'queryInfo': queryInfo,
								'tags': cmdOpt.tags,
								'data': data.toString()
							},
							function(){
							}
						);
					},
					'complete': function(status){
						// console.error('onClose.', status);
						gpiBridge(
							{
								'command': 'close',
								'queryInfo': queryInfo,
								'tags': cmdOpt.tags,
								'data': status
							},
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

	var pathDefaultCurrentDir = process.cwd();
	var currentDirs = config.cd||{'default': pathDefaultCurrentDir};
		processor = config.processor||function(cmd, callback){
			callback(cmd);
		};

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
	 * コマンド内容をユーザー関数で確認
	 * 必要に応じて加工済みのコマンドで置き換える。
	 */
	function userCheckCommand(cmdAry, callback){
		config.checkCommand(cmdAry, function(cmdAry){
			callback(cmdAry);
		});
		return;
	}

	/**
	 * コマンドを実行する
	 */
	this.cmd = function(options){
		options = options || {};
		var cmdAry = options.command.cmd || null;
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
		var tmpCd = options.command.cdName; // 無指定の場合、 `default` を参照する。
		var cmdTags = options.command.tags || [];
		userCheckCommand(
			cmdAry,
			function(cmdAry){
				if( !cmdAry ){
					// コマンドが指定されていない
					options.complete("ERROR: Unallowed command.");
					return;
				}
				options.stdout = options.stdout || function(){};
				options.stderr = options.stderr || function(){};
				options.complete = options.complete || function(){};

				var child_process = require('child_process');

				if( tmpCd ){
					process.chdir( tmpCd );
				}

				var cmd = cmdAry.shift();

				var proc = require('child_process').spawn(cmd, cmdAry);
				proc.stdout.on('data', function(data){
					options.stdout(data);
				});
				proc.stderr.on('data', function(data){
					options.stderr(data);
				});
				proc.on('close', function(code){
					if( tmpCd ){
						process.chdir( pathDefaultCurrentDir );
					}
					options.complete(code);
				});

			}
		);
		return;
	}
}

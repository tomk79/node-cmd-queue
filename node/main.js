/**
 * command-queue - main.js
 */
module.exports = function(config){
	var _this = this;
	config = config||{};
	config.allowedCommands = config.allowedCommands||[];
	config.checkCommand = config.checkCommand||function(){};
	config.gpiBridge = config.gpiBridge||function(){};

	var it79 = require('iterate79'),
		queue = new it79.queue({
			'threadLimit': 1 , // 並行処理する場合のスレッド数上限
			'process': function(cmdOpt, done, queryInfo){
				console.log('=-=-=-=-=-=-=-=-= prosess');
				console.log(cmdOpt, queryInfo);

				_this.cmd({
					'command': cmdOpt,
					'stdout': function(data){
						console.error('onData.', data.toString());
						config.gpiBridge(
							{
								'command': 'stdout',
								'queryInfo': queryInfo,
								'tags': cmdOpt.tags,
								'data': data.toString()
							},
							function(){
								done();
							}
						);

					},
					'stderr': function(data){
						console.error('onError.', data.toString());
						config.gpiBridge(
							{
								'command': 'stderr',
								'queryInfo': queryInfo,
								'tags': cmdOpt.tags,
								'data': data.toString()
							},
							function(){
								done();
							}
						);
					},
					'complete': function(){
						console.error('onClose.');
						config.gpiBridge(
							{
								'command': 'close',
								'queryInfo': queryInfo,
								'tags': cmdOpt.tags,
								'data': ''
							},
							function(){
								done();
							}
						);
					}
				});

			}
		});

	var pathDefaultCurrentDir = process.cwd();
	var cd = config.cd||{'default': pathDefaultCurrentDir};
		processor = config.processor||function(cmd, callback){
			callback(cmd);
		};

	/**
	 * GPI
	 * クライアントからのメッセージを受けて処理する
	 */
	this.gpi = function(message){
		var Gpi = require('./gpi.js');
		return Gpi(this, message);
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
	 * クエリを追加する
	 */
	this.query = function(params, callback){
		callback = callback || function(){};
		queue.push(params);
		callback();
		return;
	}

	/**
	 * コマンド内容をユーザー関数で確認
	 * 必要に応じて加工済みのコマンドで置き換える。
	 */
	function checkCommand(cmdAry, callback){
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
			options.complete(false);
			return;
		}
		if( !isCommandAllowed(cmdAry, config.allowedCommands) ){
			// 許可されていないコマンド
			options.complete(false);
			return;
		}
		var cmdCdName = options.command.cdName || 'default'; // 無指定の場合、 `default` を参照する。
		var cmdTags = options.command.tags || [];
		checkCommand(
			cmdAry,
			function(cmdAry){
				options.stdout = options.stdout || function(){};
				options.stderr = options.stderr || function(){};
				options.complete = options.complete || function(){};

				var child_process = require('child_process');

				var tmpCd = cd[cmdCdName];
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
				proc.on('close', function(){
					if( tmpCd ){
						process.chdir( pathDefaultCurrentDir );
					}
					options.complete();
				});

			}
		);
		return;
	}
}

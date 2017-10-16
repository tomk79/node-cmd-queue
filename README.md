# command-queue

コマンドラインタスクの直列処理とウェブアプリUIへの表示など。

## インストール - Install

準備中です。

## 使い方 - Usage

### サーバー側 - Server side JavaScript (NodeJS)

```js
var express = require('express'),
	app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

var CommandQueue = require('command-queue');
var commandQueue = new CommandQueue({
	'cd': {
		// コマンドを実行するときのカレントディレクトリの一覧
		// クライアント側から直接パスを指定できないよう、パスと名前の対として管理します。
		'default': process.cwd(),
		'tests': process.cwd()+'/tests'
	},
	'allowedCommands': [
		// 実行を許可するコマンド (前方一致で評価)
		'ls',
		'pwd',
		['git', 'status'],
		['git', 'log'],
		['npm', 'update']
	],
	'preprocess': function(cmd, callback){
		// 実行前の加工などの処理があれば記述
		// console.log(cmd);
		callback(cmd);
		return;
	},
	'gpiBridge': function(message, done){
		// サーバーからクライアントへのメッセージ送信を仲介
		io.emit('command-queue-message', message);
		done();
		return;
	}
});

app.use( '/path/to/command-queue/', express.static( '/path/to/node_modules/command-queue/' ) );

app.use( '/apis/commandQueue', function(req, res, next){
	res
		.status(200)
		.set('Content-Type', 'text/plain')
	;

	// クライアントから受け取ったメッセージをGPIへ送る
	commandQueue.gpi(req.query.message, function(result){
		res.write( JSON.stringify(result) );
		res.flushHeaders();
		res.end();
	});

	return;
} );

// 3000番ポートでLISTEN状態にする
server.listen( 3000, function(){
	console.log('server-standby');
} );
```

### クライアント側 - Client side JavaScript

```html
<!DOCTYPE html>
<html>
<head>
<title>CommandQueue DEMO</title>
<!-- command-queue.css -->
<link rel="stylesheet" href="/path/to/command-queue/dist/command-queue.css" />
</head>
<body>

<div id="finder1"></div>

<!-- Socket.io (required) -->
<script src="/socket.io/socket.io.js"></script>

<!-- command-queue.js -->
<script src="/path/to/command-queue/dist/command-queue.js"></script>

<script>
var socket = io();
var commandQueue = new CommandQueue(
	{
		'gpiBridge': function(message, done){
			// クライアントからサーバーへのメッセージ送信を仲介

			var data = '';
			$.ajax({
				'url': '/apis/commandQueue',
				'data': {
					'message': message
				},
				'success': function(result){
					data += result;
				},
				'complete': function(){
					var result = JSON.parse(data);
					done(result);
				}
			});
		}
	}
);
socket.on('command-queue-message', function(message){
	commandQueue.gpi(message);
});

// 端末を生成する
var terminal = commandQueue.createTerminal( document.getElementById('finder1') );

// 新しいキューを追加する
commandQueue.addQueueItem(['pwd']);

</script>
</body>
</html>
```

### commandQueue コンストラクタオプション

#### gpiBridge

クライアントからサーバーへのメッセージ送信を仲介するコールバック関数を指定します。上記の実装例は、 jQuery を使用してAJAXリクエストを送信するサンプルです。

### 端末生成時オプション

```js
// 端末を生成する
var terminal = commandQueue.createTerminal(
	document.getElementById('finder1'), // 端末を表示するためのDOM要素
	{ // Options
		'queueId': queueId, // Queue ID でフィルタリングする
		'tags': ['tag1', 'tag2'] // タグでフィルタリングする
	}
);
```

### 新規キュー追加時オプション

```js
// 新しいキューを追加する
commandQueue.addQueueItem(
	['ls', '-la'], //　コマンド(CLIオプションはスペース区切りで配列要素に追加する)
	{
		'cdName': 'tests', // コマンド実行時のカレントディレクトリ。サーバーサイドのオプション `cd` と突き合わせられる。
		'tags': ['tag2', 'tag2'], // 端末が表示をフィルタリングするために用いるタグ。
		'accept': function(queueId){
			// キュー発行の完了イベントハンドラ
			// 注意: キューに追加した時点で呼ばれます。コマンドの実行完了イベントではありません。
			// 発行したキューのID文字列が返されます。
			console.log(queueId);
		}
	}
);
```

## 更新履歴 - Change log

### command-queue@0.1.0 (2017-??-??)

- Initial Release.


## ライセンス - License

MIT License


## 作者 - Author

- Tomoya Koyanagi <tomk79@gmail.com>
- website: <http://www.pxt.jp/>
- Twitter: @tomk79 <http://twitter.com/tomk79/>

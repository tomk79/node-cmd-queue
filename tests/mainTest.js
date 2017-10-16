var assert = require('assert');
var utils79 = require('utils79');
var CmdQueue = require('../node/main.js');

describe('Initialize Instance', function() {

	it("Initialize Instance", function(done) {
		this.timeout(60*1000);
		var cmdQueue = new CmdQueue({});

		assert.equal(typeof(cmdQueue), typeof({}));

		done();
	});
});

describe('Current Dirs', function() {

	it("Set, Get, Current Dirs", function(done) {
		this.timeout(60*1000);
		var cmdQueue = new CmdQueue({
			"cd": {
				"default": __dirname
			}
		});

		// 全件取得
		assert.deepEqual(cmdQueue.getAllCurrentDirs(), {
			"default": __dirname
		});

		// 1件取得
		assert.strictEqual(cmdQueue.getCurrentDir('default'), __dirname);

		// 更新
		assert.strictEqual(cmdQueue.setCurrentDir('default', __dirname+'/test1'), true);
		assert.strictEqual(cmdQueue.getCurrentDir('default'), __dirname+'/test1');

		// 追加
		assert.strictEqual(cmdQueue.setCurrentDir('added1', __dirname), true);
		assert.deepEqual(cmdQueue.getAllCurrentDirs(), {
			"default": __dirname+'/test1',
			"added1": __dirname
		});

		// 削除
		assert.strictEqual(cmdQueue.removeCurrentDir('added1'), true);
		assert.deepEqual(cmdQueue.getAllCurrentDirs(), {
			"default": __dirname+'/test1'
		});

		// すべて削除
		assert.strictEqual(cmdQueue.clearAllCurrentDirs(), true);
		assert.deepEqual(cmdQueue.getAllCurrentDirs(), {
		});

		done();
	});

});

describe('Allowed Commands', function() {

	it("Set, Get, Allowed Commands", function(done) {
		this.timeout(60*1000);
		var cmdQueue = new CmdQueue({
			"cd": {
				"default": __dirname
			}
		});

		// 全件取得
		assert.deepEqual(cmdQueue.getAllAllowedCommands(), []);

		// 追加
		assert.strictEqual(cmdQueue.addAllowedCommand(['git', 'status']), true);
		assert.deepEqual(cmdQueue.getAllAllowedCommands(), [['git', 'status']]);

		// 追加
		assert.strictEqual(cmdQueue.addAllowedCommand(['git', 'log']), true);
		assert.deepEqual(cmdQueue.getAllAllowedCommands(), [['git', 'status'], ['git', 'log']]);

		// 追加(既に登録済みのコマンドは増えない)
		assert.strictEqual(cmdQueue.addAllowedCommand(['git', 'status']), true);
		assert.deepEqual(cmdQueue.getAllAllowedCommands(), [['git', 'status'], ['git', 'log']]);

		// 削除
		assert.strictEqual(cmdQueue.removeAllowedCommand(['git', 'log']), true);
		assert.deepEqual(cmdQueue.getAllAllowedCommands(), [['git', 'status']]);

		// すべて削除
		assert.strictEqual(cmdQueue.clearAllAllowedCommands(), true);
		assert.deepEqual(cmdQueue.getAllAllowedCommands(), []);

		done();
	});

});

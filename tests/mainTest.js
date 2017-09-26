var assert = require('assert');
var utils79 = require('utils79');
var CommandQueue = require('../node/main.js');

describe('Initialize Instance', function() {

	it("Initialize Instance", function(done) {
		this.timeout(60*1000);
		var commandQueue = new CommandQueue({});

		assert.equal(typeof(commandQueue), typeof({}));

		done();
	});
});

describe('Current Dirs', function() {

	it("Set, Get, Current Dirs", function(done) {
		this.timeout(60*1000);
		var commandQueue = new CommandQueue({
			"cd": {
				"default": __dirname
			}
		});

		// 全件取得
		assert.deepEqual(commandQueue.getAllCurrentDirs(), {
			"default": __dirname
		});

		// 1件取得
		assert.strictEqual(commandQueue.getCurrentDir('default'), __dirname);

		// 更新
		assert.strictEqual(commandQueue.setCurrentDir('default', __dirname+'/test1'), true);
		assert.strictEqual(commandQueue.getCurrentDir('default'), __dirname+'/test1');

		// 追加
		assert.strictEqual(commandQueue.setCurrentDir('added1', __dirname), true);
		assert.deepEqual(commandQueue.getAllCurrentDirs(), {
			"default": __dirname+'/test1',
			"added1": __dirname
		});

		// 削除
		assert.strictEqual(commandQueue.removeCurrentDir('added1'), true);
		assert.deepEqual(commandQueue.getAllCurrentDirs(), {
			"default": __dirname+'/test1'
		});

		// すべて削除
		assert.strictEqual(commandQueue.clearAllCurrentDirs(), true);
		assert.deepEqual(commandQueue.getAllCurrentDirs(), {
		});

		done();
	});

});

describe('Allowed Commands', function() {

	it("Set, Get, Allowed Commands", function(done) {
		this.timeout(60*1000);
		var commandQueue = new CommandQueue({
			"cd": {
				"default": __dirname
			}
		});

		// 全件取得
		assert.deepEqual(commandQueue.getAllAllowedCommands(), []);

		// 追加
		assert.strictEqual(commandQueue.addAllowedCommand(['git', 'status']), true);
		assert.deepEqual(commandQueue.getAllAllowedCommands(), [['git', 'status']]);

		// 追加
		assert.strictEqual(commandQueue.addAllowedCommand(['git', 'log']), true);
		assert.deepEqual(commandQueue.getAllAllowedCommands(), [['git', 'status'], ['git', 'log']]);

		// 追加(既に登録済みのコマンドは増えない)
		assert.strictEqual(commandQueue.addAllowedCommand(['git', 'status']), true);
		assert.deepEqual(commandQueue.getAllAllowedCommands(), [['git', 'status'], ['git', 'log']]);

		// 削除
		assert.strictEqual(commandQueue.removeAllowedCommand(['git', 'log']), true);
		assert.deepEqual(commandQueue.getAllAllowedCommands(), [['git', 'status']]);

		// すべて削除
		assert.strictEqual(commandQueue.clearAllAllowedCommands(), true);
		assert.deepEqual(commandQueue.getAllAllowedCommands(), []);

		done();
	});

});

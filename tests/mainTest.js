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

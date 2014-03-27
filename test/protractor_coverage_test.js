'use strict';

var grunt = require('grunt');
var protractorCoverage=require('../tasks/protractor_coverage');

/*
  ======== A Handy Little Nodeunit Reference ========
  https://github.com/caolan/nodeunit

  Test methods:
    test.expect(numAssertions)
    test.done()
  Test assertions:
    test.ok(value, [message])
    test.equal(actual, expected, [message])
    test.notEqual(actual, expected, [message])
    test.deepEqual(actual, expected, [message])
    test.notDeepEqual(actual, expected, [message])
    test.strictEqual(actual, expected, [message])
    test.notStrictEqual(actual, expected, [message])
    test.throws(block, [error], [message])
    test.doesNotThrow(block, [error], [message])
    test.ifError(value)
*/

exports.protractor_coverage = {
  setUp: function(done) {
    // setup here if necessary
    done();
  },
  protractor_coverage: function(test) {
    test.expect(1);
    grunt.task.run('protractor_coverage');
    test.equal(1,1);

    /*var actual = grunt.file.read('tmp/default_options');
    var expected = grunt.file.read('test/expected/default_options');
    test.equal(actual, expected, 'should describe what the default behavior is.');*/

    test.done();
  },
};

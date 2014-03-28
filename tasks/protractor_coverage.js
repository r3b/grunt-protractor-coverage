/*
 * grunt-protractor-coverage
 * https://github.com/r3b/grunt-protractor-coverage
 *
 * Copyright (c) 2014 ryan bridges
 * Licensed under the APLv2 license.
 */

'use strict';

var util = require('util');
var path = require('path');
var dargs = require('dargs-object');
var tmp = require('temporary');

module.exports = function(grunt) {

  grunt.registerMultiTask('protractor_coverage', 'Instrument your code and gather coverage data from Protractor E2E tests', function() {
    var coverageSpecSource = grunt.file.read("resources/specFile.tmpl");
    // '.../node_modules/protractor/lib/protractor.js'
    var protractorMainPath = require.resolve('protractor');
    // '.../node_modules/protractor/bin/protractor'
    var protractorBinPath = path.resolve(protractorMainPath, '../../bin/protractor');
    // '.../node_modules/protractor/referenceConf.js'
    var protractorRefConfPath = path.resolve(protractorMainPath, '../../referenceConf.js');
    // Merge task-specific and/or target-specific options with these defaults.
    var opts = this.options({
      configFile: (!grunt.util._.isUndefined(this.data.configFile)) ? this.data.configFile : protractorRefConfPath,
      keepAlive: true,
      noColor: false,
      debug: false,
      args: {}
    });
    grunt.verbose.writeln("Options: " + util.inspect(opts));

    var keepAlive = opts['keepAlive'];
    var supportedArgs = [
      //string
      "seleniumAddress", "seleniumServerJar", "seleniumPort", "baseUrl",
      "rootElement", "browser", "chromeDriver", "chromeOnly", "sauceUser",
      "sauceKey", "framework",
      //list
      "specs",
      //boolean
      "includeStackTrace", "verbose",
      //object
      "params", "capabilities", "cucumberOpts"
    ];
    var args = [protractorBinPath, opts.configFile];
    if (opts.noColor) {
      args.push('--no-jasmineNodeOpts.showColors');
    }
    if (!grunt.util._.isUndefined(opts.debug) && opts.debug === true) {
      args.splice(1, 0, 'debug');
    }

    var suppliedArgs = supportedArgs.reduce(function(args, arg) {
      var value = grunt.option(arg) || opts.args[arg];
      if ("undefined" !== typeof value && value != null) {
        args[arg] = value;
      }
      return args;
    }, {});

    var specFile = (new tmp.File()).path;
    var coverageFile = path.resolve(opts.coverageFile) || (new tmp.File()).path;
    var coverageDir = path.dirname(coverageFile);
    grunt.file.mkdir(coverageDir);
    var specFileContent = grunt.template.process(coverageSpecSource, {
      data: {
        filename: coverageFile,
        coverage: '__coverage__'
      }
    });
    grunt.file.write(specFile, specFileContent);

    suppliedArgs.specs = suppliedArgs.specs || [];
    var pConfigs = require(path.resolve(opts.configFile));
    suppliedArgs.specs = suppliedArgs.specs.concat(pConfigs.config.specs || []);
    suppliedArgs.specs.push(specFile);
    suppliedArgs.specs = grunt.file.expand(suppliedArgs.specs);


    args = args.concat(dargs(suppliedArgs, {
      joinLists: true
    }));
    //grunt.verbose.writeln("Config:\n"+JSON.stringify(pConfigs, null, 4));
    grunt.verbose.writeln("Specs: \n\t" + suppliedArgs.specs.join("\n\t"));
    grunt.verbose.writeln("Coverage File: \n\t" + coverageFile);
    grunt.verbose.writeln("Spawn node with arguments: " + args);
    // Spawn protractor command
    var done = this.async();
    grunt.util.spawn({
        cmd: 'node',
        args: args,
        opts: {
          stdio: 'inherit'
        }
      },
      function(error, result, code) {
        if (error) {
          grunt.log.error(String(result));
          if (code === 1 && keepAlive) {
            // Test fails but do not want to stop the grunt process.
            grunt.log.oklns("Test failed but keep the grunt process alive.");
            done();
            done = null;
          } else {
            // Test fails and want to stop the grunt process,
            // or protractor exited with other reason.
            grunt.fail.fatal('protractor exited with code: ' + code, 3);
          }
        } else {
          done();
          done = null;
        }
      }
    );
  });

};

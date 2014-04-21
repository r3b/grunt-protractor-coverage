/*
 * grunt-protractor-coverage
 * https://github.com/r3b/grunt-protractor-coverage
 *
 * Copyright (c) 2014 ryan bridges
 * Licensed under the APLv2 license.
 */

'use strict';

var http = require('http');
var util = require('util');
var fs = require('fs');
var path = require('path');
var dargs = require('dargs-object');
var tmp = require('temporary');
var esprima=require('esprima');
var estraverse=require('estraverse');
var escodegen=require('escodegen');
Array.prototype.unique = function() {
    var a = [], l = this.length;
    for(var i=0; i<l; i++) {
      for(var j=i+1; j<l; j++){
        if (this[i] === this[j]){
          j = ++i;
        }
      }
      a.push(this[i]);
    }
    return a;
};
module.exports = function(grunt) {
  function instrumentSpecFile(payload, file){
    var code= grunt.file.read(file);
    var ast=esprima.parse(code);
    if(!ast){
      return;
    }
    estraverse.traverse(ast, {
      enter: function (node, parent) {
        if(node.type==='CallExpression' && node.callee.type==='Identifier' && node.callee.name==='describe'){
          node.arguments
            .filter(function(n){return n.type==='FunctionExpression';})
            .forEach(function(f){
              f.body.body=payload.body.concat(f.body.body);
            });
        }
      }
    });
    estraverse.traverse(ast, {
      enter: function (node, parent) {
        if(node.type==='CallExpression' && node.callee.type==='Identifier' && node.callee.name==='require'){
          node.arguments=node.arguments
            .map(function(f){
              if(f.type==='Literal'){
                if(/^\.\//.test(f.value)){
                  if(!/\.js$/.test(f.value)){
                    f.value=f.value+'.js';
                  }
                }
                f.value=f.value.replace(/^\.\//, path.dirname(file)+'/');
              }
              return f;
            });
        }
      }
    });
    var newSpecFile=(new tmp.File()).path;
    grunt.verbose.writeln("Writing new Spec file: %s", newSpecFile);
    grunt.file.write(newSpecFile, escodegen.generate(ast));
    return newSpecFile;
  }

  grunt.registerMultiTask('protractor_coverage', 'Instrument your code and gather coverage data from Protractor E2E tests', function() {
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
    var saveCoverageTemplate = grunt.file.expand(["resources/saveCoverage.tmpl", "node_modules/grunt-protractor-coverage/resources/saveCoverage.tmpl", process.cwd()+'/**/resources/saveCoverage.tmpl']).shift();
    if(!saveCoverageTemplate){
      grunt.fail.fatal("Coverage template file not found.");
    }
    var coverageDir = path.resolve(opts.coverageDir||'coverage/');
    coverageDir = coverageDir.replace(/\\/g,'/');
    var saveCoverageSource = grunt.file.read(saveCoverageTemplate);
    var saveCoverageContent=grunt.template.process( saveCoverageSource, {
      data: {
        dirname: coverageDir,
        coverage: '__coverage__'
      }
    });
    var saveCoverageAST=esprima.parse(saveCoverageContent);
    grunt.verbose.writeln("Options: " + util.inspect(opts));

    var keepAlive = opts['keepAlive'];
    var supportedArgs = [
      //string
      "seleniumAddress", "seleniumServerJar", "seleniumPort", "baseUrl",
      "rootElement", "browser", "chromeDriver", "chromeOnly", "sauceUser",
      "sauceKey", "framework",
      //list
      "specs","exclude",
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
    var configDir=path.dirname(path.resolve(opts.configFile));
    grunt.file.mkdir(coverageDir);

    var pConfigs = require(path.resolve(opts.configFile));
    var specs=suppliedArgs.specs || [];
    var excludes=suppliedArgs.exclude || [];
    suppliedArgs.specs=[];
    specs = specs.concat(pConfigs.config.specs || []);
    excludes= excludes.concat(pConfigs.config.exclude || []);
    excludes=grunt.file.expand(excludes);
    grunt.verbose.writeln("Provided specs:", specs);
    grunt.verbose.writeln("Exclusions:", excludes);
    var files = grunt.file.expand(specs).filter(function(file){return excludes.indexOf(file)===-1;});
    grunt.verbose.writeln("Expanded specs:", files);
    //for each spec file, wrap each method call with a closure to save the coverage object
    suppliedArgs.specs=files.map(function(file){return instrumentSpecFile(saveCoverageAST, file);});

    args = args
      .concat(dargs(suppliedArgs, {
        joinLists: true
      }));
    var gargs=grunt.option.flags()
      .filter(function(f){return args.indexOf(f)===-1;})
      .map(function(f){return f.split('=');})
      .reduce(function(a, f){return a.concat(f);},[]);
    args=args.concat(gargs);

    grunt.verbose.writeln("Specs: \n\t" + suppliedArgs.specs.join("\n\t"));
    grunt.verbose.writeln("Spawn node with arguments: " + args);
    // start the collector
    var collector=require('coverage-collector');
    collector(3001);

    // Spawn protractor command
    function getCoverageData(callback){
        http.get("http://localhost:3001/data", function(res) {
          var payload="";
          res.on('data', function (chunk) {
            payload+=chunk;
            // grunt.log.warn('BODY: ' + chunk);
          });
          res.on('end', function(){
            http.get("http://localhost:3001/done", function(res) {
              if(callback){callback(payload);}
            })
            .on('error', function(e) {
              grunt.log.error("Got error: " + e.message);
              if(callback){callback(payload);}
            });
          });
        }).on('error', function(e) {
          grunt.log.error("Got error: " + e.message);
        });
      }
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
              getCoverageData(function(payload){
                try{
                  var filename=path.normalize([coverageDir,'/coverage.json'].join(''));
                  fs.writeFileSync(filename, payload);
                }catch(e){
                  grunt.log.error("Got error: " + e.message);
                }
                done();
                done = null;
              });
            } else {
              // Test fails and want to stop the grunt process,
              // or protractor exited with other reason.
              grunt.fail.fatal('protractor exited with code: ' + code, 3);
            }
          } else {
              getCoverageData(function(payload){
                try{
                  var filename=path.normalize([coverageDir,'/coverage.json'].join(''));
                  fs.writeFileSync(filename, payload);
                }catch(e){
                  grunt.log.error("Got error: " + e.message);
                }

                done();
                done = null;
              });
          }
       // });
      }
    );
  });
};

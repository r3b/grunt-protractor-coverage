/*
 * grunt-protractor-coverage
 * https://github.com/r3b/grunt-protractor-coverage
 *
 * Copyright (c) 2014 ryan bridges
 * Licensed under the APLv2 license.
 */

'use strict';
var tmp = require('tmp');
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    jshint: {
      all: [
        'Gruntfile.js',
        'tasks/*.js',
        '<%= nodeunit.tests %>',
      ],
      options: {
        jshintrc: '.jshintrc',
      },
    },

    // Before generating any new files, remove any previously-created files.
    clean: {
      options: {
        force:true
      },
      tests: ['tmp', 'build', 'instrumented', 'coverage', 'reports'],
    },
    connect: {
      server: {
        options: {
          port: 3000,
          base: 'instrumented/resources/app/angularjs'
        }
      },
    },
    // Configuration to be run (and then tested).
    protractor_coverage: {
      options: {
        configFile: "test/protractorConf.js", // Default config file
        keepAlive: true, // If false, the grunt process stops when the test fails.
        noColor: false, // If true, protractor will not use colors in its output.
        coverageDir: 'coverage',
        args: {},
        saveCoverageTemplate: "resources/saveCoverage.tmpl"
      },
      local: {
        options: {
          args: {
            baseUrl: 'http://localhost:3000/',
            // Arguments passed to the command
            'browser': 'chrome'
          }
        }
      },
      remote: {
        options: {
          configFile: "test/protractorConf.remote.js", // Default config file
          args: {
            baseUrl: 'http://localhost:3000/',
            // Arguments passed to the command
            'browser': 'chrome'
          }
        }
      },
      cucumber: {
        options: {
          configFile: "test/cucumber.conf.js",
          noInject: true
        }
      }
    },
    copy: {
      'instrument': {
        files: [{
          src: ['resources/app/**/*', '!resources/app/**/*.js'],
          dest: 'instrumented/'
        }]
      },
    },
    instrument: {
      files: 'resources/app/**/*.js',
      options: {
        lazy: true,
        basePath: "instrumented"
      }
    },
    makeReport: {
      src: 'coverage/**/*.json',
      options: {
        type: 'lcov',
        dir: 'reports',
        print: 'detail'
      }
    },

    // Unit tests.
    nodeunit: {
      tests: ['test/*_test.js'],
    },
    coveralls: {
      main:{
        src: 'reports/**/*.info',
        options: {
          force: true
        },
      },
    },

  });

  // Actually load this plugin's task(s).
  grunt.loadTasks('tasks');

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-nodeunit');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-istanbul');
  grunt.loadNpmTasks('grunt-coveralls');
  grunt.loadNpmTasks('grunt-selenium-webdriver');

  // Whenever the "test" task is run, first clean the "tmp" dir, then run this
  // plugin's task(s), then test the result.
  grunt.registerTask('test', ['clean', 'copy', 'instrument', 'connect:server', 'selenium_start', 'protractor_coverage:local', 'selenium_stop', 'makeReport', 'coveralls']);
  grunt.registerTask('test-remote', ['clean', 'copy', 'instrument', 'connect:server', 'protractor_coverage:remote', 'makeReport', 'coveralls']);
  grunt.registerTask('test-cucumber', ['clean', 'copy', 'instrument', 'connect:server', 'selenium_start', 'protractor_coverage:cucumber', 'selenium_stop', 'makeReport', 'coveralls']);

  // By default, lint and run all tests.
  grunt.registerTask('default', ['jshint', 'test']);

};

# grunt-protractor-coverage
[![Build Status](https://travis-ci.org/r3b/grunt-protractor-coverage.svg?branch=master)](https://travis-ci.org/r3b/grunt-protractor-coverage)
[![Coverage Status](https://coveralls.io/repos/r3b/grunt-protractor-coverage/badge.png)](https://coveralls.io/r/r3b/grunt-protractor-coverage)

> Instrument your code and gather coverage data from Protractor E2E tests

## Getting Started
This plugin requires Grunt `~0.4.4`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

The underlying code is borrowed heavily from [grunt-protractor-runner](https://github.com/teerapap/grunt-protractor-runner) and most options are still intact.

```shell
npm install grunt-protractor-coverage --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-protractor-coverage');
```

## The "protractor_coverage" task

### Overview
In your project's Gruntfile, add a section named `protractor_coverage` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  protractor_coverage: {
    options: {
      // Task-specific options go here.
    },
    your_target: {
      // Target-specific file lists and/or options go here.
    },
  },
})
```

#### Default Options
In this example, the default options are used to do capture coverage of your protractor tests.

Measuring coverage from protractor tests does not work out of the box. To measure coverage Protractor coverage, all
sources need to be instrumented using istanbul.

```js
    instrument: {
        files: 'src/**/*.js',
        options: {
            lazy: true,
            basePath: "instrumented"
        }
    }
```

And the server running the code / app should use that instrumented code.

```js
    connect: {
        options: {
            port: 9000,
            hostname: 'localhost'
        },
        runtime: {
            options: {
                middleware: function (connect) {
                    return [
                        lrSnippet,
                        mountFolder(connect, 'instrumented'),
                        mountFolder(connect, '.......')
                    ];
                }
            }
        }
    }
```

Next to that your test should be run.

```js
    protractor_coverage: {
        options: {
            keepAlive: true,
            noColor: false,
            collectorPort: 3001,
            coverageDir: 'path/to/coverage/dir',
            args: {
                baseUrl: 'http://localhost:9000'
            }
        },
        local: {
            options: {
                configFile: 'path/to/protractor-local.conf.js'
            }
        },
        travis: {
            options: {
                configFile: 'path/to/protractor-travis.conf.js'
            }
        }
    }
```

After the tests have been run and the coverage has been measured and captured you want to create a report.

```js
    makeReport: {
        src: 'path/to/coverage/dir/*.json',
        options: {
            type: 'lcov',
            dir: 'path/to/coverage/dir',
            print: 'detail'
        }
    }
```

### Cucumber tests
grunt-protractor-coverage normally injects code used for obtaining coverage information by generating altered versions of spec files, but Cucumber features are written in Gherkin rather than JavaScript so this will fail. You can prevent this from happening using the noInject option:

```js
    protractor_coverage: {
        options: {
            keepAlive: true,
            noInject: true,
            coverageDir: 'path/to/coverage/dir',
            args: {
                baseUrl: 'http://localhost:9000'
            }
        },
        local: {
            options: {
                configFile: 'path/to/protractor-local.conf.js'
            }
        }
    }
```

Once enabled you'll also need to update your step definitions to store coverage data after each scenario runs: 

```js
var coverage = require('grunt-protractor-coverage/cucumber');

module.exports = function () {
    // Step definitions go here
    
    this.After(coverage.getCoverage);
};
```

### Glue it all together!!

```js
grunt.initConfig({
    connect: {
        options: {
            port: 9000,
            hostname: 'localhost'
        },
        runtime: {
            options: {
                middleware: function (connect) {
                    return [
                        lrSnippet,
                        mountFolder(connect, 'instrumented'),
                        mountFolder(connect, '.......')
                    ];
                }
            }
        }
    },
    instrument: {
        files: 'src/**/*.js',
        options: {
        lazy: true,
            basePath: "instrumented"
        }
    },
    protractor_coverage: {
        options: {
            keepAlive: true,
            noColor: false,
            coverageDir: 'path/to/coverage/dir',
            args: {
                baseUrl: 'http://localhost:9000'
            }
        },
        local: {
            options: {
                configFile: 'path/to/protractor-local.conf.js'
            }
        },
        travis: {
            options: {
                configFile: 'path/to/protractor-travis.conf.js'
            }
        }
    },
    makeReport: {
        src: 'path/to/coverage/dir/*.json',
        options: {
            type: 'lcov',
            dir: 'path/to/coverage/dir',
            print: 'detail'
        }
    }
});
```

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History
_(Nothing yet)_

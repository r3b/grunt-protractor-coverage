exports.config = {
  // The address of a running selenium server. If specified, Protractor will
  // connect to an already running instance of selenium. This usually looks like
  seleniumAddress: 'http://localhost:4444/wd/hub',
  
  // Spec patterns are relative to the location of this config.
  specs: [
    'test/features/*.feature'
  ],

  // A base URL for your application under test. Calls to protractor.get()
  // with relative paths will be prepended with this.
  baseUrl: 'http://localhost:3000/',

  // Test framework to use. This may be one of:
  // jasmine, jasmine2, cucumber, mocha or custom.
  framework: 'cucumber',

  // Options to be passed to Cucumber.
  cucumberOpts: {}
};
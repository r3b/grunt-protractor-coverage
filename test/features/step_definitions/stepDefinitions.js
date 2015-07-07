//var coverage = require('grunt-protractor-coverage/cucumber');
var coverage = require('../../../cucumber');

module.exports = function() {

  this.After(coverage.getCoverage);

  this.Given(/^(\d+) seconds? has passed$/, function (seconds) {
    return browser.sleep(seconds * 1000);
  });
  
  this.When(/^the user goes to the home page$/, function () {
    return browser.driver.get(browser.baseUrl + '#');
  });
  
  this.Then(/^the todo list is present$/, function () {
    browser.waitForAngular();
		return browser.wait(function() {
			return element(by.id('new-todo')).isPresent();
		});
  });

};
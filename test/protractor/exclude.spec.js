'use strict';
describe('Ensure that the file globbing works', function() {
	it('should not be run.', function() {
		browser.sleep(3000);
		browser.driver.get(browser.baseUrl+'#');
		browser.waitForAngular();
		browser.wait(function() {
			return element(by.id('new-todo')).isPresent();
		});

	});
});

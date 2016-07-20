var http = require('http');
var options = {
  hostname: 'localhost',
  port: 3001,
  path: '/data',
  method: 'POST',
  headers:{
    'Content-Type':'application/json'
  }
};

function saveCoverage(data){
  var req = http.request(options, function(res) {
    res.on('data', function (chunk) {
    });
  });
  req.on('error', function(e) {
    console.warn('Could not save coverage: ' + e.message);
  });
  req.write(JSON.stringify(data));
  req.write('\n');
  req.end();
}

function getCoverage(callback) {
  browser.executeScript("return ('__coverage__' in window) ? window.__coverage__ : null;").then(function (coverage) {
    if (coverage) {
      saveCoverage(coverage);
    }
    typeof callback === 'function' && callback();
  });
}

module.exports = {
  options: options,
  getCoverage: getCoverage
};
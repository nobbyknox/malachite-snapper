'use strict';

var helper = require('./helper.js');
var config = helper.getConfig();
var log = require('bunyan').createLogger(config.loggerOptions);

var Client = require('node-rest-client').Client;

var client = new Client();

var http = require('http');

/*
var spawn = require('child_process').spawn,
    phantom  = spawn('./node_modules/.bin/phantomjs', [
        'lib/phantom.js',
        '/Users/nobby/dev/malachite/web/thumbs/',
        '16|https://cdnjs.com/libraries/',
        '18|http://nobbyk2.mooo.com:8091/']);

phantom.stdout.on('data', function (data) {
    log.trace('stdout: ' + data);
});

phantom.stderr.on('data', function (data) {
    log.trace('stderr: ' + data);
});

phantom.on('close', function (code, signal) {
    log.trace('signal ' + signal);
    log.trace('code: ' + code);

    log.debug('Time to see if images were created for the list of bookmark ids. If so, update bookmark.');
});
*/

//client.get('http://localhost:3003/system/nothumbs', function(data, response) {
//    log.trace('data: ', data);
//    log.trace('response: ', response);
//});


//http.get("http://localhost:3003/system/nothumbs", function(res) {
//    log.trace("Got response: ", res);
//}).on('error', function(e) {
//    console.log("Got error: " + e.message);
//});

// send SIGHUP to process
// grep.kill('SIGHUP');

// [{"id": 10, "thumb": "10.png"}]


var options = {
    hostname: 'http://localhost',
    port: 3003,
    path: '/system/nothumbs',
    method: 'GET'
    //headers: {
    //    'Content-Type': 'application/json',
    //    'Content-Length': postData.length
    //}
};

var req = http.request(options, function(res) {
    console.log('STATUS: ' + res.statusCode);
    console.log('HEADERS: ' + JSON.stringify(res.headers));
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
        console.log('BODY: ' + chunk);
    });
    res.on('end', function() {
        console.log('No more data in response.')
    })
});

req.on('error', function(e) {
    console.log('problem with request: ' + e.message);
});

// write data to request body
//req.write(postData);
req.end();

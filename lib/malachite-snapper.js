'use strict';

var helper = require('./helper.js');
var config = helper.getConfig();
var log = require('bunyan').createLogger(config.loggerOptions);

var request = require('request');

//var Client = require('node-rest-client').Client;
//var client = new Client();

var http = require('http');
var fs = require('fs');

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

getCandidates(function(bookmarks) {
    if (bookmarks) {

        var args = [];

        bookmarks.forEach(function(item) {
            log.debug(item.id, ' - ', item.title);
            args.push(item.id + '|' + item.address);
        });

        snapThem(args, function(err) {
            manageThumbUpdates(args, function(err) {
                log.debug('done');
            });
        });
    }
});



// -----------------------------------------------------------------------------

function getCandidates(next) {

    var options = {
        hostname: 'localhost',
        port: 3003,
        path: '/system/nothumbs',
        method: 'GET'
    };

    var req = http.request(options, function(res) {
        console.log('STATUS: ' + res.statusCode);
        console.log('HEADERS: ' + JSON.stringify(res.headers));
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            //console.log('BODY: ' + chunk);
            next(JSON.parse(chunk));
        });
        res.on('end', function() {
            //console.log('No more data in response.')
        })
    });

    //req.on('error', function(e) {
    //    console.log('problem with request: ' + e.message);
    //});

// write data to request body
// req.write(postData);
    req.end();

}

function snapThem(bookmarkArgs, next) {

    var cmdArgs = [
        'lib/phantom.js',
        '/Users/nobby/dev/malachite/web/thumbs/'];

    bookmarkArgs.forEach(function(item) {
        cmdArgs.push(item);
    });

    var spawn = require('child_process').spawn,
        phantom  = spawn('./node_modules/.bin/phantomjs', cmdArgs);

    phantom.stdout.on('data', function (data) {
        //log.trace('stdout: ' + data);
    });

    phantom.stderr.on('data', function (data) {
        //log.trace('stderr: ' + data);
    });

    phantom.on('close', function (code, signal) {
        //log.trace('signal ' + signal);
        //log.trace('code: ' + code);
        //log.debug('Time to see if images were created for the list of bookmark ids. If so, update bookmark.');

        next();
    });

}

function manageThumbUpdates(bookmarkArgs, next) {
    //log.debug(bookmarkArgs);

    var idsToUpdate = [];

    bookmarkArgs.forEach(function(item) {

        if (fs.existsSync('/Users/nobby/dev/malachite/web/thumbs/' + item.split('|')[0] + '.png')) {
            log.debug('Should update bookmark ID %s', item.split('|')[0]);
            idsToUpdate.push(item.split('|')[0]);
        }

        //log.debug('File %s exists: %s', item.split('|')[0], fs.existsSync('/Users/nobby/dev/malachite/web/thumbs/' + item.split('|')[0] + '.png'));
    });

    updateThumbs(idsToUpdate, function(err) {
        next();
    });

}

/**
 * Calls the API to update bookmark thumbnails. The API expects an array of bookmark IDs and thumbnail filenames.
 * Here is an example of an API payload:
 *
 * [ { "id": 1, "thumb": "1.png" } ]
 *
 * @param idArray
 * @param next
 */
function updateThumbs(idArray, next) {

    if (!idArray || idArray.length === 0) {
        next();
        return;
    }

    var payload = [];

    idArray.forEach(function(item) {
        payload.push({ id: item, thumb: item + '.png' });
    });

    var options = {
        hostname: 'localhost',
        port: 3003,
        path: '/system/updatethumbs',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    var req = http.request(options, function(res) {
        //console.log('STATUS: ' + res.statusCode);
        //console.log('HEADERS: ' + JSON.stringify(res.headers));
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            //console.log('BODY: ' + chunk);
            next();
        });
        res.on('end', function() {
            //console.log('No more data in response.')
        })
    });

    //req.on('error', function(e) {
    //    console.log('problem with request: ' + e.message);
    //});

    log.debug('Sending payload %j', payload);

    // write data to request body
    req.write(JSON.stringify(payload));
    req.end();

}

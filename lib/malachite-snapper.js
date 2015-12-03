'use strict';

var helper = require('./helper.js');
var config = helper.getConfig();
var log = require('bunyan').createLogger(config.loggerOptions);

var request = require('request');

var fs = require('fs');
var util = require('util');


setInterval(function() {
    getCandidates(function(bookmarks) {
        if (bookmarks && bookmarks.length > 0) {
            var args = [];

            bookmarks.forEach(function(item) {
                log.debug(item.id, ' - ', item.title);
                args.push(item.id + '|' + item.address);
            });

            snapThem(args, function(err) {
                manageThumbUpdates(args, function(err) {
                    log.debug('Batch complete');
                });
            });
        } else {
            log.debug('No bookmark thumbnail processing required');
        }
    });
}, config.processInterval * 60 * 1000);


// -----------------------------------------------------------------------------
// Private functions
// -----------------------------------------------------------------------------

function getCandidates(next) {

    request.get(util.format('%s/system/nothumbs?token=%s', config.baseUrl, config.token), function(err, res, body) {
        if (res.statusCode === 200 && body.length > 0) {
            next(JSON.parse(body));
        } else {
            next();
        }
    });

}

function snapThem(bookmarkArgs, next) {

    var cmdArgs = [
        'lib/phantom.js',
        config.thumbnailDrop];

    bookmarkArgs.forEach(function(item) {
        cmdArgs.push(item);
    });

    var spawn = require('child_process').spawn,
        phantom  = spawn('./node_modules/.bin/phantomjs', cmdArgs);

    phantom.stdout.on('data', function (data) {
        log.debug(data.toString());
    });

    phantom.stderr.on('data', function (data) {
        log.debug(data.toString());
    });

    phantom.on('close', function (code, signal) {
        next();
    });

}

function manageThumbUpdates(bookmarkArgs, next) {

    var thumbUpdatePayload = [];

    bookmarkArgs.forEach(function(item) {

        if (fs.existsSync(config.thumbnailDrop + item.split('|')[0] + '.png')) {
            log.debug('Should update bookmark ID %s', item.split('|')[0]);
            thumbUpdatePayload.push( { "id": item.split('|')[0], "thumb": item.split('|')[0] + '.png' });
        } else {
            log.debug('No thumbnail generated for ' + item.split('|')[0]);
            thumbUpdatePayload.push( { "id": item.split('|')[0], "thumb": null });
        }

    });

    updateThumbs(thumbUpdatePayload, function(err) {
        next();
    });

}

/**
 * Calls the API to update bookmark thumbnails. The API expects an array of bookmark IDs and thumbnail filenames.
 * Here is an example of an API payload:
 *
 * [ { "id": 1, "thumb": "1.png" } ]
 *
 * @param updatePayload
 * @param next
 */
function updateThumbs(updatePayload, next) {

    if (!updatePayload || updatePayload.length === 0) {
        next();
        return;
    }

    var options = {
        method: 'POST',
        url: util.format('%s/system/updatethumbs', config.baseUrl),
        qs: { token: config.token },
        json: updatePayload
    };

    request(options, function(err, res, body) {
        //log.debug('Err: ', err);
        //log.debug('body: ', body);
        next();
    });

}


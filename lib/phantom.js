// Render Multiple URLs to file

// 298 x 130
// 894 x 390

var RenderUrlsToFile, arrayOfUrls, system;
var thumbnailDrop;
var imgWidth = 894;
var imgHeight = 390;

system = require("system");

RenderUrlsToFile = function(urls, callbackPerUrl, callbackFinal) {
    var getFilename, next, page, retrieve, urlIndex, webpage;
    urlIndex = 0;
    webpage = require("webpage");
    page = null;
    getFilename = function(id) {
        return thumbnailDrop + id + ".png";
    };
    next = function(status, url, file) {
        page.close();
        callbackPerUrl(status, url, file);
        return retrieve();
    };
    retrieve = function() {
        var url;
        if (urls.length > 0) {
            url = urls.shift();
            urlIndex++;
            page = webpage.create();

            page.settings.userAgent = "Phantom.js bot";
            page.settings.resourceTimeout = 10000; // 10 seconds

            //viewportSize being the actual size of the headless browser
            page.viewportSize = { width: imgWidth, height: imgHeight };
            //the clipRect is the portion of the page you are taking a screenshot of
            page.clipRect = { top: 0, left: 0, width: imgWidth, height: imgHeight };

            //console.log('Opening page: ' + url.split('|')[1]);
            return page.open(url.split('|')[1], function(status) {
                var file;
                file = getFilename(url.split('|')[0]);

                if (status === "success") {
                    return window.setTimeout((function() {
                        page.render(file);
                        return next(status, url, file);
                    }), 10000);  // 10 seconds
                } else {
                    return next(status, url, file);
                }
            });
        } else {
            return callbackFinal();
        }
    };
    return retrieve();
};

arrayOfUrls = null;

if (system.args.length > 1) {
    thumbnailDrop = system.args[1];
    console.log('thumbnailDrop: ' + thumbnailDrop);
    arrayOfUrls = Array.prototype.slice.call(system.args, 2);
} else {
    console.log("Usage: phantomjs render_multi_url.js [domain.name1, domain.name2, ...]");
    //return phantom.exit();
    arrayOfUrls = ["www.google.com", "www.bbc.co.uk", "www.phantomjs.org"];
}

RenderUrlsToFile(arrayOfUrls, (function(status, url, file) {
    if (status !== "success") {
        return console.log("Unable to render '" + url + "'");
    } else {
        return console.log("Rendered '" + url + "' at '" + file + "'");
    }
}), function() {
    return phantom.exit();
});

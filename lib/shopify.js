"use strict";
var utils = require("gator-utils");
var api = require("gator-api");
function launch(application, req, res, callback) {
    var params = {
        appId: application.current.id,
        query: req.query,
        redirect_uri: utils.config.dev() ? 'https://' + req.headers['host'] + '/shopify/install' : 'https://' + utils.config.settings().domain + '/shopify/install'
    };
    api.REST.client.post('/v1/shopify/launch', params, function (err, apiRequest, apiResponse, result) {
        if (apiResponse && apiResponse.statusCode == 300 && result && result.location) {
            res.redirect(result.location);
            if (callback)
                callback(false);
        }
        else if (err) {
            res.sendStatus(500);
            if (callback)
                callback(false);
        }
        else {
            api.setSessionCookie(res, result.data.accessToken);
            res.redirect(application.branding.postLoginUrl);
            if (callback)
                callback(true);
        }
    });
}
exports.launch = launch;
function install(application, req, res, callback) {
    var params = {
        appId: application.current.id,
        query: req.query,
        uri: utils.config.dev() ? 'https://' + req.headers['host'] : 'https://' + utils.config.settings().domain
    };
    api.REST.client.post('/v1/shopify/install', params, function (err, apiRequest, apiResponse, result) {
        if (err) {
            callback(err);
        }
        else {
            api.setSessionCookie(res, result.data.accessToken);
            req['session'] = result.data;
            callback();
        }
    });
}
exports.install = install;
function uninstall(application, req, res, callback) {
    var params = {
        appId: application.current.id,
        headers: req.headers,
        body: req['rawBody'],
    };
    api.REST.client.post('/v1/shopify/uninstall', params, function (err, apiRequest, apiResponse, result) {
        callback(err);
    });
}
exports.uninstall = uninstall;
//# sourceMappingURL=shopify.js.map
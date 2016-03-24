"use strict";
var utils = require("gator-utils");
var api = require('gator-api');
function setup(app, application, callback) {
    app.get('/setup/bookmarks', application.enforceSecure, api.authenticate, function (req, res) {
        utils.noCache(res);
        api.REST.client.get('/v1/projects/account/' + req['session'].account.id + '?accessToken=' + req['session']['accessToken'], function (err, apiRequest, apiResponse, result) {
            if (err)
                req.flash('error', err.message);
            else
                req['session'].projects = result.data.projects;
            res.render('bookmarks', {
                settings: utils.config.settings(),
                application: application,
                bookmarks: api.reporting.currentBookmarks(req),
                req: req
            });
        });
    });
    app.post('/setup/bookmarks', application.enforceSecure, api.authenticate, function (req, res) {
        if (!req.body.name || !req.body.query)
            api.REST.sendError(res, new api.errors.MissingParameterError('You must specify a name and destination.'));
        else {
            api.REST.client.get('/v1/projects/account/' + req['session'].account.id + '?accessToken=' + req['session']['accessToken'], function (err, apiRequest, apiResponse, result) {
                if (!err)
                    req['session'].projects = result.data.projects;
                else {
                    api.REST.sendError(res, new api.errors.InternalError());
                    return;
                }
                var bookmarks = api.reporting.currentBookmarks(req);
                bookmarks[req.body.name] = req.body.query;
                var params = {
                    accessToken: req['session'].accessToken,
                    projectId: req['session'].currentProjectId,
                    bookmarks: bookmarks
                };
                api.REST.client.put('/v1/analytics/bookmarks', params, function (err, apiRequest, apiResponse, result) {
                    api.REST.sendConditional(res, err);
                });
            });
        }
    });
    app.delete('/setup/bookmarks', application.enforceSecure, api.authenticate, function (req, res) {
        utils.noCache(res);
        api.REST.client.get('/v1/projects/account/' + req['session'].account.id + '?accessToken=' + req['session']['accessToken'], function (err, apiRequest, apiResponse, result) {
            if (!err)
                req['session'].projects = result.data.projects;
            else {
                api.REST.sendError(res, new api.errors.InternalError());
                return;
            }
            var bookmarks = api.reporting.currentBookmarks(req);
            delete bookmarks[req.query['name']];
            var params = {
                accessToken: req['session'].accessToken,
                projectId: req['session'].currentProjectId,
                bookmarks: bookmarks
            };
            api.REST.client.put('/v1/analytics/bookmarks', params, function (err, apiRequest, apiResponse, result) {
                api.REST.sendConditional(res, err);
            });
        });
    });
    callback();
}
exports.setup = setup;
//# sourceMappingURL=bookmarks.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utils = require("gator-utils");
var api = require("gator-api");
function setup(app, application, callback) {
    app.get('/setup/campaignreferrers/:projectId', application.enforceSecure, api.authenticate, function (req, res) {
        utils.noCache(res);
        api.REST.client.get('/v1/projects?accessToken=' + req['session']['accessToken'], function (err, apiRequest, apiResponse, result) {
            if (err)
                req.flash('error', err.message);
            else
                req['session'].projects = result.data.projects;
            var project = api.getProject(req, +req.params.projectId);
            res.render('campaignReferrers', {
                application: application,
                settings: utils.config.settings(),
                campaignReferrers: project.data && project.data.campaignReferrers ? project.data.campaignReferrers : [],
                req: req
            });
        });
    });
    app.put('/setup/campaignreferrers/:projectId', application.enforceSecure, api.authenticate, function (req, res) {
        var project = api.getProject(req, +req.params.projectId);
        var params = {
            accessToken: req['session'].accessToken,
            projectId: project.id,
            campaignReferrers: req.body.campaignReferrers
        };
        api.REST.client.put('/v1/analytics/campaignreferrers', params, function (err, apiRequest, apiResponse, result) {
            api.REST.sendConditional(res, err);
        });
    });
    app.get('/setup/campaignids/:projectId', application.enforceSecure, api.authenticate, function (req, res) {
        utils.noCache(res);
        api.REST.client.get('/v1/projects?accessToken=' + req['session']['accessToken'], function (err, apiRequest, apiResponse, result) {
            if (err)
                req.flash('error', err.message);
            else
                req['session'].projects = result.data.projects;
            var project = api.getProject(req, +req.params.projectId);
            res.render('campaignIds', {
                application: application,
                settings: utils.config.settings(),
                campaignIds: project.data && project.data.campaignIds ? project.data.campaignIds.join(',') : '',
                req: req
            });
        });
    });
    app.put('/setup/campaignids/:projectId', application.enforceSecure, api.authenticate, function (req, res) {
        var project = api.getProject(req, +req.params.projectId);
        var params = {
            accessToken: req['session'].accessToken,
            projectId: project.id,
            campaignIds: req.body.campaignIds.split(',')
        };
        api.REST.client.put('/v1/analytics/campaignids', params, function (err, apiRequest, apiResponse, result) {
            api.REST.sendConditional(res, err);
        });
    });
    callback();
}
exports.setup = setup;
//# sourceMappingURL=campaigns.js.map
"use strict";
var utils = require("gator-utils");
var api = require('gator-api');
function setup(app, application, callback) {
    app.get('/setup/segments', application.enforceSecure, api.authenticate, function (req, res) {
        utils.noCache(res);
        api.reporting.getSegments(req, false, function (err) {
            if (err)
                req.flash('error', err.message);
            res.render('segments', {
                settings: utils.config.settings(),
                application: application,
                dev: utils.config.dev(),
                req: req
            });
        });
    });
    app.get('/setup/segments/form', application.enforceSecure, api.authenticate, function (req, res) {
        utils.noCache(res);
        var projects = req['session']['projects'], projectIds = [];
        if (projects) {
            for (var p = 0; p < projects.length; p++) {
                projectIds.push({ text: projects[p].name, value: projects[p].id });
            }
        }
        var segments = req['session']['segments'], segment = null;
        if (segments && req.query.id) {
            segments.forEach(function (item) {
                if (item.id == +req.query.id) {
                    segment = item;
                }
            });
        }
        res.render('segmentsForm', {
            settings: utils.config.settings(),
            application: application,
            dev: utils.config.dev(),
            req: req,
            projectIds: projectIds,
            dataObj: segment,
            filterOptions: api.reporting.getFilterOptions('sessions', false, false)
        });
    });
    app.post('/setup/segments', application.enforceSecure, api.authenticate, function (req, res) {
        var params = {
            accessToken: req['session'].accessToken,
            accountId: req['session'].account.id,
            name: req.body.name,
            query: req.body.query || {}
        };
        if (req.body.projectId) {
            params.projectId = +req.body.projectId;
        }
        api.REST.client.post('/v1/analytics/segments', params, function (err, apiRequest, apiResponse, result) {
            api.REST.sendConditional(res, err);
        });
    });
    app.put('/setup/segments', application.enforceSecure, api.authenticate, function (req, res) {
        var params = {
            id: +req.body.id,
            accessToken: req['session'].accessToken,
            accountId: req['session'].account.id,
            name: req.body.name,
            query: req.body.query || {}
        };
        if (req.body.projectId) {
            params.projectId = +req.body.projectId;
        }
        api.REST.client.put('/v1/analytics/segments', params, function (err, apiRequest, apiResponse, result) {
            api.REST.sendConditional(res, err);
        });
    });
    app.delete('/setup/segments/:id/', application.enforceSecure, api.authenticate, function (req, res) {
        api.REST.client.del('/v1/analytics/segments/' + req.params['id'] + '?accessToken=' + req['session'].accessToken, function (err, apiRequest, apiResponse) {
            api.REST.sendConditional(res, err);
        });
    });
    callback();
}
exports.setup = setup;
//# sourceMappingURL=segments.js.map
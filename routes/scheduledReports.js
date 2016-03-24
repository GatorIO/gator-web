"use strict";
var utils = require("gator-utils");
var api = require('gator-api');
function setup(app, application, callback) {
    app.get('/setup/scheduledReports', application.enforceSecure, api.authenticate, function (req, res) {
        utils.noCache(res);
        api.REST.client.get('/v1/analytics/scheduledreports/account/' + req['session'].account.id + '?accessToken=' + req['session']['accessToken'] + '&userid=' + req['session'].account.userId, function (err, apiRequest, apiResponse, result) {
            res.render('scheduledReports', {
                settings: utils.config.settings(),
                scheduledReports: result.data,
                application: application,
                req: req
            });
        });
    });
    app.get('/setup/scheduledReports/:id', application.enforceSecure, api.authenticate, function (req, res) {
        utils.noCache(res);
        api.REST.client.get('/v1/analytics/scheduledreports/query/' + req.params['id'] + "?accountId=" + req['session'].account.id + '&accessToken=' + req['session']['accessToken'] + '&userid=' + req['session'].account.userId, function (err, apiRequest, apiResponse, result) {
            res.redirect(decodeURIComponent(result.data["query"]));
        });
    });
    app.get('/setup/scheduledReports/form', application.enforceSecure, api.authenticate, function (req, res) {
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
        res.render('bookmarksForm', {
            settings: utils.config.settings(),
            application: application,
            dev: utils.config.dev(),
            req: req,
            projectIds: projectIds,
            dataObj: segment
        });
    });
    app.post('/setup/scheduledReports', application.enforceSecure, api.authenticate, function (req, res) {
        var params = {
            accessToken: req['session'].accessToken,
            accountId: req['session'].account.id,
            userId: req['session'].account.userId,
            name: req.body.name,
            query: req.body.query,
            recipients: req.body.recipients,
            subject: req.body.subject,
            desc: req.body.desc,
            attachmentFormat: req.body.attachmentFormat,
            recurrence: req.body.recur,
            frequency: req.body.freq
        };
        if (req.body.projectIds) {
            params.projectIds = req.body.projectIds.split(',');
        }
        api.REST.client.post('/v1/analytics/scheduledreports', params, function (err, apiRequest, apiResponse, result) {
            if (err) {
                api.REST.sendConditional(res, err);
            }
            else {
                api.REST.sendConditional(res, err, result.data);
            }
        });
    });
    app.put('/setup/scheduledReports', application.enforceSecure, api.authenticate, function (req, res) {
        var params = {
            id: +req.body.id,
            accessToken: req['session'].accessToken,
            accountId: req['session'].account.id,
            name: req.body.name,
            query: req.body.query,
            appliesTo: req.body.appliesTo
        };
        if (req.body.projectIds) {
            params.projectIds = req.body.projectIds.split(',');
        }
        api.REST.client.put('/v1/analytics/scheduledReports', params, function (err, apiRequest, apiResponse, result) {
            api.REST.sendConditional(res, err);
        });
    });
    app.delete('/setup/scheduledReports/:id/', application.enforceSecure, api.authenticate, function (req, res) {
        api.REST.client.del('/v1/analytics/scheduledreports/' + req.params['id'] + '?accessToken=' + req['session'].accessToken, function (err, apiRequest, apiResponse) {
            if (err)
                req.flash('error', err.message);
            else
                req.flash('info', 'The scheduled report has been deleted.');
            api.REST.sendConditional(res, err);
        });
    });
    callback();
}
exports.setup = setup;
//# sourceMappingURL=scheduledReports.js.map
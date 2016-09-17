"use strict";
var utils = require("gator-utils");
var api = require('gator-api');
var lib = require('../lib/index');
function setup(app, application, callback) {
    var statusCheck = typeof application.statusCheck == 'function' ? application.statusCheck : lib.statusCheckPlaceholder;
    app.get('/setup/dashboards', application.enforceSecure, api.authenticate, function (req, res) {
        utils.noCache(res);
        api.REST.client.get('/v1/projects?accessToken=' + req['session']['accessToken'], function (err, apiRequest, apiResponse, result) {
            if (err)
                req.flash('error', err.message);
            else
                req['session'].projects = result.data.projects;
            res.render('dashboards', {
                application: application,
                settings: utils.config.settings(),
                dashboards: api.reporting.currentDashboards(req),
                req: req
            });
        });
    });
    app.put('/setup/dashboards', application.enforceSecure, api.authenticate, function (req, res) {
        var params = {
            accessToken: req['session'].accessToken,
            projectId: req['session'].currentProjectId,
            dashboards: req.body.dashboards
        };
        api.REST.client.put('/v1/projects/dashboards', params, function (err, apiRequest, apiResponse, result) {
            api.REST.sendConditional(res, err);
        });
    });
    app.post('/setup/dashboards/pods', application.enforceSecure, api.authenticate, function (req, res) {
        var dashboards = api.reporting.currentDashboards(req);
        var pod = {
            display: req.body.display,
            title: req.body.title,
            state: req.body.state
        };
        dashboards[req.body.name].pods = dashboards[req.body.name].pods || [];
        dashboards[req.body.name].pods.push(JSON.stringify(pod));
        var params = {
            accessToken: req['session'].accessToken,
            projectId: req['session'].currentProjectId,
            dashboards: dashboards
        };
        api.REST.client.put('/v1/projects/dashboards', params, function (err, apiRequest, apiResponse, result) {
            api.REST.sendConditional(res, err);
        });
    });
    app.post('/setup/dashboards/order', application.enforceSecure, api.authenticate, function (req, res) {
        var dashboards = api.reporting.currentDashboards(req);
        var newOrder = [];
        for (var i = 0; i < req.body.order.length; i++) {
            if (dashboards[req.body.name].pods[req.body.order[i]])
                newOrder.push(utils.clone(dashboards[req.body.name].pods[req.body.order[i]]));
        }
        dashboards[req.body.name].pods = newOrder;
        var params = {
            accessToken: req['session'].accessToken,
            projectId: req['session'].currentProjectId,
            dashboards: dashboards
        };
        api.REST.client.put('/v1/projects/dashboards', params, function (err, apiRequest, apiResponse, result) {
            api.REST.sendConditional(res, err);
        });
    });
    app.delete('/setup/dashboards/pods', application.enforceSecure, api.authenticate, function (req, res) {
        var dashboards = api.reporting.currentDashboards(req);
        var dashboard = dashboards[req.body.name];
        dashboard.pods.splice(+req.body.pod, 1);
        var params = {
            accessToken: req['session'].accessToken,
            projectId: req['session'].currentProjectId,
            dashboards: dashboards
        };
        api.REST.client.put('/v1/projects/dashboards', params, function (err, apiRequest, apiResponse, result) {
            api.REST.sendConditional(res, err);
        });
    });
    app.get('/dashboard', application.enforceSecure, api.authenticate, statusCheck, function (req, res) {
        utils.noCache(res);
        var dashboards, name = req.query.name, template = req.query.template, dashboard = {};
        if (template) {
            dashboard = application['getDashboardTemplate'](template, req.query);
        }
        else {
            dashboards = api.reporting.currentDashboards(req);
            dashboard = dashboards[name];
        }
        if (dashboard) {
            for (var i = 0; i < dashboard.pods.length; i++) {
                var pod = JSON.parse(dashboard.pods[i]);
                if (pod.state && pod.state.id) {
                    var report = application.reports.definitions[application.reports.Types[pod.state.id]];
                    pod.settings = report ? report.settings : {};
                    if (report.initialState) {
                        for (var key in report.initialState) {
                            if (report.initialState.hasOwnProperty(key) && !pod.state.hasOwnProperty(key))
                                pod.state[key] = report.initialState[key];
                        }
                    }
                }
                pod.settings = pod.settings || {};
                if (pod.state.view)
                    pod.settings.view = pod.state.view;
                if (pod.state.renderView)
                    pod.settings.renderView = pod.state.renderView;
                if (pod.state.title)
                    pod.settings.title = pod.state.title;
                if (pod.state.hasOwnProperty('isLog'))
                    pod.settings.isLog = pod.state.isLog;
                if (!pod.settings.intervals)
                    pod.settings.intervals = application.reports['intervals'];
                if (!pod.settings.ranges)
                    pod.settings.ranges = application.reports['ranges'];
                if (!pod.state.dateLabel && pod.settings.intervals && pod.settings.intervals.defaultRange)
                    pod.state.dateLabel = pod.settings.intervals.defaultRange;
                else if (!pod.state.dateLabel)
                    pod.state.dateLabel = 'Last 30 Days';
                if (!pod.state.dateInterval && pod.settings.intervals && pod.settings.intervals.defaultOption)
                    pod.state.dateInterval = pod.settings.intervals.defaultOption;
                else if (!pod.state.dateInterval)
                    pod.state.dateInterval = 'Daily';
                dashboard.pods[i] = JSON.stringify(pod);
            }
        }
        else {
            req.flash('error', 'No such dashboard');
        }
        res.render('dashboard', {
            application: application,
            settings: utils.config.settings(),
            req: req,
            dashboardName: name,
            dashboard: dashboard,
            title: req.query.title || ''
        });
    });
    callback();
}
exports.setup = setup;
//# sourceMappingURL=dashboards.js.map
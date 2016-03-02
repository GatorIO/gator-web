var utils = require("gator-utils");
var api = require('gator-api');
function setup(app, application, callback) {
    app.get('/setup/dashboards', application.enforceSecure, api.authenticate, function (req, res) {
        utils.noCache(res);
        api.REST.client.get('/v1/projects/account/' + req['session'].account.id + '?accessToken=' + req['session']['accessToken'], function (err, apiRequest, apiResponse, result) {
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
        api.REST.client.put('/v1/analytics/dashboards', params, function (err, apiRequest, apiResponse, result) {
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
        api.REST.client.put('/v1/analytics/dashboards', params, function (err, apiRequest, apiResponse, result) {
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
        api.REST.client.put('/v1/analytics/dashboards', params, function (err, apiRequest, apiResponse, result) {
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
        api.REST.client.put('/v1/analytics/dashboards', params, function (err, apiRequest, apiResponse, result) {
            api.REST.sendConditional(res, err);
        });
    });
    app.get('/dashboard', application.enforceSecure, api.authenticate, function (req, res) {
        utils.noCache(res);
        var name = req.query.name, dashboard = {};
        var dashboards = api.reporting.currentDashboards(req);
        if (dashboards[name]) {
            dashboard = dashboards[name];
        }
        else {
            req.flash('error', 'No such dashboard');
        }
        res.render('dashboard', {
            application: application,
            settings: utils.config.settings(),
            req: req,
            dashboardName: name,
            dashboard: dashboard
        });
    });
    callback();
}
exports.setup = setup;
//# sourceMappingURL=dashboards.js.map
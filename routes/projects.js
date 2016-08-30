"use strict";
var utils = require("gator-utils");
var api = require('gator-api');
function setup(app, application, callback) {
    app.get('/defaultproject/:id/', application.enforceSecure, api.authenticate, function (req, res) {
        utils.noCache(res);
        req['session']['currentProjectId'] = req.params.id;
        var params = {
            accessToken: req['session']['accessToken'],
            projectId: req.params.id
        };
        api.REST.client.post('/v1/users/defaultproject', params, function (err, apiRequest, apiResponse, result) {
            res.send('OK');
        });
    });
    app.get('/setup/projects', application.enforceSecure, api.authenticate, function (req, res) {
        utils.noCache(res);
        api.REST.client.get('/v1/projects?accessToken=' + req['session']['accessToken'], function (err, apiRequest, apiResponse, result) {
            if (err)
                req.flash('error', err.message);
            else
                req['session'].projects = result.data.projects;
            var found = false;
            if (req['session'].currentProjectId && req['session'].projects) {
                for (var p = 0; p < req['session'].projects.length; p++) {
                    if (req['session'].projects[p].id == req['session'].currentProjectId) {
                        found = true;
                        break;
                    }
                }
            }
            if (!found) {
                if (req['session'].projects.length > 0)
                    req['session'].currentProjectId = req['session'].projects[0].id;
            }
            res.render('projects', {
                application: application,
                settings: utils.config.settings(),
                existingProjects: result && result.data ? (result.data.projects ? result.data.projects : []) : [],
                req: req
            });
        });
    });
    app.get('/setup/projects/form', application.enforceSecure, api.authenticate, function (req, res) {
        utils.noCache(res);
        var projects = req['session']['projects'], project = null;
        project = api.getProject(req, req.query.id);
        if (!req['session'].projects)
            req['session'].projects = [];
        res.render('projectsForm', {
            settings: utils.config.settings(),
            application: application,
            dev: utils.config.dev(),
            req: req,
            newUser: req.query.new ? true : false,
            dataObj: project
        });
    });
    app.post('/setup/projects', application.enforceSecure, api.authenticate, function (req, res) {
        utils.noCache(res);
        var params = {
            accessToken: req['session'].accessToken,
            name: req.body.name,
            type: +req.body.type
        };
        api.REST.client.post('/v1/projects', params, function (err, apiRequest, apiResponse, result) {
            if (!err) {
                req['session'].currentProjectId = result.data.project.id;
                var params = {
                    accessToken: req['session'].accessToken,
                    projectId: result.data.project.id,
                    dashboards: application.defaultDashboard(+req.body.type)
                };
                api.REST.client.put('/v1/projects/dashboards', params, function (err, apiRequest, apiResponse, result) {
                    api.REST.sendConditional(res, err);
                });
            }
            else {
                api.REST.sendConditional(res, err);
            }
        });
    });
    app.put('/setup/projects', application.enforceSecure, api.authenticate, function (req, res) {
        var params = {
            id: +req.body.id,
            accessToken: req['session'].accessToken,
            name: req.body.name,
            type: +req.body.type,
            enabled: req.body.enabled
        };
        api.REST.client.put('/v1/projects', params, function (err, apiRequest, apiResponse, result) {
            api.REST.sendConditional(res, err);
        });
    });
    app.delete('/setup/projects/:id/', application.enforceSecure, api.authenticate, function (req, res) {
        api.REST.client.del('/v1/projects/' + req.params['id'] + '?accessToken=' + req['session'].accessToken, function (err, apiRequest, apiResponse) {
            api.REST.sendConditional(res, err);
        });
    });
    app.get('/setup/projectshares', application.enforceSecure, api.authenticate, function (req, res) {
        utils.noCache(res);
        if (!req.query.projectId) {
            res.redirect('/setup/projects');
            return;
        }
        api.REST.client.get('/v1/projectshares?projectId=' + req.query.projectId + '&accessToken=' + req['session']['accessToken'], function (err, apiRequest, apiResponse, result) {
            var projectShares = [], project = api.getProject(req, req.query.projectId);
            if (err)
                req.flash('error', err.message);
            else
                projectShares = result.data.projectShares;
            res.render('projectShares', {
                application: application,
                settings: utils.config.settings(),
                projectShares: projectShares,
                project: project,
                req: req
            });
        });
    });
    app.get('/setup/projectshares/form', application.enforceSecure, api.authenticate, function (req, res) {
        utils.noCache(res);
        var project = api.getProject(req, req.query.projectId);
        if (req.query.userId) {
            api.REST.client.get('/v1/projectshares?userId=' + req.query.userId + '&projectId=' + req.query.projectId + '&accessToken=' + req['session']['accessToken'], function (err, apiRequest, apiResponse, result) {
                res.render('projectSharesForm', {
                    settings: utils.config.settings(),
                    application: application,
                    dev: utils.config.dev(),
                    req: req,
                    project: project,
                    dataObj: result.data.projectShares[0]
                });
            });
        }
        else {
            res.render('projectSharesForm', {
                settings: utils.config.settings(),
                application: application,
                dev: utils.config.dev(),
                req: req,
                project: project,
                dataObj: null
            });
        }
    });
    app.post('/setup/projectshares', application.enforceSecure, api.authenticate, function (req, res) {
        utils.noCache(res);
        var params = {
            accessToken: req['session'].accessToken,
            projectId: req.body.projectId,
            userName: req.body.userName,
            permissions: req.body.permissions
        };
        api.REST.client.post('/v1/projectshares', params, function (err, apiRequest, apiResponse, result) {
            api.REST.sendConditional(res, err);
        });
    });
    app.delete('/setup/projectshares', application.enforceSecure, api.authenticate, function (req, res) {
        api.REST.client.del('/v1/projectshares?userName=' + encodeURIComponent(req.query['userName']) + '&projectId=' + req.query['projectId'] + '&accessToken=' + req['session'].accessToken, function (err, apiRequest, apiResponse) {
            api.REST.sendConditional(res, err);
        });
    });
    callback();
}
exports.setup = setup;
//# sourceMappingURL=projects.js.map
"use strict";
var utils = require("gator-utils");
var api = require('gator-api');
function setup(app, application, callback) {
    app.get('/setup/attributes/:id', application.enforceSecure, api.authenticate, function (req, res) {
        utils.noCache(res);
        api.REST.client.get('/v1/projects?accessToken=' + req['session']['accessToken'], function (err, apiRequest, apiResponse, result) {
            if (err)
                req.flash('error', err.message);
            else
                req['session'].projects = result.data.projects;
            var project = api.getProject(req, +req.params['id']);
            var attribs = api.reporting.getCustomAttributes(req, +req.params['id']);
            res.render('attributes', {
                settings: utils.config.settings(),
                application: application,
                req: req,
                project: project,
                attributes: attribs
            });
        });
    });
    app.get('/setup/attributes/form/:id', application.enforceSecure, api.authenticate, function (req, res) {
        utils.noCache(res);
        api.REST.client.get('/v1/projects?accessToken=' + req['session']['accessToken'], function (err, apiRequest, apiResponse, result) {
            var dataObj = null, project = null;
            if (err)
                req.flash('error', err.message);
            else
                req['session'].projects = result.data.projects;
            var project = api.getProject(req, +req.params['id']);
            var attribs = api.reporting.getCustomAttributes(req, +req.params['id']);
            if (req.query.name) {
                if (!project.data.attributes[req.query.type][req.query.name])
                    project.data.attributes[req.query.type][req.query.name] = {};
                dataObj = project.data.attributes[req.query.type][req.query.name];
                dataObj.name = req.query.name;
            }
            res.render('attributesForm', {
                settings: utils.config.settings(),
                application: application,
                dev: utils.config.dev(),
                req: req,
                dataObj: dataObj,
                project: project,
                attributes: attribs
            });
        });
    });
    app.post('/setup/attributes/:id', application.enforceSecure, api.authenticate, function (req, res) {
        if (!req.body.name)
            api.REST.sendError(res, new api.errors.MissingParameterError('You must specify a name and destination.'));
        else {
            var project = api.getProject(req, +req.params['id']);
            var attribs = api.reporting.getCustomAttributes(req, +req.params['id']);
            var attrib = {};
            var type = req.body.type || 'session';
            if (!attribs[type])
                attribs[type] = {};
            attrib.description = req.body.description;
            attrib.filterable = req.body.filterable == 'yes';
            attrib.dataType = req.body.dataType;
            attrib.format = req.body.format;
            if (req.body.attribType == 'element') {
                attrib.isElement = true;
            }
            else {
                attrib.isMetric = true;
                attrib.dataType = 'numeric';
                attrib.totalBy = req.body.totalBy || 'sum';
                attrib.basisRelationship = req.body.basisRelationship || 'percent';
            }
            project.data.attributes[type][req.body.name] = attrib;
            var params = {
                accessToken: req['session'].accessToken,
                accountId: req['session'].account.id,
                projectId: project.id,
                attributes: project.data.attributes
            };
            api.REST.client.put('/v1/analytics/attributes/custom', params, function (err, apiRequest, apiResponse, result) {
                api.REST.sendConditional(res, err);
            });
        }
    });
    app.delete('/setup/attributes/:id', application.enforceSecure, api.authenticate, function (req, res) {
        utils.noCache(res);
        var project = api.getProject(req, +req.params['id']);
        var attribs = api.reporting.getCustomAttributes(req, +req.params['id']);
        if (!project.data.attributes[req.query['type']])
            project.data.attributes[req.query['type']] = {};
        delete project.data.attributes[req.query['type']][req.query['name']];
        var params = {
            accessToken: req['session'].accessToken,
            accountId: req['session'].account.id,
            projectId: project.id,
            attributes: project.data.attributes
        };
        api.REST.client.put('/v1/analytics/attributes/custom', params, function (err, apiRequest, apiResponse, result) {
            api.REST.sendConditional(res, err);
        });
    });
    callback();
}
exports.setup = setup;
//# sourceMappingURL=attributes.js.map
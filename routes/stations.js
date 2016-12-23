"use strict";
var utils = require("gator-utils");
var api = require('gator-api');
function getStations(req, res, application) {
    api.REST.client.get('/v1/monitoring/stations', function (err, apiRequest, apiResponse, result) {
        if (err)
            req.flash('error', err.message);
        res.render('stations', {
            settings: utils.config.settings(),
            application: application,
            dev: utils.config.dev(),
            req: req,
            stations: result.data || []
        });
    });
}
exports.getStations = getStations;
function setup(app, application, callback) {
    try {
        app.get('/stations', application.enforceSecure, api.authenticate, function (req, res) {
            getStations(req, res, application);
        });
        app.get('/stations/data', application.enforceSecure, api.authenticate, function (req, res) {
            utils.noCache(res);
            api.REST.client.get('/v1/monitoring/stations', function (err, apiRequest, apiResponse, result) {
                if (result.data) {
                    var stations = [], project = api.getProject(req, req['session'].currentProjectId), disabled = [];
                    if (project && project.data && project.data.disabledStations) {
                        disabled = project.data.disabledStations;
                    }
                    for (var key in result.data) {
                        if (result.data.hasOwnProperty(key)) {
                            var item = result.data[key];
                            item.id = +key;
                            if (disabled.indexOf(+key) > -1)
                                item.disabled = true;
                            stations.push(item);
                        }
                    }
                    result.data = stations;
                }
                api.REST.sendConditional(res, err, result ? result.data : null);
            });
        });
        app.get('/stations/enable/:id/', application.enforceSecure, api.authenticate, function (req, res) {
            api.REST.client.get('/v1/monitoring/stations/enable/' + req.params['id'] + '?projectId=' + req['session'].currentProjectId + '&accessToken=' + req['session'].accessToken, function (err, apiRequest, apiResponse) {
                if (!err) {
                    var project = api.getProject(req, req['session'].currentProjectId);
                    if (!project.data)
                        project.data = {};
                    if (!project.data.disabledStations)
                        project.data.disabledStations = [];
                    var index = project.data.disabledStations.indexOf(+req.params['id']);
                    if (index > -1)
                        project.data.disabledStations.splice(index, 1);
                }
                api.REST.sendConditional(res, err);
            });
        });
        app.get('/stations/disable/:id/', application.enforceSecure, api.authenticate, function (req, res) {
            api.REST.client.get('/v1/monitoring/stations/disable/' + req.params['id'] + '?projectId=' + req['session'].currentProjectId + '&accessToken=' + req['session'].accessToken, function (err, apiRequest, apiResponse) {
                if (!err) {
                    var project = api.getProject(req, req['session'].currentProjectId);
                    if (!project.data)
                        project.data = {};
                    if (!project.data.disabledStations)
                        project.data.disabledStations = [];
                    project.data.disabledStations.push(+req.params['id']);
                }
                api.REST.sendConditional(res, err);
            });
        });
        callback();
    }
    catch (err) {
        console.dir(err);
        callback(err);
    }
}
exports.setup = setup;
//# sourceMappingURL=stations.js.map
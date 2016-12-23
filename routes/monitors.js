"use strict";
var utils = require("gator-utils");
var api = require('gator-api');
var dictionaries = require('../lib/dictionaries');
var monitorTypes = dictionaries.MonitorTypes;
function getMonitorParams(req) {
    var params = req.body;
    if (params.id)
        params.id = +params.id;
    params.projectId = req['session'].currentProjectId;
    if (params.stationsOptions == 'select' && params.stations)
        params.stations = params.stations.split(',');
    else
        delete params.stations;
    params.data = {};
    params.accessToken = req['session'].accessToken;
    switch (+req.body.type) {
        case monitorTypes.email:
            params.data.checkExploitsLists = req.body.checkExploitsLists == 'on';
            params.data.checkBlocklists = req.body.checkBlocklists == 'on';
            break;
        case monitorTypes.DNS:
            params.data.recordType = req.body.recordType;
            params.data.expectedValues = req.body.expectedValues;
            break;
        case monitorTypes.website:
            if (req.body.matchPhrase)
                params.data.matchPhrase = req.body.matchPhrase;
            if (req.body.userName)
                params.data.userName = req.body.userName;
            if (req.body.password)
                params.data.password = req.body.password;
            if (req.body.userAgent)
                params.data.userAgent = req.body.userAgent;
            break;
        case monitorTypes.certificate:
            params.data.allowAuthorizationErrors = req.body.allowAuthorizationErrors == 'on';
            params.data.daysLeft = +req.body.daysLeft;
            break;
        case monitorTypes.scoring:
            params.data.minimumScore = +req.body.score;
            break;
        case monitorTypes.performance:
            params.data.timingMinimum = +req.body.timingMinimum;
            break;
        case monitorTypes.portScan:
            params.data.ports = req.body.ports;
            params.interval = req.body.longInterval;
            break;
    }
    return params;
}
exports.getMonitorParams = getMonitorParams;
function getMonitors(req, res, application) {
    utils.noCache(res);
    api.REST.client.get('/v1/monitoring/contacts?projectId=' + req['session'].currentProjectId + '&accessToken=' + req['session']['accessToken'], function (err, apiRequest, apiResponse, result) {
        if (err) {
            res.render('message', {
                settings: utils.config.settings(),
                application: application,
                req: req,
                message: 'An unknown error has occurred.',
                title: 'Error'
            });
        }
        else {
            var contacts_1 = result.data;
            api.REST.client.get('/v1/monitoring/stations?projectId=' + req['session'].currentProjectId, function (err, apiRequest, apiResponse, result) {
                var stations = result.data;
                if (err)
                    req.flash('error', err.message);
                if (result && result.data)
                    exports.stationList = result.data;
                api.REST.client.get('/v1/monitoring/monitors?projectId=' + req['session'].currentProjectId + '&accessToken=' + req['session']['accessToken'], function (err, apiRequest, apiResponse, result) {
                    if (err)
                        req.flash('error', err.message);
                    res.render('monitors', {
                        settings: utils.config.settings(),
                        application: application,
                        dev: utils.config.dev(),
                        req: req,
                        monitors: result ? result.data : [],
                        monitorTypes: dictionaries.MonitorTypes,
                        monitorDescriptions: dictionaries.monitorTypes.codes,
                        contacts: contacts_1,
                        stations: stations
                    });
                });
            });
        }
    });
}
exports.getMonitors = getMonitors;
function setup(app, application, callback) {
    try {
        app.get('/certificates', application.enforceSecure, api.authenticate, function (req, res) {
            utils.noCache(res);
            api.REST.client.get('/v1/monitoring/stations?projectId=' + req['session'].currentProjectId, function (err, apiRequest, apiResponse, result) {
                var stations = result.data;
                api.REST.client.get('/v1/monitoring/monitors?projectId=' + req['session'].currentProjectId + '&accessToken=' + req['session']['accessToken'], function (err, apiRequest, apiResponse, result) {
                    if (err)
                        req.flash('error', err.message);
                    res.render('certificates', {
                        settings: utils.config.settings(),
                        application: application,
                        dev: utils.config.dev(),
                        req: req,
                        monitors: result.data || [],
                        stations: stations
                    });
                });
            });
        });
        app.get('/monitors', application.enforceSecure, api.authenticate, function (req, res) {
            getMonitors(req, res, application);
        });
        app.get('/monitors/types', application.enforceSecure, api.authenticate, function (req, res) {
            res.render('monitorTypes', {
                settings: utils.config.settings(),
                application: application,
                dev: utils.config.dev(),
                req: req
            });
        });
        app.get('/monitors/data', application.enforceSecure, api.authenticate, function (req, res) {
            utils.noCache(res);
            api.REST.client.get('/v1/monitoring/monitors?projectId=' + req['session'].currentProjectId + '&accessToken=' + req['session']['accessToken'], function (err, apiRequest, apiResponse, result) {
                api.REST.sendConditional(res, err, result ? result.data : null);
            });
        });
        app.get('/monitors/down/data', application.enforceSecure, api.authenticate, function (req, res) {
            utils.noCache(res);
            api.REST.client.get('/v1/monitoring/monitors/down?projectId=' + req['session'].currentProjectId + '&accessToken=' + req['session']['accessToken'], function (err, apiRequest, apiResponse, result) {
                api.REST.sendConditional(res, err, result ? result.data : null);
            });
        });
        app.post('/monitors', application.enforceSecure, api.authenticate, function (req, res) {
            utils.noCache(res);
            var params = getMonitorParams(req);
            api.REST.client.post('/v1/monitoring/monitors', params, function (err, apiRequest, apiResponse, result) {
                api.REST.sendConditional(res, err, result);
            });
        });
        app.put('/monitors', application.enforceSecure, api.authenticate, function (req, res) {
            utils.noCache(res);
            var params = getMonitorParams(req);
            api.REST.client.put('/v1/monitoring/monitors', params, function (err, apiRequest, apiResponse, result) {
                api.REST.sendConditional(res, err);
            });
        });
        app.delete('/monitors/:id/', application.enforceSecure, api.authenticate, function (req, res) {
            api.REST.client.del('/v1/monitoring/monitors/' + req.params['id'] + '?accessToken=' + req['session'].accessToken, function (err, apiRequest, apiResponse) {
                api.REST.sendConditional(res, err);
            });
        });
        app.get('/monitors/enable/:id/', application.enforceSecure, api.authenticate, function (req, res) {
            api.REST.client.get('/v1/monitoring/monitors/enable/' + req.params['id'] + '?accessToken=' + req['session'].accessToken, function (err, apiRequest, apiResponse) {
                api.REST.sendConditional(res, err);
            });
        });
        app.get('/monitors/disable/:id/', application.enforceSecure, api.authenticate, function (req, res) {
            api.REST.client.get('/v1/monitoring/monitors/disable/' + req.params['id'] + '?accessToken=' + req['session'].accessToken, function (err, apiRequest, apiResponse) {
                api.REST.sendConditional(res, err);
            });
        });
        app.get('/monitors/test', application.enforceSecure, api.authenticate, function (req, res) {
            utils.noCache(res);
            api.REST.client.get('/v1/monitoring/monitors/test/' + req.query['monitorId'] + '?accessToken=' + req['session'].accessToken + '&stationId=' + req.query['stationId'], function (err, apiRequest, apiResponse, result) {
                api.REST.sendConditional(res, err, result);
            });
        });
        app.get('/test/website', application.enforceSecure, function (req, res) {
            utils.noCache(res);
            api.REST.client.get('/v1/monitoring/test/website?url=' + encodeURIComponent(req.query['url']) + '&stationId=' + req.query['stationId'], function (err, apiRequest, apiResponse, result) {
                api.REST.sendConditional(res, err, result);
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
//# sourceMappingURL=monitors.js.map
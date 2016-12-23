"use strict";
var utils = require("gator-utils");
var api = require('gator-api');
function getContactParams(req) {
    var items, params = req.body;
    if (params.id)
        params.id = +params.id;
    if (params.delayOption == 'immediate')
        delete params.alertDelay;
    params.projectId = req['session'].currentProjectId;
    params.accessToken = req['session'].accessToken;
    params.endpoints = [];
    if (params.emailList) {
        items = params.emailList.split(',');
        for (var e = 0; e < items.length; e++) {
            params.endpoints.push({ type: 'email', value: items[e] });
        }
    }
    if (params.SMSList) {
        items = params.SMSList.split(',');
        for (var e = 0; e < items.length; e++) {
            params.endpoints.push({ type: 'SMS', value: items[e] });
        }
    }
    delete params.emailList;
    delete params.SMSList;
    return params;
}
exports.getContactParams = getContactParams;
function setup(app, application, callback) {
    try {
        app.get('/contacttypes', application.enforceSecure, api.authenticate, function (req, res) {
            res.render('contactTypes', {
                settings: utils.config.settings(),
                application: application,
                dev: utils.config.dev(),
                req: req,
            });
        });
        app.get('/contacts', application.enforceSecure, application.statusCheck, api.authenticate, function (req, res) {
            utils.noCache(res);
            res.render('contacts', {
                settings: utils.config.settings(),
                application: application,
                dev: utils.config.dev(),
                req: req
            });
        });
        app.get('/contacts/data', application.enforceSecure, api.authenticate, function (req, res) {
            utils.noCache(res);
            api.REST.client.get('/v1/monitoring/contacts?projectId=' + req['session'].currentProjectId + '&accessToken=' + req['session']['accessToken'], function (err, apiRequest, apiResponse, result) {
                api.REST.sendConditional(res, err, result ? result.data : []);
            });
        });
        app.delete('/contacts/:id/', application.enforceSecure, api.authenticate, function (req, res) {
            api.REST.client.del('/v1/monitoring/contacts/' + req.params['id'] + '?accessToken=' + req['session'].accessToken, function (err, apiRequest, apiResponse) {
                api.REST.sendConditional(res, err);
            });
        });
        app.post('/contacts', application.enforceSecure, api.authenticate, function (req, res) {
            utils.noCache(res);
            var params = getContactParams(req);
            api.REST.client.post('/v1/monitoring/contacts', params, function (err, apiRequest, apiResponse, result) {
                api.REST.sendConditional(res, err);
            });
        });
        app.put('/contacts', application.enforceSecure, api.authenticate, function (req, res) {
            var params = getContactParams(req);
            api.REST.client.put('/v1/monitoring/contacts', params, function (err, apiRequest, apiResponse, result) {
                api.REST.sendConditional(res, err);
            });
        });
        app.get('/contacts/test/:id/', application.enforceSecure, api.authenticate, function (req, res) {
            api.REST.client.get('/v1/monitoring/contacts/test/' + req.params['id'] + '?accessToken=' + req['session'].accessToken, function (err, apiRequest, apiResponse) {
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
//# sourceMappingURL=contacts.js.map
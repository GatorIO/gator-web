"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils = require("gator-utils");
const api = require("gator-api");
function setup(app, application, callback) {
    app.get('/developer/rest/:id', application.enforceSecure, function (req, res) {
        res.render('./developer/swagger', {
            req: req,
            application: application,
            dev: utils.config.dev(),
            spec: utils.config.settings().apiUrl + '/' + utils.config.settings().apiVersion + '/' + req.params['id'] + '.js'
        });
    });
    app.get('/login', application.enforceSecure, function (req, res) {
        if (req.query.accessToken) {
            api.setSessionCookie(res, req.query.accessToken);
            res.redirect(application.branding.postLoginUrl);
            return;
        }
        res.render('./api/login', {
            req: req,
            application: application,
            dev: utils.config.dev()
        });
    });
    app.post('/login', application.enforceSecure, function (req, res) {
        api.login(req.body['username'], req.body['password'], application.settings.appId, function (err, authObject) {
            if (!err)
                api.setSessionCookie(res, authObject.accessToken);
            api.REST.sendConditional(res, err, null, 'success');
        });
    });
    app.get('/reset', application.enforceSecure, function (req, res) {
        res.render('./api/reset', {
            req: req,
            application: application,
            dev: utils.config.dev()
        });
    });
    app.post('/reset', application.enforceSecure, function (req, res) {
        api.REST.client.get('/v1/reset/' + application.settings.appId + '/' + req.body.username, function (err, apiRequest, apiResponse) {
            api.REST.sendConditional(res, err, null, 'success');
        });
    });
    app.get('/reset/change', application.enforceSecure, function (req, res) {
        res.render('./api/resetChange', {
            req: req,
            application: application,
            dev: utils.config.dev()
        });
    });
    app.post('/reset/change', application.enforceSecure, function (req, res) {
        api.REST.client.post('/v1/reset', req.body, function (err, apiRequest, apiResponse) {
            api.REST.sendConditional(res, err, null, 'success');
        });
    });
    app.get('/register', application.enforceSecure, function (req, res) {
        res.render('./api/register', {
            req: req,
            application: application,
            dev: utils.config.dev()
        });
    });
    app.post('/register', application.enforceSecure, function (req, res) {
        api.signup(req.body, function (err, authObject) {
            if (err) {
                api.REST.sendError(res, err);
            }
            else {
                api.setSessionCookie(res, authObject.accessToken);
                api.REST.sendConditional(res, err);
            }
        });
    });
    app.get('/logout', application.enforceSecure, function (req, res) {
        api.logout(res);
    });
    callback();
}
exports.setup = setup;
//# sourceMappingURL=api.js.map
"use strict";
var utils = require("gator-utils");
var api = require('gator-api');
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
        api.login(req.body['username'], req.body['password'], application.settings.moduleId, function (err, authObject) {
            if (!err)
                api.setSessionCookie(res, authObject.accessToken);
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
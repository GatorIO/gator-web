"use strict";
var utils = require("gator-utils");
var api = require('gator-api');
function setup(app, application, callback) {
    app.get('/help/overview', application.enforceSecure, function (req, res) {
        res.render('./help/overview', {
            req: req,
            application: application,
            dev: utils.config.dev()
        });
    });
    app.get('/help/gettingstarted', application.enforceSecure, function (req, res) {
        res.render('./help/gettingStarted', {
            req: req,
            application: application,
            dev: utils.config.dev()
        });
    });
    app.get('/help/reporting', application.enforceSecure, function (req, res) {
        res.render('./help/reporting', {
            req: req,
            application: application,
            dev: utils.config.dev(),
            attributes: api.reporting.getAttributes('all', api.reporting.AttributeTypes.all, false)
        });
    });
    app.get('/help/conversiontracking', application.enforceSecure, function (req, res) {
        res.render('./help/conversionTracking', {
            req: req,
            application: application,
            dev: utils.config.dev()
        });
    });
    app.get('/help/multivariate', application.enforceSecure, function (req, res) {
        res.render('./help/multivariate', {
            req: req,
            application: application,
            dev: utils.config.dev()
        });
    });
    app.get('/help/scoring', application.enforceSecure, function (req, res) {
        res.render('./help/scoring', {
            req: req,
            application: application,
            dev: utils.config.dev()
        });
    });
    callback();
}
exports.setup = setup;
//# sourceMappingURL=help.js.map
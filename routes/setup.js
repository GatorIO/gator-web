var utils = require("gator-utils");
var web = require("gator-web");
var api = require('gator-api');
var apiRoutes = require('./api');
var projectRoutes = require('./projects');
var reportingRoutes = require('./reporting');
var segmentRoutes = require('./segments');
var campaignRoutes = require('./campaigns');
var dashboardRoutes = require('./dashboards');
var bookmarkRoutes = require('./bookmarks');
var scheduledReportsRoutes = require('./scheduledReports');
var developerRoutes = require('./developer');
var attributeRoutes = require('./attributes');
var accessTokenRoutes = require('./accessTokens');
function setup(app, application, callback) {
    try {
        accessTokenRoutes.setup(app, application, function () {
            helpRoutes.setup(app, application, function () {
                apiRoutes.setup(app, application, function () {
                    attributeRoutes.setup(app, application, function () {
                        scheduledReportsRoutes.setup(app, application, function () {
                            bookmarkRoutes.setup(app, application, function () {
                                dashboardRoutes.setup(app, application, function () {
                                    campaignRoutes.setup(app, application, function () {
                                        projectRoutes.setup(app, application, function () {
                                            reportingRoutes.setup(app, application, function () {
                                                developerRoutes.setup(app, application, function () {
                                                    segmentRoutes.setup(app, application, function () {
                                                        app.get('/', application.enforceSecure, function (req, res) {
                                                            res.render('home', {
                                                                settings: utils.config.settings(),
                                                                application: application,
                                                                req: req
                                                            });
                                                        });
                                                        app.get('/home', application.enforceSecure, function (req, res) {
                                                            res.render('home', {
                                                                settings: utils.config.settings(),
                                                                application: application,
                                                                req: req
                                                            });
                                                        });
                                                        app.get('/terms', application.enforceSecure, function (req, res) {
                                                            res.render('terms', {
                                                                settings: utils.config.settings(),
                                                                application: application,
                                                                req: req
                                                            });
                                                        });
                                                        app.get('/privacy', application.enforceSecure, function (req, res) {
                                                            res.render('privacy', {
                                                                settings: utils.config.settings(),
                                                                application: application,
                                                                req: req
                                                            });
                                                        });
                                                        app.get('/browsercaps', application.enforceSecure, function (req, res) {
                                                            res.render('browserCaps', {
                                                                settings: utils.config.settings(),
                                                                application: application,
                                                                req: req
                                                            });
                                                        });
                                                        app.get('/contact/form', application.enforceSecure, function (req, res) {
                                                            res.render('contactForm', {
                                                                settings: utils.config.settings(),
                                                                application: application,
                                                                dev: utils.config.dev(),
                                                                req: req
                                                            });
                                                        });
                                                        app.get('/support', application.enforceSecure, function (req, res) {
                                                            res.render('support', {
                                                                settings: utils.config.settings(),
                                                                application: application,
                                                                dev: utils.config.dev(),
                                                                req: req
                                                            });
                                                        });
                                                        app.get('/features', application.enforceSecure, function (req, res) {
                                                            res.render('features', {
                                                                settings: utils.config.settings(),
                                                                application: application,
                                                                dev: utils.config.dev(),
                                                                req: req
                                                            });
                                                        });
                                                        app.get('/how', application.enforceSecure, function (req, res) {
                                                            res.render('how', {
                                                                settings: utils.config.settings(),
                                                                application: application,
                                                                dev: utils.config.dev(),
                                                                req: req
                                                            });
                                                        });
                                                        app.get('/scoring', application.enforceSecure, function (req, res) {
                                                            res.render('scoring', {
                                                                settings: utils.config.settings(),
                                                                application: application,
                                                                dev: utils.config.dev(),
                                                                req: req
                                                            });
                                                        });
                                                        app.get('/comingsoon', application.enforceSecure, api.authenticate, function (req, res) {
                                                            res.render('comingSoon', {
                                                                settings: utils.config.settings(),
                                                                application: application,
                                                                dev: utils.config.dev(),
                                                                req: req
                                                            });
                                                        });
                                                        app.get('/registered', application.enforceSecure, api.authenticate, function (req, res) {
                                                            utils.noCache(res);
                                                            var params = {
                                                                accessToken: req['session'].accessToken,
                                                                moduleId: 0,
                                                                name: "analytics",
                                                                status: 0
                                                            };
                                                            api.accounts.create(params, function (err, account) {
                                                                if (err) {
                                                                    web.renderError(req, res, err.message);
                                                                    return;
                                                                }
                                                                var authParams = {
                                                                    accessToken: req['session'].accessToken,
                                                                    noCache: true
                                                                };
                                                                api.authorize(authParams, function (err, auth) {
                                                                    req['session'].user = auth.user;
                                                                    req['session'].account = account;
                                                                    res.redirect(301, '/setup/projects/form?new=1');
                                                                });
                                                            });
                                                        });
                                                        callback();
                                                    });
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    }
    catch (err) {
        console.dir(err);
        callback(err);
    }
}
exports.setup = setup;
//# sourceMappingURL=setup.js.map
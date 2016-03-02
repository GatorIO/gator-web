/// <reference path="../typings/node/node.d.ts" />
/// <reference path="../typings/gator-utils/gator-utils.d.ts" />
/// <reference path="../typings/gator-api/gator-api.d.ts" />
/// <reference path="../typings/express/express.d.ts" />
/// <reference path="../typings/connect-flash/connect-flash.d.ts" />
/// <reference path="../typings/gator-web/gator-web.d.ts" />
import utils = require("gator-utils");
import web = require("gator-web");
import express = require('express');
import api = require('gator-api');
import {IApplication} from "gator-web";

import apiRoutes = require('./api');
import projectRoutes = require('./projects');
import reportingRoutes = require('./reporting');
import segmentRoutes = require('./segments');
import campaignRoutes = require('./campaigns');
import dashboardRoutes = require('./dashboards');
import bookmarkRoutes = require('./bookmarks');
import scheduledReportsRoutes = require('./scheduledReports');
import developerRoutes = require('./developer');
import attributeRoutes = require('./attributes');
import helpRoutes = require('./help');
import accessTokenRoutes = require('./accessTokens');

export function setup(app: express.Application, application: IApplication, callback) {

    /*
     Set up routes - this script handles module admin functions
     */

    try {

        accessTokenRoutes.setup(app, application, function() {

            helpRoutes.setup(app, application, function(){

                apiRoutes.setup(app, application, function(){

                    attributeRoutes.setup(app, application, function(){

                        scheduledReportsRoutes.setup(app, application, function(){

                            bookmarkRoutes.setup(app, application, function() {

                                dashboardRoutes.setup(app, application, function() {

                                    campaignRoutes.setup(app, application, function() {

                                        projectRoutes.setup(app, application, function() {

                                            reportingRoutes.setup(app, application, function() {

                                                developerRoutes.setup(app, application, function() {

                                                    segmentRoutes.setup(app, application, function() {

                                                        //  check for https and redirect to secure page if not in secure mode
                                                        app.get('/', application.enforceSecure, function (req: express.Request, res: express.Response) {
                                                            res.render('home', {
                                                                settings: utils.config.settings(),
                                                                application: application,
                                                                req: req
                                                            });
                                                        });

                                                        app.get('/home', application.enforceSecure, function(req: any, res) {
                                                            res.render('home', {
                                                                settings: utils.config.settings(),
                                                                application: application,
                                                                req: req
                                                            });
                                                        });

                                                        app.get('/terms', application.enforceSecure, function(req: any, res) {
                                                            res.render('terms', {
                                                                settings: utils.config.settings(),
                                                                application: application,
                                                                req: req
                                                            });
                                                        });

                                                        app.get('/privacy', application.enforceSecure, function(req: any, res) {
                                                            res.render('privacy', {
                                                                settings: utils.config.settings(),
                                                                application: application,
                                                                req: req
                                                            });
                                                        });

                                                        app.get('/browsercaps', application.enforceSecure, function(req: any, res) {
                                                            res.render('browserCaps', {
                                                                settings: utils.config.settings(),
                                                                application: application,
                                                                req: req
                                                            });
                                                        });

                                                        app.get('/contact/form', application.enforceSecure, function(req: any, res) {
                                                            res.render('contactForm', {
                                                                settings: utils.config.settings(),
                                                                application: application,
                                                                dev: utils.config.dev(),
                                                                req: req
                                                            });
                                                        });

                                                        app.get('/support', application.enforceSecure, function(req: any, res) {
                                                            res.render('support', {
                                                                settings: utils.config.settings(),
                                                                application: application,
                                                                dev: utils.config.dev(),
                                                                req: req
                                                            });
                                                        });

                                                        app.get('/features', application.enforceSecure, function(req: any, res) {
                                                            res.render('features', {
                                                                settings: utils.config.settings(),
                                                                application: application,
                                                                dev: utils.config.dev(),
                                                                req: req
                                                            });
                                                        });

                                                        app.get('/how', application.enforceSecure, function(req: any, res) {
                                                            res.render('how', {
                                                                settings: utils.config.settings(),
                                                                application: application,
                                                                dev: utils.config.dev(),
                                                                req: req
                                                            });
                                                        });

                                                        app.get('/scoring', application.enforceSecure, function(req: any, res) {
                                                            res.render('scoring', {
                                                                settings: utils.config.settings(),
                                                                application: application,
                                                                dev: utils.config.dev(),
                                                                req: req
                                                            });
                                                        });

                                                        app.get('/comingsoon', application.enforceSecure, api.authenticate, function(req: any, res) {
                                                            res.render('comingSoon', {
                                                                settings: utils.config.settings(),
                                                                application: application,
                                                                dev: utils.config.dev(),
                                                                req: req
                                                            });
                                                        });

                                                        app.get('/registered', application.enforceSecure, api.authenticate, function (req: express.Request, res: express.Response) {
                                                            utils.noCache(res);

                                                            var params = {
                                                                accessToken: req['session'].accessToken,
                                                                moduleId: 0,    // analytics
                                                                name: "analytics",
                                                                status: 0
                                                            };

                                                            //  for a newly registered user, create an account
                                                            api.accounts.create(params, function(err: api.errors.APIError, account: api.accounts.Account) {

                                                                if (err) {
                                                                    web.renderError(req, res, err.message);
                                                                    return;
                                                                }

                                                                //  re-auth the user to get the new role info
                                                                var authParams = {
                                                                    accessToken: req['session'].accessToken,
                                                                    noCache: true
                                                                };

                                                                api.authorize(authParams, function(err: api.errors.APIError, auth: api.Authorization) {

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
    } catch (err) {
        console.dir(err);
        callback(err);
    }
}
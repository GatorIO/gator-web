/// <reference path="../typings/node/node.d.ts" />
/// <reference path="../typings/gator-utils/gator-utils.d.ts" />
/// <reference path="../typings/gator-api/gator-api.d.ts" />
/// <reference path="../typings/express/express.d.ts" />
/// <reference path="../typings/connect-flash/connect-flash.d.ts" />
import utils = require("gator-utils");
import express = require('express');
import restify = require('restify');
import api = require('gator-api');
import {IApplication} from "gator-web";

/*
 Set up routes - this script handles functions required for managing the API
 */

export function setup(app: express.Application, application: IApplication, callback) {

    app.get('/help/overview', application.enforceSecure, function (req: express.Request, res: express.Response) {

        res.render('./help/overview', {
            req: req,
            application: application,
            dev: utils.config.dev()
        });
    });

    app.get('/help/gettingstarted', application.enforceSecure, function (req: express.Request, res: express.Response) {

        res.render('./help/gettingStarted', {
            req: req,
            application: application,
            dev: utils.config.dev()
        });
    });

    app.get('/help/reporting', application.enforceSecure, function (req: express.Request, res: express.Response) {

        res.render('./help/reporting', {
            req: req,
            application: application,
            dev: utils.config.dev(),
            attributes: api.reporting.getAttributes('all', api.reporting.AttributeTypes.all, false)
        });
    });

    app.get('/help/conversiontracking', application.enforceSecure, function (req: express.Request, res: express.Response) {

        res.render('./help/conversionTracking', {
            req: req,
            application: application,
            dev: utils.config.dev()
        });
    });

    app.get('/help/multivariate', application.enforceSecure, function (req: express.Request, res: express.Response) {

        res.render('./help/multivariate', {
            req: req,
            application: application,
            dev: utils.config.dev()
        });
    });

    app.get('/help/scoring', application.enforceSecure, function (req: express.Request, res: express.Response) {

        res.render('./help/scoring', {
            req: req,
            application: application,
            dev: utils.config.dev()
        });
    });

    callback();
}


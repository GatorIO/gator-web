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

import _apiRoutes = require('./api');
import _projectRoutes = require('./projects');
import _reportingRoutes = require('./reporting');
import _segmentRoutes = require('./segments');
import _campaignRoutes = require('./campaigns');
import _dashboardRoutes = require('./dashboards');
import _bookmarkRoutes = require('./bookmarks');
import _developerRoutes = require('./developer');
import _attributeRoutes = require('./attributes');
import _paymentRoutes = require('./payments');
import _emailRoutes = require('./email');
import _accessTokenRoutes = require('./accessTokens');

export var apiRoutes = require('./api');
export var projectRoutes = require('./projects');
export var reportingRoutes = require('./reporting');
export var segmentRoutes = require('./segments');
export var campaignRoutes = require('./campaigns');
export var dashboardRoutes = require('./dashboards');
export var bookmarkRoutes = require('./bookmarks');
export var developerRoutes = require('./developer');
export var attributeRoutes = require('./attributes');
export var paymentRoutes = require('./payments');
export var emailRoutes = require('./email');
export var accessTokenRoutes = require('./accessTokens');

export function setup(app: express.Application, application: IApplication, callback) {

    /*
     Set up routes - this script handles module admin functions
     */

    try {

        accessTokenRoutes.setup(app, application, function() {

            apiRoutes.setup(app, application, function(){

                attributeRoutes.setup(app, application, function(){

                    bookmarkRoutes.setup(app, application, function() {

                        dashboardRoutes.setup(app, application, function() {

                            campaignRoutes.setup(app, application, function() {

                                projectRoutes.setup(app, application, function() {

                                    reportingRoutes.setup(app, application, function() {

                                        developerRoutes.setup(app, application, function() {

                                            segmentRoutes.setup(app, application, function() {

                                                paymentRoutes.setup(app, application, function() {

                                                    emailRoutes.setup(app, application, function() {                                                        
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
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
import developerRoutes = require('./developer');
import attributeRoutes = require('./attributes');
import paymentRoutes = require('./payments');
import emailRoutes = require('./email');
import accessTokenRoutes = require('./accessTokens');

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
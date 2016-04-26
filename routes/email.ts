/// <reference path="../typings/node/node.d.ts" />
/// <reference path="../typings/gator-utils/gator-utils.d.ts" />
/// <reference path="../typings/gator-api/gator-api.d.ts" />
/// <reference path="../typings/express/express.d.ts" />
/// <reference path="../typings/connect-flash/connect-flash.d.ts" />
/// <reference path="../typings/restify/restify.d.ts" />
import utils = require("gator-utils");
import express = require('express');
import restify = require('restify');
import api = require('gator-api');
import {IApplication} from "gator-web";

/*
 Set up routes - this script handles functions required for managing access tokens
 */

export function setup(app: express.Application, application: IApplication, callback) {

    app.get('/email/unsubscribe', application.enforceSecure, api.authenticate, function (req: express.Request, res: express.Response) {

        res.render('unsubscribe', {
            application: application,
            settings: utils.config.settings(),
            req: req
        });
    });

    app.post('/email/unsubscribe', function (req: express.Request, res: express.Response) {
        utils.noCache(res);

        var params: any = {
            email: req.body.email,
            listId: req.body.listId
        };

        api.REST.client.post('/v1/email/unsubscribe', params, function(err, apiRequest: restify.Request, apiResponse: restify.Response, result: any) {
            api.REST.sendConditional(res, err, result);
        });
    });

    callback();
}


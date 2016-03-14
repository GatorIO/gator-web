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
 Set up routes - this script handles functions required for managing campaigns
 */

export function setup(app: express.Application, application: IApplication, callback) {

    /*
        Campaign referrers
     */

    //  get all campaign referrers for project and show list of them
    app.get('/setup/campaignreferrers', application.enforceSecure, api.authenticate, function (req: express.Request, res: express.Response) {
        utils.noCache(res);

        //  always refresh the project list here, since all edits redir back here
        api.REST.client.get('/v1/projects/account/' + req['session'].account.id + '?accessToken=' + req['session']['accessToken'], function(err, apiRequest: restify.Request, apiResponse: restify.Response, result: any) {

            if (err)
                req.flash('error', err.message);
            else
                req['session'].projects = result.data.projects;

            res.render('campaignReferrers', {
                application: application,
                settings: utils.config.settings(),
                campaignReferrers: req['session'].account.data && req['session'].account.data.campaignReferrers ? req['session'].account.data.campaignReferrers : [],
                req: req
            });
        });
    });

    //  update existing data
    app.put('/setup/campaignreferrers', application.enforceSecure, api.authenticate, function (req: express.Request, res: express.Response) {

        var params = {
            accessToken: req['session'].accessToken,
            accountId: req['session'].account.id,
            campaignReferrers: req.body.campaignReferrers
        };

        api.REST.client.put('/v1/analytics/campaignreferrers', params, function(err, apiRequest: restify.Request, apiResponse: restify.Response, result: any) {
            api.REST.sendConditional(res, err);
        });
    });


    /*
         Campaign ids
      */

    //  get all campaign ids for account and show list of them
    app.get('/setup/campaignids', application.enforceSecure, api.authenticate, function (req: express.Request, res: express.Response) {
        utils.noCache(res);

        //  always refresh the account here, since all edits redir back here
        api.REST.client.get('/v1/accounts/' + req['session'].account.id + '?accessToken=' + req['session']['accessToken'], function(err, apiRequest: restify.Request, apiResponse: restify.Response, result: any) {

            if (!err)
                req['session'].account = result.data.account;

            res.render('campaignIds',{
                application: application,
                settings: utils.config.settings(),
                campaignIds: req['session'].account.data && req['session'].account.data.campaignIds ? req['session'].account.data.campaignIds.join(',') : '',
                req: req
            });
        });
    });

    //  update existing data
    app.put('/setup/campaignids', application.enforceSecure, api.authenticate, function (req: express.Request, res: express.Response) {

        var params = {
            accessToken: req['session'].accessToken,
            accountId: req['session'].account.id,
            campaignIds: req.body.campaignIds.split(',')
        };

        api.REST.client.put('/v1/analytics/campaignids', params, function(err, apiRequest: restify.Request, apiResponse: restify.Response, result: any) {
            api.REST.sendConditional(res, err);
        });
    });

    callback();
}
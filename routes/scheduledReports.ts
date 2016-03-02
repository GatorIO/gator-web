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
 Set up routes - this script handles functions required for managing scheduled reports
 */

export function setup(app: express.Application, application: IApplication, callback) {

    //  show all scheduled reports for the current account
    app.get('/setup/scheduledReports', application.enforceSecure, api.authenticate, function (req: express.Request, res: express.Response) {
        utils.noCache(res);


        api.REST.client.get('/v1/analytics/scheduledreports/account/'+ req['session'].account.id + '?accessToken=' + req['session']['accessToken'] + '&userid=' + req['session'].account.userId , function(err, apiRequest: restify.Request, apiResponse: restify.Response, result: any) {


            //if (!err)
            //  req['session'].account = result.data.account;

            res.render('scheduledReports',{
                settings: utils.config.settings(),
                scheduledReports: result.data,
                application: application,
                req: req
            });
        });

        /*
         //  always refresh the account here, since all edits redir back here
         api.REST.client.get('/v1/accounts/' + req['session'].account.id + '?accessToken=' + req['session']['accessToken'], function(err, apiRequest: restify.Request, apiResponse: restify.Response, result: any) {

         if (!err)
         req['session'].account = result.data.account;

         res.render('bookmarks',{
         settings: utils.config.settings(),
         bookmarks: req['session'].account.data && req['session'].account.data.bookmarks ? req['session'].account.data.bookmarks : {},
         req: req
         });
         });
         */

    });

    // get scheduled report by id
    app.get('/setup/scheduledReports/:id', application.enforceSecure, api.authenticate, function (req: express.Request, res: express.Response) {
        utils.noCache(res);
        api.REST.client.get('/v1/analytics/scheduledreports/query/'+ req.params['id'] + "?accountId=" + req['session'].account.id + '&accessToken=' + req['session']['accessToken'] + '&userid=' + req['session'].account.userId , function(err, apiRequest: restify.Request, apiResponse: restify.Response, result: any) {

            res.redirect(decodeURIComponent(result.data["query"]));
        });
    });


    //  display bookmark maintenance form
    app.get('/setup/scheduledReports/form', application.enforceSecure, api.authenticate, function (req: express.Request, res: express.Response) {
        utils.noCache(res);

        var projects = req['session']['projects'], projectIds = [];

        //  build list of projects
        if (projects) {

            for (var p = 0; p < projects.length; p++) {
                projectIds.push({ text: projects[p].name, value: projects[p].id });
            }
        }

        //  get segment to edit
        var segments = req['session']['segments'], segment = null;

        if (segments && req.query.id) {

            segments.forEach(function(item) {
                if (item.id == +req.query.id) {
                    segment = item;
                }
            });
        }

        res.render('bookmarksForm', {
            settings: utils.config.settings(),
            application: application,
            dev: utils.config.dev(),
            req: req,
            projectIds: projectIds,
            dataObj: segment
        });
    });

    //  create a new bookmark
    app.post('/setup/scheduledReports', application.enforceSecure, api.authenticate, function (req: express.Request, res: express.Response) {


        var params: any = {
            accessToken: req['session'].accessToken,
            accountId: req['session'].account.id,
            userId: req['session'].account.userId,
            name: req.body.name,
            query: req.body.query,
            recipients: req.body.recipients,
            subject: req.body.subject,
            desc: req.body.desc,
            attachmentFormat: req.body.attachmentFormat,
            recurrence: req.body.recur,
            frequency: req.body.freq
        };




        if (req.body.projectIds) {
            params.projectIds = req.body.projectIds.split(',');
        }


        api.REST.client.post('/v1/analytics/scheduledreports', params, function(err, apiRequest: restify.Request, apiResponse: restify.Response, result: any) {
            if(err)
            {
                api.REST.sendConditional(res, err);
            }
            else {
                api.REST.sendConditional(res, err, result.data);
            }
        });
    });

    //  update an existing segment
    app.put('/setup/scheduledReports', application.enforceSecure, api.authenticate, function (req: express.Request, res: express.Response) {


        var params: any = {
            id: +req.body.id,
            accessToken: req['session'].accessToken,
            accountId: req['session'].account.id,
            name: req.body.name,
            query: req.body.query,
            appliesTo: req.body.appliesTo
        };

        if (req.body.projectIds) {
            params.projectIds = req.body.projectIds.split(',');
        }

        api.REST.client.put('/v1/analytics/scheduledReports', params, function(err, apiRequest: restify.Request, apiResponse: restify.Response, result: any) {
            api.REST.sendConditional(res, err);
        });
    });

    app.delete('/setup/scheduledReports/:id/', application.enforceSecure, api.authenticate, function (req: express.Request, res: express.Response) {


        api.REST.client.del('/v1/analytics/scheduledreports/' + req.params['id'] + '?accessToken=' + req['session'].accessToken, function(err: Error, apiRequest: restify.Request, apiResponse: restify.Response) {

            if (err)
                req.flash('error', err.message);
            else
                req.flash('info', 'The scheduled report has been deleted.');

            api.REST.sendConditional(res, err);
        });
    });

    callback();
}


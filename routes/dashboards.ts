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
import lib = require('../lib/index');

/*
 Set up routes - this script handles functions required for managing dashboards
 */

export function setup(app: express.Application, application: IApplication, callback) {

    var statusCheck: any = typeof application.statusCheck == 'function' ? application.statusCheck : lib.statusCheckPlaceholder;

    //  get all dashboards for project and show list of them
    app.get('/setup/dashboards', application.enforceSecure, api.authenticate, function (req: express.Request, res: express.Response) {
        utils.noCache(res);

        //  always refresh the project list here, since all edits redir back here
        api.REST.client.get('/v1/projects?accessToken=' + req['session']['accessToken'], function(err, apiRequest: restify.Request, apiResponse: restify.Response, result: any) {

            if (err)
                req.flash('error', err.message);
            else
                req['session'].projects = result.data.projects;

            res.render('dashboards',{
                application: application,
                settings: utils.config.settings(),
                dashboards: api.reporting.currentDashboards(req),
                req: req
            });
        });
    });

    //  update existing data
    app.put('/setup/dashboards', application.enforceSecure, api.authenticate, function (req: express.Request, res: express.Response) {

        var params = {
            accessToken: req['session'].accessToken,
            projectId: req['session'].currentProjectId,
            dashboards: req.body.dashboards
        };

        api.REST.client.put('/v1/projects/dashboards', params, function(err, apiRequest: restify.Request, apiResponse: restify.Response, result: any) {
            api.REST.sendConditional(res, err);
        });
    });

    //  add a pod to a dashboard
    app.post('/setup/dashboards/pods', application.enforceSecure, api.authenticate, function (req: express.Request, res: express.Response) {

        var dashboards = api.reporting.currentDashboards(req);

        var pod = {
            display: req.body.display,
            title:  req.body.title,
            state: req.body.state
        };

        dashboards[req.body.name].pods = dashboards[req.body.name].pods || [];
        dashboards[req.body.name].pods.push(JSON.stringify(pod));   //  need to stringify it or mongo won't store it (the $'s are a problem)

        var params = {
            accessToken: req['session'].accessToken,
            projectId: req['session'].currentProjectId,
            dashboards: dashboards
        };

        api.REST.client.put('/v1/projects/dashboards', params, function(err, apiRequest: restify.Request, apiResponse: restify.Response, result: any) {
            api.REST.sendConditional(res, err);
        });
    });

    //  update the pod display order
    app.post('/setup/dashboards/order', application.enforceSecure, api.authenticate, function (req: express.Request, res: express.Response) {

        var dashboards = api.reporting.currentDashboards(req);

        var newOrder = [];

        for (var i = 0; i < req.body.order.length; i++) {

            if (dashboards[req.body.name].pods[req.body.order[i]])
                newOrder.push(utils.clone(dashboards[req.body.name].pods[req.body.order[i]]));
        }

        dashboards[req.body.name].pods = newOrder;

        var params = {
            accessToken: req['session'].accessToken,
            projectId: req['session'].currentProjectId,
            dashboards: dashboards
        };

        api.REST.client.put('/v1/projects/dashboards', params, function(err, apiRequest: restify.Request, apiResponse: restify.Response, result: any) {
            api.REST.sendConditional(res, err);
        });
    });

    //  delete a pod
    app.delete('/setup/dashboards/pods', application.enforceSecure, api.authenticate, function (req: express.Request, res: express.Response) {

        var dashboards = api.reporting.currentDashboards(req);
        var dashboard = dashboards[req.body.name];

        dashboard.pods.splice(+req.body.pod, 1);

        var params = {
            accessToken: req['session'].accessToken,
            projectId: req['session'].currentProjectId,
            dashboards: dashboards
        };

        api.REST.client.put('/v1/projects/dashboards', params, function(err, apiRequest: restify.Request, apiResponse: restify.Response, result: any) {
            api.REST.sendConditional(res, err);
        });
    });

    //  display a dashboard
    app.get('/dashboard', application.enforceSecure, api.authenticate, statusCheck, function (req: express.Request, res: express.Response) {
        utils.noCache(res);

        var name = req.query.name, dashboard = {};

        //  find the dashboard to display
        var dashboards = api.reporting.currentDashboards(req);

        if (dashboards[name]) {
            dashboard = dashboards[name];
        } else {
            req.flash('error', 'No such dashboard');
        }

        res.render('dashboard',{
            application: application,
            settings: utils.config.settings(),
            req: req,
            dashboardName: name,
            dashboard: dashboard
        });
    });

    callback();
}


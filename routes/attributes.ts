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
 Set up routes - this script handles functions required for managing attributes

 SCOPE:  Custom attributes are specific to a project.

 */

export function setup(app: express.Application, application: IApplication, callback) {

    app.get('/setup/attributes/:id', application.enforceSecure, api.authenticate, function (req: express.Request, res: express.Response) {
        utils.noCache(res);

        //  refresh the project list
        api.REST.client.get('/v1/projects?accessToken=' + req['session']['accessToken'], function(err, apiRequest: restify.Request, apiResponse: restify.Response, result: any) {

            if (err)
                req.flash('error', err.message);
            else
                req['session'].projects = result.data.projects;

            var project = api.getProject(req, +req.params['id']);
            var attribs = api.reporting.getCustomAttributes(req, +req.params['id']);      //  specific to user

            res.render('attributes',{
                settings: utils.config.settings(),
                application: application,
                req: req,
                project: project,
                attributes: attribs
            });
        });
    });

    //  display for attribute maintenance form
    app.get('/setup/attributes/form/:id', application.enforceSecure, api.authenticate, function (req: express.Request, res: express.Response) {
        utils.noCache(res);

        //  refresh the project list
        api.REST.client.get('/v1/projects?accessToken=' + req['session']['accessToken'], function(err, apiRequest: restify.Request, apiResponse: restify.Response, result: any) {
            var dataObj = null, project: any = null;

            if (err)
                req.flash('error', err.message);
            else
                req['session'].projects = result.data.projects;

            var project = api.getProject(req, +req.params['id']);
            var attribs = api.reporting.getCustomAttributes(req, +req.params['id']);      //  specific to user

            if (req.query.name) {

                if (!project.data.attributes[req.query.type][req.query.name])
                    project.data.attributes[req.query.type][req.query.name] = {};

                dataObj = project.data.attributes[req.query.type][req.query.name];
                dataObj.name = req.query.name;
            }

            res.render('attributesForm', {
                settings: utils.config.settings(),
                application: application,
                dev: utils.config.dev(),
                req: req,
                dataObj: dataObj,
                project: project,
                attributes: attribs
            });
        });
    });

    //  create/update an attribute
    app.post('/setup/attributes/:id', application.enforceSecure, api.authenticate, function (req: express.Request, res: express.Response) {

        if (!req.body.name)
            api.REST.sendError(res, new api.errors.MissingParameterError('You must specify a name and destination.'));
        else {

            var project = api.getProject(req, +req.params['id']);
            var attribs = api.reporting.getCustomAttributes(req, +req.params['id']);      //  specific to user

            var attrib: any = {};

            var type = req.body.type || 'session';

            if (!attribs[type])
                attribs[type] = {};

            attrib.description = req.body.description;
            attrib.filterable = req.body.filterable == 'yes';
            attrib.dataType = req.body.dataType;
            attrib.format = req.body.format;

            if (req.body.attribType == 'element') {
                attrib.isElement = true;
            } else {
                attrib.isMetric = true;
                attrib.dataType = 'numeric';
                attrib.totalBy = req.body.totalBy || 'sum';
                attrib.basisRelationship = req.body.basisRelationship || 'percent';
            }

            project.data.attributes[type][req.body.name] = attrib;

            var params = {
                accessToken: req['session'].accessToken,
                projectId: project.id,
                attributes: project.data.attributes
            };

            api.REST.client.put('/v1/analytics/attributes/custom', params, function(err, apiRequest: restify.Request, apiResponse: restify.Response, result: any) {
                api.REST.sendConditional(res, err);
            });
        }
    });

    //  delete an attribute and update the account
    app.delete('/setup/attributes/:id', application.enforceSecure, api.authenticate, function (req: express.Request, res: express.Response) {
        utils.noCache(res);

        var project = api.getProject(req, +req.params['id']);
        var attribs = api.reporting.getCustomAttributes(req, +req.params['id']);      //  specific to user

        if (!project.data.attributes[req.query['type']])
            project.data.attributes[req.query['type']] = {};

        delete project.data.attributes[req.query['type']][req.query['name']];

        var params = {
            accessToken: req['session'].accessToken,
            projectId: project.id,
            attributes: project.data.attributes
        };

        api.REST.client.put('/v1/analytics/attributes/custom', params, function(err, apiRequest: restify.Request, apiResponse: restify.Response, result: any) {
            api.REST.sendConditional(res, err);
        });
    });

    callback();
}


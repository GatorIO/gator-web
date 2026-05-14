import utils = require("gator-utils");
import express = require('express');
import api = require('gator-api');
import {IApplication} from "../lib";

/*
 Set up routes - this script handles functions required for managing attributes

 SCOPE:  Custom attributes are specific to a project.

 */

export async function setup(app: express.Application, application: IApplication): Promise<void> {

    app.get('/setup/attributes/:id', application.enforceSecure, api.authenticate, async (req: express.Request, res: express.Response) => {
        utils.noCache(res);

        try {
            const result = await api.REST.client.get('/v1/projects?accessToken=' + req['session']['accessToken']);
            req['session']['projects'] = result.data.projects;
        } catch (err: any) {
            req.flash('error', err.message);
        }

        const project = api.getProject(req, +req.params['id']);
        const attribs = api.reporting.getCustomAttributes(req, +req.params['id']);      //  specific to user

        res.render('attributes', {
            settings: utils.config.settings(),
            application: application,
            req: req,
            project: project,
            attributes: attribs
        });
    });

    //  display for attribute maintenance form
    app.get('/setup/attributes/form/:id', application.enforceSecure, api.authenticate, async (req: express.Request, res: express.Response) => {
        utils.noCache(res);

        try {
            const result = await api.REST.client.get('/v1/projects?accessToken=' + req['session']['accessToken']);
            req['session']['projects'] = result.data.projects;
        } catch (err: any) {
            req.flash('error', err.message);
        }

        let dataObj = null;
        const project: any = api.getProject(req, +req.params['id']);
        const attribs = api.reporting.getCustomAttributes(req, +req.params['id']);      //  specific to user

        if (req.query.name) {

            if (!project.data.attributes[req.query.type as string][req.query.name as string])
                project.data.attributes[req.query.type as string][req.query.name as string] = {};

            dataObj = project.data.attributes[req.query.type as string][req.query.name as string];
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

    //  create/update an attribute
    app.post('/setup/attributes/:id', application.enforceSecure, api.authenticate, async (req: express.Request, res: express.Response) => {

        if (!req.body.name) {
            api.REST.sendError(res, new api.errors.MissingParameterError('You must specify a name and destination.'));
            return;
        }

        const project = api.getProject(req, +req.params['id']);
        const attribs = api.reporting.getCustomAttributes(req, +req.params['id']);      //  specific to user

        const attrib: any = {};

        const type = req.body.type || 'session';

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

        const params = {
            accessToken: req['session']['accessToken'],
            projectId: project.id,
            attributes: project.data.attributes
        };

        try {
            await api.REST.client.put('/v1/analytics/attributes/custom', params);
            api.REST.sendConditional(res, null);
        } catch (err) {
            api.REST.sendConditional(res, err);
        }
    });

    //  delete an attribute and update the account
    app.delete('/setup/attributes/:id', application.enforceSecure, api.authenticate, async (req: express.Request, res: express.Response) => {
        utils.noCache(res);

        const project = api.getProject(req, +req.params['id']);
        api.reporting.getCustomAttributes(req, +req.params['id']);      //  specific to user

        if (!project.data.attributes[req.query['type'] as string])
            project.data.attributes[req.query['type'] as string] = {};

        delete project.data.attributes[req.query['type'] as string][req.query['name'] as string];

        const params = {
            accessToken: req['session']['accessToken'],
            projectId: project.id,
            attributes: project.data.attributes
        };

        try {
            await api.REST.client.put('/v1/analytics/attributes/custom', params);
            api.REST.sendConditional(res, null);
        } catch (err) {
            api.REST.sendConditional(res, err);
        }
    });
}

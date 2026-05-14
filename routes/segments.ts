import utils = require("gator-utils");
import express = require('express');
import api = require('gator-api');
import {IApplication} from "../lib";

/*
 Set up routes - this script handles functions required for managing segments
 */

export async function setup(app: express.Application, application: IApplication): Promise<void> {

    //  get all segments for the current account
    app.get('/setup/segments', application.enforceSecure, api.authenticate, async (req: express.Request, res: express.Response) => {
        utils.noCache(res);

        try {
            await api.reporting.getSegments(req, false, req['session']['account'].appId);
        } catch (err: any) {
            req.flash('error', err.message);
        }

        res.render('segments', {
            settings: utils.config.settings(),
            application: application,
            dev: utils.config.dev(),
            req: req
        });
    });

    //  display for segment maintenance form
    app.get('/setup/segments/form', application.enforceSecure, api.authenticate, function (req: express.Request, res: express.Response) {
        utils.noCache(res);

        const projects = req['session']['projects'];
        const projectIds = [];

        //  build list of projects
        if (projects) {

            for (let p = 0; p < projects.length; p++) {
                projectIds.push({ text: projects[p].name, value: projects[p].id });
            }
        }

        //  get segment to edit
        const segments = req['session']['segments'];
        let segment = null;

        if (segments && req.query.id) {

            segments.forEach(function (item) {
                if (item.id == +req.query.id) {
                    segment = item;
                }
            });
        }

        res.render('segmentsForm', {
            settings: utils.config.settings(),
            application: application,
            dev: utils.config.dev(),
            req: req,
            projectIds: projectIds,
            dataObj: segment,
            filterOptions: api.reporting.getFilterOptions('sessions', false, false)
        });
    });

    //  create a new segment
    app.post('/setup/segments', application.enforceSecure, api.authenticate, async (req: express.Request, res: express.Response) => {

        const params: any = {
            accessToken: req['session']['accessToken'],
            name: req.body.name,
            query: req.body.query || {}
        };

        if (req.body.projectId) {
            params.projectId = +req.body.projectId;
        }

        try {
            await api.REST.client.post('/v1/analytics/segments', params);
            api.REST.sendConditional(res, null);
        } catch (err) {
            api.REST.sendConditional(res, err);
        }
    });

    //  update an existing segment
    app.put('/setup/segments', application.enforceSecure, api.authenticate, async (req: express.Request, res: express.Response) => {

        const params: any = {
            id: +req.body.id,
            accessToken: req['session']['accessToken'],
            name: req.body.name,
            query: req.body.query || {}
        };

        if (req.body.projectId) {
            params.projectId = +req.body.projectId;
        }

        try {
            await api.REST.client.put('/v1/analytics/segments', params);
            api.REST.sendConditional(res, null);
        } catch (err) {
            api.REST.sendConditional(res, err);
        }
    });

    app.delete('/setup/segments/:id/', application.enforceSecure, api.authenticate, async (req: express.Request, res: express.Response) => {

        try {
            await api.REST.client.del('/v1/analytics/segments/' + req.params['id'] + '?accessToken=' + req['session']['accessToken']);
            api.REST.sendConditional(res, null);
        } catch (err) {
            api.REST.sendConditional(res, err);
        }
    });
}

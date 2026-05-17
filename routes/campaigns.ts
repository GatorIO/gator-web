import utils = require("gator-utils");
import express = require('express');
import api = require('gator-api');
import {IApplication} from "../lib";

/*
 Set up routes - this script handles functions required for managing campaigns
 */

export async function setup(app: express.Application, application: IApplication): Promise<void> {

    /*
        Campaign referrers
     */

    //  get all campaign referrers for project and show list of them
    app.get('/setup/campaignreferrers/:projectId', application.enforceSecure, api.authenticate, async (req: express.Request, res: express.Response) => {
        utils.noCache(res);

        let projectId: any = req.params.projectId;

        if (projectId == 'current')
            projectId = req.session['currentProjectId'];

        try {
            const result = await api.REST.client.get('/v1/projects?accessToken=' + req['session']['accessToken']);
            req['session']['projects'] = result.data.projects;
        } catch (err: any) {
            req.flash('error', err.message);
        }

        const project = api.getProject(req, +projectId);

        res.render('campaignReferrers', {
            application: application,
            settings: utils.config.settings(),
            campaignReferrers: project.data && project.data.campaignReferrers ? project.data.campaignReferrers : [],
            req: req
        });
    });

    //  update existing data
    app.put('/setup/campaignreferrers/:projectId', application.enforceSecure, api.authenticate, async (req: express.Request, res: express.Response) => {

        let projectId: any = req.params.projectId;

        if (projectId == 'current')
            projectId = req.session['currentProjectId'];

        const project = api.getProject(req, +projectId);

        const params = {
            accessToken: req['session']['accessToken'],
            projectId: project.id,
            campaignReferrers: req.body?.campaignReferrers || []
        };

        try {
            await api.REST.client.put('/v1/analytics/campaignreferrers', params);
            api.REST.sendConditional(res, null);
        } catch (err) {
            api.REST.sendConditional(res, err);
        }
    });


    /*
         Campaign ids
      */

    //  get all campaign ids for account and show list of them
    app.get('/setup/campaignids/:projectId', application.enforceSecure, api.authenticate, async (req: express.Request, res: express.Response) => {
        utils.noCache(res);

        let projectId: any = req.params.projectId;

        if (projectId == 'current')
            projectId = req.session['currentProjectId'];

        try {
            const result = await api.REST.client.get('/v1/projects?accessToken=' + req['session']['accessToken']);
            req['session']['projects'] = result.data.projects;
        } catch (err: any) {
            req.flash('error', err.message);
        }

        const project = api.getProject(req, +projectId);

        res.render('campaignIds', {
            application: application,
            settings: utils.config.settings(),
            campaignIds: project.data && project.data.campaignIds ? project.data.campaignIds.join(',') : '',
            req: req
        });
    });

    //  update existing data
    app.put('/setup/campaignids/:projectId', application.enforceSecure, api.authenticate, async (req: express.Request, res: express.Response) => {

        let projectId: any = req.params.projectId;

        if (projectId == 'current')
            projectId = req.session['currentProjectId'];

        const project = api.getProject(req, +projectId);

        const params = {
            accessToken: req['session']['accessToken'],
            projectId: project.id,
            campaignIds: req.body.campaignIds.split(',')
        };

        try {
            await api.REST.client.put('/v1/analytics/campaignids', params);
            api.REST.sendConditional(res, null);
        } catch (err) {
            api.REST.sendConditional(res, err);
        }
    });
}

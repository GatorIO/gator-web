import utils = require("gator-utils");
import express = require('express');
import api = require('gator-api');
import {IApplication} from "../lib";

/*
 Set up routes - this script handles functions required for managing projects
 */

export async function setup(app: express.Application, application: IApplication): Promise<void> {

    //  set the current project id as a session variable
    app.get('/defaultproject/:id/', application.enforceSecure, api.authenticate, async (req: express.Request, res: express.Response) => {
        utils.noCache(res);
        req['session']['currentProjectId'] = req.params.id;

        const params = {
            accessToken: req['session']['accessToken'],
            projectId: req.params.id
        };

        try {
            await api.REST.client.post('/v1/users/defaultproject', params);
        } catch {
            // ignored - the original handler always sent 'OK' regardless of result
        }

        res.send('OK');
    });

    //  get all projects for account and show list of them
    app.get('/setup/projects', application.enforceSecure, api.authenticate, async (req: express.Request, res: express.Response) => {
        utils.noCache(res);

        let projects: any[] = [];

        try {
            const result = await api.REST.client.get('/v1/projects?accessToken=' + req['session']['accessToken']);

            if (result && result.data) {
                req['session']['projects'] = result.data.projects;
                projects = result.data.projects || [];
            }
        } catch (err: any) {
            req.flash('error', err.message);
        }

        //  make sure the default project exists in the project list
        let found = false;

        if (req['session']['currentProjectId'] && req['session']['projects']) {

            for (let p = 0; p < req['session']['projects'].length; p++) {
                if (req['session']['projects'][p].id == req['session']['currentProjectId']) {
                    found = true;
                    break;
                }
            }
        }

        if (!found) {

            if (req['session']['projects'] && req['session']['projects'].length > 0)
                req['session']['currentProjectId'] = req['session']['projects'][0].id;
        }

        res.render('projects', {
            application: application,
            settings: utils.config.settings(),
            existingProjects: projects,
            req: req
        });
    });

    //  display maintenance form
    app.get('/setup/projects/form', application.enforceSecure, api.authenticate, function (req: express.Request, res: express.Response) {
        utils.noCache(res);

        const project = api.getProject(req, req.query.id);

        if (!req['session']['projects'])
            req['session']['projects'] = [];

        res.render('projectsForm', {
            settings: utils.config.settings(),
            application: application,
            dev: utils.config.dev(),
            req: req,
            newUser: req.query.new ? true : false,
            dataObj: project
        });
    });

    //  create a new project
    app.post('/setup/projects', application.enforceSecure, api.authenticate, async (req: express.Request, res: express.Response) => {
        utils.noCache(res);

        const params = {
            accessToken: req['session']['accessToken'],
            name: req.body.name,
            type: +req.body.type,
            crossDomain: req.body.crossDomain == "true" ? true : false
        };

        try {
            const result = await api.REST.client.post('/v1/projects', params);
            req['session']['currentProjectId'] = result.data.project.id;

            //  successful project creation, so add default dashboard
            const dashParams = {
                accessToken: req['session']['accessToken'],
                projectId: result.data.project.id,
                dashboards: application.defaultDashboard(+req.body.type)
            };

            await api.REST.client.put('/v1/projects/dashboards', dashParams);
            api.REST.sendConditional(res, null);
        } catch (err) {
            api.REST.sendConditional(res, err);
        }
    });

    //  update an existing project
    app.put('/setup/projects', application.enforceSecure, api.authenticate, async (req: express.Request, res: express.Response) => {

        const params = {
            id: +req.body.id,
            accessToken: req['session']['accessToken'],
            name: req.body.name,
            type: +req.body.type,
            enabled: req.body.enabled,
            crossDomain: req.body.crossDomain == "true" ? true : false
        };

        try {
            await api.REST.client.put('/v1/projects', params);
            api.REST.sendConditional(res, null);
        } catch (err) {
            api.REST.sendConditional(res, err);
        }
    });

    app.delete('/setup/projects/:id/', application.enforceSecure, api.authenticate, async (req: express.Request, res: express.Response) => {

        try {
            await api.REST.client.del('/v1/projects/' + req.params['id'] + '?accessToken=' + req['session']['accessToken']);
            api.REST.sendConditional(res, null);
        } catch (err) {
            api.REST.sendConditional(res, err);
        }
    });

    //  get all shares for a project and show list of them
    app.get('/setup/projectshares', application.enforceSecure, api.authenticate, async (req: express.Request, res: express.Response) => {
        utils.noCache(res);

        if (!req.query.projectId) {
            res.redirect('/setup/projects');
            return;
        }

        const project = api.getProject(req, req.query.projectId);
        let projectShares: any[] = [];

        try {
            const result = await api.REST.client.get('/v1/projectshares?projectId=' + req.query.projectId + '&accessToken=' + req['session']['accessToken']);
            projectShares = result.data.projectShares;
        } catch (err: any) {
            req.flash('error', err.message);
        }

        res.render('projectShares', {
            application: application,
            settings: utils.config.settings(),
            projectShares: projectShares,
            project: project,
            req: req
        });
    });

    //  display maintenance form
    app.get('/setup/projectshares/form', application.enforceSecure, api.authenticate, async (req: express.Request, res: express.Response) => {
        utils.noCache(res);

        const project = api.getProject(req, req.query.projectId);

        if (!req.query.userId) {

            res.render('projectSharesForm', {
                settings: utils.config.settings(),
                application: application,
                dev: utils.config.dev(),
                req: req,
                project: project,
                dataObj: null
            });
            return;
        }

        let dataObj: any = null;

        try {
            const result = await api.REST.client.get('/v1/projectshares?userId=' + req.query.userId + '&projectId=' + req.query.projectId + '&accessToken=' + req['session']['accessToken']);
            dataObj = result.data.projectShares[0];
        } catch {
            // dataObj stays null
        }

        res.render('projectSharesForm', {
            settings: utils.config.settings(),
            application: application,
            dev: utils.config.dev(),
            req: req,
            project: project,
            dataObj: dataObj
        });
    });

    //  update project share
    app.post('/setup/projectshares', application.enforceSecure, api.authenticate, async (req: express.Request, res: express.Response) => {
        utils.noCache(res);

        const params = {
            accessToken: req['session']['accessToken'],
            projectId: req.body.projectId,
            userName: req.body.userName,
            permissions: req.body.permissions
        };

        try {
            await api.REST.client.post('/v1/projectshares', params);
            api.REST.sendConditional(res, null);
        } catch (err) {
            api.REST.sendConditional(res, err);
        }
    });

    app.delete('/setup/projectshares', application.enforceSecure, api.authenticate, async (req: express.Request, res: express.Response) => {

        try {
            await api.REST.client.del('/v1/projectshares?userName=' + encodeURIComponent(req.query['userName'] as string) + '&projectId=' + req.query['projectId'] + '&accessToken=' + req['session']['accessToken']);
            api.REST.sendConditional(res, null);
        } catch (err) {
            api.REST.sendConditional(res, err);
        }
    });
}

import utils = require("gator-utils");
import express = require('express');
import api = require('gator-api');
import {IApplication} from "../lib";

/*
 Set up routes - this script handles functions required for managing bookmarks
 */

export async function setup(app: express.Application, application: IApplication): Promise<void> {

    //  show all bookmarks for the current account
    app.get('/setup/bookmarks', application.enforceSecure, api.authenticate, async (req: express.Request, res: express.Response) => {
        utils.noCache(res);

        try {
            const result = await api.REST.client.get('/v1/projects?accessToken=' + req['session']['accessToken']);
            req['session']['projects'] = result.data.projects;
        } catch (err: any) {
            req.flash('error', err.message);
        }

        res.render('bookmarks', {
            settings: utils.config.settings(),
            application: application,
            bookmarks: api.reporting.currentBookmarks(req),
            req: req
        });
    });

    //  create a new bookmark
    app.post('/setup/bookmarks', application.enforceSecure, api.authenticate, async (req: express.Request, res: express.Response) => {

        if (!req.body.name || !req.body.query) {
            api.REST.sendError(res, new api.errors.MissingParameterError('You must specify a name and destination.'));
            return;
        }

        try {
            const result = await api.REST.client.get('/v1/projects?accessToken=' + req['session']['accessToken']);
            req['session']['projects'] = result.data.projects;
        } catch {
            api.REST.sendError(res, new api.errors.InternalError());
            return;
        }

        const bookmarks = api.reporting.currentBookmarks(req);
        bookmarks[req.body.name] = req.body.query;

        const params = {
            accessToken: req['session']['accessToken'],
            projectId: req['session']['currentProjectId'],
            bookmarks: bookmarks
        };

        try {
            await api.REST.client.put('/v1/projects/bookmarks', params);
            api.REST.sendConditional(res, null);
        } catch (err) {
            api.REST.sendConditional(res, err);
        }
    });

    //  delete a bookmark and update the account
    app.delete('/setup/bookmarks', application.enforceSecure, api.authenticate, async (req: express.Request, res: express.Response) => {
        utils.noCache(res);

        try {
            const result = await api.REST.client.get('/v1/projects?accessToken=' + req['session']['accessToken']);
            req['session']['projects'] = result.data.projects;
        } catch {
            api.REST.sendError(res, new api.errors.InternalError());
            return;
        }

        const bookmarks = api.reporting.currentBookmarks(req);
        delete bookmarks[req.query['name'] as string];

        const params = {
            accessToken: req['session']['accessToken'],
            projectId: req['session']['currentProjectId'],
            bookmarks: bookmarks
        };

        try {
            await api.REST.client.put('/v1/projects/bookmarks', params);
            api.REST.sendConditional(res, null);
        } catch (err) {
            api.REST.sendConditional(res, err);
        }
    });
}

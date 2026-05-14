import utils = require("gator-utils");
import express = require('express');
import api = require('gator-api');
import {IApplication} from "../lib";

/*
 Set up routes - this script handles functions required for managing access tokens
 */

export async function setup(app: express.Application, application: IApplication): Promise<void> {

    app.get('/accesstokens', application.enforceSecure, api.authenticate, async (req: express.Request, res: express.Response) => {
        utils.noCache(res);

        const projectFilter = req.query.projectId ? '&projectId=' + req.query.projectId : '';
        let tokens: any[] = [];

        try {
            const result = await api.REST.client.get('/v1/accesstokens?accessToken=' + req['session']['accessToken'] +
                '&type=api' + projectFilter);
            tokens = result.data.accessTokens;
        } catch (err: any) {
            req.flash('error', err.message);
        }

        tokens.forEach(function (token) {

            if (new Date(Date.parse(token.expiration)).getFullYear() > 2900)
                token.expiration = 'N/A';
        });

        res.render('accessTokens', {
            req: req,
            application: application,
            accessTokens: tokens,
            projectId: req.query.projectId || 0,
            projectName: req.query.projectName || ''
        });
    });

    app.post('/accesstokens', application.enforceSecure, api.authenticate, async (req: express.Request, res: express.Response) => {
        utils.noCache(res);

        if (!req.body.expires) {
            req.body.expires = new Date(Date.parse('3000-01-01'));
        }

        const permissions = [];

        if (req.body.pushAccess == 'true')
            permissions.push('push');

        if (req.body.queryAccess == 'true')
            permissions.push('query');

        const params: any = {
            accessToken: req['session']['accessToken'],
            accountId: req['session']['account'].id,
            permissions: permissions,
            expiration: req.body.expires,
            type: 'api'
        };

        if (req.body.projectId)
            params.projectId = req.body.projectId;

        try {
            const result = await api.REST.client.post('/v1/accesstokens', params);
            api.REST.sendConditional(res, null, result);
        } catch (err) {
            api.REST.sendConditional(res, err);
        }
    });

    app.delete('/accesstokens', application.enforceSecure, api.authenticate, async (req: express.Request, res: express.Response) => {
        utils.noCache(res);

        try {
            await api.REST.client.del('/v1/accesstokens/' + req.body['accessToken'] + '?accessToken=' + req['session']['accessToken']);
            api.REST.sendConditional(res, null);
        } catch (err) {
            api.REST.sendConditional(res, err);
        }
    });
}

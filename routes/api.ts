import utils = require("gator-utils");
import express = require('express');
import api = require('gator-api');
import {IApplication} from "../lib";
import {verifyCaptcha} from "../lib/utils";

/*
 Set up routes - this script handles functions required for managing the API
 */

export async function setup(app: express.Application, application: IApplication): Promise<void> {

    //  proxy client api calls to api-host
    app.post('/apiproxy', application.enforceSecure, api.authenticateNoRedirect, async (req: express.Request, res: express.Response) => {

        if (!req.body || !req.body.verb || !req.body.path) {
            api.REST.sendError(res, new api.errors.MissingParameterError());
            return;
        }

        const client = api.sessionClient(req);

        try {
            switch (req.body.verb.toUpperCase()) {

                case 'DEL': {
                    await client.del(req.body.path);
                    api.REST.sendConditional(res, null);
                    break;
                }

                case 'GET': {
                    const result = await client.get(req.body.path);
                    api.REST.sendConditional(res, null, result);
                    break;
                }

                case 'POST': {
                    const result = await client.post(req.body.path, req.body.data);
                    api.REST.sendConditional(res, null, result);
                    break;
                }

                case 'PUT': {
                    const result = await client.put(req.body.path, req.body.data);
                    api.REST.sendConditional(res, null, result);
                    break;
                }

                default:
                    api.REST.sendError(res, new api.errors.BadRequestError('No such verb'));
            }
        } catch (err) {
            api.REST.sendConditional(res, err);
        }
    });

    app.get('/developer/rest/:id', application.enforceSecure, async (req: express.Request, res: express.Response) => {

        const specUrl = utils.config.settings().apiUrl + '/' + utils.config.settings().apiVersion + '/' + req.params['id'] + '.json';
        let spec: any = {};

        try {
            const text = await utils.getUrlText(specUrl);
            spec = JSON.parse(text);
        } catch {
            spec = {};
        }

        if (req.query.env == 'local') {
            spec.host = '127.0.0.5:8080';
            spec.schemes = ['http'];
        }

        res.render('./developer/swagger', {
            req: req,
            application: application,
            dev: utils.config.dev(),
            spec: spec
        });
    });

    app.get('/login', application.enforceSecure, function (req: express.Request, res: express.Response) {

        //  check for a remote login
        if (req.query.accessToken) {
            res.redirect(utils.appendQueryString(application.branding.postLoginUrl, 'accessToken', req.query.accessToken as string));
            return;
        }

        res.render('./api/login', {
            req: req,
            application: application,
            dev: utils.config.dev()
        });
    });

    app.post('/login', application.enforceSecure, async (req: express.Request, res: express.Response) => {
        const remoteAddress = utils.ip.remoteAddress(req);

        try {
            //  specifying the appId will pull the user's account object into the authObject
            const authObject = await api.login(req.body['username'], req.body['password'], application.settings.appId, remoteAddress);
            api.setSessionAuth(req, authObject);
            api.REST.sendConditional(res, null, { accessToken: authObject.accessToken }, 'success');
        } catch (err) {
            api.REST.sendConditional(res, err, null, 'success');
        }
    });

    //  reset password
    app.get('/reset', application.enforceSecure, function (req, res) {
        api.logger.info('GET /reset', req, { ip: utils.ip.remoteAddress(req) });

        res.render('./api/reset', {
            req: req,
            application: application,
            dev: utils.config.dev()
        });
    });

    app.post('/reset', application.enforceSecure, async (req, res) => {

        const verified = await verifyCaptcha(req);

        if (!verified) {
            api.REST.send(res);
            return;
        }

        const remoteAddress = utils.ip.remoteAddress(req);
        api.logger.info('POST /reset', req, { ip: remoteAddress });

        try {
            await api.REST.client.get('/v1/reset/' + application.settings.appId + '/' + req.body.username + '?i=' + remoteAddress);
            api.REST.sendConditional(res, null, null, 'success');
        } catch (err) {
            api.REST.sendConditional(res, err, null, 'success');
        }
    });

    app.get('/reset/change', application.enforceSecure, function (req, res) {
        res.render('./api/resetChange', {
            req: req,
            application: application,
            dev: utils.config.dev()
        });
    });

    app.post('/reset/change', application.enforceSecure, async (req, res) => {

        try {
            await api.REST.client.post('/v1/reset', req.body);
            api.REST.sendConditional(res, null, null, 'success');
        } catch (err) {
            api.REST.sendConditional(res, err, null, 'success');
        }
    });

    app.get('/register', application.enforceSecure, function (req, res) {
        res.render('./api/register', {
            req: req,
            application: application,
            dev: utils.config.dev()
        });
    });

    app.post('/register', application.enforceSecure, async (req, res) => {

        const verified = await verifyCaptcha(req);

        if (!verified) {
            api.REST.sendError(res, 'Cannot verify source');
            return;
        }

        api.logger.info('POST /register', req, { ip: utils.ip.remoteAddress(req) });
        req.body.remoteAddress = utils.ip.remoteAddress(req);

        try {
            const authObject = await api.signup(req.body);
            api.setSessionAuth(req, authObject);
            api.REST.sendConditional(res, null);
        } catch (err) {
            api.REST.sendError(res, err);
        }
    });

    //  handle logout
    app.get('/logout', application.enforceSecure, function (req: any, res) {
        api.logout(req, res);
    });
}

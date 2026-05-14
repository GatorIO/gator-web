import utils = require("gator-utils");
import express = require('express');
import api = require('gator-api');
import {IApplication} from "../lib";

export function getContactParams(req) {
    let items;
    const params: any = req.body;

    if (params.id)
        params.id = +params.id;

    if (params.delayOption == 'immediate')
        delete params.alertDelay;

    params.projectId = req['session'].currentProjectId;
    params.accessToken = req['session'].accessToken;
    params.endpoints = [];

    if (params.emailList) {
        items = params.emailList.split(',');

        for (let e = 0; e < items.length; e++) {
            params.endpoints.push({ type: 'email', value: items[e] });
        }
    }

    if (params.SMSList) {
        items = params.SMSList.split(',');

        for (let e = 0; e < items.length; e++) {
            params.endpoints.push({ type: 'SMS', value: items[e] });
        }
    }

    delete params.emailList;
    delete params.SMSList;

    return params;
}

export async function setup(app: express.Application, application: IApplication): Promise<void> {

    /*
     Contacts
     */

    app.get('/contacttypes', application.enforceSecure, api.authenticate, function (req: express.Request, res: express.Response) {
        res.render('contactTypes', {
            settings: utils.config.settings(),
            application: application,
            dev: utils.config.dev(),
            req: req,
        });
    });

    app.get('/contacts', application.enforceSecure, application.statusCheck, api.authenticate, function (req: any, res) {

        utils.noCache(res);

        res.render('contacts', {
            settings: utils.config.settings(),
            application: application,
            dev: utils.config.dev(),
            req: req
        });
    });

    app.get('/contacts/data', application.enforceSecure, api.authenticate, async (req: any, res) => {

        utils.noCache(res);

        try {
            const result = await api.REST.client.get('/v1/monitoring/contacts?projectId=' + req['session'].currentProjectId + '&accessToken=' + req['session']['accessToken']);
            api.REST.sendConditional(res, null, result ? result.data : []);
        } catch (err) {
            api.REST.sendConditional(res, err, []);
        }
    });

    app.delete('/contacts/:id/', application.enforceSecure, api.authenticate, async (req: express.Request, res: express.Response) => {

        try {
            await api.REST.client.del('/v1/monitoring/contacts/' + req.params['id'] + '?accessToken=' + req['session']['accessToken']);
            api.REST.sendConditional(res, null);
        } catch (err) {
            api.REST.sendConditional(res, err);
        }
    });

    //  create a new contact
    app.post('/contacts', application.enforceSecure, api.authenticate, async (req: express.Request, res: express.Response) => {
        utils.noCache(res);

        const params = getContactParams(req);

        try {
            await api.REST.client.post('/v1/monitoring/contacts', params);
            api.REST.sendConditional(res, null);
        } catch (err) {
            api.REST.sendConditional(res, err);
        }
    });

    //  update an existing contact
    app.put('/contacts', application.enforceSecure, api.authenticate, async (req: express.Request, res: express.Response) => {

        const params = getContactParams(req);

        try {
            await api.REST.client.put('/v1/monitoring/contacts', params);
            api.REST.sendConditional(res, null);
        } catch (err) {
            api.REST.sendConditional(res, err);
        }
    });

    app.get('/contacts/test/:id/', application.enforceSecure, api.authenticate, async (req: express.Request, res: express.Response) => {

        try {
            await api.REST.client.get('/v1/monitoring/contacts/test/' + req.params['id'] + '?accessToken=' + req['session']['accessToken']);
            api.REST.sendConditional(res, null);
        } catch (err) {
            api.REST.sendConditional(res, err);
        }
    });
}

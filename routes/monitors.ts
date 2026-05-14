import utils = require("gator-utils");
import lib = require('../lib/index');
import express = require('express');
import api = require('gator-api');
import dictionaries = require('../lib/dictionaries');
import {IApplication} from "../lib";

export let stationList;

const monitorTypes = dictionaries.MonitorTypes;

export function getMonitorParams(req) {
    const params: any = req.body;

    if (params.id)
        params.id = +params.id;

    params.projectId = req['session'].currentProjectId;

    if (params.stationsOptions == 'select' && params.stations)
        params.stations = params.stations.split(',');
    else
        delete params.stations;

    params.data = {};
    params.accessToken = req['session'].accessToken;

    //  only create data properties relevant to the monitor type
    switch (+req.body.type) {
        case monitorTypes.email:
            params.data.checkExploitsLists = req.body.checkExploitsLists == 'on';
            params.data.checkBlocklists = req.body.checkBlocklists == 'on';
            break;
        case monitorTypes.DNS:
            params.data.recordType = req.body.recordType;
            params.data.expectedValues = req.body.expectedValues;
            break;
        case monitorTypes.website:

            if (req.body.matchPhrase)
                params.data.matchPhrase = req.body.matchPhrase;

            if (req.body.userName)
                params.data.userName = req.body.userName;

            if (req.body.password)
                params.data.password = req.body.password;

            if (req.body.userAgent)
                params.data.userAgent = req.body.userAgent;
            break;
        case monitorTypes.certificate:
            params.data.allowAuthorizationErrors = req.body.allowAuthorizationErrors == 'on';
            params.data.daysLeft = +req.body.daysLeft;
            break;
        case monitorTypes.scoring:
            params.data.minimumScore = +req.body.score;
            break;
        case monitorTypes.performance:
            params.data.timingMinimum = +req.body.timingMinimum;
            break;
        case monitorTypes.portScan:
            params.data.ports = req.body.ports;
            params.interval = req.body.longInterval;
            break;
    }
    return params;
}

export async function getMonitors(req, res, application: IApplication): Promise<void> {
    utils.noCache(res);

    let contacts: any = null;
    let stations: any = null;
    let monitors: any[] = [];

    try {
        const contactsResult = await api.REST.client.get('/v1/monitoring/contacts?projectId=' + req['session'].currentProjectId + '&accessToken=' + req['session']['accessToken']);
        contacts = contactsResult.data;
    } catch {
        res.render('message', {
            settings: utils.config.settings(),
            application: application,
            req: req,
            message: 'An unknown error has occurred.',
            title: 'Error'
        });
        return;
    }

    try {
        const stationsResult = await api.REST.client.get('/v1/monitoring/stations?projectId=' + req['session'].currentProjectId);
        stations = stationsResult.data;

        //  refresh station list
        if (stationsResult && stationsResult.data)
            stationList = stationsResult.data;
    } catch (err: any) {
        req.flash('error', err.message);
    }

    try {
        const monitorsResult = await api.REST.client.get('/v1/monitoring/monitors?projectId=' + req['session'].currentProjectId + '&accessToken=' + req['session']['accessToken']);
        monitors = monitorsResult ? monitorsResult.data : [];
    } catch (err: any) {
        req.flash('error', err.message);
    }

    res.render('monitors', {
        settings: utils.config.settings(),
        application: application,
        dev: utils.config.dev(),
        req: req,
        monitors: monitors,
        monitorTypes: dictionaries.MonitorTypes,
        monitorDescriptions: dictionaries.monitorTypes.codes,
        contacts: contacts,
        stations: stations
    });
}

export async function setup(app: express.Application, application: IApplication): Promise<void> {

    /*
     Monitors
     */

    const statusCheck: any = typeof application.statusCheck == 'function' ? application.statusCheck : lib.statusCheckPlaceholder;

    app.get('/certificates', application.enforceSecure, api.authenticate, statusCheck, async (req: any, res) => {

        utils.noCache(res);

        let stations: any = null;
        let monitors: any[] = [];

        try {
            const stationsResult = await api.REST.client.get('/v1/monitoring/stations?projectId=' + req['session'].currentProjectId);
            stations = stationsResult.data;
        } catch {
            // stations stays null
        }

        try {
            const monitorsResult = await api.REST.client.get('/v1/monitoring/monitors?projectId=' + req['session'].currentProjectId + '&accessToken=' + req['session']['accessToken']);
            monitors = monitorsResult.data || [];
        } catch (err: any) {
            req.flash('error', err.message);
        }

        res.render('certificates', {
            settings: utils.config.settings(),
            application: application,
            dev: utils.config.dev(),
            req: req,
            monitors: monitors,
            stations: stations
        });
    });

    app.get('/monitors', application.enforceSecure, api.authenticate, statusCheck, function (req: any, res) {
        getMonitors(req, res, application);
    });

    app.get('/monitors/types', application.enforceSecure, api.authenticate, statusCheck, function (req: any, res) {

        res.render('monitorTypes', {
            settings: utils.config.settings(),
            application: application,
            dev: utils.config.dev(),
            req: req
        });
    });

    app.get('/monitors/data', application.enforceSecure, api.authenticate, async (req: any, res) => {

        utils.noCache(res);

        try {
            const result = await api.REST.client.get('/v1/monitoring/monitors?projectId=' + req['session'].currentProjectId + '&accessToken=' + req['session']['accessToken']);
            api.REST.sendConditional(res, null, result ? result.data : null);
        } catch (err) {
            api.REST.sendConditional(res, err);
        }
    });

    //  get down monitors
    app.get('/monitors/down/data', application.enforceSecure, api.authenticate, async (req: any, res) => {

        utils.noCache(res);

        try {
            const result = await api.REST.client.get('/v1/monitoring/monitors/down?projectId=' + req['session'].currentProjectId + '&accessToken=' + req['session']['accessToken']);
            api.REST.sendConditional(res, null, result ? result.data : null);
        } catch (err) {
            api.REST.sendConditional(res, err);
        }
    });

    //  create a new monitor
    app.post('/monitors', application.enforceSecure, api.authenticate, async (req: express.Request, res: express.Response) => {
        utils.noCache(res);

        const params = getMonitorParams(req);

        try {
            const result = await api.REST.client.post('/v1/monitoring/monitors', params);
            api.REST.sendConditional(res, null, result);
        } catch (err) {
            api.REST.sendConditional(res, err);
        }
    });

    //  update an existing monitor
    app.put('/monitors', application.enforceSecure, api.authenticate, async (req: express.Request, res: express.Response) => {
        utils.noCache(res);

        const params = getMonitorParams(req);

        try {
            await api.REST.client.put('/v1/monitoring/monitors', params);
            api.REST.sendConditional(res, null);
        } catch (err) {
            api.REST.sendConditional(res, err);
        }
    });

    app.delete('/monitors/:id/', application.enforceSecure, api.authenticate, async (req: express.Request, res: express.Response) => {

        try {
            await api.REST.client.del('/v1/monitoring/monitors/' + req.params['id'] + '?accessToken=' + req['session']['accessToken']);
            api.REST.sendConditional(res, null);
        } catch (err) {
            api.REST.sendConditional(res, err);
        }
    });

    app.get('/monitors/enable/:id/', application.enforceSecure, api.authenticate, async (req: express.Request, res: express.Response) => {

        try {
            await api.REST.client.get('/v1/monitoring/monitors/enable/' + req.params['id'] + '?accessToken=' + req['session']['accessToken']);
            api.REST.sendConditional(res, null);
        } catch (err) {
            api.REST.sendConditional(res, err);
        }
    });

    app.get('/monitors/disable/:id/', application.enforceSecure, api.authenticate, async (req: express.Request, res: express.Response) => {

        try {
            await api.REST.client.get('/v1/monitoring/monitors/disable/' + req.params['id'] + '?accessToken=' + req['session']['accessToken']);
            api.REST.sendConditional(res, null);
        } catch (err) {
            api.REST.sendConditional(res, err);
        }
    });

    app.get('/monitors/test', application.enforceSecure, api.authenticate, async (req: express.Request, res: express.Response) => {
        utils.noCache(res);

        try {
            const result = await api.REST.client.get('/v1/monitoring/monitors/test/' + req.query['monitorId'] + '?accessToken=' + req['session']['accessToken'] + '&stationId=' + req.query['stationId']);
            api.REST.sendConditional(res, null, result);
        } catch (err) {
            api.REST.sendConditional(res, err);
        }
    });

    //  test a url as a website test
    app.get('/test/website', application.enforceSecure, async (req: express.Request, res: express.Response) => {
        utils.noCache(res);

        try {
            const result = await api.REST.client.get('/v1/monitoring/test/website?url=' + encodeURIComponent(req.query['url'] as string) + '&stationId=' + req.query['stationId']);
            api.REST.sendConditional(res, null, result);
        } catch (err) {
            api.REST.sendConditional(res, err);
        }
    });
}

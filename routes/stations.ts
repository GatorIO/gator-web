import utils = require("gator-utils");
import express = require('express');
import api = require('gator-api');
import {IApplication} from "../lib/index";

export async function getStations(req, res, application: IApplication): Promise<void> {

    let stations: any[] = [];

    try {
        const result = await api.REST.client.get('/v1/monitoring/stations');
        stations = result.data || [];
    } catch (err: any) {
        req.flash('error', err.message);
    }

    res.render('stations', {
        settings: utils.config.settings(),
        application: application,
        dev: utils.config.dev(),
        req: req,
        stations: stations
    });
}

export async function setup(app: express.Application, application: IApplication): Promise<void> {

    /*
     Stations
     */

    app.get('/stations', application.enforceSecure, api.authenticate, function (req: any, res) {
        getStations(req, res, application);
    });

    app.get('/stations/data', application.enforceSecure, api.authenticate, async (req: any, res) => {

        utils.noCache(res);

        try {
            const result = await api.REST.client.get('/v1/monitoring/stations');

            //  flatten data for use in UI
            if (result.data) {
                const stations = [];
                const project = api.getProject(req, req['session'].currentProjectId);
                let disabled: any[] = [];

                if (project && project.data && project.data.disabledStations) {
                    disabled = project.data.disabledStations;
                }

                for (const key in result.data) {

                    if (Object.hasOwn(result.data, key)) {
                        const item = result.data[key];
                        item.id = +key;

                        if (disabled.indexOf(+key) > -1)
                            item.disabled = true;

                        stations.push(item);
                    }
                }
                result.data = stations;
            }
            api.REST.sendConditional(res, null, result ? result.data : null);
        } catch (err) {
            api.REST.sendConditional(res, err);
        }
    });

    app.get('/stations/enable/:id/', application.enforceSecure, api.authenticate, async (req: express.Request, res: express.Response) => {

        try {
            await api.REST.client.get('/v1/monitoring/stations/enable/' + req.params['id'] + '?projectId=' + req['session']['currentProjectId'] + '&accessToken=' + req['session']['accessToken']);

            const project = api.getProject(req, req['session']['currentProjectId']);

            if (!project.data)
                project.data = {};

            if (!project.data.disabledStations)
                project.data.disabledStations = [];

            const index = project.data.disabledStations.indexOf(+req.params['id']);

            if (index > -1)
                project.data.disabledStations.splice(index, 1);

            api.REST.sendConditional(res, null);
        } catch (err) {
            api.REST.sendConditional(res, err);
        }
    });

    app.get('/stations/disable/:id/', application.enforceSecure, api.authenticate, async (req: express.Request, res: express.Response) => {

        try {
            await api.REST.client.get('/v1/monitoring/stations/disable/' + req.params['id'] + '?projectId=' + req['session']['currentProjectId'] + '&accessToken=' + req['session']['accessToken']);

            const project = api.getProject(req, req['session']['currentProjectId']);

            if (!project.data)
                project.data = {};

            if (!project.data.disabledStations)
                project.data.disabledStations = [];

            project.data.disabledStations.push(+req.params['id']);

            api.REST.sendConditional(res, null);
        } catch (err) {
            api.REST.sendConditional(res, err);
        }
    });
}

import utils = require("gator-utils");
import express = require('express');
import api = require('gator-api');
import lib = require('../lib/index');
import {IApplication} from "../lib";

const fs = require('fs');
const os = require('os');

/*
 Set up routes - this script handles functions required reporting
 */

function getEndpoint(query?): string {
    let endpoint = '';

    if (query && query.appId) {
        endpoint = api.applications.items[+query.appId].reporting.apiEndpoint;
    } else {
        endpoint = api.applications.items[utils.config.settings().appId].reporting.apiEndpoint;
    }

    //  standardize endpoints with / at end
    if (endpoint.substr(endpoint.length - 1, 1) != '/') {
        endpoint += '/';
    }
    return endpoint;
}

export async function getReport(application, req, res): Promise<void> {

    /*
     The id query string param is the report id in application.reports:  /report?id=log

     The options query string param is the customized version of the definition.  Its values take priority
     over the definition.

     To get the options:
     -   Get report definition from the id param, if it exists
     -   Override the report definition from the options.id param, if it exists
     -   Override the report definition options from the options param

     */

    let definition;
    let qsOptions;

    try {
        qsOptions = req.query.options ? JSON.parse(req.query.options) : {};
    } catch {
        qsOptions = {};
    }

    const id = qsOptions.id || req.query.id;        //  there should not be two ids, but if there is, use the one in options

    //  get report definition
    if (id) {
        if (utils.isNumeric(id))
            definition = application.reports.definitions[+id];
        else
            definition = application.reports.definitions[application.reports.Types[id]];

        if (!definition) {
            res.render('message', {
                title: 'Error',
                message: 'No such report',
                settings: utils.config.settings(),
                application: application,
                dev: utils.config.dev(),
                req: req
            });
            return;
        }

        //  got to clone it so it is not modified elsewhere
        definition = utils.clone(definition);

        definition.initialState = definition.initialState || {};
        definition.initialState.id = id;
    } else {
        //  default definition
        definition = {
            settings: {
                renderView: 'report'
            },
            initialState: {}
        };

        //  fix up existing settings - this is to support prior formats
        if (qsOptions.entity || qsOptions.view)     //  view is legacy format
            definition.settings.entity = qsOptions.entity || qsOptions.view;

        if (qsOptions.renderView)
            definition.settings.renderView = qsOptions.renderView;

        if (qsOptions.title)
            definition.settings.title = qsOptions.title;

        if (Object.hasOwn(qsOptions, 'isLog'))
            definition.settings.isLog = qsOptions.isLog;

        if (!definition.settings.intervals)
            definition.settings.intervals = application.reports['intervals'];

        if (!definition.settings.ranges)
            definition.settings.ranges = application.reports['ranges'];
    }

    if (!definition.settings.entity) {
        res.render('message', {
            title: 'Error',
            message: 'No data entity specified for report',
            settings: utils.config.settings(),
            application: application,
            dev: utils.config.dev(),
            req: req
        });
        return;
    }

    //  call functions for dynamic settings
    if (typeof definition.initialState.filter == 'function')
        definition.initialState.filter = definition.initialState.filter(application, req);

    if (typeof definition.initialState.match == 'function')
        definition.initialState.match = definition.initialState.match(application, req);

    //  override options from definition with query string params
    if (req.query.options) {

        for (const key in qsOptions) {

            if (Object.hasOwn(qsOptions, key))
                definition.initialState[key] = qsOptions[key];
        }
    }

    let project: any = api.currentProject(req);

    if (!project)
        project = {};

    if (!project.data)
        project.data = {};

    if (!project.data.attributes)
        project.data.attributes = {};

    const customAttribs = project.data.attributes;

    const isLog = definition.settings.renderView == 'log';

    const metricOptions = api.reporting.getAttributeOptions(definition.settings.entity, api.reporting.AttributeTypes.metrics, customAttribs, isLog);
    const elementOptions = api.reporting.getAttributeOptions(definition.settings.entity, api.reporting.AttributeTypes.elements, customAttribs, isLog);
    const filterOptions = api.reporting.getFilterOptions(definition.settings.entity, customAttribs, isLog);
    const attribOptions = api.reporting.getAttributeOptions(definition.settings.entity, api.reporting.AttributeTypes.all, customAttribs, isLog);

    utils.noCache(res);

    //  any route that requires segments should call this first
    try {
        await api.reporting.getSegments(req, false, definition.appId);
    } catch (err: any) {
        req.flash('error', err.message);
    }

    const renderView = definition.settings.renderView;

    res.render(renderView || 'report', {
        settings: utils.config.settings(),
        application: application,
        dev: utils.config.dev(),
        req: req,
        definition: definition,
        segmentOptions: api.reporting.getSegmentOptions(req),
        metricOptions: metricOptions,
        elementOptions: elementOptions,
        filterOptions: filterOptions,
        attribOptions: attribOptions
    });
}

export async function setup(app: express.Application, application: IApplication): Promise<void> {

    const statusCheck: any = typeof application.statusCheck == 'function' ? application.statusCheck : lib.statusCheckPlaceholder;

    app.post('/query', application.enforceSecure, api.authenticateNoRedirect, async (req: express.Request, res: express.Response) => {

        //  This function manually checks auth status in order to send the proper status to the client ajax call.
        if (!req['session']) {
            api.REST.sendError(res, new api.errors.AuthenticationTimeoutError('Your session has timed out.'));
            return;
        }

        const params: any = {
            accessToken: req['session']['accessToken'],
            query: req.body,
            clientIP: utils.ip.remoteAddress(req),
            clientUA: req.header('user-agent')
        };

        //  support change from 'view' to 'entity'
        if (params.query && params.query.view) {
            params.query.entity = params.query.view;
            delete params.query.view;
        }

        const path = getEndpoint(params.query) + 'query';

        try {
            const result = await api.REST.client.post(path, params);
            api.REST.sendConditional(res, null, result ? result.data : null);
        } catch (err) {
            api.logger.error('Reporting query client error', err, path, params.query);
            api.REST.sendError(res, err);
        }
    });

    //  typeahead support
    app.get('/search', application.enforceSecure, api.authenticateNoRedirect, async (req: express.Request, res: express.Response) => {

        //  This function manually checks auth status in order to send the proper status to the client ajax call.
        if (!req['session']) {
            api.REST.sendError(res, new api.errors.AuthenticationTimeoutError('Your session has timed out.'));
            return;
        }

        try {
            const result = await api.REST.client.get(getEndpoint() + 'attributes/search?accessToken=' + req['session']['accessToken'] + '&attribute=' + encodeURIComponent(req.query.attribute as string) + '&projectId=' + req.query.projectId + '&value=' + encodeURIComponent(req.query.value as string));
            res.json(result || []);
        } catch {
            res.json([]);
        }
    });

    app.get('/report', application.enforceSecure, api.authenticate, statusCheck, function (req: express.Request, res: express.Response) {
        getReport(application, req, res);
    });

    async function exportData(req: express.Request, res: express.Response): Promise<void> {

        const params: any = {
            accessToken: req['session']['accessToken'],
            query: JSON.parse(req.query.query as string)
        };

        params.query.format = req.query.format;
        params.query.limit = 200;       //  keep this at 200 - higher leads to server slowness

        res.attachment('data.' + req.query.format);

        let cycles = 0;
        const path = getEndpoint(params.query) + 'query';

        try {

            while (true) {

                if (cycles++ >= 1000000) {
                    res.write('ERROR: Too many rows to download.  The limit is ' + (cycles * params.query.limit));
                    res.end();
                    return;
                }

                let result: any;

                try {
                    result = await api.REST.client.post(path, params);
                } catch (err: any) {
                    res.write('ERROR: ' + err.message);
                    res.end();
                    return;
                }

                //  no headers after first chunk
                params.query.dataOnly = true;

                if (result && result.code == 200) {

                    if (req.query.format == 'csv') {

                        if (result.data.csv)
                            res.write(result.data.csv);
                        else
                            res.write('');

                    } else {
                        const chunk = JSON.stringify(result.data.rows);

                        //  on first chunk, write the array start
                        if (cycles == 1)
                            res.write('[');

                        res.write(chunk.substr(1, chunk.length - 2));

                        //  write end array if last chunk, or comma if more
                        if (result.data.nextClause)
                            res.write(',');
                        else
                            res.write(']');
                    }

                    //  add filter to continue after where the last chunk ended
                    if (result.data.nextClause) {
                        params.query.nextClause = result.data.nextClause;
                    } else {

                        //  all data has been sent
                        res.end();
                        return;
                    }
                } else {
                    res.write('ERROR: ' + JSON.stringify(result));
                    res.end();
                    return;
                }
            }
        } catch (err) {
            api.logger.error('In download', err, req);
        }
    }

    function exportPDF(req: express.Request, res: express.Response): void {

        let phantomBin = 'phantomjs';
        const file = utils.guid() + '.pdf';

        const exec = require('child_process').exec;

        if (os.platform().substr(0, 3) == 'win') {
            phantomBin = '"../node_modules/gator-web/bin/phantomjs-win"';
        }

        let reportUrl = application.current.consoleHost;

        if (utils.config.dev())
            reportUrl = application.settings.nodeUrl;

        reportUrl += '/report?format=pdf&accessToken=' + req['session']['accessToken'] + '&options=' + encodeURIComponent(req.query.options as string);

        exec('cd phantomjs && ' + phantomBin + ' --ignore-ssl-errors=yes ../node_modules/gator-web/lib/renderpdf.js "' + reportUrl + '" ' + file,
            (err) => {

                if (err !== null) {
                    api.logger.error(err, "PDF download", req);
                    res.end("Internal error");
                } else {
                    res.download('phantomjs/' + file, 'report.pdf', function (err) {

                        try {

                            if (err) {
                                api.logger.error(err, "PDF download", req);
                                res.end("Internal error");
                            } else {
                                const stat = fs.statSync('phantomjs/' + file);

                                if (stat.isFile())
                                    fs.unlink('phantomjs/' + file);
                            }
                        } catch { }
                    });
                }
            }
        );
    }

    app.get('/download', application.enforceSecure, api.authenticate, async (req: express.Request, res: express.Response) => {

        try {

            switch (req.query.format) {
                case 'csv':
                case 'json':
                    await exportData(req, res);
                    break;

                case 'pdf':
                    exportPDF(req, res);
                    break;

                default:
                    res.write('ERROR: No format');
                    res.end();
            }
        } catch (err) {
            api.logger.error(err, "/download", req);
            res.end("Internal error");
        }
    });

    app.get('/visualizations/badtraffic', application.enforceSecure, api.authenticate, statusCheck, async (req: express.Request, res: express.Response) => {
        utils.noCache(res);

        try {
            await api.reporting.getSegments(req, false, req.query.appId as any);
        } catch (err: any) {
            req.flash('error', err.message);
        }

        res.render('badTraffic', {
            settings: utils.config.settings(),
            application: application,
            dev: utils.config.dev(),
            req: req
        });
    });

    app.get('/person/profile', application.enforceSecure, api.authenticate, statusCheck, async (req: express.Request, res: express.Response) => {
        utils.noCache(res);

        const params: any = {
            accessToken: req['session']['accessToken'],
            projectId: req['session']['currentProjectId']
        };

        if (!req.query.person) {

            res.render('profile', {
                params: params,
                summary: null,
                sessions: null,
                events: null,
                latestSession: null,
                personData: null,
                application: application,
                req: req
            });
            return;
        }

        params.personId = req.query.person;
        params.days = req.query.days || 30;

        let result: any = null;

        try {
            result = await api.REST.client.post('/v1/analytics/person/profile', params);
        } catch (err: any) {
            req.flash('error', err.message);
        }

        if (!result)
            req.flash('error', 'Internal error');
        else if (result.code != 200 || !result.data)
            req.flash('error', result.message || 'Internal error');

        res.render('profile', {
            params: params,
            application: application,
            personData: result && result.data && result.data.personData ? result.data.personData : null,
            summary: result && result.data && result.data.summary && result.data.summary.rows ? result.data.summary.rows[0] || [] : [],
            sessions: result && result.data && result.data.sessions && result.data.sessions.rows ? result.data.sessions.rows : [],
            events: result && result.data && result.data.events && result.data.events.rows ? result.data.events.rows : [],
            latestSession: result && result.data && result.data.latestSession && result.data.latestSession.rows ? result.data.latestSession.rows[0] || [] : [],
            req: req
        });
    });

    app.get('/formatoptions', application.enforceSecure, api.authenticate, function (req: express.Request, res: express.Response) {
        utils.noCache(res);

        res.render('formatOptions', {
            settings: utils.config.settings(),
            application: application,
            req: req
        });
    });
}

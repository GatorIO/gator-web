/// <reference path="../typings/node/node.d.ts" />
/// <reference path="../typings/gator-utils/gator-utils.d.ts" />
/// <reference path="../typings/gator-api/gator-api.d.ts" />
/// <reference path="../typings/express/express.d.ts" />
/// <reference path="../typings/connect-flash/connect-flash.d.ts" />
/// <reference path="../typings/restify/restify.d.ts" />
import restify = require('restify');
import utils = require("gator-utils");
import express = require('express');
import api = require('gator-api');
import projectRoutes = require('./projects');
import lib = require('../lib/index');
var http = require('http');
var fs = require('fs');
var os = require('os');
import {IApplication} from "gator-web";

/*
 Set up routes - this script handles functions required reporting
 */

function getEndpoint(appId: number): string {

    if (typeof appId != 'undefined') {
        return api.applications.items[+appId].reporting.apiEndpoint;
    } else {
        return api.applications.items[api.reporting.defaultAppId].reporting.apiEndpoint;
    }
}

export function setup(app: express.Application, application: IApplication, callback) {

    var statusCheck: any = typeof application.statusCheck == 'function' ? application.statusCheck : lib.statusCheckPlaceholder;

    app.post('/query', application.enforceSecure, api.authenticateNoRedirect, function (req: express.Request, res: express.Response) {

        //  This function manually checks auth status in order to send the proper status to the client ajax call.
        if (!req['session']) {
            api.REST.sendError(res, new api.errors.AuthenticationTimeoutError('Your session has timed out.'));
            return;
        }

        var endpoint, params = {
            accessToken: req['session'].accessToken,
            query: req.body
        };

        api.REST.client.post(getEndpoint(req.body.appId) + 'query', params, function(err, apiRequest: restify.Request, apiResponse: restify.Response, result: any) {
            api.REST.sendConditional(res, err, result ? result.data : null);
        });
    });

    //  typeahead support
    app.get('/search', application.enforceSecure, api.authenticateNoRedirect, function (req: express.Request, res: express.Response) {

        //  This function manually checks auth status in order to send the proper status to the client ajax call.
        if (!req['session']) {
            api.REST.sendError(res, new api.errors.AuthenticationTimeoutError('Your session has timed out.'));
            return;
        }

        api.REST.client.get(getEndpoint(req.query.appId) + 'attributes/search?accessToken=' + req['session'].accessToken + '&attribute=' + encodeURIComponent(req.query.attribute) + '&projectId=' + req.query.projectId + '&value=' + encodeURIComponent(req.query.value), function(err, apiRequest: restify.Request, apiResponse: restify.Response, result: any) {
            res.json(result || []);
        });
    });

    app.get('/report', application.enforceSecure, api.authenticate, statusCheck, function (req: express.Request, res: express.Response) {

        //  if trying to run a report with no projects, redirect to the new login destination
        if (!req['session'].projects || utils.empty(req['session'].projects)) {
            res.redirect(application.branding.postSignupUrl);
            return;
        }

        /*
         The id query string param is the report id in application.reports:  /report?id=log

         The options query string param is the customized version of the definition.  Its values take priority
         over the definition.

         To get the options:
         -   Get report definition from the id param, if it exists
         -   Override the report definition from the options.id param, if it exists
         -   Override the report definition options from the options param

         */

        var definition, qsOptions, metricOptions, elementOptions, filterOptions, attribOptions, id;

        qsOptions = req.query.options ? JSON.parse(req.query.options) : {};
        id = qsOptions.id || req.query.id;        //  there should not be two ids, but if there is, use the one in options

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
                    view: 'sessions',
                    renderView: 'report'
                },
                initialState: {}
            };

            //  fix up existing settings - this is to support prior formats
            if (qsOptions.view)
                definition.settings.view = qsOptions.view;

            if (qsOptions.renderView)
                definition.settings.renderView = qsOptions.renderView;

            if (qsOptions.title)
                definition.settings.title = qsOptions.title;

            if (qsOptions.hasOwnProperty('isLog'))
                definition.settings.isLog = qsOptions.isLog;

            if (!definition.settings.intervals)
                definition.settings.intervals = application.reports['intervals'];

            if (!definition.settings.ranges)
                definition.settings.ranges = application.reports['ranges'];

        }

        //  override options from definition with query string params
        if (req.query.options) {

            for (let key in qsOptions) {

                if (qsOptions.hasOwnProperty(key))
                    definition.initialState[key] = qsOptions[key];
            }
        }

        var project: any = api.currentProject(req);

        if (!project)
            project = {};

        if (!project.data)
            project.data = {};

        if (!project.data.attributes)
            project.data.attributes = {};

        var customAttribs = project.data.attributes;

        var isLog = definition.settings.renderView == 'log';

        metricOptions = api.reporting.getAttributeOptions(definition.settings.view, api.reporting.AttributeTypes.metrics, customAttribs, isLog, definition.settings.appId);
        elementOptions = api.reporting.getAttributeOptions(definition.settings.view, api.reporting.AttributeTypes.elements, customAttribs, isLog, definition.settings.appId);
        filterOptions = api.reporting.getFilterOptions(definition.settings.view, customAttribs, isLog, definition.settings.appId);
        attribOptions = api.reporting.getAttributeOptions(definition.settings.view, api.reporting.AttributeTypes.all, customAttribs, isLog, definition.settings.appId);

        utils.noCache(res);

        //  any route that requires segments should call this first
        api.reporting.getSegments(req, false, definition.appId, function(err) {

            if (err)
                req.flash('error', err.message);

            res.render(definition.settings.renderView || 'report', {
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
        });
    });

    function exportCSV(req: express.Request, res: express.Response) {

        var params = {
            accessToken: req['session'].accessToken,
            query: JSON.parse(req.query.query)
        };

        params.query.format = req.query.format;
        params.query.limit = 1000;

        res.attachment('data.' + req.query.format);

        var cycles = 0, running: boolean = false;

        var interval = setInterval(function() {

            //  if this somehow gets into a loop that is too big, close it
            if (cycles++ >= 100000) {
                res.write('ERROR: Too many rows to download.  The limit is ' + (cycles * params.query.limit));
                res.end();
                clearInterval(interval);
                return;
            }

            if (running)
                return;

            running = true;

            api.REST.client.post(getEndpoint(req.query.appId) + 'query', params, function(err, apiRequest: restify.Request, apiResponse: restify.Response, result: any) {

                if (err) {
                    clearInterval(interval);
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
                        res.json(result.data);
                    }

                    //  add filter to continue after where the last chunk ended
                    if (result.data.nextClause) {
                        params.query.nextClause = result.data.nextClause;
                    } else {

                        //  all data has been sent
                        res.end();
                        clearInterval(interval);
                    }

                    running = false;

                } else {
                    res.write('ERROR: ' + JSON.stringify(result));
                    res.end();
                    clearInterval(interval);
                }
            });
        }, 50);
    }

    function exportPDF(req: express.Request, res: express.Response) {

        var phantomBin = 'phantomjs', dest = 'data.' + req.query.format, file = utils.guid() + '.pdf';

        const exec = require('child_process').exec;

        if (os.platform().substr(0, 3) == 'win') {
            phantomBin = '"../node_modules/gator-web/bin/phantomjs-win"'
        }

        var reportUrl = 'https://' + application.settings.domain;

        if (utils.config.dev())
            reportUrl = application.settings.nodeUrl;

        reportUrl += '/report?format=pdf&accessToken=' + req['session'].accessToken + '&options=' + encodeURIComponent(req.query.options);

        const child = exec('cd phantomjs && ' + phantomBin + ' --ignore-ssl-errors=yes ../node_modules/gator-web/lib/renderpdf.js "' + reportUrl + '" ' + file,
            (err, stdout, stderr) => {

                if (err !== null) {
                    api.log(err, "PDF download");
                    res.end("Internal error - " + err.message);
                } else {
                    res.download('phantomjs/' + file, 'report.pdf', function(err) {

                        try {

                            if (err)
                                res.end("Internal error - " + err.message);
                            else {
                                var stat = fs.statSync('phantomjs/' + file);

                                if (stat.isFile())
                                    fs.unlink('phantomjs/' + file);
                            }
                        } catch(err) {}
                    });
                }
            }
        );
    }

    app.get('/download', application.enforceSecure, api.authenticate, function (req: express.Request, res: express.Response) {

        switch (req.query.format) {
            case 'csv':
                exportCSV(req, res);
                break;

            case 'pdf':
                exportPDF(req, res);
                break;

            default:
                res.write('ERROR: No format');
                res.end();
        }
    });

    app.get('/visualizations/badtraffic', application.enforceSecure, api.authenticate, statusCheck, function (req: express.Request, res: express.Response) {
        utils.noCache(res);

        //  any route that requires segments should call this first
        api.reporting.getSegments(req, false, req.query.appId, function(err) {

            if (err)
                req.flash('error', err.message);

            res.render('badTraffic', {
                settings: utils.config.settings(),
                application: application,
                dev: utils.config.dev(),
                req: req
            });
        });
    });

    app.get('/person/profile', application.enforceSecure, api.authenticate, statusCheck, function (req: express.Request, res: express.Response) {
        utils.noCache(res);

        var params = {
            accessToken: req['session'].accessToken,
            projectId: req['session'].currentProjectId
        };

        if (req.query.person) {
            params['personId'] = req.query.person;
            params['days'] = req.query.days || 30;

            api.REST.client.post('/v1/analytics/person/profile', params, function(err, apiRequest: restify.Request, apiResponse: restify.Response, result: any) {

                if (!result)
                    req.flash('error', 'Internal error');
                else if (result.code != 200 || !result.data)
                    req.flash('error', result.message || 'Internal error');

                res.render('profile', {
                    params: params,
                    application: application,
                    personData: result.data && result.data.personData ? result.data.personData : null,
                    summary: result.data && result.data.summary && result.data.summary.rows ? result.data.summary.rows[0] : [],
                    sessions: result.data && result.data.sessions && result.data.sessions.rows ? result.data.sessions.rows : [],
                    events: result.data && result.data.events && result.data.events.rows ? result.data.events.rows : [],
                    latestSession: result.data && result.data.latestSession && result.data.latestSession.rows ? result.data.latestSession.rows[0] : [],
                    req: req
                });
            });
        } else {

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
        }
    });

    app.get('/formatoptions', application.enforceSecure, api.authenticate, function (req: express.Request, res: express.Response) {
        utils.noCache(res);

        res.render('formatOptions', {
            settings: utils.config.settings(),
            application: application,
            req: req
        });
    });

    callback();
}


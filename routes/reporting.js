"use strict";
var utils = require("gator-utils");
var api = require('gator-api');
var lib = require('../lib/index');
var http = require('http');
var fs = require('fs');
var os = require('os');
function getEndpoint() {
    return api.applications.items[utils.config.settings().appId].reporting.apiEndpoint;
}
function getReport(application, req, res) {
    if (utils.config.settings().appId != 2) {
        if (!req['session'].projects || utils.empty(req['session'].projects)) {
            res.redirect(application.branding.postSignupUrl);
            return;
        }
    }
    var definition, qsOptions, metricOptions, elementOptions, filterOptions, attribOptions, id;
    qsOptions = req.query.options ? JSON.parse(req.query.options) : {};
    id = qsOptions.id || req.query.id;
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
        definition = utils.clone(definition);
        definition.initialState = definition.initialState || {};
        definition.initialState.id = id;
    }
    else {
        definition = {
            settings: {
                renderView: 'report'
            },
            initialState: {}
        };
        if (qsOptions.entity)
            definition.settings.entity = qsOptions.entity;
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
    if (req.query.options) {
        for (var key in qsOptions) {
            if (qsOptions.hasOwnProperty(key))
                definition.initialState[key] = qsOptions[key];
        }
    }
    var project = api.currentProject(req);
    if (!project)
        project = {};
    if (!project.data)
        project.data = {};
    if (!project.data.attributes)
        project.data.attributes = {};
    var customAttribs = project.data.attributes;
    var isLog = definition.settings.renderView == 'log';
    metricOptions = api.reporting.getAttributeOptions(definition.settings.entity, api.reporting.AttributeTypes.metrics, customAttribs, isLog, definition.settings.appId);
    elementOptions = api.reporting.getAttributeOptions(definition.settings.entity, api.reporting.AttributeTypes.elements, customAttribs, isLog, definition.settings.appId);
    filterOptions = api.reporting.getFilterOptions(definition.settings.entity, customAttribs, isLog, definition.settings.appId);
    attribOptions = api.reporting.getAttributeOptions(definition.settings.entity, api.reporting.AttributeTypes.all, customAttribs, isLog, definition.settings.appId);
    utils.noCache(res);
    api.reporting.getSegments(req, false, definition.appId, function (err) {
        if (err)
            req.flash('error', err.message);
        var renderView = definition.settings.renderView;
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
    });
}
exports.getReport = getReport;
function setup(app, application, callback) {
    var statusCheck = typeof application.statusCheck == 'function' ? application.statusCheck : lib.statusCheckPlaceholder;
    app.post('/query', application.enforceSecure, api.authenticateNoRedirect, function (req, res) {
        if (!req['session']) {
            api.REST.sendError(res, new api.errors.AuthenticationTimeoutError('Your session has timed out.'));
            return;
        }
        var endpoint, params = {
            accessToken: req['session'].accessToken,
            query: req.body
        };
        api.REST.client.post(getEndpoint() + 'query', params, function (err, apiRequest, apiResponse, result) {
            api.REST.sendConditional(res, err, result ? result.data : null);
        });
    });
    app.get('/search', application.enforceSecure, api.authenticateNoRedirect, function (req, res) {
        if (!req['session']) {
            api.REST.sendError(res, new api.errors.AuthenticationTimeoutError('Your session has timed out.'));
            return;
        }
        api.REST.client.get(getEndpoint() + 'attributes/search?accessToken=' + req['session'].accessToken + '&attribute=' + encodeURIComponent(req.query.attribute) + '&projectId=' + req.query.projectId + '&value=' + encodeURIComponent(req.query.value), function (err, apiRequest, apiResponse, result) {
            res.json(result || []);
        });
    });
    app.get('/report', application.enforceSecure, api.authenticate, statusCheck, function (req, res) {
        getReport(application, req, res);
    });
    function exportCSV(req, res) {
        var params = {
            accessToken: req['session'].accessToken,
            query: JSON.parse(req.query.query)
        };
        params.query.format = req.query.format;
        params.query.limit = 1000;
        res.attachment('data.' + req.query.format);
        var cycles = 0, running = false;
        var interval = setInterval(function () {
            if (cycles++ >= 100000) {
                res.write('ERROR: Too many rows to download.  The limit is ' + (cycles * params.query.limit));
                res.end();
                clearInterval(interval);
                return;
            }
            if (running)
                return;
            running = true;
            api.REST.client.post(getEndpoint() + 'query', params, function (err, apiRequest, apiResponse, result) {
                if (err) {
                    clearInterval(interval);
                    res.write('ERROR: ' + err.message);
                    res.end();
                    return;
                }
                params.query.dataOnly = true;
                if (result && result.code == 200) {
                    if (req.query.format == 'csv') {
                        if (result.data.csv)
                            res.write(result.data.csv);
                        else
                            res.write('');
                    }
                    else {
                        res.json(result.data);
                    }
                    if (result.data.nextClause) {
                        params.query.nextClause = result.data.nextClause;
                    }
                    else {
                        res.end();
                        clearInterval(interval);
                    }
                    running = false;
                }
                else {
                    res.write('ERROR: ' + JSON.stringify(result));
                    res.end();
                    clearInterval(interval);
                }
            });
        }, 50);
    }
    function exportPDF(req, res) {
        var phantomBin = 'phantomjs', dest = 'data.' + req.query.format, file = utils.guid() + '.pdf';
        var exec = require('child_process').exec;
        if (os.platform().substr(0, 3) == 'win') {
            phantomBin = '"../node_modules/gator-web/bin/phantomjs-win"';
        }
        var reportUrl = application.current.consoleHost;
        if (utils.config.dev())
            reportUrl = application.settings.nodeUrl;
        reportUrl += '/report?format=pdf&accessToken=' + req['session'].accessToken + '&options=' + encodeURIComponent(req.query.options);
        var child = exec('cd phantomjs && ' + phantomBin + ' --ignore-ssl-errors=yes ../node_modules/gator-web/lib/renderpdf.js "' + reportUrl + '" ' + file, function (err, stdout, stderr) {
            if (err !== null) {
                api.log(err, "PDF download");
                res.end("Internal error");
            }
            else {
                res.download('phantomjs/' + file, 'report.pdf', function (err) {
                    try {
                        if (err) {
                            api.log(err, "PDF download");
                            res.end("Internal error");
                        }
                        else {
                            var stat = fs.statSync('phantomjs/' + file);
                            if (stat.isFile())
                                fs.unlink('phantomjs/' + file);
                        }
                    }
                    catch (err) { }
                });
            }
        });
    }
    app.get('/download', application.enforceSecure, api.authenticate, function (req, res) {
        try {
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
        }
        catch (err) {
            api.log(err, "/download");
            res.end("Internal error");
        }
    });
    app.get('/visualizations/badtraffic', application.enforceSecure, api.authenticate, statusCheck, function (req, res) {
        utils.noCache(res);
        api.reporting.getSegments(req, false, req.query.appId, function (err) {
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
    app.get('/person/profile', application.enforceSecure, api.authenticate, statusCheck, function (req, res) {
        utils.noCache(res);
        var params = {
            accessToken: req['session'].accessToken,
            projectId: req['session'].currentProjectId
        };
        if (req.query.person) {
            params['personId'] = req.query.person;
            params['days'] = req.query.days || 30;
            api.REST.client.post('/v1/analytics/person/profile', params, function (err, apiRequest, apiResponse, result) {
                if (!result)
                    req.flash('error', 'Internal error');
                else if (result.code != 200 || !result.data)
                    req.flash('error', result.message || 'Internal error');
                res.render('profile', {
                    params: params,
                    application: application,
                    personData: result.data && result.data.personData ? result.data.personData : null,
                    summary: result.data && result.data.summary && result.data.summary.rows ? result.data.summary.rows[0] || [] : [],
                    sessions: result.data && result.data.sessions && result.data.sessions.rows ? result.data.sessions.rows : [],
                    events: result.data && result.data.events && result.data.events.rows ? result.data.events.rows : [],
                    latestSession: result.data && result.data.latestSession && result.data.latestSession.rows ? result.data.latestSession.rows[0] || [] : [],
                    req: req
                });
            });
        }
        else {
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
    app.get('/formatoptions', application.enforceSecure, api.authenticate, function (req, res) {
        utils.noCache(res);
        res.render('formatOptions', {
            settings: utils.config.settings(),
            application: application,
            req: req
        });
    });
    callback();
}
exports.setup = setup;
//# sourceMappingURL=reporting.js.map
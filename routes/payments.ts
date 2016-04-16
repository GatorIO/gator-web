/// <reference path="../typings/node/node.d.ts" />
/// <reference path="../typings/gator-utils/gator-utils.d.ts" />
/// <reference path="../typings/gator-api/gator-api.d.ts" />
/// <reference path="../typings/express/express.d.ts" />
/// <reference path="../typings/connect-flash/connect-flash.d.ts" />
import utils = require("gator-utils");
import express = require('express');
import restify = require('restify');
import api = require('gator-api');
import {IApplication} from "gator-web";

/*
 Set up routes - this script handles functions required for managing payments
 */

export function setup(app: express.Application, application: IApplication, callback) {

    app.get('/billing/paymentmethods', api.authenticate, application.enforceSecure, function (req: express.Request, res: express.Response) {

        var cards = [];

        api.REST.client.get('/v1/payments/methods?accessToken=' + req['session'].accessToken, function(err, apiRequest, apiResponse, result) {

            if (result && result.data)
                cards = result.data.cards;

            //  if there are no payment methods already, go straight to entry form
            if (!cards || cards.length == 0) {
                res.redirect('/billing/paymentmethods/form');
            } else {

                res.render('paymentMethods', {
                    settings: utils.config.settings(),
                    application: application,
                    req: req,
                    cards: cards,
                    customer: result.data.customer
                });
            }
        });
    });

    app.get('/billing/paymentmethods/form', api.authenticate, application.enforceSecure, function (req: express.Request, res: express.Response) {

        res.render('paymentMethodsForm', {
            settings: utils.config.settings(),
            application: application,
            req: req,
            publishableKey: application.current['publishableKey']
        });
    });

    app.post('/billing/paymentmethods/form', api.authenticate, application.enforceSecure, function (req: express.Request, res: express.Response) {

        var params = {
            accessToken: req['session'].accessToken,
            stripeToken: req.body.stripeToken
        };

        api.REST.client.post('/v1/payments/methods', params, function(err, apiRequest, apiResponse, result) {

            if (!err) {
                res.redirect('/billing/paymentmethods');
            } else {

                if (err)
                    req.flash('error', err.message);

                res.render('paymentMethodsForm', {
                    settings: utils.config.settings(),
                    application: application,
                    req: req,
                    publishableKey: application.current['publishableKey']
                });
            }
        });
    });

    app.delete('/billing/paymentmethods', api.authenticate, application.enforceSecure, function (req: express.Request, res: express.Response) {

        api.REST.client.del('/v1/payments/methods/' + req.body['id'] + '?accessToken=' + req['session']['accessToken'], function(err, apiRequest: restify.Request, apiResponse: restify.Response) {
            api.REST.sendConditional(res, err);
        });
    });

    app.put('/billing/paymentmethods/primary', api.authenticate, application.enforceSecure, function (req: express.Request, res: express.Response) {

        var params = {
            accessToken: req['session'].accessToken,
            id: req.body['id']
        };

        api.REST.client.put('/v1/payments/methods/primary', params, function(err, apiRequest: restify.Request, apiResponse: restify.Response) {
            api.REST.sendConditional(res, err);
        });
    });

    app.get('/billing/payments', api.authenticate, application.enforceSecure, function (req: express.Request, res: express.Response) {

        var payments = [];

        api.REST.client.get('/v1/payments?accessToken=' + req['session'].accessToken, function(err, apiRequest, apiResponse, result) {

            if (result && result.data)
                payments = result.data.payments;

            res.render('payments', {
                settings: utils.config.settings(),
                application: application,
                req: req,
                payments: payments
            });
        });
    });

    app.get('/billing/prepay', api.authenticate, application.enforceSecure, function (req: express.Request, res: express.Response) {

        var cards = [];

        api.REST.client.get('/v1/payments/methods?accessToken=' + req['session'].accessToken, function(err, apiRequest, apiResponse, result) {

            if (result && result.data)
                cards = result.data.cards;

            res.render('prepay', {
                settings: utils.config.settings(),
                application: application,
                req: req,
                paymentMethodCount: cards.length
            });
        });
    });

    app.post('/billing/prepay', api.authenticate, application.enforceSecure, function (req: express.Request, res: express.Response) {

        var params = {
            accessToken: req['session'].accessToken,
            amount: req.body.amount,
            description: 'Prepayment'
        };

        api.REST.client.post('/v1/payments', params, function(err, apiRequest, apiResponse, result) {
            api.REST.sendConditional(res, err);
        });
    });

    callback();
}


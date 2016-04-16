"use strict";
var utils = require("gator-utils");
var api = require('gator-api');
function setup(app, application, callback) {
    app.get('/billing/paymentmethods', api.authenticate, application.enforceSecure, function (req, res) {
        var cards = [];
        api.REST.client.get('/v1/payments/methods?accessToken=' + req['session'].accessToken, function (err, apiRequest, apiResponse, result) {
            if (result && result.data)
                cards = result.data.cards;
            if (!cards || cards.length == 0) {
                res.redirect('/billing/paymentmethods/form');
            }
            else {
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
    app.get('/billing/paymentmethods/form', api.authenticate, application.enforceSecure, function (req, res) {
        res.render('paymentMethodsForm', {
            settings: utils.config.settings(),
            application: application,
            req: req,
            publishableKey: application.current['publishableKey']
        });
    });
    app.post('/billing/paymentmethods/form', api.authenticate, application.enforceSecure, function (req, res) {
        var params = {
            accessToken: req['session'].accessToken,
            stripeToken: req.body.stripeToken
        };
        api.REST.client.post('/v1/payments/methods', params, function (err, apiRequest, apiResponse, result) {
            if (!err) {
                req['session'].account.status = 0;
                res.redirect('/billing/paymentmethods');
            }
            else {
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
    app.delete('/billing/paymentmethods', api.authenticate, application.enforceSecure, function (req, res) {
        api.REST.client.del('/v1/payments/methods/' + req.body['id'] + '?accessToken=' + req['session']['accessToken'], function (err, apiRequest, apiResponse) {
            api.REST.sendConditional(res, err);
        });
    });
    app.put('/billing/paymentmethods/primary', api.authenticate, application.enforceSecure, function (req, res) {
        var params = {
            accessToken: req['session'].accessToken,
            id: req.body['id']
        };
        api.REST.client.put('/v1/payments/methods/primary', params, function (err, apiRequest, apiResponse) {
            api.REST.sendConditional(res, err);
        });
    });
    app.get('/billing/payments', api.authenticate, application.enforceSecure, function (req, res) {
        var payments = [];
        api.REST.client.get('/v1/payments?accessToken=' + req['session'].accessToken, function (err, apiRequest, apiResponse, result) {
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
    app.get('/billing/prepay', api.authenticate, application.enforceSecure, function (req, res) {
        var cards = [];
        api.REST.client.get('/v1/payments/methods?accessToken=' + req['session'].accessToken, function (err, apiRequest, apiResponse, result) {
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
    app.post('/billing/prepay', api.authenticate, application.enforceSecure, function (req, res) {
        var params = {
            accessToken: req['session'].accessToken,
            amount: req.body.amount,
            description: 'Prepayment'
        };
        api.REST.client.post('/v1/payments', params, function (err, apiRequest, apiResponse, result) {
            api.REST.sendConditional(res, err);
        });
    });
    callback();
}
exports.setup = setup;
//# sourceMappingURL=payments.js.map
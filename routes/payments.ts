import utils = require("gator-utils");
import express = require('express');
import api = require('gator-api');
import {IApplication} from "../lib";

/*
 Set up routes - this script handles functions required for managing payments
 */

export async function setup(app: express.Application, application: IApplication): Promise<void> {

    app.get('/billing/paymentmethods', api.authenticate, application.enforceSecure, async (req: express.Request, res: express.Response) => {

        let cards: any[] = [];
        let customer: any = null;

        try {
            const result = await api.REST.client.get('/v1/payments/methods?accessToken=' + req['session']['accessToken']);

            if (result && result.data) {
                cards = result.data.cards;
                customer = result.data.customer;
            }
        } catch {
            // fall through to empty cards
        }

        //  if there are no payment methods already, go straight to entry form
        if (!cards || cards.length == 0) {
            res.redirect('/billing/paymentmethods/form');
            return;
        }

        res.render('paymentMethods', {
            settings: utils.config.settings(),
            application: application,
            req: req,
            cards: cards,
            customer: customer
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

    app.post('/billing/paymentmethods/form', api.authenticate, application.enforceSecure, async (req: express.Request, res: express.Response) => {

        const params = {
            accessToken: req['session']['accessToken'],
            stripeToken: req.body.stripeToken
        };

        try {
            await api.REST.client.post('/v1/payments/methods', params);
            //  update account status to active with new payment method
            req['session']['account'].status = 0;
            req['session']['account'].billingMethod = 'automatic';
            res.redirect('/billing/paymentmethods');
        } catch (err: any) {
            req.flash('error', err.message);

            res.render('paymentMethodsForm', {
                settings: utils.config.settings(),
                application: application,
                req: req,
                publishableKey: application.current['publishableKey']
            });
        }
    });

    app.delete('/billing/paymentmethods', api.authenticate, application.enforceSecure, async (req: express.Request, res: express.Response) => {

        try {
            await api.REST.client.del('/v1/payments/methods/' + req.body['id'] + '?accessToken=' + req['session']['accessToken']);
            api.REST.sendConditional(res, null);
        } catch (err) {
            api.REST.sendConditional(res, err);
        }
    });

    app.put('/billing/paymentmethods/primary', api.authenticate, application.enforceSecure, async (req: express.Request, res: express.Response) => {

        const params = {
            accessToken: req['session']['accessToken'],
            id: req.body['id']
        };

        try {
            await api.REST.client.put('/v1/payments/methods/primary', params);
            api.REST.sendConditional(res, null);
        } catch (err) {
            api.REST.sendConditional(res, err);
        }
    });

    app.get('/billing/payments', api.authenticate, application.enforceSecure, async (req: express.Request, res: express.Response) => {

        let payments: any[] = [], discount = 0, balance = 0;

        try {
            const result = await api.REST.client.get('/v1/payments?accessToken=' + req['session']['accessToken']);

            if (result && result.data) {
                payments = result.data.payments;
                discount = result.data.discount || 0;
                balance = result.data.balance || 0;
            }
        } catch (err: any) {
            req.flash('error', err.message);
        }

        res.render('payments', {
            settings: utils.config.settings(),
            application: application,
            req: req,
            payments: payments,
            discount: discount,
            balance: balance
        });
    });

    app.get('/billing/prepay', api.authenticate, application.enforceSecure, async (req: express.Request, res: express.Response) => {

        let cards: any[] = [];

        try {
            const result = await api.REST.client.get('/v1/payments/methods?accessToken=' + req['session']['accessToken']);

            if (result && result.data)
                cards = result.data.cards;
        } catch {
            // fall through to empty cards
        }

        res.render('prepay', {
            settings: utils.config.settings(),
            application: application,
            req: req,
            paymentMethodCount: cards.length
        });
    });

    app.post('/billing/prepay', api.authenticate, application.enforceSecure, async (req: express.Request, res: express.Response) => {

        const params = {
            accessToken: req['session']['accessToken'],
            amount: req.body.amount,
            description: 'Prepayment'
        };

        try {
            await api.REST.client.post('/v1/payments', params);
            api.REST.sendConditional(res, null);
        } catch (err) {
            api.REST.sendConditional(res, err);
        }
    });
}

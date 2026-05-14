import utils = require("gator-utils");
import express = require('express');
import api = require('gator-api');
import {IApplication} from "../lib";

/*
 Set up routes - this script handles functions required for Shopify integration
 */

export async function setup(app: express.Application, application: IApplication): Promise<void> {

    app.get('/shopify/realmchanged', application.enforceSecure, api.authenticate, (req: express.Request, res: express.Response) => {

        let url = 'https://' + req.query.shop + '/admin/apps';
        const shopifyApp: any = api.applications.items[utils.config.settings().appId];

        if (shopifyApp && shopifyApp.data && shopifyApp.data.shopifyAppId)
            url += '/' + shopifyApp.data.shopifyAppId;

        res.render('realmChanged', {
            settings: utils.config.settings(),
            application: application,
            dev: utils.config.dev(),
            req: req,
            url: url
        });
    });

    app.post('/shopify/cust/redact', (req: express.Request, res: express.Response) => {
        res.sendStatus(200);
    });

    app.post('/shopify/shop/delete', (req: express.Request, res: express.Response) => {
        res.sendStatus(200);
    });
}

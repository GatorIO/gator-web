import utils = require("gator-utils");
import express = require('express');
import api = require('gator-api');
import {IApplication} from "../lib";

/*
 Set up routes - this script handles email-related routes
 */

export async function setup(app: express.Application, application: IApplication): Promise<void> {

    app.get('/email/unsubscribe', function (req: express.Request, res: express.Response) {

        res.render('./api/unsubscribe', {
            application: application,
            settings: utils.config.settings(),
            req: req
        });
    });

    app.post('/email/unsubscribe', async (req: express.Request, res: express.Response) => {
        utils.noCache(res);

        const params: any = {
            lid: req.body.lid,
            cid: req.body.cid,
            sid: req.body.sid,
            uid: req.body.uid,
            aid: req.body.aid
        };

        try {
            const result = await api.REST.client.post('/v1/email/unsubscribe', params);
            api.REST.sendConditional(res, null, result);
        } catch (err) {
            api.REST.sendConditional(res, err);
        }
    });
}

import utils = require("gator-utils");
import express = require('express');
import {IApplication} from "../lib";

/*
 Set up system routes
 */

export async function setup(app: express.Application, application: IApplication): Promise<void> {

    app.get('/configcheck', (req: express.Request, res: express.Response) => {

        const packageInfoPath = process.cwd() + '/package.json';
        const packageInfo = require(packageInfoPath);

        res.render('configCheck', {
            settings: utils.config.settings(),
            application: application,
            req: req,
            packageInfo: packageInfo,
            versions: process.versions,
            proc: process
        });
    });
}

import utils = require("gator-utils");
import express = require('express');
import {IApplication} from "../lib";

/*
 Set up system routes
 */

export function setup(app: express.Application, application: IApplication, callback) {

    app.get('/configcheck', (req: express.Request, res: express.Response) => {

        let packageInfoPath = process.cwd() + '/package.json';

        let packageInfo = require(packageInfoPath);

        res.render('configCheck', {
            settings: utils.config.settings(),
            application: application,
            req: req,
            packageInfo: packageInfo,
            versions: process.versions,
            proc: process
        });
    });

    callback();
}


import express = require('express');
import {IApplication} from "../lib";

export let apiRoutes = require('./api');
export let projectRoutes = require('./projects');
export let reportingRoutes = require('./reporting');
export let segmentRoutes = require('./segments');
export let campaignRoutes = require('./campaigns');
export let dashboardRoutes = require('./dashboards');
export let bookmarkRoutes = require('./bookmarks');
export let developerRoutes = require('./developer');
export let attributeRoutes = require('./attributes');
export let paymentRoutes = require('./payments');
export let emailRoutes = require('./email');
export let accessTokenRoutes = require('./accessTokens');
export let contactRoutes = require('./contacts');
export let monitorRoutes = require('./monitors');
export let stationRoutes = require('./stations');
export let shopifyRoutes = require('./shopify');
export let systemRoutes = require('./system');

export async function setup(app: express.Application, application: IApplication): Promise<void> {

    /*
     Set up routes - this script handles module admin functions
     */

    await accessTokenRoutes.setup(app, application);
    await apiRoutes.setup(app, application);
    await attributeRoutes.setup(app, application);
    await bookmarkRoutes.setup(app, application);
    await dashboardRoutes.setup(app, application);
    await campaignRoutes.setup(app, application);
    await projectRoutes.setup(app, application);
    await reportingRoutes.setup(app, application);
    await developerRoutes.setup(app, application);
    await segmentRoutes.setup(app, application);
    await paymentRoutes.setup(app, application);
    await emailRoutes.setup(app, application);
}

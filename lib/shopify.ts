/// <reference path="../typings/gator-utils/gator-utils.d.ts" />
/// <reference path="../typings/gator-api/gator-api.d.ts" />
import utils = require("gator-utils");
import api = require("gator-api");

/*
    Shopify OAuth and API helpers
 */

//  Launch a Shopify app.  Return whether app launch/login was successful.  Possible outcomes are errors, an OAuth redirect or success.
export function launch(application, req, res, callback?: (launched: boolean) => void) {

    let params = {
        appId: application.current.id,
        query: req.query,
        redirect_uri: utils.config.dev() ? 'https://' + req.headers['host'] + '/shopify/install' : 'https://' + utils.config.settings().domain + '/shopify/install'
    };

    //  this checks for a valid user name equal to the shop name and that the shop has the app installed
    api.REST.client.post('/v1/shopify/launch', params, function (err, apiRequest, apiResponse, result) {

        //  if the user does not exist or the app is not installed, redirect to the app's authorization or billing activation url
        if (apiResponse && apiResponse.statusCode == 300 && result && result.location) {
            res.redirect(result.location);

            if (callback)
                callback(false);

        } else if (err) {
            res.sendStatus(500);

            if (callback)
                callback(false);
        } else {
            api.setSessionCookie(res, result.data.accessToken);
            res.redirect(application.branding.postLoginUrl);

            if (callback)
                callback(true);
        }
    });
}

export function install(application, req, res, callback: (err?: api.errors.APIError) => void) {

    let params = {
        appId: application.current.id,
        query: req.query,
        uri: utils.config.dev() ? 'https://' + req.headers['host'] : 'https://' + utils.config.settings().domain
    };

    //  perform base install/authentication
    api.REST.client.post('/v1/shopify/install', params, function (err, apiRequest, apiResponse, result) {

        if (err) {
            callback(err);
        } else {
            api.setSessionCookie(res, result.data.accessToken);
            req['session'] = result.data;
            callback();
        }
    });
}

export function uninstall(application, req, res, callback: (err?: api.errors.APIError) => void) {

    let params = {
        appId: application.current.id,
        headers: req.headers,
        body: req['rawBody'],
    };

    //  perform uninstall
    api.REST.client.post('/v1/shopify/uninstall', params, function (err, apiRequest, apiResponse, result) {
        callback(err);
    });
}

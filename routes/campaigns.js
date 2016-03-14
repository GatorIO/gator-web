var utils = require("gator-utils");
var api = require('gator-api');
function setup(app, application, callback) {
    app.get('/setup/campaignreferrers', application.enforceSecure, api.authenticate, function (req, res) {
        utils.noCache(res);
        api.REST.client.get('/v1/projects/account/' + req['session'].account.id + '?accessToken=' + req['session']['accessToken'], function (err, apiRequest, apiResponse, result) {
            if (err)
                req.flash('error', err.message);
            else
                req['session'].projects = result.data.projects;
            res.render('campaignReferrers', {
                application: application,
                settings: utils.config.settings(),
                campaignReferrers: req['session'].account.data && req['session'].account.data.campaignReferrers ? req['session'].account.data.campaignReferrers : [],
                req: req
            });
        });
    });
    app.put('/setup/campaignreferrers', application.enforceSecure, api.authenticate, function (req, res) {
        var params = {
            accessToken: req['session'].accessToken,
            accountId: req['session'].account.id,
            campaignReferrers: req.body.campaignReferrers
        };
        api.REST.client.put('/v1/analytics/campaignreferrers', params, function (err, apiRequest, apiResponse, result) {
            api.REST.sendConditional(res, err);
        });
    });
    app.get('/setup/campaignids', application.enforceSecure, api.authenticate, function (req, res) {
        utils.noCache(res);
        api.REST.client.get('/v1/accounts/' + req['session'].account.id + '?accessToken=' + req['session']['accessToken'], function (err, apiRequest, apiResponse, result) {
            if (!err)
                req['session'].account = result.data.account;
            res.render('campaignIds', {
                application: application,
                settings: utils.config.settings(),
                campaignIds: req['session'].account.data && req['session'].account.data.campaignIds ? req['session'].account.data.campaignIds.join(',') : '',
                req: req
            });
        });
    });
    app.put('/setup/campaignids', application.enforceSecure, api.authenticate, function (req, res) {
        var params = {
            accessToken: req['session'].accessToken,
            accountId: req['session'].account.id,
            campaignIds: req.body.campaignIds.split(',')
        };
        api.REST.client.put('/v1/analytics/campaignids', params, function (err, apiRequest, apiResponse, result) {
            api.REST.sendConditional(res, err);
        });
    });
    callback();
}
exports.setup = setup;
//# sourceMappingURL=campaigns.js.map
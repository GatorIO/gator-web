var utils = require("gator-utils");
var api = require('gator-api');
function setup(app, application, callback) {
    app.get('/accesstokens', application.enforceSecure, api.authenticate, function (req, res) {
        utils.noCache(res);
        var projectFilter = req.query.projectId ? '&projectId=' + req.query.projectId : '';
        api.REST.client.get('/v1/accesstokens/' + req['session'].user.id + '?accessToken=' + req['session'].accessToken + '&accountId=' + req['session'].account.id +
            '&type=api' + projectFilter, function (err, apiRequest, apiResponse, result) {
            var tokens = [];
            if (err) {
                req.flash('error', err.message);
            }
            else {
                tokens = result.data.accessTokens;
            }
            tokens.forEach(function (token) {
                if (new Date(Date.parse(token.expiration)).getFullYear() > 2900)
                    token.expiration = 'N/A';
            });
            res.render('accessTokens', {
                req: req,
                application: application,
                accessTokens: tokens,
                projectId: req.query.projectId || 0,
                projectName: req.query.projectName || ''
            });
        });
    });
    app.post('/accesstokens', application.enforceSecure, api.authenticate, function (req, res) {
        utils.noCache(res);
        if (!req.body.expires) {
            req.body.expires = new Date(Date.parse('3000-01-01'));
        }
        var permissions = [];
        if (req.body.pushAccess == 'true')
            permissions.push('push');
        if (req.body.queryAccess == 'true')
            permissions.push('query');
        var params = {
            accessToken: req['session']['accessToken'],
            accountId: req['session'].account.id,
            permissions: permissions,
            expiration: req.body.expires,
            type: 'api'
        };
        if (req.body.projectId)
            params.projectId = req.body.projectId;
        api.REST.client.post('/v1/accesstokens', params, function (err, apiRequest, apiResponse, result) {
            api.REST.sendConditional(res, err, result);
        });
    });
    app.delete('/accesstokens', application.enforceSecure, api.authenticate, function (req, res) {
        utils.noCache(res);
        api.REST.client.del('/v1/accesstokens/' + req.body['accessToken'] + '?accessToken=' + req['session']['accessToken'], function (err, apiRequest, apiResponse) {
            api.REST.sendConditional(res, err);
        });
    });
    callback();
}
exports.setup = setup;
//# sourceMappingURL=accessTokens.js.map
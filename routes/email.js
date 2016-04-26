"use strict";
var utils = require("gator-utils");
var api = require('gator-api');
function setup(app, application, callback) {
    app.get('/email/unsubscribe', application.enforceSecure, api.authenticate, function (req, res) {
        res.render('unsubscribe', {
            application: application,
            settings: utils.config.settings(),
            req: req
        });
    });
    app.post('/email/unsubscribe', function (req, res) {
        utils.noCache(res);
        var params = {
            email: req.body.email,
            listId: req.body.listId
        };
        api.REST.client.post('/v1/email/unsubscribe', params, function (err, apiRequest, apiResponse, result) {
            api.REST.sendConditional(res, err, result);
        });
    });
    callback();
}
exports.setup = setup;
//# sourceMappingURL=email.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils = require("gator-utils");
const api = require("gator-api");
function setup(app, application, callback) {
    app.get('/email/unsubscribe', function (req, res) {
        res.render('./api/unsubscribe', {
            application: application,
            settings: utils.config.settings(),
            req: req
        });
    });
    app.post('/email/unsubscribe', function (req, res) {
        utils.noCache(res);
        var params = {
            lid: req.body.lid,
            cid: req.body.cid,
            sid: req.body.sid,
            uid: req.body.uid,
            aid: req.body.aid
        };
        api.REST.client.post('/v1/email/unsubscribe', params, function (err, apiRequest, apiResponse, result) {
            api.REST.sendConditional(res, err, result);
        });
    });
    callback();
}
exports.setup = setup;
//# sourceMappingURL=email.js.map
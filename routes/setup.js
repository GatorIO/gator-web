"use strict";
exports.apiRoutes = require('./api');
exports.projectRoutes = require('./projects');
exports.reportingRoutes = require('./reporting');
exports.segmentRoutes = require('./segments');
exports.campaignRoutes = require('./campaigns');
exports.dashboardRoutes = require('./dashboards');
exports.bookmarkRoutes = require('./bookmarks');
exports.developerRoutes = require('./developer');
exports.attributeRoutes = require('./attributes');
exports.paymentRoutes = require('./payments');
exports.emailRoutes = require('./email');
exports.accessTokenRoutes = require('./accessTokens');
exports.contactRoutes = require('./contacts');
exports.monitorRoutes = require('./monitors');
exports.stationRoutes = require('./stations');
function setup(app, application, callback) {
    try {
        exports.accessTokenRoutes.setup(app, application, function () {
            exports.apiRoutes.setup(app, application, function () {
                exports.attributeRoutes.setup(app, application, function () {
                    exports.bookmarkRoutes.setup(app, application, function () {
                        exports.dashboardRoutes.setup(app, application, function () {
                            exports.campaignRoutes.setup(app, application, function () {
                                exports.projectRoutes.setup(app, application, function () {
                                    exports.reportingRoutes.setup(app, application, function () {
                                        exports.developerRoutes.setup(app, application, function () {
                                            exports.segmentRoutes.setup(app, application, function () {
                                                exports.paymentRoutes.setup(app, application, function () {
                                                    exports.emailRoutes.setup(app, application, function () {
                                                        callback();
                                                    });
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    }
    catch (err) {
        console.dir(err);
        callback(err);
    }
}
exports.setup = setup;
//# sourceMappingURL=setup.js.map
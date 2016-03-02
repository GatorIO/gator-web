var _flash = require('./flash');
exports.flash = _flash;
function renderError(req, res, message) {
    res.render('errorPage', { req: req, message: message ? message : 'Unknown error' });
}
exports.renderError = renderError;
//# sourceMappingURL=index.js.map
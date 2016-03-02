var _setupRoutes = require('../routes/setup');
exports.setupRoutes = _setupRoutes;
var _flash = require('./flash');
exports.flash = _flash;
function renderError(req, res, message) {
    res.render('errorPage', { req: req, message: message ? message : 'Unknown error' });
}
exports.renderError = renderError;
var MenuLink = (function () {
    function MenuLink(title, url) {
        this.title = title;
        this.url = url;
    }
    return MenuLink;
})();
exports.MenuLink = MenuLink;
var MenuItem = (function () {
    function MenuItem(title, iconClass, link, item) {
    }
    return MenuItem;
})();
exports.MenuItem = MenuItem;
//# sourceMappingURL=index.js.map
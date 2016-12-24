"use strict";
var _routes = require('../routes/setup');
var _shopify = require('../lib/shopify');
var _dictionaries = require('./dictionaries');
exports.routes = _routes;
exports.shopify = _shopify;
exports.dictionaries = _dictionaries;
var _flash = require('./flash');
exports.flash = _flash;
function renderError(req, res, message) {
    res.render('errorPage', { req: req, message: message ? message : 'Unknown error' });
}
exports.renderError = renderError;
function statusCheckPlaceholder(req, res, next) {
    return next();
}
exports.statusCheckPlaceholder = statusCheckPlaceholder;
var MenuLink = (function () {
    function MenuLink(title, url) {
        this.title = title;
        this.url = url;
    }
    return MenuLink;
}());
exports.MenuLink = MenuLink;
var MenuItem = (function () {
    function MenuItem(title, iconClass, link, item) {
    }
    return MenuItem;
}());
exports.MenuItem = MenuItem;
//# sourceMappingURL=index.js.map
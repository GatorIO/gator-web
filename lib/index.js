"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _routes = require("../routes/setup");
const _shopify = require("../lib/shopify");
const _dictionaries = require("./dictionaries");
exports.routes = _routes;
exports.shopify = _shopify;
exports.dictionaries = _dictionaries;
let _flash = require('./flash');
exports.flash = _flash;
function renderError(req, res, message) {
    res.render('errorPage', { req: req, message: message ? message : 'Unknown error' });
}
exports.renderError = renderError;
function statusCheckPlaceholder(req, res, next) {
    return next();
}
exports.statusCheckPlaceholder = statusCheckPlaceholder;
class MenuLink {
    constructor(title, url) {
        this.title = title;
        this.url = url;
    }
}
exports.MenuLink = MenuLink;
class MenuItem {
    constructor(title, iconClass, link, item) {
    }
}
exports.MenuItem = MenuItem;
//# sourceMappingURL=index.js.map
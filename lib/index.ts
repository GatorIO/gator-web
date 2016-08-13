import _routes = require('../routes/setup');
import _apiRoutes = require('../routes/api');
import _accessTokenRoutes = require('../routes/accessTokens');

export var routes = _routes;
export var apiRoutes = _apiRoutes;
export var accessTokenRoutes = _accessTokenRoutes;

var _flash = require('./flash');

export var flash = _flash;

export function renderError(req, res, message) {
    res.render('errorPage', { req: req, message: message ? message : 'Unknown error'});
}

//  An application can have a custom middleware.  If it doesn't, it uses this placeholder.
export function statusCheckPlaceholder(req, res, next: Function) {
    return next();
}

export class MenuLink {
    public title: string;
    public url: string;

    constructor(title: string, url: string) {
        this.title = title;
        this.url = url;
    }
}

export class MenuItem {
    public title: string;
    public iconClass: string;
    public link: MenuLink;
    public subItems: Array<MenuItem>;
    public target: string;

    constructor(title: string, iconClass: string, link: MenuLink, item) {

    }
}

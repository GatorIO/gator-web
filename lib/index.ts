import _routes = require('../routes/setup');

export var routes = _routes;

var _flash = require('./flash');

export var flash = _flash;

export function renderError(req, res, message) {
    res.render('errorPage', { req: req, message: message ? message : 'Unknown error'});
}

//  An application can have a custom middleware.  If it doesn't, it uses this placeholder.
export function middlewarePlaceholder(req, res, next: Function) {
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

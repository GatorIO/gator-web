var _flash = require('./flash');

export var flash = _flash;

export function renderError(req, res, message) {
    res.render('errorPage', { req: req, message: message ? message : 'Unknown error'});
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

var _flash = require('./flash');

export var flash = _flash;

export function renderError(req, res, message) {
    res.render('errorPage', { req: req, message: message ? message : 'Unknown error'});
}



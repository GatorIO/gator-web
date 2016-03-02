/**
 This is a custom version of connect-flash that supports non-standard sessions
 */

/**
 * Module dependencies.
 */
var format = require('util').format;
var isArray = require('util').isArray;

/*
 Flash message function
 */
/**
 * Expose `flash()` function on requests.
 *
 * @return {Function}
 * @api public
 */
module.exports = function flash(options) {
    options = options || {};
    var safe = (options.unsafe === undefined) ? true : !options.unsafe;

    return function(req, res, next) {
        if (req.flash && safe) { return next(); }
        req.flash = _flash;
        next();
    }
};

function _flash(type, msg) {

    var msgs = this.flashes = this.flashes || {};

    if (type && msg) {

        if (arguments.length > 2 && format) {
            var args = Array.prototype.slice.call(arguments, 1);
            msg = format.apply(undefined, args);
        } else if (isArray(msg)) {
            msg.forEach(function(val){
                (msgs[type] = msgs[type] || []).push(val);
            });
            return msgs[type].length;
        }
        return (msgs[type] = msgs[type] || []).push(msg);
    } else if (type) {
        var arr = msgs[type];
        delete msgs[type];
        return arr || [];
    } else {
        this.flashes = {};
        return msgs;
    }
}

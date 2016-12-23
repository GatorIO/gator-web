"use strict";
var urlLib = require('url');
function hostname(url) {
    if (url.indexOf('://') == -1)
        url = 'http://' + url;
    var urlObject = urlLib.parse(url);
    if (!urlObject)
        throw new Error('Unable to parse URL');
    return urlObject.hostname;
}
exports.hostname = hostname;
function path(url) {
    if (url.indexOf('://') == -1)
        url = 'http://' + url;
    var urlObject = urlLib.parse(url);
    if (!urlObject)
        throw new Error('Unable to parse URL');
    var ret = urlObject.path;
    if (ret.substr(ret.length - 1) == '/')
        ret = ret.substr(0, ret.length - 1);
    return urlObject.path;
}
exports.path = path;
//# sourceMappingURL=utils.js.map
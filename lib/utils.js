"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const urlLib = require('url');
function hostname(url) {
    if (url.indexOf('://') == -1)
        url = 'http://' + url;
    let urlObject = urlLib.parse(url);
    if (!urlObject)
        throw new Error('Unable to parse URL');
    return urlObject.hostname;
}
exports.hostname = hostname;
function path(url) {
    if (url.indexOf('://') == -1)
        url = 'http://' + url;
    let urlObject = urlLib.parse(url);
    if (!urlObject)
        throw new Error('Unable to parse URL');
    let ret = urlObject.path;
    if (ret.substr(ret.length - 1) == '/')
        ret = ret.substr(0, ret.length - 1);
    return urlObject.path;
}
exports.path = path;
//# sourceMappingURL=utils.js.map
/// <reference path="../typings/gator-utils/gator-utils.d.ts" />
/// <reference path="../typings/gator-api/gator-api.d.ts" />
import utils = require("gator-utils");
import api = require("gator-api");
const urlLib = require('url');

/*
    Utility functions for the monitoring module
 */
//  return the hostname from a url
export function hostname(url: string): string {

    //  the url library needs a protocol attached to work correctly
    if (url.indexOf('://') == -1)
        url = 'http://' + url;

    var urlObject = urlLib.parse(url);

    if (!urlObject)
        throw new Error('Unable to parse URL');

    return urlObject.hostname;
}

//  return the path from a url
export function path(url: string): string {

    //  the url library needs a protocol attached to work correctly
    if (url.indexOf('://') == -1)
        url = 'http://' + url;

    var urlObject = urlLib.parse(url);

    if (!urlObject)
        throw new Error('Unable to parse URL');

    var ret = urlObject.path;

    //  strip off trailing /
    if (ret.substr(ret.length - 1) == '/')
        ret = ret.substr(0, ret.length - 1);

    return urlObject.path;
}


import utils = require("gator-utils");
import api = require("gator-api");
import Axios from "axios";
const urlLib = require('url');

/*
    Utility functions
 */

//  return the hostname from a url
export function hostname(url: string): string {

    //  the url library needs a protocol attached to work correctly
    if (url.indexOf('://') == -1)
        url = 'http://' + url;

    let urlObject = urlLib.parse(url);

    if (!urlObject)
        throw new Error('Unable to parse URL');

    return urlObject.hostname;
}

//  return the path from a url
export function path(url: string): string {

    //  the url library needs a protocol attached to work correctly
    if (url.indexOf('://') == -1)
        url = 'http://' + url;

    let urlObject = urlLib.parse(url);

    if (!urlObject)
        throw new Error('Unable to parse URL');

    let ret = urlObject.path;

    //  strip off trailing /
    if (ret.substr(ret.length - 1) == '/')
        ret = ret.substr(0, ret.length - 1);

    return urlObject.path;
}

/**
 * Verify captcha using Cloudflare
 */
export async function verifyCaptcha(req) {
    try {
        const token = req.body?.['cf-turnstile-response']

        if (!token) {
            return true
        }
        const remoteAddress = utils.ip.remoteAddress(req)
        const url = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

        const params = {
            url,
            method: 'post',
            data: {
                secret: '0x4AAAAAABBrZ5lR9_6xhnWa4L14d6lCy70',
                response: token,
                remoteip: remoteAddress
            },
            headers: {
                'Content-Type': 'application/json'
            }
        }
        const result = await Axios(params);

        if (!result.data?.success) {
            api.logger.error(result, "verifyCaptcha outcome", req);
        }
        return !!result.data?.success
    } catch(err) {
        api.logger.error(err, "verifyCaptcha", req);
        return false
    }
}
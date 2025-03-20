import utils = require("gator-utils");
import api = require("gator-api");
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

export async function verifyCaptcha(req) {
    try {
        const remoteAddress = utils.ip.remoteAddress(req)
        const url = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
        const token = req.body?.['cf-turnstile-response']
        const idempotencyKey = crypto.randomUUID();

        const result = await fetch(url, {
            body: JSON.stringify({
                secret: '0x4AAAAAABBrZ5lR9_6xhnWa4L14d6lCy70',
                response: token,
                remoteip: remoteAddress,
                idempotency_key: idempotencyKey
            }),
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const outcome = await result.json()

        return outcome.success
    } catch(err) {
        return false
    }
}

declare module 'gator-utils' {
    export function superRandom(bytes?:number):string;
    export function isArray(obj:any):boolean;
    export function prefixAttributes(obj:Object, prefix:string):Object;
    export function isNumeric(n:any):boolean;
    export function toBytes(num:number):Uint8Array;
    export function uuid(len?:number, radix?:number):string;
    export function base62encode(i:any):string;
    export function isUTF8(charset:any):boolean;
    export function padLeft(value:any, padChar:string, padCount:number):string;
    export function urlDecode(str:any, charset:any):any;
    export function clone(o:Object):Object;
    export function extend(o1:Object, o2:Object):Object;
    export function copyProperty(property:string, o1:Object, o2:Object, allowNull?:boolean, allowEmpty?:boolean):boolean;
    export function isFunction(functionToCheck:any):boolean;
    export function replaceAll(original:string, search:string, replacement:string):string;
    export function htmlify(obj:any):string;
    export function empty(obj:Object):boolean;
    export function trimStart(value:string, start:string):string;
    export function parseCookieValueFromString(headerVal:string, key:string):any;
    export function trimEnd(val:string, end:string):string;
    export function repeat(val:string, n:number):string;
    export function spaces(n:number):string;
    export function merge(o1:any, o2:any, overwrite:boolean):Object;
    export function validEmail(email:string):boolean;
    export function missingParams(req:any, requiredParams:string[]):string[];
    export function guid():string;
    export function hash(input:string):number;
    export function noCache(res:any):void;

    export module config {
        export function env(): string;
        export function dev(): boolean;
        export function settings(envir?: string): any;
    }

    export module ip {
        export function localHost(req:any):boolean;
        export function isIPV6(address:string):boolean;
        export function remoteAddress(req:any):string;
        export function isLoopback(addr:any):boolean;
        export function hashIPV6(ip:string):number;
        export function hash(address:string):number;
        export function toNumber(address:string, reverse?:boolean):number;
        export function compress(address:string):any;
        export function toNumber32(address:string):number;
        export function fromNumber(ipNumber:number):string;
        export function toNumberIPV6(address:string):number;
    }

    export module epoch {
        export var timezones:{
            code: string;
            name: string;
            utcOffset?: number;
            dstStart?: Date;
            dstEnd?: Date;
        }[];
        export enum DateIntervals {
            second = 0,
            minute = 1,
            hour = 2,
            day = 3,
            week = 4,
            month = 5,
            quarter = 6,
            year = 7,
        }
        export function getTimezoneId(timezone:any):number;

        export function utcOffset(timezoneId:number):number;

        export function currentDatetime(utcOffset?:number):Date;

        export function toUTC(strDate:string, utcOffset?:number):Date;

        export function currentDate(utcOffset?:number):Date;

        export function dateToString(date:Date, includeTime?:boolean):string;

        export function startOfDate(date?:Date):Date;

        export function addMonths(months:number, date?:Date):Date;

        export function addYears(years:number, date?:Date):Date;

        export function addDays(days:number, date?:Date):Date;

        export function addHours(hours:number, date?:Date):Date;

        export function addMinutes(minutes:number, date?:Date):Date;

        export function addSeconds(seconds:number, date?:Date):Date;

        export function diff(interval:DateIntervals, date1:Date, date2?:Date):number;

        export function start():Date;

        export function millisecond(date?:Date):number;

        export function second(date?:Date):number;

        export function minute(date?:Date):number;

        export function hour(date?:Date):number;

        export function day(date?:Date):number;

        export function week(date?:Date):number;

        export function month(date?:Date):number;

        export function quarter(date?:Date):number;

        export function formatTimezone(param:string);

        export function currentMonth(utcOffset?:number):Date;

        export function monthCode(date?:Date, utcOffset?:number):string;
    }
}

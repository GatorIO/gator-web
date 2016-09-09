/// <reference path="../restify/restify.d.ts" />

declare module 'gator-api' {
    import restify = require('restify');

    export var client;

    export module errors {

        export class APIError {
            message:string;
            code:number;

            constructor(message?:string);
        }

        export class InternalError implements APIError {
            message:string;
            code:number;

            constructor(message?:string);
        }

        export class DuplicateError implements APIError {
            message:string;
            code:number;

            constructor(message?:string);
        }

        export class NotFoundError implements APIError {
            message:string;
            code:number;

            constructor(message?:string);
        }

        export class MissingParameterError implements APIError {
            message:string;
            code:number;

            constructor(message?:string);
        }

        export class UnauthorizedError implements APIError {
            message:string;
            code:number;

            constructor(message?:string);
        }

        export class BadRequestError implements APIError {
            message:string;
            code:number;

            constructor(message?:string);
        }

        export class AuthenticationTimeoutError implements APIError {
            message:string;
            code:number;

            constructor(message?:string);
        }
    }

    export module applications {

        export class Permission {
            public id:string;
            public description:string;

            constructor(id:string, description?:string);
        }

        export class Application {

            //  app attributes
            public id: number;
            public name: string;
            public description: string;
            public host: string;
            public commissions: boolean;
            public permissions: Array<Permission>;     //  the available permissions for the module
            public reporting: {
                apiEndpoint: string
            };
        }

        export var items: Array<Application>;
        export function getAll(callback:(err?:errors.APIError, result?:Array<Application>) => void);
    }

    export module users {

        export enum UserStatus {
            active = 0,
            lockedOut = 1
        }

        export class User {
            public id:number;
            public name:string;
            public password:string;
            public firstName:string;
            public lastName:string;
            public status:UserStatus;
            public createdDate:Date;
            public lastUpdated:Date;
            public ipAddress:string;
        }

        export function create(params:any, callback:(err?:errors.APIError, result?:any) => void);
        export function authorize(accessToken:string, callback:(err?:errors.APIError, result?:any) => void);
    }

    export module accounts {

        export enum AccountStatus {
            active = 0,
            lockedOut = 1
        }

        export class Account {
            public id:number;
            public name:string;
            public createdDate:Date;
            public userId:string;
            public appId:string;
            public status:number;
            public ipAddress:string;
            public data:any;
        }

        export function get(params:any, callback:(err?:errors.APIError, result?:any) => void);
        export function create(params:any, callback:(err?:errors.APIError, result?:any) => void);
    }

    export module projects {

        export class Project {
            public id:number;
            public accountId:number;
            public name:string;
            public enabled:boolean;
            public data: any;
        }

        export function get(params:any, callback:(err?:errors.APIError, projects?:Array<Project>) => void);
        export function create(params:any, callback:(err?:errors.APIError, project?:Project) => void);
    }

    export class Authorization {
        accessToken:string;
        user:users.User;
        expiration:Date;
        account:accounts.Account;
        projects:Array<projects.Project>;
        currentProjectId:number;
    }

    export module sessions {
        export function set(authObject:any);

        export function get(accessToken:string);
    }

    export module REST {
        export var client:restify.Client;
        export class ResponseResult {
            constructor(code?:number, data?:Object, message?:string);

            code:number;
            message:string;
            data:Object;

            public toJson():Object;
        }

        export function sendError(res:any, err:any)
        export function noCache(res:any);
        export function redirect(res:any, location:string, code:number);
        export function send(res:any, data?:Object, message?:string);
        export function sendConditional(res:any, err:any, data?:Object, message?:string);
        export function isSecure(req):boolean;
    }

    export interface ISettings {
        domain: string;
        appName: string;
        appId: number;

        nodeHost: string;
        nodePort: number;
        nodeUrl: string;

        apiUrl: string;
        apiVersion: string;

        product: string;
    }

    export function login(name:string, password:string, appId:number, callback:(err?:errors.APIError, result?:Authorization) => void);
    export function logout(res:any);
    export function authorize(params:any, callback:(err?:errors.APIError, result?:Authorization) => void);
    export function log(a1?:any, a2?:any, a3?:any, a4?:any, a5?:any);

    export module logs {
        export function log(a1?:any, a2?:any, a3?:any, a4?:any, a5?:any);
    }

    export function authenticate(req, res, next);
    export function authenticateNoRedirect(req, res, next);
    export function signup(params:any, callback:(err?:errors.APIError, result?:Authorization) => void);
    export function setSessionCookie(res:any, accessToken:string);
    export function machineId():string;
    export function isSysAdmin(req): boolean;
    export function hasAdminPermission(req, permission: string): boolean;

    export function getProject(req, id);
    export function currentProject(req);

    export module reporting {

        export function currentDashboards(req);
        export function currentBookmarks(req);
        export function getCustomAttributes(req, projectId);

        export var Operators;
        export class Segment {
            id:number;
            accountId:number;
            name:string;
            query:string;
            global:boolean;
        }

        export var DataTypes;

        export class Attribute {
            name:string;
            title:string;
            dataType:string;
            isElement:boolean;
            isMetric:boolean;
            description:string;
            operators:Array<string>;
            values:Array<string>;
            inputFormat:string;
            filterable:boolean;
            searchable:boolean;
            supportedViews:Array<string>;
            logAttribute:boolean;
            gapType: string;
            chartOptions: Object;
        }

        //  segmentation filter definitions suitable for use with jQuery QueryBuilder
        export class FilterOptions {
            id:string;
            label:string;
            type:string;
            input:string;
            values:Array<any>;
            operators:Array<string>;
            description:string;
            validation:Object;
            multiple:boolean;
            searchable:boolean;
            default_value:string;
        }

        export var defaultAppId: number;
        export var attributes: { [appId: number] : Array<Attribute> };

        export enum AttributeTypes {
            all,
            metrics,
            elements
        }

        export function applicationAttributes(appId: number): Array<Attribute>;
        export function getAttributes(view:string, attributeType:AttributeTypes, isLog:boolean, appId?:number): Array<Attribute>;
        export function addAttributeView(options, view:string, attributeType:AttributeTypes, customAttribs:any);
        export function getAttributeOptions(view:string, attributeType:AttributeTypes, customAttribs:any, isLog?:boolean, appId?:number);
        export function addFilterView(filterOptions, view:string, customAttribs:any);
        export function getFilterOptions(view:string, customAttribs:any, isLog:boolean, appId?:number):Array<FilterOptions>;
        export function getFilterOption(attrib:any):FilterOptions;
        export function init(defaultAppId: number, callback:Function);
        export function getSegmentOptions(req);
        export function getSegments(req, useCache: boolean, appId: number, callback: (err: errors.APIError, segments?: Array<Segment>) => void);
    }
}

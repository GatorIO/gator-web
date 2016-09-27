/// <reference path="../gator-api/gator-api.d.ts" />

declare module 'gator-web' {
    import api = require('gator-api');

    export interface IBranding {
        productName: string;
        companyName: string;
        scriptName: string;
        logoDarkBackground: string;
        logoLightBackground: string;
        logoMenu: string;
        logoMenuSmall: string;
        supportEmail: string;
        salesEmail: string;
        salesPhone: string;
        address1: string;
        address2: string;
        primaryColor: string;
        signupUrl: string;
        postSignupUrl: string;
        loginUrl: string;
        postLoginUrl: string;
    }

    //  Dashboard pod
    export class Pod {
        display: string;
        title: string;
        state: Object;
    }

    export class Dashboard {
        createdDate: any;
        pods: Array<string>;
    }

    export function flash(options);
    export function renderError(req, res, message);

    export class MenuLink {
        public title: string;
        public url: string;
        constructor(title: string, url: string);
    }

    export class MenuItem {
        public title: string;
        public iconClass: string;
        public link: MenuLink;
        public subItems: Array<MenuItem>;
        public target: string;
        constructor(title: string, iconClass: string, link: MenuLink, item);
    }

    export interface Report {
        description?: string;
        options: Object;
    }

    export interface Reports {
        Types: Object;
        definitions: Array<Report>;
    }

    export interface IApplication {
        settings: api.ISettings;
        api: any;
        current: any;
        branding: IBranding;
        projectTypes: Object;
        projectDesc(type): string;
        defaultDashboard(type): Object;
        menuItems(user, account, project): Array<MenuItem>;
        enforceSecure(req, res, next: Function);
        statusCheck(req, res, next: Function);
        reports: Reports;
    }

    export var trackingProjectId: number;

    module routes {
        export function setup(app, application, callback);

        module apiRoutes {
            export function setup(app, application, callback);
        }

        module accessTokenRoutes {
            export function setup(app, application, callback);
        }

        module paymentRoutes {
            export function setup(app, application, callback);
        }

        module bookmarkRoutes {
            export function setup(app, application, callback);
        }

        module projectRoutes {
            export function setup(app, application, callback);
        }

        module dashboardRoutes {
            export function setup(app, application, callback);
        }

        module reportingRoutes {
            export function setup(app, application, callback);
        }

        module emailRoutes {
            export function setup(app, application, callback);
        }
    }
}


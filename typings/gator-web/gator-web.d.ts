
declare module 'gator-web' {

    export class Branding {
        productName: string;
        companyName: string;
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

    export function flash(type, msg);
    export function renderError(req, res, message);
}

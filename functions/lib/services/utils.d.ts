import { Response } from 'express';
interface ApiFunctions {
    badRequest: (response: Response, message?: string, code?: string) => Response;
    notFound: (response: Response, message?: string) => Response;
    error: (response: Response, message?: string, code?: string) => Response;
    send: (response: Response, data?: any) => Response;
    redirect: (response: Response, data?: any) => Response;
    forbidden: (response: Response, message?: string, code?: string) => Response;
    unauthorized: (response: Response, message?: string, code?: string) => Response;
}
export declare const api: ApiFunctions;
export declare const parseToken: (bearer: string | undefined) => string | null;
export declare const authorize: (req: any, res: Response, next: any, userService: any, admin: any) => Promise<any>;
export declare const createUserObject: (user: any, userService: any) => any;
export declare const fetchEmail: (text: string | undefined) => string | undefined;
export declare const fetchSenderName: (text: string | undefined) => string | undefined;
export declare const dateStringToTimestamp: (date: string) => number;
export declare const timestampToString: (date: number) => string;
export declare const readBase64String: (text: string) => string;
export declare const purgeHtml: (html: string) => string;
export declare const compareMessages: (message1: any, message2: any) => boolean;
export declare const jsonify: (object: any) => any;
export {};
//# sourceMappingURL=utils.d.ts.map
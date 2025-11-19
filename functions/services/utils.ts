import User from '../models/User';
import { logger } from './logger';
import { Response } from 'express';

const COMMON_ERROR = 'Common error';
const NOT_FOUND = 'Object not found';
const APPLICATION_JSON = 'application/json';
const CONTENT_TYPE = 'Content-Type';

interface ApiResponse {
  code: string;
  data?: any;
  error?: {
    code: string;
    message: string;
  };
}

interface ApiFunctions {
  badRequest: (response: Response, message?: string, code?: string) => Response;
  notFound: (response: Response, message?: string) => Response;
  error: (response: Response, message?: string, code?: string) => Response;
  send: (response: Response, data?: any) => Response;
  redirect: (response: Response, data?: any) => Response;
  forbidden: (response: Response, message?: string, code?: string) => Response;
  unauthorized: (response: Response, message?: string, code?: string) => Response;
}

export const api: ApiFunctions = {
  badRequest: (response: Response, message: string = '', code: string = 'BAD_REQUEST'): Response => response
    .header(CONTENT_TYPE, APPLICATION_JSON)
    .status(400).send({ error: { code, message } }),
  notFound: (response: Response, message: string = ''): Response => response
    .header(CONTENT_TYPE, APPLICATION_JSON)
    .status(404).send({ error: { code: 'NOT_FOUND', message: (message || NOT_FOUND) } }),
  error: (response: Response, message: string = '', code: string = COMMON_ERROR): Response => response
    .header(CONTENT_TYPE, APPLICATION_JSON)
    .status(500).send({ error: { code, message } }),
  send: (response: Response, data: any = {}): Response => response
    .header(CONTENT_TYPE, APPLICATION_JSON)
    .status(200).send({ code: 'OK', data }),
  redirect: (response: Response, data: any = {}): Response => response
    .header(CONTENT_TYPE, APPLICATION_JSON)
    .status(301).send({ code: 'REDIRECT', data }),
  forbidden: (response: Response, message: string = '', code: string = 'FORBIDDEN'): Response => response
    .header(CONTENT_TYPE, APPLICATION_JSON)
    .status(403).send({ error: { code, message } }),
  unauthorized: (response: Response, message: string = '', code: string = 'UNAUTHORIZED'): Response => response
    .header(CONTENT_TYPE, APPLICATION_JSON)
    .status(401).send({ error: { code, message } }),
};

export const parseToken = (bearer: string | undefined): string | null => {
  if (!bearer) {
    return null;
  }

  if (bearer.startsWith('Bearer')) {
    return bearer.substring(7);
  }
  return null;
}

export const authorize = async (req: any, res: Response, next: any, userService: any, admin: any): Promise<any> => {
  if (!req.headers.authorization) {
    if (!next) {
      return Promise.reject(new Error('MISSING_AUTH_HEADER'));
    }
    return api.forbidden(res);
  }

  const jwt = parseToken(req.headers.authorization.trim());

  logger.info(`jwt found : ${(jwt ? 'yes' : 'no')}`);
  try {
    const claims = await admin.auth().verifyIdToken(jwt as string);
    let user = await userService.find(claims.uid);

    if (!user) {
      logger.info(`User with id ${claims.uid} logged in but the object is not in the DB. Creating the necessary objects.`)
      user = createUserObject(claims, userService);
    }

    req.user = user;
  } catch (err: any) {
    if (err.code === 'auth/argument-error') return api.unauthorized(res, 'Token has expired');
    throw new Error(err.message)
  }

  if (next) return next();
}

export const createUserObject = (user: any, userService: any): any => {
  const userObject = new User(user.uid, user.email);
  logger.info('creating user : ', userObject);

  userService.createUser(userObject);
  return userObject;
}

export const fetchEmail = (text: string | undefined): string | undefined => {
  const EMAIL_REGEX = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;

  if (!text) return;
  const matches = text.match(EMAIL_REGEX);
  return matches ? matches[0] : undefined;
}

export const fetchSenderName = (text: string | undefined): string | undefined => {
  const SENDER_NAME_REGEX = /([\w\s]*\s+)</gi;

  if (!text) return;
  const match = SENDER_NAME_REGEX.exec(text);
  if (!match) return;
  return match[match.length - 1];
}

export const dateStringToTimestamp = (date: string): number => {
  // Note: moment is not imported, so this will need to be fixed
  return new Date(date).getTime();
}

export const timestampToString = (date: number): string => {
  // Note: moment is not imported, so this will need to be fixed
  return new Date(date).toLocaleString();
}

export const readBase64String = (text: string): string => {
  return Buffer.from(text, 'base64').toString();
}

export const purgeHtml = (html: string): string => html.replace(/[\s]/gi, '');
export const compareMessages = (message1: any, message2: any): boolean => message1.id === message2.id;
export const jsonify = (object: any): any => JSON.parse(JSON.stringify(object));

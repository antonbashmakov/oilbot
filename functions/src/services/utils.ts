import * as moment from 'moment';
import User from '../models/User';
import { logger } from './logger';

// Constants
const COMMON_ERROR = 'Common error';
const NOT_FOUND = 'Object not found';
const APPLICATION_JSON = 'application/json';
const CONTENT_TYPE = 'Content-Type';

// Interface for Express response object
interface ExpressResponse {
  header(field: string, value: string): ExpressResponse;
  status(code: number): ExpressResponse;
  send(data: any): ExpressResponse;
}

// Interface for Express request object
interface ExpressRequest {
  headers: {
    authorization?: string;
  };
  user?: User;
}

// Interface for Firebase Admin
interface FirebaseAdmin {
  auth(): {
    verifyIdToken(token: string): Promise<any>;
  };
}

// Interface for User Service
interface UserService {
  find(id: string): Promise<User | undefined>;
  createUser(user: User): Promise<any>;
}

export const api = {
  badRequest: (response: ExpressResponse, message: string = '', code: string = 'BAD_REQUEST'): ExpressResponse => response
    .header(CONTENT_TYPE, APPLICATION_JSON)
    .status(400).send({ error: { code, message } }),
  
  notFound: (response: ExpressResponse, message: string = ''): ExpressResponse => response
    .header(CONTENT_TYPE, APPLICATION_JSON)
    .status(404).send({ error: { code: 'NOT_FOUND', message: (message || NOT_FOUND) } }),
  
  error: (response: ExpressResponse, message: string = '', code: string = COMMON_ERROR): ExpressResponse => response
    .header(CONTENT_TYPE, APPLICATION_JSON)
    .status(500).send({ error: { code, message } }),
  
  send: (response: ExpressResponse, data: any = {}): ExpressResponse => response
    .header(CONTENT_TYPE, APPLICATION_JSON)
    .status(200).send({ code: 'OK', data }),
  
  redirect: (response: ExpressResponse, data: any = {}): ExpressResponse => response
    .header(CONTENT_TYPE, APPLICATION_JSON)
    .status(301).send({ code: 'REDIRECT', data }),
  
  forbidden: (response: ExpressResponse, message: string = '', code: string = 'FORBIDDEN'): ExpressResponse => response
    .header(CONTENT_TYPE, APPLICATION_JSON)
    .status(403).send({ error: { code, message } }),
  
  unauthorized: (response: ExpressResponse, message: string = '', code: string = 'UNAUTHORIZED'): ExpressResponse => response
    .header(CONTENT_TYPE, APPLICATION_JSON)
    .status(401).send({ error: { code, message } }),
};

export const jsonify = (object: any): any => JSON.parse(JSON.stringify(object));

export const parseToken = (bearer: string | undefined): string | null => {
  if (!bearer) {
    return null;
  }

  if (bearer.startsWith('Bearer')) {
    return bearer.substring(7);
  }
  return null;
}

export const createUserObject = (user: any, userService: UserService): User => {
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

export const dateStringToTimestamp = (date: string): number => moment(new Date(date)).valueOf();
export const timestampToString = (date: number): string => moment(date).format('llll');
export const readBase64String = (text: string): string => `${Buffer.from(text, 'base64')}`;
export const purgeHtml = (html: string): string => html.replace(/[\s]/gi, '');

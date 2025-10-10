

import User from '../models/User.js';
import { logger } from './logger.js';

const COMMON_ERROR = 'Common error';
const NOT_FOUND = 'Object not found';
const APPLICATION_JSON = 'application/json';
const CONTENT_TYPE = 'Content-Type'; // or require('fs') with sync methods


export const api = {
    badRequest: (response, message = '', code = 'BAD_REQUEST',) => response
        .header(CONTENT_TYPE, APPLICATION_JSON)
        .status(400).send({ error: { code, message } }),
    notFound: (response, message = '') => response
        .header(CONTENT_TYPE, APPLICATION_JSON)
        .status(404).send({ error: { code: 'NOT_FOUND', message: (message || NOT_FOUND) } }),
    error: (response, message = '', code = COMMON_ERROR) => response
        .header(CONTENT_TYPE, APPLICATION_JSON)
        .status(500).send({ error: { code, message } }),
    send: (response, data = {}) => response
        .header(CONTENT_TYPE, APPLICATION_JSON)
        .status(200).send({ code: 'OK', data }),
    redirect: (response, data = {}) => response
        .header(CONTENT_TYPE, APPLICATION_JSON)
        .status(301).send({ code: 'REDIRECT', data }),
    forbidden: (response, message = '', code = 'FORBIDDEN') => response
        .header(CONTENT_TYPE, APPLICATION_JSON)
        .status(403).send({ error: { code, message } }),
    unauthorized: (response, message = '', code = 'UNAUTHORIZED') => response
        .header(CONTENT_TYPE, APPLICATION_JSON)
        .status(401).send({ error: { code, message } }),
};


export const parseToken = (bearer) => {
    if (!bearer) {
        return null;
    }

    if (bearer.startsWith('Bearer')) {
        return bearer.substring(7);
    }
    return null;
}


export const authorize = async (req, res, next, userService, admin) => {

    if (!req.headers.authorization) {
        if (!next) {
            return Promise.reject(new Error('MISSING_AUTH_HEADER'));
        }
        return api.forbidden(res);
    }

    const jwt = parseToken(req.headers.authorization.trim());

    logger.info(`jwt found : ${(jwt ? 'yes' : 'no')}`);
    try {
        const claims = await admin.auth().verifyIdToken(jwt);
        let user = await userService.find(claims.uid);

        if (!user) {
            logger.log(`User with id ${claims.uid} logged in but the object is not in the DB. Creating the necessary objects.`)
            user = createUserObject(claims, userService);
        }

        req.user = user;
    } catch (err) {
        if (err.code === 'auth/argument-error') return api.unauthorized(res, 'Token has expired');
        throw new Error(err.message)
    }

    if (next) return next();
}

export const createUserObject = (user, userService) => {
    const userObject = new User(user.uid, user.email);
    logger.info('creating user : ', userObject);

    userService.createUser(userObject);
    return userObject;
}


export const fetchEmail = (text) => {
    const EMAIL_REGEX = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;

    if (!text) return;
    return text.match(EMAIL_REGEX)[0];
}
export const fetchSenderName = (text) => {
    const SENDER_NAME_REGEX = /([\w\s]*\s+)</gi;

    if (!text) return;
    const match = SENDER_NAME_REGEX.exec(text);
    if (!match) return;
    return match[match.length - 1];
}
export const dateStringToTimestamp = (date) => moment(new Date(date)).valueOf();
export const timestampToString = (date) => moment(date).format('llll');
export const readBase64String = (text) => `${new Buffer.from(text, 'base64')}`;
export const purgeHtml = (html) => html.replace(/[\s]/gi, '');
export const compareMessages = (message1, message2) => message1.id === message2.id;

export const jsonify = (object) => JSON.parse(JSON.stringify(object));
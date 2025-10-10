/* eslint-disable */
import functions from 'firebase-functions';
import admin from 'firebase-admin';
admin.initializeApp();

import db from './controllers/db/db.js';
import publicApi from './controllers/public/public.js';
const pub = functions.https.onRequest(publicApi);

/*

import privateApi from './controllers/private/private.js';
import adminApi from './controllers/admin/admin.js';

const adminEndpoint = functions.https.onRequest(adminApi);

const priv = functions.https.onRequest(privateApi);

export const onUserCreated = db.onUserCreated;
export const onMessageCreated = db.onMessageCreated;
export const resubscribeToGmailScheduled = db.resubscribeToGmailScheduled;

export { priv as private, pub as public, adminEndpoint as admin};
*/

export {  pub as public};


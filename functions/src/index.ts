import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

import publicApi from './controllers/public/public';
const pub = functions.https.onRequest(publicApi);

export { pub as public };


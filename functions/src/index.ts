import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

import publicApi from './controllers/public/public';
import adminApi from './controllers/admin';

const pub = functions.https.onRequest(publicApi);
const adm = functions.https.onRequest(adminApi);

export { pub as public, adm as admin };


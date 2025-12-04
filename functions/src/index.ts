import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

import publicApi from "./controllers/private/private";
import adminApi from "./controllers/admin";
import webhookApi from "./controllers/webhook";
import {publicApi as newPublicApi} from "./controllers/public";
import {db} from "./controllers/db";

export const processOutboxEvent = db.processOutboxEvent;

const priv = functions.https.onRequest(publicApi);
const adm = functions.https.onRequest(adminApi);
const webhooks = functions.https.onRequest(webhookApi);
const pub = functions.https.onRequest(newPublicApi);

export {priv as private, adm as admin, webhooks as webhooks, pub as public};

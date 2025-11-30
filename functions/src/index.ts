import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

import publicApi from "./controllers/private/private";
import adminApi from "./controllers/admin";
import {db} from "./controllers/db";

export const processOutboxEvent = db.processOutboxEvent;

const priv = functions.https.onRequest(publicApi);
const adm = functions.https.onRequest(adminApi);

export {priv as private, adm as admin};


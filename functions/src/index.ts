import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

import privateApi from "./controllers/private/private";
import adminApi from "./controllers/admin";
import webhookApi from "./controllers/webhook";
import {publicApi} from "./controllers/public";
import {db} from "./controllers/db";

export const processOutboxEvent = db.processOutboxEvent;

const webhooks = functions.https.onRequest(webhookApi);

const priv = functions.https.onRequest((req, res) => {
  // Remove /api/public from the request path so Express router sees correct routes
  if (req.path.startsWith("/api/private")) {
    req.url = req.url.replace(/^\/api\/private/, "");
  }
  return privateApi(req, res);
}
);
const adm = functions.https.onRequest((req, res) => {
  // Remove /api/public from the request path so Express router sees correct routes
  if (req.path.startsWith("/api/admin")) {
    req.url = req.url.replace(/^\/api\/admin/, "");
  }
  return adminApi(req, res);
});
const pub = functions.https.onRequest((req, res) => {
  // Remove /api/public from the request path so Express router sees correct routes
  if (req.path.startsWith("/api/public")) {
    req.url = req.url.replace(/^\/api\/public/, "");
  }
  return publicApi(req, res);
});

export {priv as private, adm as admin, webhooks as webhooks, pub as public};

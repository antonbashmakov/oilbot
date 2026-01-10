import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

import privateApi from "./controllers/private/private";
import adminApi from "./controllers/admin";
import agentApi from "./controllers/agent";
import webhookApi from "./controllers/webhook";
import {publicApi} from "./controllers/public";
import {db} from "./controllers/db";

export const processOutboxEvent = db.processOutboxEvent;
export const processSubscriptionsDaily = db.processSubscriptionsDaily;

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

const agnt = functions.https.onRequest((req, res) => {
  // Remove /api/agent from the request path so Express router sees correct routes
  if (req.path.startsWith("/api/agent")) {
    req.url = req.url.replace(/^\/api\/agent/, "");
  }
  return agentApi(req, res);
});

let api: functions.HttpsFunction | undefined;
if (process.env.FUNCTIONS_EMULATOR) {
  api = functions.https.onRequest((req, res) => {
    // Remove /api/public from the request path so Express router sees correct routes
    if (req.path.startsWith("/api/public") || req.path.startsWith("/public")) {
      req.url = req.url.replace(/^\/(api\/)?public/, "");
      return publicApi(req, res);
    }
    if (req.path.startsWith("/api/private") || req.path.startsWith("/private")) {
      req.url = req.url.replace(/^\/(api\/)?private/, "");
      return privateApi(req, res);
    }
    if (req.path.startsWith("/api/admin") || req.path.startsWith("/admin")) {
      req.url = req.url.replace(/^\/(api\/)?admin/, "");
      return adminApi(req, res);
    }
    if (req.path.startsWith("/api/agent") || req.path.startsWith("/agent")) {
      req.url = req.url.replace(/^\/(api\/)?agent/, "");
      return agentApi(req, res);
    }
    throw res.status(404).send("No such function found");
  });
}

export {priv as private, adm as admin, webhooks as webhooks, pub as public, agnt as agent};

if (api) {
  exports.api = api;
}

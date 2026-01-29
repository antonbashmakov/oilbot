import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import {toProcessor} from "../../services/events/factory";
import {ChargeSubscriptionEvent, OutboxEvent, Subscription} from "../../models";
import {logger} from "../../services/logger";
import SubscriptionService from "../../services/SubscriptionService";
import EventPublisher from "../../services/EventPublisher";
import TelegramService from "../../services/TelegramService";
import MockTelegramService from "../../services/MockTelegramService";
import {error} from "firebase-functions/logger";
import * as CONSTANTS from "../../constants";
import {toMessage} from "../../messaging/util";


export {
  functions,
  admin,
  toProcessor,
  ChargeSubscriptionEvent,
  OutboxEvent,
  Subscription,
  logger,
  SubscriptionService,
  EventPublisher,
  CONSTANTS,
  TelegramService,
  toMessage,
  error,
};

if (process.env.GCLOUD_PROJECT === "test-project") {
  exports.TelegramService = MockTelegramService;
}

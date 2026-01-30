import { BroadcastTask, BroadcastResult, Customer } from "../models";
import CustomerService from "./CustomerService";
import TelegramService from "./TelegramService";
import BroadcastResultService from "./BroadcastResultService";
import BroadcastTaskService from "./BroadcastTaskService";
import { Firestore } from "firebase-admin/firestore";
import MockTelegramService from "./MockTelegramService";

export {
  CustomerService,
  TelegramService,
  BroadcastResultService,
  BroadcastTaskService,
  Firestore,
  BroadcastTask,
  BroadcastResult,
  Customer,
};


if (process.env.GCLOUD_PROJECT === "test-project") {
  exports.TelegramService = MockTelegramService;
}

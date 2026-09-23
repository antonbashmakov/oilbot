import * as functions from "firebase-functions";
import * as express from "express";
import * as admin from "firebase-admin";
import * as cors from "cors";
import { readFile }  from 'node:fs/promises';

import DeliveryService from "../../services/DeliveryService";
import ChatService from "../../services/ChatService";
import ChatbotService from "../../services/ChatbotService";
import ItemService from "../../services/ItemService";
import CustomerService from "../../services/CustomerService";
import CartItemService from "../../services/CartItemService";
import OrderService from "../../services/OrderService";
import UserService from "../../services/UserService";
import PaymentService from "../../services/PaymentService";
import IdempotencyGuardService from "../../services/IdempotencyGuardService";
import TBankService from "../../services/payments/TBankService";
import SubscriptionService from "../../services/SubscriptionService";
import CustomerBalanceService from "../../services/CustomerBalanceService";
import * as CONSTANTS from "../../constants";
import OrderPickingService from "../../services/OrderPickingService";

import {api} from "../../services/utils";
import MockTBankService from "../../services/payments/MockTBankService";

import MockEventPublisher from "../../services/MockEventPublisher";
import EventPublisher from "../../services/EventPublisher";
import {OilAgentMessage}  from "../../models";


export {
  functions,
  express,
  admin,
  cors,
  api,
  readFile,
  DeliveryService,
  ItemService,
  CustomerService,
  CartItemService,
  OrderService,
  UserService,
  PaymentService,
  IdempotencyGuardService,
  TBankService,
  SubscriptionService,
  CustomerBalanceService,
  EventPublisher,
  OrderPickingService,
  ChatService,
  ChatbotService,
  OilAgentMessage,
  CONSTANTS,
};

if (process.env.GCLOUD_PROJECT === "test-project") {
  exports.TBankService = MockTBankService;
  exports.EventPublisher = MockEventPublisher;
}



import * as moment from "moment";
import * as jwt from "jsonwebtoken";

import {User} from "../models";
import UserService from "./UserService";
import {express} from "../controllers/private/imports";
import {intersection} from "lodash";
import {logger} from "firebase-functions/v1";
import {validate, parse} from "@tma.js/init-data-node";


// Constants
const COMMON_ERROR = "Common error";
const NOT_FOUND = "Object not found";
const APPLICATION_JSON = "application/json";
const CONTENT_TYPE = "Content-Type";

// Interface for Express response object
interface ExpressResponse {
  header(field: string, value: string): ExpressResponse;
  status(code: number): ExpressResponse;
  send(data: any): ExpressResponse;
  end(): ExpressResponse;
}

export const api = {
  badRequest: (response: ExpressResponse, message = "", code = "BAD_REQUEST"): ExpressResponse => response
    .header(CONTENT_TYPE, APPLICATION_JSON)
    .status(400).send({error: {code, message}}),
  paymentRequired: (response: ExpressResponse, message = "", code = "PAYMENT_REQUIRED"): ExpressResponse => response
    .header(CONTENT_TYPE, APPLICATION_JSON)
    .status(402).send({error: {code, message}}),

  notFound: (response: ExpressResponse, message = ""): ExpressResponse => response
    .header(CONTENT_TYPE, APPLICATION_JSON)
    .status(404).send({error: {code: "NOT_FOUND", message: (message || NOT_FOUND)}}),

  error: (response: ExpressResponse, message = "", code: string = COMMON_ERROR): ExpressResponse => response
    .header(CONTENT_TYPE, APPLICATION_JSON)
    .status(500).send({error: {code, message}}),

  send: (response: ExpressResponse, data: any = {}): ExpressResponse => response
    .header(CONTENT_TYPE, APPLICATION_JSON)
    .status(200).send(data),

  ok: (response: ExpressResponse): ExpressResponse => response
    .status(204).end(),

  redirect: (response: ExpressResponse, data: any = {}): ExpressResponse => response
    .header(CONTENT_TYPE, APPLICATION_JSON)
    .status(301).send({code: "REDIRECT", data}),

  forbidden: (response: ExpressResponse, message = "", code = "FORBIDDEN"): ExpressResponse => response
    .header(CONTENT_TYPE, APPLICATION_JSON)
    .status(403).send({error: {code, message}}),

  unauthorized: (response: ExpressResponse, message = "", code = "UNAUTHORIZED"): ExpressResponse => response
    .header(CONTENT_TYPE, APPLICATION_JSON)
    .status(401).send({error: {code, message}}),
};

export const jsonify = (object: any): any => JSON.parse(JSON.stringify(object));

export const parseToken = (bearer: string | undefined): string | null => {
  if (!bearer) {
    return null;
  }

  if (bearer.startsWith("Bearer")) {
    return bearer.substring(7);
  }
  return null;
};

export const fetchEmail = (text: string | undefined): string | undefined => {
  const EMAIL_REGEX = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;

  if (!text) return;
  const matches = text.match(EMAIL_REGEX);
  return matches ? matches[0] : undefined;
};

export const fetchSenderName = (text: string | undefined): string | undefined => {
  const SENDER_NAME_REGEX = /([\w\s]*\s+)</gi;

  if (!text) return;
  const match = SENDER_NAME_REGEX.exec(text);
  if (!match) return;
  return match[match.length - 1];
};

export const dateStringToTimestamp = (date: string): number => moment(new Date(date)).valueOf();
export const timestampToString = (date: number): string => moment(date).format("llll");
export const readBase64String = (text: string): string => `${Buffer.from(text, "base64")}`;
export const purgeHtml = (html: string): string => html.replace(/[\s]/gi, "");

export const generateToken = (user: User): string => {
  return jwt.sign({id: user.id}, process.env.JWT_SECRET as string, {
    expiresIn: "1d",
  });
};

export type ROLE = "ADMIN" | "AGENT";


export const authorize = async (req: express.Request, res: express.Response, next: express.NextFunction, userService: UserService, roles?: ROLE[]) => {
  if (!req.headers.authorization) {
    if (!next) {
      return Promise.reject(new Error("MISSING_AUTH_HEADER"));
    }
    return api.forbidden(res);
  }

  const token = parseToken(req.headers.authorization.trim());

  if (!token) return api.forbidden(res);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };
    const user = await userService.require(decoded.id);
    const intersections = intersection(user.roles, roles);

    if (roles && !intersections.length) return api.forbidden(res);

    (req as any).user = user;
  } catch (err) {
    return res.status(401).json({message: "Invalid token"});
  }

  if (next) return next();
};
export const who = async (req: express.Request, userService: UserService) => {
  if (!req.headers.authorization) {
    return undefined;
  }

  const token = parseToken(req.headers.authorization.trim());

  if (!token) return undefined;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };
    const user = await userService.require(decoded.id);

    return user;
  } catch (err) {
    return undefined;
  }
};


export const verifyTelegramInitData = (initData: string, botToken: string) => {
  logger.info("Verifying Telegram init data:", initData);
  logger.info("Bot token:", botToken);
  try {
    // Validate init data.
    validate(initData, botToken, {
      // We consider init data sign valid for 1 hour from their creation moment.
      expiresIn: 3600111111111,
    });

    const data = parse(initData);

    logger.info("User data:", data.user);

    const jwt = generateToken({id: data.user?.id + ""} as User);

    return {jwt, data};
  } catch (e) {
    return;
  }
};

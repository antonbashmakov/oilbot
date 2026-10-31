import * as moment from "moment";
import * as jwt from "jsonwebtoken";

import {User} from "../models";
import UserService from "./UserService";
import {express} from "../controllers/private/imports";
import {intersection} from "lodash";
import {validate, parse} from "@tma.js/init-data-node";
import * as crypto from "crypto";


// Constants
const COMMON_ERROR = "Common error";
const NOT_FOUND = "Object not found";
const APPLICATION_JSON = "application/json";
const CONTENT_TYPE = "Content-Type";

export type ExternalUser = {
  id: string;
  first_name?: string;
  last_name?: string;
};

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

export type CustomerToken = {
  customerId: string;
};

export const generateCustomerToken = (customerId: string): string => {
  return jwt.sign({customerId} as CustomerToken, process.env.JWT_SECRET as string, {
    expiresIn: "1d",
  });
};

/**
 * Lets a request through only with a customer token (Authorization header or the __session
 * cookie) issued for the customer in the path parameter customerId.
 */
export const authorizeCustomer = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const token = parseToken(req.headers.authorization?.trim()) || req.cookies?.__session;

  if (!token) return api.unauthorized(res);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as Partial<CustomerToken>;

    if (!decoded.customerId) return api.unauthorized(res, "Invalid token");
    if (decoded.customerId !== req.params.customerId) return api.forbidden(res);

    (req as any).customerId = decoded.customerId;
  } catch (err) {
    return api.unauthorized(res, "Invalid token");
  }

  return next();
};


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

export type VerificationResult = {
  jwt: string;
  user: ExternalUser;
};


export const verifyTelegramInitData: (initData: string, botToken: string) => VerificationResult | undefined = (initData: string, botToken: string) => {
  try {
    // Validate init data.
    validate(initData, botToken, {
      // We consider init data sign valid for 1 hour from their creation moment.
      expiresIn: 3600,
    });

    const data = parse(initData);

    const jwt = generateToken({id: data.user?.id + ""} as User);

    return {jwt, user: {id: `${data.user?.id}`, first_name: data.user?.first_name, last_name: data.user?.last_name}};
  } catch (e) {
    return undefined;
  }
};

// Telegram Login Widget data older than this is refused.
const TELEGRAM_LOGIN_MAX_AGE_SECONDS = 24 * 60 * 60;

/**
 * Checks Telegram Login Widget data (core.telegram.org/widgets/login-legacy): hash = hex
 * HMAC-SHA-256 of the sorted "key=value" lines of all other fields, with key SHA-256(bot token);
 * auth_date at most 24 hours old.
 */
export const verifyTelegramLogin = (data: Record<string, unknown>, botToken: string, now = Date.now()): ExternalUser | undefined => {
  const {hash, ...fields} = data;
  if (typeof hash !== "string" || !botToken) return undefined;

  const dataCheckString = Object.keys(fields)
    .filter((key) => fields[key] !== undefined && fields[key] !== null)
    .sort()
    .map((key) => `${key}=${fields[key]}`)
    .join("\n");
  const secret = crypto.createHash("sha256").update(botToken).digest();
  const expected = crypto.createHmac("sha256", secret).update(dataCheckString).digest("hex");

  if (expected.length !== hash.length || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(hash))) return undefined;

  const authDate = Number(fields.auth_date);
  if (!Number.isFinite(authDate) || now / 1000 - authDate > TELEGRAM_LOGIN_MAX_AGE_SECONDS) return undefined;

  return {
    id: `${fields.id}`,
    first_name: typeof fields.first_name === "string" ? fields.first_name : undefined,
    last_name: typeof fields.last_name === "string" ? fields.last_name : undefined,
  };
};

export const verifyVKInitData: (initData: string, botToken: string) => VerificationResult | undefined = (initData: string, secretKey: string) => {
  let sign;

  const queryParams: { key: string, value: string }[] = [];
  const vkUser: ExternalUser = {
    id: "",
  };

  const processQueryParam = (key: string, value: string) => {
    if (typeof value === "string") {
      if (key === "sign") {
        sign = value;
      } else if (key.startsWith("vk_")) {
        queryParams.push({key, value});
      }

      switch (key) {
      case "vk_user_id":
        vkUser.id = value;
        break;
      case "vk_first_name":
        vkUser.first_name = value;
        break;
      case "vk_last_name":
        vkUser.last_name = value;
        break;
      }
    }
  };


  for (const param of initData.split("&")) {
    const [key, value] = param.split("=");
    processQueryParam(key, value);
  }

  if (!sign || queryParams.length === 0) {
    return undefined;
  }
  const queryString = queryParams
    .sort((a, b) => a.key.localeCompare(b.key))
    .reduce((acc, {key, value}, idx) => {
      return acc + (idx === 0 ? "" : "&") + `${key}=${encodeURIComponent(value)}`;
    }, "");

  const paramsHash = crypto
    .createHmac("sha256", secretKey)
    .update(queryString)
    .digest()
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=$/, "");

  const isValid = paramsHash === sign;

  if (!isValid) {
    return undefined;
  }
  const jwt = generateToken({id: vkUser.id} as User);

  return {jwt, user: vkUser};
};



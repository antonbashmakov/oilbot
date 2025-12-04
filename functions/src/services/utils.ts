import * as moment from "moment";
import * as jwt from "jsonwebtoken";
import { User } from "../models";


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
}

export const api = {
  badRequest: (response: ExpressResponse, message = "", code = "BAD_REQUEST"): ExpressResponse => response
    .header(CONTENT_TYPE, APPLICATION_JSON)
    .status(400).send({error: {code, message}}),

  notFound: (response: ExpressResponse, message = ""): ExpressResponse => response
    .header(CONTENT_TYPE, APPLICATION_JSON)
    .status(404).send({error: {code: "NOT_FOUND", message: (message || NOT_FOUND)}}),

  error: (response: ExpressResponse, message = "", code: string = COMMON_ERROR): ExpressResponse => response
    .header(CONTENT_TYPE, APPLICATION_JSON)
    .status(500).send({error: {code, message}}),

  send: (response: ExpressResponse, data: any = {}): ExpressResponse => response
    .header(CONTENT_TYPE, APPLICATION_JSON)
    .status(200).send(data),

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
  return jwt.sign({ id: user.id }, process.env.JWT_SECRET as string, {
    expiresIn: "1d",
  });
}

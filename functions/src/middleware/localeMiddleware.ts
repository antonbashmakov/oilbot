import {Request, Response, NextFunction} from "express";

/**
 * Extended Express Request interface with locale property
 */
export interface LocaleRequest extends Request {
  locale?: string;
}

/**
 * Parse Accept-Language header to extract primary language
 * @param header Accept-Language header value
 * @returns ISO language code (e.g., 'ru', 'en')
 */
const parseAcceptLanguage = (header: string | undefined): string => {
  if (!header) return "ru";

  // Match first language tag (e.g., "ru-RU" or "en" from "ru-RU,ru;q=0.9,en-US;q=0.8")
  const match = header.match(/^([a-z]{2,3}(?:-[A-Z]{2,3})?)/i);
  return match ? match[1].toLowerCase() : "ru";
};

/**
 * Middleware to set locale cookie based on Accept-Language header
 * Sets cookie named 'locale' and adds locale to req.locale
 */
export const localeMiddleware = (
  req: LocaleRequest,
  res: Response,
  next: NextFunction
) => {
  // Parse Accept-Language header
  const acceptLanguage = req.headers["accept-language"];
  const locale = parseAcceptLanguage(acceptLanguage);

  // Note: We're not reading existing cookies to avoid cookie-parser dependency
  // If cookie reading is needed later, we can add cookie-parser

  // Set cookie
  const isProduction = process.env.NODE_ENV === "production";
  res.cookie("locale", locale, {
    httpOnly: false, // Accessible to client-side JavaScript
    secure: isProduction, // HTTPS only in production
    sameSite: "none",
    maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
    path: "/",
  });

  // Make locale available to downstream handlers
  req.locale = locale;

  next();
};

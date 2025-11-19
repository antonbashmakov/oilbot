// logger.ts
import { logger as gcpLogger } from "firebase-functions";
import util from "util";
import chalk from "chalk";

const isProduction = process.env.NODE_ENV === "production";

const prettifyArgs = (args: any[]): any[] => {
  return args.map((arg) =>
    typeof arg === "object" ? util.inspect(arg, false, null, true /* enable colors */) : arg
  );
};

interface Logger {
  info: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
  debug: (...args: any[]) => void;
  log?: (...args: any[]) => void;
}

export const logger: Logger = {
  info(...args: any[]): void {
    if (!isProduction) {
      console.log(chalk.blue("[INFO]"), ...prettifyArgs(args));
    } else {
      gcpLogger.info(...args);
    }
  },
  warn(...args: any[]): void {
    if (!isProduction) {
      console.log(chalk.yellow("[WARN]"), ...prettifyArgs(args));
    } else {
      gcpLogger.warn(...args);
    }
  },
  error(...args: any[]): void {
    if (!isProduction) {
      console.log(chalk.red("[ERROR]"), ...prettifyArgs(args));
    } else {
      gcpLogger.error(...args);
    }
  },
  debug(...args: any[]): void {
    if (!isProduction) {
      console.log(chalk.gray("[DEBUG]"), ...prettifyArgs(args));
    } else {
      gcpLogger.debug(...args);
    }
  },
  log(...args: any[]): void {
    this.info(...args);
  }
};

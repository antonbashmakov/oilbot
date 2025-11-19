// logger.ts
import { logger as gcpLogger } from "firebase-functions";
import util from "util";
import chalk from "chalk";
const isProduction = process.env.NODE_ENV === "production";
const prettifyArgs = (args) => {
    return args.map((arg) => typeof arg === "object" ? util.inspect(arg, false, null, true /* enable colors */) : arg);
};
export const logger = {
    info(...args) {
        if (!isProduction) {
            console.log(chalk.blue("[INFO]"), ...prettifyArgs(args));
        }
        else {
            gcpLogger.info(...args);
        }
    },
    warn(...args) {
        if (!isProduction) {
            console.log(chalk.yellow("[WARN]"), ...prettifyArgs(args));
        }
        else {
            gcpLogger.warn(...args);
        }
    },
    error(...args) {
        if (!isProduction) {
            console.log(chalk.red("[ERROR]"), ...prettifyArgs(args));
        }
        else {
            gcpLogger.error(...args);
        }
    },
    debug(...args) {
        if (!isProduction) {
            console.log(chalk.gray("[DEBUG]"), ...prettifyArgs(args));
        }
        else {
            gcpLogger.debug(...args);
        }
    },
    log(...args) {
        this.info(...args);
    }
};
//# sourceMappingURL=logger.js.map
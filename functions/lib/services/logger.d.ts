interface Logger {
    info: (...args: any[]) => void;
    warn: (...args: any[]) => void;
    error: (...args: any[]) => void;
    debug: (...args: any[]) => void;
    log?: (...args: any[]) => void;
}
export declare const logger: Logger;
export {};
//# sourceMappingURL=logger.d.ts.map
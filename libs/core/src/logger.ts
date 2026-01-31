import * as PinoPkg from 'pino';
import type { Logger as PinoLogger } from 'pino';

// Handle CommonJS/ESM interop without esModuleInterop
const pino = (PinoPkg as any).default || PinoPkg;

export class Logger {
    private static instance: Logger;
    private logger: PinoLogger;

    private constructor() {
        // @ts-ignore - pino function might be inferred incorrectly depending on import
        this.logger = pino({
            level: process.env['LOG_LEVEL'] || 'info',
        });
        // this.logger = {
        //     info: console.log,
        //     error: console.error,
        //     warn: console.warn,
        //     debug: console.debug,
        // } as any;
    }

    public static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    public debug = (message: string, context?: Record<string, any>) => {
        this.logger.debug(context, message);
    }

    public info = (message: string, context?: Record<string, any>) => {
        this.logger.info(context, message);
    }

    public warn = (message: string, context?: Record<string, any>) => {
        this.logger.warn(context, message);
    }

    public error = (message: string, context?: Record<string, any>) => {
        this.logger.error(context, message);
    }
}

export const logger = Logger.getInstance();

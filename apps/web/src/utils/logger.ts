/**
 * Client-side structured logger for FuturaSculptAI Cockpit.
 * Supports configurable log levels, UTC timestamps, and production silencing.
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

export class Logger {
  private level: LogLevel;
  private prefix: string;

  constructor(prefix: string = 'FuturaSculpt', defaultLevel?: LogLevel) {
    this.prefix = prefix;
    if (defaultLevel !== undefined) {
      this.level = defaultLevel;
    } else {
      // In production/test default to WARN; in dev default to DEBUG
      const isDev =
        (typeof import.meta !== 'undefined' && (import.meta as any).env?.MODE === 'development') ||
        (typeof (globalThis as any).process !== 'undefined' && (globalThis as any).process?.env?.NODE_ENV === 'development');
      this.level = isDev ? LogLevel.DEBUG : LogLevel.WARN;
    }
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  getLevel(): LogLevel {
    return this.level;
  }

  private format(severity: string, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${this.prefix}:${severity}] ${message}`;
  }

  debug(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.DEBUG) {
      console.debug(this.format('DEBUG', message), ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.INFO) {
      console.info(this.format('INFO', message), ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.WARN) {
      console.warn(this.format('WARN', message), ...args);
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.ERROR) {
      console.error(this.format('ERROR', message), ...args);
    }
  }
}

export const logger = new Logger('FuturaSculpt');

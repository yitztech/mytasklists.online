// Logs en JSON a stdout (AUDITORIA BE-22 de la plataforma) y registro de errores en Bugsink
// (INT-07). La plataforma recoge stdout con Fluent Bit: https://logs.yunitztech.com
import { randomUUID } from 'node:crypto';
import { LoggerService } from '@nestjs/common';
import * as Sentry from '@sentry/node';

type Level = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

// Fuera de los ternarios: el control de i18n toma sus literales por textos de interfaz
const isText = (value: unknown): value is string => typeof value === 'string';

export function log(level: Level, msg: string, fields: Record<string, unknown> = {}): void {
  process.stdout.write(JSON.stringify({ time: new Date().toISOString(), level, msg, ...fields }) + '\n');
}

/** Logger de Nest: cada `new Logger(ctx).log(...)` sale como una línea JSON con su `context` */
export class JsonLogger implements LoggerService {
  log(message: unknown, ...rest: unknown[]): void {
    this.write('info', message, rest);
  }
  error(message: unknown, ...rest: unknown[]): void {
    this.write('error', message, rest);
  }
  warn(message: unknown, ...rest: unknown[]): void {
    this.write('warn', message, rest);
  }
  debug(message: unknown, ...rest: unknown[]): void {
    if (process.env.NODE_ENV !== 'production') this.write('debug', message, rest);
  }
  verbose(message: unknown, ...rest: unknown[]): void {
    this.debug(message, ...rest);
  }
  fatal(message: unknown, ...rest: unknown[]): void {
    this.write('fatal', message, rest);
  }

  // Nest pasa el contexto como último argumento y, en error(), la traza antes que él
  private write(level: Level, message: unknown, rest: unknown[]): void {
    const args = [...rest];
    const context = args.length && isText(args[args.length - 1]) ? (args.pop() as string) : undefined;
    const nestTrace = level === 'error' && isText(args[0]);
    const stack = nestTrace ? (args.shift() as string) : message instanceof Error ? message.stack : undefined;
    const msg = message instanceof Error ? message.message : isText(message) ? message : JSON.stringify(message);
    log(level, msg, { ...(context && { context }), ...(stack && { stack }) });
  }
}

// Apagado sin SENTRY_DSN (en local y en el CI). Sin datos personales ni trazas de rendimiento.
const dsn = process.env.SENTRY_DSN;
if (dsn) {
  Sentry.init({
    dsn,
    release: process.env.RELEASE_SHA,
    environment: process.env.SENTRY_ENVIRONMENT || 'production',
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false,
      databaseQueryData: false,
      stackFrameVariables: false,
    },
    tracesSampleRate: 0,
  });
}

export function reportError(error: unknown, requestId?: string): void {
  if (!dsn) return;
  Sentry.withScope((scope) => {
    if (requestId) scope.setTag('requestId', requestId);
    Sentry.captureException(error);
  });
}

// X-Request-ID del gateway si parece un identificador; si no, uno nuevo
const REQUEST_ID = /^[A-Za-z0-9._-]{1,128}$/;
export function requestId(header: unknown): string {
  return isText(header) && REQUEST_ID.test(header) ? header : randomUUID();
}

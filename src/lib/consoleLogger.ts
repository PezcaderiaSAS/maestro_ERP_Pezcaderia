import type { IDataService } from '../types/services.types';

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

type LogFn = (accion: string, contexto?: unknown) => void;

export interface Logger {
  info: LogFn;
  warn: LogFn;
  error: LogFn;
  debug: LogFn;
  table: (accion: string, data: unknown[]) => void;
  traceStart: (accion: string) => void;
  traceEnd: (accion: string) => void;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

const MODULE_LEVELS: Record<string, LogLevel> = {
  DataService: 'DEBUG',
  localDb: 'DEBUG',
  Store: 'DEBUG',
  POSCart: 'INFO',
  POSPrinter: 'INFO',
  Balanza: 'INFO',
  App: 'INFO',
  POS: 'INFO',
  CashFlow: 'INFO',
  TEST: 'INFO',
};

const COLORS: Record<LogLevel, string> = {
  DEBUG: '#888',
  INFO: '#0a7',
  WARN: '#f80',
  ERROR: '#e33',
};

const ICONS: Record<LogLevel, string> = {
  DEBUG: '🔍',
  INFO: '📋',
  WARN: '⚠️',
  ERROR: '❌',
};

export let sessionId = '';

export function initLogger(): void {
  try {
    const stored = sessionStorage.getItem('logger_session_id');
    if (stored) {
      sessionId = stored;
    } else {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('logger_session_id', sessionId);
    }
  } catch {
    sessionId = crypto.randomUUID();
  }
}

let _enabledOverrides: Set<string> | null = null;
let _lastDebugValue: string | null = null;

function isModuleEnabled(modulo: string): boolean {
  if (typeof globalThis !== 'undefined' && (globalThis as any).__LOGGER_ENABLED__ === false) {
    return false;
  }
  const inDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV === true;
  if (!inDev) {
    const debugVal = (typeof localStorage !== 'undefined') ? localStorage.getItem('debug') : null;
    if (!debugVal) return false;
    if (_lastDebugValue !== debugVal) {
      _lastDebugValue = debugVal;
      _enabledOverrides = new Set(debugVal.split(',').map(s => s.trim()).filter(Boolean));
    }
    return _enabledOverrides!.has(modulo);
  }
  return true;
}

function getModuleLevel(modulo: string): LogLevel {
  return MODULE_LEVELS[modulo] ?? 'INFO';
}

export function safeStringify(obj: unknown): string {
  const seen = new WeakSet<object>();
  return JSON.stringify(obj, (_key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) return '[Circular]';
      seen.add(value);
    }
    if (typeof value === 'bigint') return value.toString();
    if (value instanceof Error) return { message: value.message, stack: value.stack, name: value.name };
    if (value instanceof Date) return value.toISOString();
    if (value instanceof Map || value instanceof Set) return Array.from(value);
    return value;
  }, 2);
}

export function createLogger(modulo: string): Logger {
  const moduleLevel = getModuleLevel(modulo);
  const moduleThreshold = LOG_LEVELS[moduleLevel];

  function shouldLog(level: LogLevel): boolean {
    if (!isModuleEnabled(modulo)) return false;
    return LOG_LEVELS[level] >= moduleThreshold;
  }

  function log(
    level: LogLevel,
    accion: string,
    contexto?: unknown,
  ): void {
    if (!shouldLog(level)) return;

    const color = COLORS[level];
    const icon = ICONS[level];
    const ts = new Date().toISOString();

    console.groupCollapsed(
      `%c${icon} [${modulo}] ${accion}`,
      `color:${color};font-weight:bold;`,
    );
    console.info(`sessionId: ${sessionId}`);
    console.info(`timestamp: ${ts}`);
    console.info(`level: ${level}`);
    console.info(`module: ${modulo}`);

    if (contexto !== undefined) {
      try {
        const safe = safeStringify(contexto);
        console.info('context:', safe);
      } catch {
        console.info('context: [unable to serialize]');
      }
      console.dir(contexto);
    }

    console.groupEnd();
  }

  return {
    info: (accion, contexto) => log('INFO', accion, contexto),
    warn: (accion, contexto) => log('WARN', accion, contexto),
    error: (accion, contexto) => log('ERROR', accion, contexto),
    debug: (accion, contexto) => log('DEBUG', accion, contexto),
    table: (accion, data) => {
      if (shouldLog('INFO')) {
        console.groupCollapsed(`📊 [${modulo}] ${accion}`);
        console.table(data);
        console.groupEnd();
      }
    },
    traceStart: (accion) => {
      if (shouldLog('DEBUG')) {
        performance.mark(`${modulo}:${accion}:start`);
      }
    },
    traceEnd: (accion) => {
      if (shouldLog('DEBUG')) {
        const startMark = `${modulo}:${accion}:start`;
        performance.measure(`${modulo}:${accion}`, startMark);
        console.debug(`⏱ [${modulo}] ${accion}`, performance.getEntriesByName(`${modulo}:${accion}`).pop());
        performance.clearMarks(startMark);
      }
    },
  };
}

export class LoggableDataService implements IDataService {
  readonly mode: IDataService['mode'];
  private inner: IDataService;
  private log: Logger;

  constructor(inner: IDataService) {
    this.inner = inner;
    this.mode = inner.mode;
    this.log = createLogger('DataService');
  }

  async getAll<T>(table: string): Promise<T[]> {
    this.log.debug(`getAll(${table})`);
    const start = performance.now();
    try {
      const result = await this.inner.getAll<T>(table);
      this.log.debug(`getAll(${table}) OK`, { count: result.length, ms: Math.round(performance.now() - start) });
      return result;
    } catch (e) {
      this.log.error(`getAll(${table}) FAIL`, { error: e instanceof Error ? e.message : e, ms: Math.round(performance.now() - start) });
      throw e;
    }
  }

  async getById<T>(table: string, id: string): Promise<T | null> {
    this.log.debug(`getById(${table}, ${id})`);
    const start = performance.now();
    try {
      const result = await this.inner.getById<T>(table, id);
      this.log.debug(`getById(${table}) OK`, { found: result !== null, ms: Math.round(performance.now() - start) });
      return result;
    } catch (e) {
      this.log.error(`getById(${table}) FAIL`, { id, error: e instanceof Error ? e.message : e, ms: Math.round(performance.now() - start) });
      throw e;
    }
  }

  async create<T>(table: string, data: Partial<T>): Promise<T> {
    this.log.debug(`create(${table})`, { data });
    const start = performance.now();
    try {
      const result = await this.inner.create<T>(table, data);
      this.log.debug(`create(${table}) OK`, { id: (result as any)?.id, ms: Math.round(performance.now() - start) });
      return result;
    } catch (e) {
      this.log.error(`create(${table}) FAIL`, { error: e instanceof Error ? e.message : e, ms: Math.round(performance.now() - start) });
      throw e;
    }
  }

  async update<T>(table: string, id: string, data: Partial<T>): Promise<T> {
    this.log.debug(`update(${table}, ${id})`, { data });
    const start = performance.now();
    try {
      const result = await this.inner.update<T>(table, id, data);
      this.log.debug(`update(${table}) OK`, { id, ms: Math.round(performance.now() - start) });
      return result;
    } catch (e) {
      this.log.error(`update(${table}) FAIL`, { id, error: e instanceof Error ? e.message : e, ms: Math.round(performance.now() - start) });
      throw e;
    }
  }

  async softDelete(table: string, id: string): Promise<void> {
    this.log.debug(`softDelete(${table}, ${id})`);
    const start = performance.now();
    try {
      await this.inner.softDelete(table, id);
      this.log.debug(`softDelete(${table}) OK`, { id, ms: Math.round(performance.now() - start) });
    } catch (e) {
      this.log.error(`softDelete(${table}) FAIL`, { id, error: e instanceof Error ? e.message : e, ms: Math.round(performance.now() - start) });
      throw e;
    }
  }

  async hardDelete(table: string, id: string): Promise<void> {
    this.log.debug(`hardDelete(${table}, ${id})`);
    const start = performance.now();
    try {
      await this.inner.hardDelete(table, id);
      this.log.debug(`hardDelete(${table}) OK`, { id, ms: Math.round(performance.now() - start) });
    } catch (e) {
      this.log.error(`hardDelete(${table}) FAIL`, { id, error: e instanceof Error ? e.message : e, ms: Math.round(performance.now() - start) });
      throw e;
    }
  }

  async query<T>(table: string, options: import('../types/services.types').QueryOptions): Promise<T[]> {
    this.log.debug(`query(${table})`, { filters: options.filters?.length, orderBy: options.orderBy });
    const start = performance.now();
    try {
      const result = await this.inner.query<T>(table, options);
      this.log.debug(`query(${table}) OK`, { count: result.length, ms: Math.round(performance.now() - start) });
      return result;
    } catch (e) {
      this.log.error(`query(${table}) FAIL`, { error: e instanceof Error ? e.message : e, ms: Math.round(performance.now() - start) });
      throw e;
    }
  }

  async getDbMode(): Promise<'local' | 'supabase' | 'dual'> {
    return this.inner.getDbMode();
  }

  async setDbMode(mode: 'local' | 'supabase' | 'dual'): Promise<void> {
    return this.inner.setDbMode(mode);
  }
}

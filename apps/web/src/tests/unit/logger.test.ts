import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Logger, LogLevel, logger } from '../../utils/logger';

describe('Logger', () => {
  let consoleDebugSpy: ReturnType<typeof vi.spyOn>;
  let consoleInfoSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes with default prefix and log level', () => {
    const defaultLog = new Logger();
    expect(defaultLog.getLevel()).toBe(LogLevel.WARN);
    expect(logger.getLevel()).toBe(LogLevel.WARN);
  });

  it('initializes with development mode debug level when process.env.NODE_ENV is development', () => {
    const originalProcess = (globalThis as any).process;
    (globalThis as any).process = { env: { NODE_ENV: 'development' } };
    try {
      const devLog = new Logger('DevTest');
      expect(devLog.getLevel()).toBe(LogLevel.DEBUG);
    } finally {
      (globalThis as any).process = originalProcess;
    }
  });

  it('allows explicit defaultLevel in constructor and setLevel', () => {
    const customLog = new Logger('Custom', LogLevel.INFO);
    expect(customLog.getLevel()).toBe(LogLevel.INFO);

    customLog.setLevel(LogLevel.ERROR);
    expect(customLog.getLevel()).toBe(LogLevel.ERROR);
  });

  it('respects DEBUG log level filtering', () => {
    const testLog = new Logger('DebugTest', LogLevel.DEBUG);
    testLog.debug('Debug message', { meta: 1 });
    testLog.info('Info message');
    testLog.warn('Warn message');
    testLog.error('Error message');

    expect(consoleDebugSpy).toHaveBeenCalledTimes(1);
    expect(consoleInfoSpy).toHaveBeenCalledTimes(1);
    expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
  });

  it('filters out messages below current severity', () => {
    const testLog = new Logger('WarnTest', LogLevel.WARN);
    testLog.debug('Ignored debug');
    testLog.info('Ignored info');
    testLog.warn('Active warn');
    testLog.error('Active error');

    expect(consoleDebugSpy).not.toHaveBeenCalled();
    expect(consoleInfoSpy).not.toHaveBeenCalled();
    expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
  });

  it('silences all messages when level is NONE', () => {
    const silentLog = new Logger('Silent', LogLevel.NONE);
    silentLog.debug('Ignored');
    silentLog.info('Ignored');
    silentLog.warn('Ignored');
    silentLog.error('Ignored');

    expect(consoleDebugSpy).not.toHaveBeenCalled();
    expect(consoleInfoSpy).not.toHaveBeenCalled();
    expect(consoleWarnSpy).not.toHaveBeenCalled();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});


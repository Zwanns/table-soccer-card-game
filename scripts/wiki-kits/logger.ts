export type WikiKitsLogLevel = 'debug' | 'info' | 'warn' | 'error';

export type WikiKitsLogger = {
  debug(message: string): void;
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
};

type LoggerOptions = {
  debugEnabled?: boolean;
};

export function createWikiKitsLogger(options: LoggerOptions = {}): WikiKitsLogger {
  const write = (level: WikiKitsLogLevel, message: string): void => {
    if (level === 'debug' && options.debugEnabled !== true) {
      return;
    }

    const line = `[wiki-kits] ${message}`;

    if (level === 'error') {
      console.error(line);
      return;
    }

    if (level === 'warn') {
      console.warn(line);
      return;
    }

    console.log(line);
  };

  return {
    debug: (message: string) => write('debug', message),
    info: (message: string) => write('info', message),
    warn: (message: string) => write('warn', message),
    error: (message: string) => write('error', message)
  };
}

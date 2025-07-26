const isDev = import.meta.env.DEV;

export const secureLog = {
  info: (msg: string, data?: any) => {
    if (isDev) console.log(msg, data);
  },
  error: (msg: string, error?: any) => {
    if (isDev) console.error(msg, error);
    // TODO: forward to monitoring in production
  },
  warn: (msg: string, data?: any) => {
    if (isDev) console.warn(msg, data);
  },
  debug: (msg: string, data?: any) => {
    if (isDev) console.debug(msg, data);
  }
};
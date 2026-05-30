type LogMeta = Record<string, unknown>;

export const logger = {
  info(message: string, meta?: LogMeta) {
    process.stdout.write(`${JSON.stringify({ level: 'info', message, meta, at: new Date().toISOString() })}\n`);
  },
  error(message: string, meta?: LogMeta) {
    process.stderr.write(`${JSON.stringify({ level: 'error', message, meta, at: new Date().toISOString() })}\n`);
  }
};

import { appendFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { config } from '../config/config.js';
import { insertLog } from '../database/helpers.js';

const LOG_DIR = join(config.paths.root, 'logs');
if (!existsSync(LOG_DIR)) mkdirSync(LOG_DIR, { recursive: true });

const LEVELS = { debug: 4, info: 3, warn: 2, error: 1 };
const MIN_LEVEL = process.env.LOG_LEVEL ? LEVELS[process.env.LOG_LEVEL] ?? 3 : 3;

function stamp() {
  return new Date().toISOString();
}

function write(level, msg, meta) {
  if (LEVELS[level] > MIN_LEVEL) return;
  const line = `[${stamp()}] [${level.toUpperCase()}] ${msg}${meta ? ' ' + JSON.stringify(meta) : ''}\n`;
  // stdout
  // eslint-disable-next-line no-console
  console[level === 'debug' ? 'log' : level === 'warn' ? 'warn' : 'error']?.(line.trimEnd());
  try {
    appendFileSync(join(LOG_DIR, 'bot.log'), line);
  } catch {
    /* ignore fs errors */
  }
}

export const logger = {
  debug: (m, meta) => write('debug', m, meta),
  info: (m, meta) => write('info', m, meta),
  warn: (m, meta) => write('warn', m, meta),
  error: (m, meta) => write('error', m, meta),
  /** Persist an auditable event both to the DB log table and to file. */
  audit: (guildId, type, data) => {
    try {
      insertLog(guildId, type, data);
    } catch (e) {
      write('error', `audit persist failed: ${e.message}`);
    }
    write('info', `AUDIT [${type}] guild=${guildId}`, data);
  },
};

export default logger;

import Database from 'better-sqlite3';
import { config } from '../config/config.js';
import { initSchema } from './schema.js';

let dbInstance = null;

/**
 * Lazily opens (and on first call, initializes) the SQLite database.
 * Returns a singleton better-sqlite3 instance.
 */
export function getDb() {
  if (dbInstance) return dbInstance;

  dbInstance = new Database(config.paths.db, {
    fileMustExist: false,
    verbose: undefined,
  });

  // Recommended pragma tuning.
  dbInstance.pragma('journal_mode = WAL');
  dbInstance.pragma('foreign_keys = ON');
  dbInstance.pragma('synchronous = NORMAL');

  initSchema(dbInstance);

  return dbInstance;
}

/** Convenience accessor for the prepared statement cache. */
export function db() {
  return getDb();
}

export default getDb;

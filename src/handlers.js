import { readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import logger from './utils/logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Recursively load all command modules from src/commands (and any subfolders).
 * Each module must `export default` a SlashCommandBuilder-based command object
 * OR an object shaped like { data, execute, ... }.
 *
 * @returns {Map<string, object>} commandName -> command
 */
export async function loadCommands() {
  const commands = new Map();
  const commandsDir = join(__dirname, 'commands');

  async function walk(dir) {
    let entries = [];
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.isFile() && (entry.name.endsWith('.js'))) {
        try {
          const mod = await import(`file://${fullPath}`);
          const cmd = mod.default || mod;
          if (!cmd?.data?.name) {
            logger.warn(`Skipping invalid command module: ${entry.name} (missing data.name)`);
            continue;
          }
          commands.set(cmd.data.name, cmd);
          logger.debug(`Loaded command: ${cmd.data.name}`);
        } catch (e) {
          logger.error(`Failed to load command ${entry.name}: ${e.message}`);
        }
      }
    }
  }

  await walk(commandsDir);
  logger.info(`Loaded ${commands.size} commands.`);
  return commands;
}

/**
 * Load all event handlers from src/events. Each module exports default:
 *   { name: 'ready', once: true, execute(client, ...args) {} }
 */
export async function loadEvents(client) {
  const eventsDir = join(__dirname, 'events');
  let entries = [];
  try {
    entries = readdirSync(eventsDir, { withFileTypes: true });
  } catch {
    logger.warn('events directory missing — no events loaded.');
    return;
  }
  let count = 0;
  // Track which events we've already registered to prevent duplicates.
  const registered = new Set();
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.js')) continue;
    try {
      const fullPath = join(eventsDir, entry.name);
      const mod = await import(`file://${fullPath}`);
      const evt = mod.default || mod;
      if (!evt?.name) continue;
      // Prevent duplicate registration (in case loadEvents is called twice).
      if (registered.has(evt.name)) {
        logger.debug(`Event ${evt.name} already registered — skipping duplicate.`);
        continue;
      }
      registered.add(evt.name);
      if (evt.once) {
        client.once(evt.name, (...args) => evt.execute(client, ...args));
      } else {
        client.on(evt.name, (...args) => evt.execute(client, ...args));
      }
      count++;
      logger.debug(`Loaded event: ${evt.name}`);
    } catch (e) {
      logger.error(`Failed to load event ${entry.name}: ${e.message}`);
    }
  }
  logger.info(`Loaded ${count} event handlers.`);
}

export default { loadCommands, loadEvents };

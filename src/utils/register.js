import { REST, Routes } from 'discord.js';
import { config } from '../config/config.js';
import logger from './logger.js';

const rest = new REST({ version: '10' }).setToken(config.token);

/**
 * Register slash commands to Discord.
 *
 * To avoid duplicate commands, we register to ONLY ONE scope:
 *   - If GUILD_ID is set → guild-only (instant, perfect for single-server bots like ORGVNUM)
 *   - Otherwise → global only (takes up to 1 hour to propagate)
 *
 * @param {Array} commands - command objects (each has .data)
 * @param {string} clientId - the bot's application ID (client.application.id)
 */
export async function restPutCommands(commands, clientId) {
  if (!clientId) {
    logger.error('Cannot register slash commands: missing application (client) ID.');
    return;
  }
  const body = commands.map((c) => (c.data?.toJSON ? c.data.toJSON() : c.data));

  if (config.guildId) {
    // Guild-only registration (instant, no duplicates).
    try {
      await rest.put(Routes.applicationGuildCommands(clientId, config.guildId), { body });
      logger.info(`Registered ${body.length} guild slash commands for ${config.guildId}.`);
    } catch (e) {
      logger.error(`Guild command registration failed: ${e.message}`);
    }
  } else {
    // Global registration (takes up to 1 hour).
    try {
      await rest.put(Routes.applicationCommands(clientId), { body });
      logger.info(`Registered ${body.length} global slash commands.`);
    } catch (e) {
      logger.error(`Global command registration failed: ${e.message}`);
    }
  }
}

/** Clear all commands from a scope (used for cleanup). */
export async function clearCommands(clientId, scope = 'guild', guildId = null) {
  if (scope === 'guild' && guildId) {
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: [] });
    logger.info(`Cleared guild commands for ${guildId}.`);
  } else {
    await rest.put(Routes.applicationCommands(clientId), { body: [] });
    logger.info('Cleared global commands.');
  }
}

export { rest };

import { REST, Routes } from 'discord.js';
import { config } from '../config/config.js';
import logger from './logger.js';

const rest = new REST({ version: '10' }).setToken(config.token);

/**
 * PUT slash commands to Discord.
 * - Always registers globally.
 * - If GUILD_ID is set, also registers immediately to that guild (faster dev).
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

  // Global registration.
  try {
    await rest.put(Routes.applicationCommands(clientId), { body });
    logger.info(`Registered ${body.length} global slash commands.`);
  } catch (e) {
    logger.error(`Global command registration failed: ${e.message}`);
  }

  // Guild registration (instant) when GUILD_ID is configured.
  if (config.guildId) {
    try {
      await rest.put(Routes.applicationGuildCommands(clientId, config.guildId), { body });
      logger.info(`Registered ${body.length} guild slash commands for ${config.guildId}.`);
    } catch (e) {
      logger.error(`Guild command registration failed: ${e.message}`);
    }
  }
}

export { rest };

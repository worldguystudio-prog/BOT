import { REST, Routes } from 'discord.js';
import { config } from '../config/config.js';
import logger from './logger.js';

const rest = new REST({ version: '10' }).setToken(config.token);

/**
 * PUT slash commands to Discord.
 * - Always registers globally.
 * - If GUILD_ID is set, also registers immediately to that guild (faster dev).
 */
export async function restPutCommands(commands) {
  const body = commands.map((c) => (c.data?.toJSON ? c.data.toJSON() : c.data));

  // Global registration.
  try {
    await rest.put(Routes.applicationCommands(config.clientId || (await getClientId())), { body });
    logger.info(`Registered ${body.length} global slash commands.`);
  } catch (e) {
    logger.error(`Global command registration failed: ${e.message}`);
  }

  // Guild registration (instant) when GUILD_ID is configured.
  if (config.guildId) {
    try {
      const clientId = await getClientId();
      await rest.put(Routes.applicationGuildCommands(clientId, config.guildId), { body });
      logger.info(`Registered ${body.length} guild slash commands for ${config.guildId}.`);
    } catch (e) {
      logger.error(`Guild command registration failed: ${e.message}`);
    }
  }
}

let cachedClientId = null;
async function getClientId() {
  if (cachedClientId) return cachedClientId;
  // Fetch application id via REST.
  const app = await rest.get(Routes.application());
  cachedClientId = app.id;
  config.clientId = app.id;
  return cachedClientId;
}

export { rest };

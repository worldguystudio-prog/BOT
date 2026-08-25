import { Events } from 'discord.js';
import { config } from '../config/config.js';
import { restPutCommands } from '../utils/register.js';
import logger from '../utils/logger.js';

export default {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    // Fetch the application so we have the bot's application ID.
    try {
      await client.application?.fetch();
    } catch (e) {
      logger.warn(`Could not fetch application: ${e.message}`);
    }

    const clientId = client.application?.id;
    if (!clientId) {
      logger.error('Could not resolve application ID — slash commands will NOT be registered.');
    }

    // Load + register slash commands.
    try {
      const { loadCommands } = await import('../handlers.js');
      const commands = await loadCommands();
      client.commands = commands;
      if (clientId) {
        await restPutCommands([...commands.values()], clientId);
        logger.info(`Slash commands registered (guild=${config.guildId || 'none'}, global).`);
      }
    } catch (e) {
      logger.error(`Command registration failed: ${e.message}`);
    }

    // Set a branded presence.
    try {
      client.user?.setActivity('ORGVNUM • Personnel & Administration', { type: 3 /* Watching */ });
    } catch {
      /* ignore */
    }

    logger.info(`ORGVNUM online — ${client.guilds.cache.size} guild(s) cached.`);
  },
};

import { Events } from 'discord.js';
import logger from '../utils/logger.js';

export default {
  name: Events.MessageCreate,
  async execute(client, message) {
    if (!message.guild || message.author?.bot) return;
    try {
      const { runAutomod } = await import('../systems/automod.js');
      await runAutomod(message);
    } catch (e) {
      logger.error(`automod run error: ${e.message}`);
    }
  },
};

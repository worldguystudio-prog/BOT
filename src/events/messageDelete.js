import { Events, time } from 'discord.js';
import { logEvent } from '../systems/logging.js';
import { config } from '../config/config.js';

export default {
  name: Events.MessageDelete,
  async execute(client, message) {
    if (!message.guild || message.author?.bot) return;
    const content = message.content || '*No text content / uncached message.*';

    await logEvent(
      message.guild,
      'MESSAGE_DELETE',
      'ORGVNUM — Message Deleted',
      null,
      [
        { name: 'Author', value: `<@${message.author?.id ?? 'Unknown'}>`, inline: true },
        { name: 'Channel', value: `<#${message.channelId}>`, inline: true },
        { name: 'Deleted', value: time(new Date(), 'R'), inline: true },
        { name: 'Content', value: content.slice(0, 1024) || '*empty*', inline: false },
      ],
      config.brand.colors.warning,
      'message',
    );
  },
};

import { Events, time } from 'discord.js';
import { logEvent } from '../systems/logging.js';
import { config } from '../config/config.js';

export default {
  name: Events.MessageUpdate,
  async execute(client, oldMessage, newMessage) {
    if (!oldMessage.guild || oldMessage.author?.bot) return;
    if (oldMessage.content === newMessage?.content) return;

    const oldContent = oldMessage.content || '*empty*';
    const newContent = newMessage?.content || '*empty*';

    await logEvent(
      oldMessage.guild,
      'MESSAGE_EDIT',
      'ORGVNUM — Message Edited',
      null,
      [
        { name: 'Author', value: `<@${oldMessage.author?.id ?? 'Unknown'}>`, inline: true },
        { name: 'Channel', value: `<#${oldMessage.channelId}>`, inline: true },
        { name: 'Edited', value: time(new Date(), 'R'), inline: true },
        { name: 'Before', value: oldContent.slice(0, 1024), inline: false },
        { name: 'After', value: newContent.slice(0, 1024), inline: false },
      ],
      config.brand.colors.info,
      'message',
    );
  },
};

import { SlashCommandBuilder } from 'discord.js';
import { accentEmbed } from '../../utils/embeds.js';
import { config } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder().setName('ping').setDescription('Check the bot\'s latency.'),
  requiredLevel: config.permissionLevels.MEMBER,
  cooldown: 3000,
  async execute(interaction, client) {
    const sent = await interaction.reply({ embeds: [accentEmbed('Pinging…')], fetchReply: true });
    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    const ws = client.ws.ping;
    await interaction.editReply({ embeds: [accentEmbed(`**Pong!**\n\nLatency: **${latency}ms**\nWebSocket: **${ws}ms**`, 'ORGVNUM — Ping')] });
  },
};

import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { successEmbed, errorEmbed } from '../../utils/embeds.js';
import { config } from '../../config/config.js';
import { get } from '../../database/helpers.js';

export default {
  data: new SlashCommandBuilder()
    .setName('lockticket')
    .setDescription('Lock the current ticket (requester cannot send messages).'),
  requiredLevel: config.permissionLevels.STAFF,
  requiredPermissions: [PermissionFlagsBits.ManageChannels],
  cooldown: 1000,
  async execute(interaction) {
    const ticket = get('SELECT * FROM tickets WHERE channel_id = ?', [interaction.channelId]);
    if (!ticket) return interaction.reply({ embeds: [errorEmbed('This channel is not a ticket.')], ephemeral: true });
    try {
      await interaction.channel.permissionOverwrites.edit(ticket.user_id, { SendMessages: false });
      await interaction.reply({ embeds: [successEmbed('Ticket locked. The requester can no longer send messages here.')], ephemeral: true });
    } catch (e) {
      await interaction.reply({ embeds: [errorEmbed(`Could not lock: ${e.message}`)], ephemeral: true });
    }
  },
};

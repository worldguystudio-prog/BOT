import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { successEmbed, errorEmbed } from '../../utils/embeds.js';
import { config } from '../../config/config.js';
import { get } from '../../database/helpers.js';

export default {
  data: new SlashCommandBuilder()
    .setName('unlockticket')
    .setDescription('Unlock the current ticket.'),
  requiredLevel: config.permissionLevels.STAFF,
  requiredPermissions: [PermissionFlagsBits.ManageChannels],
  cooldown: 1000,
  async execute(interaction) {
    const ticket = get('SELECT * FROM tickets WHERE channel_id = ?', [interaction.channelId]);
    if (!ticket) return interaction.reply({ embeds: [errorEmbed('This channel is not a ticket.')], ephemeral: true });
    try {
      await interaction.channel.permissionOverwrites.edit(ticket.user_id, { SendMessages: true });
      await interaction.reply({ embeds: [successEmbed('Ticket unlocked.')], ephemeral: true });
    } catch (e) {
      await interaction.reply({ embeds: [errorEmbed(`Could not unlock: ${e.message}`)], ephemeral: true });
    }
  },
};

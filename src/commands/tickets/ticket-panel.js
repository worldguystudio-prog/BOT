import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { buildTicketPanel } from '../../systems/tickets.js';
import { successEmbed } from '../../utils/embeds.js';
import { config } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ticket-panel')
    .setDescription('Post the ORGVNUM support ticket panel in this channel.'),
  requiredLevel: config.permissionLevels.ADMINISTRATOR,
  requiredPermissions: [PermissionFlagsBits.ManageGuild],
  cooldown: 3000,
  async execute(interaction) {
    const panel = buildTicketPanel();
    await interaction.channel.send(panel);
    await interaction.reply({ embeds: [successEmbed('Ticket panel posted.')], ephemeral: true });
  },
};

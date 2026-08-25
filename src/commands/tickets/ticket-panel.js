import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { buildTicketPanel } from '../../systems/tickets.js';
import { successEmbed, errorEmbed } from '../../utils/embeds.js';
import { getSetting } from '../../database/helpers.js';
import { config } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ticket-panel')
    .setDescription('Post the ORGVNUM support ticket panel.')
    .addChannelOption((o) => o.setName('channel').setDescription('Channel to post the panel in (defaults to configured or current channel)').setRequired(false)),
  requiredLevel: config.permissionLevels.ADMINISTRATOR,
  requiredPermissions: [PermissionFlagsBits.ManageGuild],
  cooldown: 3000,
  async execute(interaction) {
    // Priority: option > configured ticket_panel_channel_id > current channel.
    const targetChannel = interaction.options.getChannel('channel') || (getSetting(interaction.guild.id, 'ticket_panel_channel_id', null) ? interaction.guild.channels.cache.get(getSetting(interaction.guild.id, 'ticket_panel_channel_id')) : interaction.channel);

    if (!targetChannel || !targetChannel.isTextBased()) {
      return interaction.reply({ embeds: [errorEmbed('Invalid channel. Use `/config tickets panel` to set one, or provide a channel option.')], ephemeral: true });
    }

    const panel = buildTicketPanel();
    try {
      await targetChannel.send(panel);
      await interaction.reply({ embeds: [successEmbed(`Ticket panel posted in ${targetChannel}.`)], ephemeral: true });
    } catch (e) {
      await interaction.reply({ embeds: [errorEmbed(`Could not post panel: ${e.message}`)], ephemeral: true });
    }
  },
};

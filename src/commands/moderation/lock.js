import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { successEmbed, errorEmbed } from '../../utils/embeds.js';
import { config } from '../../config/config.js';
import { logEvent } from '../../systems/logging.js';

export default {
  data: new SlashCommandBuilder()
    .setName('lock')
    .setDescription('Lock the current channel (prevent members from sending).'),
  requiredLevel: config.permissionLevels.MODERATOR,
  requiredPermissions: [PermissionFlagsBits.ManageChannels],
  cooldown: 2000,
  async execute(interaction) {
    try {
      await interaction.channel.permissionOverwrites.edit(interaction.guild.id, { SendMessages: false });
      await logEvent(interaction.guild, 'LOCK', 'ORGVNUM — Channel Locked', `<#${interaction.channelId}> was locked by <@${interaction.user.id}>.`, [], config.brand.colors.warning);
      await interaction.reply({ embeds: [successEmbed('Channel locked. Members can no longer send messages here.')] });
    } catch (e) {
      await interaction.reply({ embeds: [errorEmbed(`Could not lock channel: ${e.message}`)], ephemeral: true });
    }
  },
};

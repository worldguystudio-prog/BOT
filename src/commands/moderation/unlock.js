import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { successEmbed, errorEmbed } from '../../utils/embeds.js';
import { config } from '../../config/config.js';
import { logEvent } from '../../systems/logging.js';

export default {
  data: new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('Unlock the current channel.'),
  requiredLevel: config.permissionLevels.MODERATOR,
  requiredPermissions: [PermissionFlagsBits.ManageChannels],
  cooldown: 2000,
  async execute(interaction) {
    try {
      await interaction.channel.permissionOverwrites.edit(interaction.guild.id, { SendMessages: null });
      await logEvent(interaction.guild, 'UNLOCK', 'ORGVNUM — Channel Unlocked', `<#${interaction.channelId}> was unlocked by <@${interaction.user.id}>.`, [], config.brand.colors.success);
      await interaction.reply({ embeds: [successEmbed('Channel unlocked.')] });
    } catch (e) {
      await interaction.reply({ embeds: [errorEmbed(`Could not unlock channel: ${e.message}`)], ephemeral: true });
    }
  },
};

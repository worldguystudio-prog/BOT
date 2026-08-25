import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { successEmbed, errorEmbed } from '../../utils/embeds.js';
import { config } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription('Set the slowmode delay for this channel.')
    .addIntegerOption((o) => o.setName('seconds').setDescription('Delay in seconds (0 to disable, max 21600)').setRequired(true).setMinValue(0).setMaxValue(21600)),
  requiredLevel: config.permissionLevels.MODERATOR,
  requiredPermissions: [PermissionFlagsBits.ManageChannels],
  cooldown: 2000,
  async execute(interaction) {
    const secs = interaction.options.getInteger('seconds', true);
    try {
      await interaction.channel.setRateLimitPerUser(secs);
      await interaction.reply({ embeds: [successEmbed(`Slowmode set to ${secs === 0 ? 'off' : `${secs} second(s)`}.`)] });
    } catch (e) {
      await interaction.reply({ embeds: [errorEmbed(`Could not set slowmode: ${e.message}`)], ephemeral: true });
    }
  },
};

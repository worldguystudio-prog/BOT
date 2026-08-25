import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { doUnwarn } from '../../systems/moderation.js';
import { successEmbed, errorEmbed } from '../../utils/embeds.js';
import { config } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('unwarn')
    .setDescription('Remove a specific warning from a member.')
    .addStringOption((o) => o.setName('warning_id').setDescription('Warning ID (e.g. WARN-000123) or its row ID').setRequired(true)),
  requiredLevel: config.permissionLevels.MODERATOR,
  requiredPermissions: [PermissionFlagsBits.ModerateMembers],
  cooldown: 2000,
  async execute(interaction) {
    const warningId = interaction.options.getString('warning_id', true);
    const row = await doUnwarn(interaction.guild, warningId, interaction.member);
    if (!row) {
      await interaction.reply({ embeds: [errorEmbed(`No active warning found matching \`${warningId}\`.`)], ephemeral: true });
      return;
    }
    await interaction.reply({
      embeds: [successEmbed(`Warning \`${row.warning_id}\` for <@${row.user_id}> has been removed.`, 'ORGVNUM — Warning Removed')],
      ephemeral: true,
    });
  },
};

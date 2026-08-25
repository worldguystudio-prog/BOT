import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { getSetting, nextCaseNumber, createCase } from '../../database/helpers.js';
import { successEmbed, errorEmbed } from '../../utils/embeds.js';
import { logModeration } from '../../systems/logging.js';
import { config } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Remove the persistent mute from a member.')
    .addUserOption((o) => o.setName('user').setDescription('Member to unmute').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('Reason').setRequired(false)),
  requiredLevel: config.permissionLevels.MODERATOR,
  requiredPermissions: [PermissionFlagsBits.ManageRoles],
  cooldown: 2000,
  async execute(interaction) {
    const user = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason');
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (!member) return interaction.reply({ embeds: [errorEmbed('That member is not in the server.')], ephemeral: true });

    const mutedRoleId = getSetting(interaction.guild.id, 'muted_role_id', null);
    if (!mutedRoleId) return interaction.reply({ embeds: [errorEmbed('No muted role is configured.')], ephemeral: true });

    try {
      await member.roles.remove(mutedRoleId, reason || 'Unmute');
    } catch (e) {
      return interaction.reply({ embeds: [errorEmbed(`Could not remove mute: ${e.message}`)], ephemeral: true });
    }
    const caseNumber = nextCaseNumber(interaction.guild.id);
    createCase({ guildId: interaction.guild.id, caseNumber, type: 'UNMUTE', userId: user.id, moderatorId: interaction.user.id, reason });
    await logModeration(interaction.guild, { action: 'UNMUTE', user, moderator: interaction.member, reason, caseId: caseNumber });
    await interaction.reply({ embeds: [successEmbed(`<@${user.id}> has been unmuted.\nCase: \`#${caseNumber}\``, 'ORGVNUM — Member Unmuted')], ephemeral: true });
  },
};

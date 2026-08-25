import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { doUntimeout } from '../../systems/moderation.js';
import { successEmbed, errorEmbed } from '../../utils/embeds.js';
import { assertCanModerate } from '../../utils/errors.js';
import { config } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('untimeout')
    .setDescription('Remove a Discord timeout from a member.')
    .addUserOption((o) => o.setName('user').setDescription('Member to untimeout').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('Reason').setRequired(false)),
  requiredLevel: config.permissionLevels.MODERATOR,
  requiredPermissions: [PermissionFlagsBits.ModerateMembers],
  cooldown: 2000,
  async execute(interaction) {
    const user = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason');
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (!member) return interaction.reply({ embeds: [errorEmbed('That member is not in the server.')], ephemeral: true });
    if (!(await assertCanModerate(interaction, member))) return;
    const caseNumber = await doUntimeout(interaction.guild, member, interaction.member, reason || 'No reason provided');
    await interaction.reply({ embeds: [successEmbed(`<@${user.id}> timeout removed.\nCase: \`#${caseNumber}\``, 'ORGVNUM — Timeout Removed')], ephemeral: true });
  },
};

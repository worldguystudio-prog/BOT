import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { doKick } from '../../systems/moderation.js';
import { successEmbed, errorEmbed } from '../../utils/embeds.js';
import { assertCanModerate } from '../../utils/errors.js';
import { config } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a member from the server.')
    .addUserOption((o) => o.setName('user').setDescription('Member to kick').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('Reason').setRequired(true).setMaxLength(500)),
  requiredLevel: config.permissionLevels.MODERATOR,
  requiredPermissions: [PermissionFlagsBits.KickMembers],
  cooldown: 2000,
  async execute(interaction) {
    const user = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason', true);
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (!member) return interaction.reply({ embeds: [errorEmbed('That member is not in the server.')], ephemeral: true });
    if (!(await assertCanModerate(interaction, member))) return;
    const caseNumber = await doKick(interaction.guild, member, interaction.member, reason);
    await interaction.reply({ embeds: [successEmbed(`<@${user.id}> has been kicked.\nReason: ${reason}\nCase: \`#${caseNumber}\``, 'ORGVNUM — Member Kicked')], ephemeral: true });
  },
};

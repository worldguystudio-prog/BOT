import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { doTimeout } from '../../systems/moderation.js';
import { successEmbed, errorEmbed } from '../../utils/embeds.js';
import { assertCanModerate } from '../../utils/errors.js';
import { parseDuration } from '../../utils/checks.js';
import { config } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Apply a Discord timeout to a member.')
    .addUserOption((o) => o.setName('user').setDescription('Member to timeout').setRequired(true))
    .addStringOption((o) => o.setName('duration').setDescription('Duration (e.g. 10m, 2h, 1d — max 28d)').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('Reason').setRequired(true).setMaxLength(500)),
  requiredLevel: config.permissionLevels.MODERATOR,
  requiredPermissions: [PermissionFlagsBits.ModerateMembers],
  cooldown: 2000,
  async execute(interaction) {
    const user = interaction.options.getUser('user', true);
    const durStr = interaction.options.getString('duration', true);
    const reason = interaction.options.getString('reason', true);
    const secs = parseDuration(durStr);
    if (!secs) return interaction.reply({ embeds: [errorEmbed('Invalid duration. Use formats like `10m`, `2h`, `1d`.')], ephemeral: true });
    if (secs > 28 * 86400) return interaction.reply({ embeds: [errorEmbed('Discord timeouts cannot exceed 28 days.')], ephemeral: true });

    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (!member) return interaction.reply({ embeds: [errorEmbed('That member is not in the server.')], ephemeral: true });
    if (!(await assertCanModerate(interaction, member))) return;

    const caseNumber = await doTimeout(interaction.guild, member, interaction.member, reason, secs);
    await interaction.reply({ embeds: [successEmbed(`<@${user.id}> timed out for ${secs}s.\nReason: ${reason}\nCase: \`#${caseNumber}\``, 'ORGVNUM — Timeout')], ephemeral: true });
  },
};

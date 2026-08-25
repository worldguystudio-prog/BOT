import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { doWarn } from '../../systems/moderation.js';
import { successEmbed, errorEmbed } from '../../utils/embeds.js';
import { assertCanModerate } from '../../utils/errors.js';
import { config } from '../../config/config.js';
import { cleanInput } from '../../utils/checks.js';

export default {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Issue a formal warning to a member.')
    .addUserOption((o) => o.setName('user').setDescription('Member to warn').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('Reason for the warning').setRequired(true).setMaxLength(500)),
  requiredLevel: config.permissionLevels.MODERATOR,
  requiredPermissions: [PermissionFlagsBits.ModerateMembers],
  cooldown: 2000,
  async execute(interaction) {
    const user = interaction.options.getUser('user', true);
    const reason = cleanInput(interaction.options.getString('reason', true), 500);
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    if (member && !(await assertCanModerate(interaction, member))) return;

    const result = await doWarn(interaction.guild, member || user, interaction.member, reason);
    await interaction.reply({
      embeds: [
        successEmbed(
          `**Warning issued**\n\nUser: <@${user.id}>\nReason: ${reason}\nCase: \`#${result.caseNumber}\`\nWarning ID: \`${result.warningId}\`\n\nA DM has been sent to the user. They may appeal through the ticket system.`,
          'ORGVNUM — Warning',
        ),
      ],
      ephemeral: true,
    });
  },
};

import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { getSetting, nextCaseNumber, createCase } from '../../database/helpers.js';
import { successEmbed, errorEmbed } from '../../utils/embeds.js';
import { assertCanModerate } from '../../utils/errors.js';
import { logModeration } from '../../systems/logging.js';
import { sendModDM } from '../../utils/dm.js';
import { parseDuration } from '../../utils/checks.js';
import { config } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Apply a persistent mute (muted role) to a member.')
    .addUserOption((o) => o.setName('user').setDescription('Member to mute').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('Reason').setRequired(true).setMaxLength(500))
    .addStringOption((o) => o.setName('duration').setDescription('Optional duration (e.g. 10m, 2h, 1d). Permanent if omitted.').setRequired(false)),
  requiredLevel: config.permissionLevels.MODERATOR,
  requiredPermissions: [PermissionFlagsBits.ManageRoles],
  cooldown: 2000,
  async execute(interaction) {
    const user = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason', true);
    const durStr = interaction.options.getString('duration');
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (!member) return interaction.reply({ embeds: [errorEmbed('That member is not in the server.')], ephemeral: true });
    if (!(await assertCanModerate(interaction, member))) return;

    const mutedRoleId = getSetting(interaction.guild.id, 'muted_role_id', null);
    if (!mutedRoleId) return interaction.reply({ embeds: [errorEmbed('No muted role configured. Use `/config permissions` or set `muted_role_id` first. (You can also use `/timeout` for native Discord timeouts.)')], ephemeral: true });

    const role = await interaction.guild.roles.fetch(mutedRoleId).catch(() => null);
    if (!role) return interaction.reply({ embeds: [errorEmbed('The configured muted role no longer exists.')], ephemeral: true });
    if (interaction.guild.members.me.roles.highest.position <= role.position) {
      return interaction.reply({ embeds: [errorEmbed('My role must be above the muted role.')], ephemeral: true });
    }

    await member.roles.add(role, reason).catch((e) => interaction.reply({ embeds: [errorEmbed(`Could not apply mute: ${e.message}`)], ephemeral: true }));

    let duration = null;
    if (durStr) {
      const secs = parseDuration(durStr);
      if (secs) {
        duration = secs;
        setTimeout(() => {
          member.roles.remove(role, 'Mute duration expired').catch(() => {});
        }, secs * 1000);
      }
    }

    await sendModDM(user, 'muted', reason, interaction.guild, interaction.member, duration);
    const caseNumber = nextCaseNumber(interaction.guild.id);
    createCase({ guildId: interaction.guild.id, caseNumber, type: 'MUTE', userId: user.id, moderatorId: interaction.user.id, reason, duration: duration ? `${duration}s` : 'Permanent' });
    await logModeration(interaction.guild, { action: 'MUTE', user, moderator: interaction.member, reason, caseId: caseNumber, extra: { duration: duration ? `${duration}s` : 'Permanent' } });

    await interaction.reply({ embeds: [successEmbed(`<@${user.id}> has been muted.\nReason: ${reason}\nDuration: ${duration ? `${duration}s` : 'Permanent'}\nCase: \`#${caseNumber}\``, 'ORGVNUM — Member Muted')], ephemeral: true });
  },
};

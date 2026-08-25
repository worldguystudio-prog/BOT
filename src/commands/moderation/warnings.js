import { SlashCommandBuilder, PermissionFlagsBits, time } from 'discord.js';
import { listWarnings } from '../../systems/moderation.js';
import { brandedEmbed, errorEmbed } from '../../utils/embeds.js';
import { config } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('View a member\'s warning history.')
    .addUserOption((o) => o.setName('user').setDescription('Member to inspect').setRequired(true)),
  requiredLevel: config.permissionLevels.STAFF,
  requiredPermissions: [PermissionFlagsBits.ModerateMembers],
  cooldown: 2000,
  async execute(interaction) {
    const user = interaction.options.getUser('user', true);
    const warnings = listWarnings(interaction.guild.id, user.id);
    if (!warnings.length) {
      await interaction.reply({ embeds: [errorEmbed(`<@${user.id}> has no active warnings.`, 'ORGVNUM — Clean Record')], ephemeral: true });
      return;
    }
    const fields = warnings.slice(0, 12).map((w) => ({
      name: `\`${w.warning_id}\` — Case #${w.warning_id.replace('WARN-', '')}`,
      value: `**Reason:** ${w.reason || 'No reason'}\n**By:** <@${w.moderator_id}>\n**When:** ${time(new Date(w.timestamp), 'R')}`,
      inline: false,
    }));
    await interaction.reply({
      embeds: [
        brandedEmbed(`**${warnings.length} active warning(s)** for <@${user.id}>.`, 'ORGVNUM — Warning History').addFields(fields),
      ],
      ephemeral: true,
    });
  },
};

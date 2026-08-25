import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { listApplications, buildReviewPanel } from '../../systems/applications.js';
import { brandedEmbed, errorEmbed } from '../../utils/embeds.js';
import { config } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('applications')
    .setDescription('List recent applications.')
    .addStringOption((o) =>
      o
        .setName('status')
        .setDescription('Filter by status')
        .setRequired(false)
        .addChoices(
          { name: 'Pending', value: 'PENDING' },
          { name: 'Under Review', value: 'UNDER REVIEW' },
          { name: 'Interview', value: 'INTERVIEW' },
          { name: 'Accepted', value: 'ACCEPTED' },
          { name: 'Denied', value: 'DENIED' },
          { name: 'Waitlisted', value: 'WAITLISTED' },
        ),
    ),
  requiredLevel: config.permissionLevels.RECRUITER,
  requiredPermissions: [PermissionFlagsBits.ManageMessages],
  cooldown: 2000,
  async execute(interaction) {
    const status = interaction.options.getString('status');
    const apps = listApplications(interaction.guild.id, status);
    if (!apps.length) return interaction.reply({ embeds: [errorEmbed('No applications found.')] , ephemeral: true });

    // Show up to 5 inline; staff can use /application for the full review panel.
    const fields = apps.slice(0, 12).map((a) => ({
      name: `#${a.application_id} — ${a.type}`,
      value: `<@${a.user_id}> • **${a.status}** • <t:${Math.floor(new Date(a.submitted_at).getTime() / 1000)}:R>`,
      inline: false,
    }));
    await interaction.reply({
      embeds: [brandedEmbed(`**${apps.length} application(s)**${status ? ` (${status})` : ''}.\nUse \`/application <id>\` to view the review panel.`, 'ORGVNUM — Applications').addFields(fields)],
      ephemeral: true,
    });
  },
};

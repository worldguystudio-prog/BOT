import { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, TextInputBuilder, TextInputStyle, ModalBuilder } from 'discord.js';
import {
  addToWaitlist, getWaitlist, getWaitlistEntry, setWaitlistStatus, promoteWaitlist, removeFromWaitlist, waitlistEmbed,
} from '../../systems/recruitment.js';
import { successEmbed, errorEmbed, brandedEmbed } from '../../utils/embeds.js';
import { config } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('waitlist')
    .setDescription('Manage the ORGVNUM Placement Waitlist.')
    .addSubcommand((s) => s.setName('add').setDescription('Add yourself to the placement waitlist.'))
    .addSubcommand((s) =>
      s
        .setName('remove')
        .setDescription('Remove an entry from the waitlist (staff).')
        .addStringOption((o) => o.setName('id').setDescription('Waitlist ID or user').setRequired(true)),
    )
    .addSubcommand((s) =>
      s
        .setName('view')
        .setDescription('View waitlist entries (staff).')
        .addStringOption((o) =>
          o.setName('status').setDescription('Filter by status').setRequired(false).addChoices(
            { name: 'Pending Review', value: 'PENDING REVIEW' },
            { name: 'Promoted', value: 'PROMOTED' },
            { name: 'Rejected', value: 'REJECTED' },
            { name: 'Closed', value: 'CLOSED' },
          ),
        ),
    )
    .addSubcommand((s) =>
      s
        .setName('promote')
        .setDescription('Promote a waitlist entry (staff).')
        .addStringOption((o) => o.setName('id').setDescription('Waitlist ID or user').setRequired(true)),
    )
    .addSubcommand((s) =>
      s
        .setName('status')
        .setDescription('View your waitlist status.')
        .addUserOption((o) => o.setName('user').setDescription('View another user (staff)').setRequired(false)),
    ),
  requiredLevel: config.permissionLevels.MEMBER,
  cooldown: 5000,
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'add') {
      const modal = new ModalBuilder()
        .setCustomId('waitlist:add:')
        .setTitle('ORGVNUM — Placement Waitlist')
        .addComponents(
          mr('roblox_username', 'Roblox Username', true, TextInputStyle.Short),
          mr('discord_username', 'Discord Username', true, TextInputStyle.Short),
          mr('age', 'Age', true, TextInputStyle.Short, 3),
          mr('timezone', 'Timezone', true, TextInputStyle.Short),
          mr('desired_role', 'Desired Role', true, TextInputStyle.Short),
          mr('activity_level', 'Activity Level', true, TextInputStyle.Short),
          mr('experience', 'Previous Experience', false, TextInputStyle.Paragraph),
          mr('why_join', 'Why ORGVNUM?', false, TextInputStyle.Paragraph),
          mr('skills', 'Skills', false, TextInputStyle.Paragraph),
          mr('availability', 'Availability', false, TextInputStyle.Paragraph),
        );
      return interaction.showModal(modal);
    }

    // Staff-only subcommands.
    if (!interaction.member?.permissions?.has(PermissionFlagsBits.ManageMessages)) {
      const recruiter = await import('../../database/helpers.js').then((m) => m.getSetting(interaction.guild.id, 'recruiter_role_id', null));
      if (!recruiter || !interaction.member?.roles?.cache?.has(recruiter)) {
        return interaction.reply({ embeds: [errorEmbed('Only staff may use this subcommand.')], ephemeral: true });
      }
    }

    if (sub === 'remove') {
      const id = interaction.options.getString('id', true);
      const row = removeFromWaitlist(interaction.guild.id, id);
      if (!row) return interaction.reply({ embeds: [errorEmbed('Waitlist entry not found.')], ephemeral: true });
      return interaction.reply({ embeds: [successEmbed(`Removed waitlist entry #${row.id} for <@${row.user_id}>.`)], ephemeral: true });
    }

    if (sub === 'view') {
      const status = interaction.options.getString('status');
      const entries = getWaitlist(interaction.guild.id, status);
      if (!entries.length) return interaction.reply({ embeds: [errorEmbed('No waitlist entries found.')] , ephemeral: true });
      const fields = entries.slice(0, 12).map((e) => ({
        name: `#${String(e.id).padStart(4, '0')} — ${e.roblox_username || 'Unknown'}`,
        value: `<@${e.user_id}> • **${e.status}** • Desired: ${e.desired_role || '—'}`,
        inline: false,
      }));
      return interaction.reply({ embeds: [brandedEmbed(`**${entries.length} waitlist entry/entries.**`, 'ORGVNUM — Waitlist').addFields(fields)], ephemeral: true });
    }

    if (sub === 'promote') {
      const id = interaction.options.getString('id', true);
      const entry = promoteWaitlist(interaction.guild, id, interaction.user.id);
      if (!entry) return interaction.reply({ embeds: [errorEmbed('Entry not found.')], ephemeral: true });
      return interaction.reply({ embeds: [successEmbed(`Promoted waitlist entry #${entry.id} for <@${entry.user_id}>.`, 'ORGVNUM — Promoted')], ephemeral: true });
    }

    if (sub === 'status') {
      const target = interaction.options.getUser('user') || interaction.user;
      const entry = getWaitlistEntry(interaction.guild.id, target.id);
      if (!entry) return interaction.reply({ embeds: [errorEmbed(`<@${target.id}> is not on the waitlist.`)], ephemeral: true });
      return interaction.reply({ embeds: [waitlistEmbed(entry)], ephemeral: true });
    }
  },
};

function mr(id, label, required, style, max) {
  const input = new TextInputBuilder().setCustomId(id).setLabel(label).setStyle(style).setRequired(required);
  if (max) input.setMaxLength(max);
  return new ActionRowBuilder().addComponents(input);
}

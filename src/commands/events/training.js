import { SlashCommandBuilder, PermissionFlagsBits, time } from 'discord.js';
import { createEvent, getEvent, setEventStatus, listEvents, addAttendance, attendanceList } from '../../systems/events.js';
import { successEmbed, errorEmbed, brandedEmbed } from '../../utils/embeds.js';
import { config } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('training')
    .setDescription('Manage training sessions & events.')
    .addSubcommand((s) =>
      s
        .setName('create')
        .setDescription('Create a training/event.')
        .addStringOption((o) => o.setName('name').setDescription('Event name').setRequired(true))
        .addStringOption((o) =>
          o.setName('type').setDescription('Type').setRequired(false).addChoices(
            { name: 'Training', value: 'Training' },
            { name: 'Operation', value: 'Operation' },
            { name: 'Patrol', value: 'Patrol' },
            { name: 'Ceremony', value: 'Ceremony' },
            { name: 'Interview', value: 'Interview' },
            { name: 'Recruitment Event', value: 'Recruitment Event' },
          ),
        )
        .addStringOption((o) => o.setName('date').setDescription('Date/time (e.g. "tomorrow 8pm")').setRequired(false)),
    )
    .addSubcommand((s) => s.setName('start').setDescription('Mark an event as in progress.').addIntegerOption((o) => o.setName('id').setDescription('Event ID').setRequired(true)))
    .addSubcommand((s) => s.setName('end').setDescription('End an event.').addIntegerOption((o) => o.setName('id').setDescription('Event ID').setRequired(true)))
    .addSubcommand((s) => s.setName('cancel').setDescription('Cancel an event.').addIntegerOption((o) => o.setName('id').setDescription('Event ID').setRequired(true)))
    .addSubcommand((s) =>
      s
        .setName('roster')
        .setDescription('View or record attendance.')
        .addIntegerOption((o) => o.setName('id').setDescription('Event ID').setRequired(true))
        .addUserOption((o) => o.setName('user').setDescription('Mark this user as attended').setRequired(false)),
    ),
  requiredLevel: config.permissionLevels.TRAINER,
  requiredPermissions: [PermissionFlagsBits.ManageMessages],
  cooldown: 2000,
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'create') {
      const name = interaction.options.getString('name', true);
      const type = interaction.options.getString('type') || 'Training';
      const date = interaction.options.getString('date') || new Date().toISOString();
      const id = createEvent({ guildId: interaction.guild.id, name, type, hostId: interaction.user.id, date });
      return interaction.reply({ embeds: [successEmbed(`Event **${name}** (${type}) created.\nEvent ID: **#${id}**\nDate: ${date}`)] });
    }

    const id = interaction.options.getInteger('id', true);
    const evt = getEvent(interaction.guild.id, id);
    if (!evt) return interaction.reply({ embeds: [errorEmbed(`Event #${id} not found.`)], ephemeral: true });

    if (sub === 'start') {
      setEventStatus(interaction.guild.id, id, 'IN PROGRESS');
      return interaction.reply({ embeds: [successEmbed(`Event **${evt.name}** is now **IN PROGRESS**.`)] });
    }
    if (sub === 'end') {
      setEventStatus(interaction.guild.id, id, 'COMPLETED');
      return interaction.reply({ embeds: [successEmbed(`Event **${evt.name}** marked **COMPLETED**.`)] });
    }
    if (sub === 'cancel') {
      setEventStatus(interaction.guild.id, id, 'CANCELLED');
      return interaction.reply({ embeds: [successEmbed(`Event **${evt.name}** has been **CANCELLED**.`)] });
    }
    if (sub === 'roster') {
      const markUser = interaction.options.getUser('user');
      if (markUser) {
        addAttendance(id, markUser.id, 1);
        return interaction.reply({ embeds: [successEmbed(`<@${markUser.id}> marked as attended for **${evt.name}**.`)] });
      }
      const rows = attendanceList(id);
      if (!rows.length) return interaction.reply({ embeds: [errorEmbed('No attendance recorded yet.')] });
      const lines = rows.map((r) => `• <@${r.user_id}> — ${r.attended ? '✅ Attended' : '❌ Absent'}`);
      return interaction.reply({ embeds: [brandedEmbed(`**Roster for ${evt.name}**\n\n${lines.join('\n')}`)] });
    }
  },
};

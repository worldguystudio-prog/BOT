import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { startShift, getActiveShift, endShift } from '../../systems/shifts.js';
import { successEmbed, errorEmbed } from '../../utils/embeds.js';
import { config } from '../../config/config.js';
import { humanizeDuration } from '../../utils/checks.js';

export default {
  data: new SlashCommandBuilder()
    .setName('shift')
    .setDescription('Staff shift management.')
    .addSubcommand((s) =>
      s
        .setName('start')
        .setDescription('Start your shift.')
        .addStringOption((o) => o.setName('department').setDescription('Department').setRequired(false)),
    )
    .addSubcommand((s) => s.setName('end').setDescription('End your current shift.'))
    .addSubcommand((s) => s.setName('status').setDescription('View your current shift status.'))
    .addSubcommand((s) => s.setName('leaderboard').setDescription('View the shift activity leaderboard.')),
  requiredLevel: config.permissionLevels.STAFF,
  cooldown: 2000,
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'start') {
      const active = getActiveShift(interaction.guild.id, interaction.user.id);
      if (active) return interaction.reply({ embeds: [errorEmbed('You already have an active shift. End it first with `/shift end`.')], ephemeral: true });
      const department = interaction.options.getString('department') || null;
      const shift = startShift(interaction.guild.id, interaction.user.id, department);
      return interaction.reply({ embeds: [successEmbed(`Shift started at <t:${Math.floor(new Date(shift.startTime).getTime() / 1000)}:T>.${department ? `\nDepartment: ${department}` : ''}`, 'ORGVNUM — Shift Started')] });
    }

    if (sub === 'end') {
      const active = getActiveShift(interaction.guild.id, interaction.user.id);
      if (!active) return interaction.reply({ embeds: [errorEmbed('You have no active shift.')], ephemeral: true });
      const ended = endShift(active.id);
      return interaction.reply({ embeds: [successEmbed(`Shift ended. Duration: **${humanizeDuration(ended.duration)}**.`)] });
    }

    if (sub === 'status') {
      const active = getActiveShift(interaction.guild.id, interaction.user.id);
      if (!active) return interaction.reply({ embeds: [errorEmbed('You have no active shift.')] , ephemeral: true });
      const elapsed = Math.floor((Date.now() - new Date(active.start_time).getTime()) / 1000);
      return interaction.reply({ embeds: [successEmbed(`You are on shift.\nStarted: <t:${Math.floor(new Date(active.start_time).getTime() / 1000)}:T>\nElapsed: ${humanizeDuration(elapsed)}${active.department ? `\nDepartment: ${active.department}` : ''}`)] });
    }

    if (sub === 'leaderboard') {
      const { leaderboard } = await import('../../systems/shifts.js');
      const rows = leaderboard(interaction.guild.id, 10);
      if (!rows.length) return interaction.reply({ embeds: [errorEmbed('No shift data yet.')] });
      const lines = rows.map((r, i) => `**${i + 1}.** <@${r.userId}> — ${r.pretty} (${r.shifts} shifts)`);
      const { brandedEmbed } = await import('../../utils/embeds.js');
      return interaction.reply({ embeds: [brandedEmbed(`**ORGVNUM — Shift Leaderboard**\n\n${lines.join('\n')}`)] });
    }
  },
};

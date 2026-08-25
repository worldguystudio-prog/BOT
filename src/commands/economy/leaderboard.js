import { SlashCommandBuilder } from 'discord.js';
import { leaderboard } from '../../systems/economy.js';
import { brandedEmbed, errorEmbed } from '../../utils/embeds.js';
import { config } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('View the ORGVNUM points leaderboard.')
    .addStringOption((o) => o.setName('type').setDescription('Leaderboard type').setRequired(false).addChoices({ name: 'Points', value: 'points' }, { name: 'Shifts', value: 'shifts' })),
  requiredLevel: config.permissionLevels.MEMBER,
  cooldown: 5000,
  async execute(interaction) {
    const type = interaction.options.getString('type') || 'points';
    if (type === 'shifts') {
      const { leaderboard: shiftLB } = await import('../../systems/shifts.js');
      const rows = shiftLB(interaction.guild.id, 10);
      if (!rows.length) return interaction.reply({ embeds: [errorEmbed('No shift data yet.')] });
      const lines = rows.map((r, i) => `**${i + 1}.** <@${r.userId}> — ${r.pretty} (${r.shifts} shifts)`);
      return interaction.reply({ embeds: [brandedEmbed(`**ORGVNUM — Shift Leaderboard**\n\n${lines.join('\n')}`)] });
    }
    const rows = leaderboard(interaction.guild.id, 10);
    if (!rows.length) return interaction.reply({ embeds: [errorEmbed('No points awarded yet.')] });
    const lines = rows.map((r, i) => `**${i + 1}.** <@${r.user_id}> — ${r.points} pts`);
    return interaction.reply({ embeds: [brandedEmbed(`**ORGVNUM — Points Leaderboard**\n\n${lines.join('\n')}`)] });
  },
};

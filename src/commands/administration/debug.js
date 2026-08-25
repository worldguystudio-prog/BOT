import { SlashCommandBuilder } from 'discord.js';
import { errorEmbed, brandedEmbed } from '../../utils/embeds.js';
import { isOwner } from '../../utils/permissions.js';
import { config } from '../../config/config.js';
import { all } from '../../database/helpers.js';
import { db } from '../../database/database.js';

export default {
  data: new SlashCommandBuilder().setName('debug').setDescription('Show diagnostic information (owner only).'),
  ownerOnly: true,
  async execute(interaction, client) {
    if (!isOwner(interaction.user.id)) return interaction.reply({ embeds: [errorEmbed('Owner only.')] , ephemeral: true });
    const mem = process.memoryUsage();
    const uptime = Math.floor(process.uptime());
    const recentLogs = all('SELECT type, COUNT(*) AS c FROM logs WHERE guild_id = ? GROUP BY type ORDER BY c DESC LIMIT 10', [interaction.guild.id]);
    const fields = [
      { name: 'Uptime', value: `${uptime}s`, inline: true },
      { name: 'Commands Loaded', value: String(client.commands?.size || 0), inline: true },
      { name: 'Guilds', value: String(client.guilds.cache.size), inline: true },
      { name: 'Memory (RSS)', value: `${(mem.rss / 1024 / 1024).toFixed(1)} MB`, inline: true },
      { name: 'Heap Used', value: `${(mem.heapUsed / 1024 / 1024).toFixed(1)} MB`, inline: true },
      { name: 'Node', value: process.version, inline: true },
      { name: 'DB File', value: config.paths.db.split('/').pop(), inline: true },
      { name: 'DB Size', value: `${(db().prepare('PRAGMA page_count').get().page_count * 4096 / 1024).toFixed(0)} KB`, inline: true },
      { name: 'Recent Log Types', value: recentLogs.map((l) => `${l.type}: ${l.c}`).join('\n') || 'None', inline: false },
    ];
    await interaction.reply({ embeds: [brandedEmbed('**ORGVNUM — Debug**', 'ORGVNUM — Debug').addFields(fields)], ephemeral: true });
  },
};

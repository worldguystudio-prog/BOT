import { SlashCommandBuilder, time, TimestampStyles } from 'discord.js';
import { brandedEmbed } from '../../utils/embeds.js';
import { config } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder().setName('botinfo').setDescription('View information about the ORGVNUM bot.'),
  requiredLevel: config.permissionLevels.MEMBER,
  cooldown: 5000,
  async execute(interaction, client) {
    const mem = process.memoryUsage();
    const fields = [
      { name: 'Bot', value: client.user?.tag || 'ORGVNUM', inline: true },
      { name: 'Version', value: '1.0.0', inline: true },
      { name: 'Node.js', value: process.version, inline: true },
      { name: 'Discord.js', value: 'v14', inline: true },
      { name: 'Uptime', value: time(new Date(Date.now() - process.uptime() * 1000), TimestampStyles.RelativeTime), inline: true },
      { name: 'Servers', value: String(client.guilds.cache.size), inline: true },
      { name: 'Memory', value: `${(mem.rss / 1024 / 1024).toFixed(1)} MB`, inline: true },
      { name: 'Commands', value: String(client.commands?.size || 0), inline: true },
      { name: 'Database', value: 'SQLite', inline: true },
    ];
    await interaction.reply({ embeds: [brandedEmbed(`**ORGVNUM — Personnel & Administration System**\n\nA custom-built Discord infrastructure platform.`, 'ORGVNUM — Bot Info').addFields(fields)] });
  },
};

import { SlashCommandBuilder, time, TimestampStyles } from 'discord.js';
import { brandedEmbed } from '../../utils/embeds.js';
import { config } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder().setName('serverinfo').setDescription('View information about this server.'),
  requiredLevel: config.permissionLevels.MEMBER,
  cooldown: 3000,
  async execute(interaction) {
    const g = interaction.guild;
    await g.fetch().catch(() => {});
    const fields = [
      { name: 'Server ID', value: `\`${g.id}\``, inline: true },
      { name: 'Owner', value: `<@${g.ownerId}>`, inline: true },
      { name: 'Created', value: time(g.createdAt, TimestampStyles.RelativeTime), inline: true },
      { name: 'Members', value: String(g.memberCount), inline: true },
      { name: 'Channels', value: String(g.channels.cache.size), inline: true },
      { name: 'Roles', value: String(g.roles.cache.size), inline: true },
      { name: 'Boost Level', value: `Tier ${g.premiumTier}`, inline: true },
      { name: 'Boosts', value: String(g.premiumSubscriptionCount), inline: true },
      { name: 'Verification', value: g.verificationLevel, inline: true },
    ];
    await interaction.reply({ embeds: [brandedEmbed(`**${g.name}**`, 'ORGVNUM — Server Info').setThumbnail(g.iconURL({ size: 256 }) || null).addFields(fields)] });
  },
};

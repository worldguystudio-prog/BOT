import { SlashCommandBuilder, time, TimestampStyles, PermissionFlagsBits } from 'discord.js';
import { brandedEmbed, errorEmbed } from '../../utils/embeds.js';
import { config } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('View information about a member.')
    .addUserOption((o) => o.setName('user').setDescription('Member (defaults to you)').setRequired(false)),
  requiredLevel: config.permissionLevels.MEMBER,
  cooldown: 2000,
  async execute(interaction) {
    const user = interaction.options.getUser('user') || interaction.user;
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (!member) return interaction.reply({ embeds: [errorEmbed('Member not found in this server.')] , ephemeral: true });

    const roles = member.roles.cache.filter((r) => r.id !== interaction.guild.id).sort((a, b) => b.position - a.position);
    const flags = (await user.fetchFlags().catch(() => null)) || [];
    const fields = [
      { name: 'User ID', value: `\`${user.id}\``, inline: true },
      { name: 'Tag', value: user.tag, inline: true },
      { name: 'Bot', value: user.bot ? 'Yes' : 'No', inline: true },
      { name: 'Created', value: time(user.createdAt, TimestampStyles.RelativeTime), inline: true },
      { name: 'Joined', value: member.joinedAt ? time(member.joinedAt, TimestampStyles.RelativeTime) : 'Unknown', inline: true },
      { name: 'Roles', value: roles.size ? roles.map((r) => `<@&${r.id}>`).slice(0, 20).join(', ') : 'None', inline: false },
    ];
    if (member.permissions?.has(PermissionFlagsBits.Administrator)) fields.push({ name: 'Key Permissions', value: 'Administrator', inline: true });
    await interaction.reply({ embeds: [brandedEmbed(`**${user.tag}**`, 'ORGVNUM — User Info').setThumbnail(user.displayAvatarURL({ size: 256 })).addFields(fields)] });
  },
};

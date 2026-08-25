import { SlashCommandBuilder, time, TimestampStyles, PermissionFlagsBits } from 'discord.js';
import { brandedEmbed, errorEmbed } from '../../utils/embeds.js';
import { config } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('roleinfo')
    .setDescription('View information about a role.')
    .addRoleOption((o) => o.setName('role').setDescription('Role').setRequired(true)),
  requiredLevel: config.permissionLevels.MEMBER,
  cooldown: 2000,
  async execute(interaction) {
    const role = interaction.options.getRole('role', true);
    if (!role) return interaction.reply({ embeds: [errorEmbed('Role not found.')] , ephemeral: true });
    const perms = role.permissions.toArray();
    const fields = [
      { name: 'Role ID', value: `\`${role.id}\``, inline: true },
      { name: 'Members', value: String(role.members.size), inline: true },
      { name: 'Position', value: String(role.position), inline: true },
      { name: 'Color', value: role.hexColor, inline: true },
      { name: 'Mentionable', value: role.mentionable ? 'Yes' : 'No', inline: true },
      { name: 'Hoisted', value: role.hoist ? 'Yes' : 'No', inline: true },
      { name: 'Created', value: time(role.createdAt, TimestampStyles.RelativeTime), inline: true },
      { name: 'Managed', value: role.managed ? 'Yes' : 'No', inline: true },
      { name: 'Administrator', value: role.permissions.has(PermissionFlagsBits.Administrator) ? 'Yes' : 'No', inline: true },
      { name: 'Key Permissions', value: perms.length ? perms.slice(0, 15).join(', ') : 'None', inline: false },
    ];
    await interaction.reply({ embeds: [brandedEmbed(`**${role.name}**`, 'ORGVNUM — Role Info').addFields(fields)] });
  },
};

import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { doUnban } from '../../systems/moderation.js';
import { successEmbed, errorEmbed } from '../../utils/embeds.js';
import { config } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Revoke a ban.')
    .addStringOption((o) => o.setName('user').setDescription('User ID to unban').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('Reason').setRequired(false)),
  requiredLevel: config.permissionLevels.MODERATOR,
  requiredPermissions: [PermissionFlagsBits.BanMembers],
  cooldown: 2000,
  async execute(interaction) {
    const raw = interaction.options.getString('user', true).replace(/[<@!>]/g, '');
    const reason = interaction.options.getString('reason');
    if (!/^\d{17,20}$/.test(raw)) return interaction.reply({ embeds: [errorEmbed('Provide a valid user ID.')], ephemeral: true });
    const caseNumber = await doUnban(interaction.guild, raw, interaction.member, reason || 'No reason provided');
    await interaction.reply({ embeds: [successEmbed(`<@${raw}> has been unbanned.\nCase: \`#${caseNumber}\``, 'ORGVNUM — Member Unbanned')], ephemeral: true });
  },
};

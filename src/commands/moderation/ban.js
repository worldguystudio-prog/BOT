import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { doBan } from '../../systems/moderation.js';
import { successEmbed, errorEmbed } from '../../utils/embeds.js';
import { assertCanModerate } from '../../utils/errors.js';
import { config } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a user from the server.')
    .addStringOption((o) => o.setName('user').setDescription('User ID or mention').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('Reason').setRequired(true).setMaxLength(500))
    .addIntegerOption((o) => o.setName('delete_days').setDescription('Days of messages to delete (0-7)').setMinValue(0).setMaxValue(7).setRequired(false)),
  requiredLevel: config.permissionLevels.MODERATOR,
  requiredPermissions: [PermissionFlagsBits.BanMembers],
  cooldown: 2000,
  async execute(interaction) {
    const raw = interaction.options.getString('user', true).replace(/[<@!>]/g, '');
    const reason = interaction.options.getString('reason', true);
    const deleteDays = interaction.options.getInteger('delete_days') || 0;
    if (!/^\d{17,20}$/.test(raw)) return interaction.reply({ embeds: [errorEmbed('Provide a valid user ID.')], ephemeral: true });
    const member = await interaction.guild.members.fetch(raw).catch(() => null);
    if (member && !(await assertCanModerate(interaction, member))) return;
    const caseNumber = await doBan(interaction.guild, raw, interaction.member, reason, deleteDays);
    await interaction.reply({ embeds: [successEmbed(`<@${raw}> has been banned.\nReason: ${reason}\nCase: \`#${caseNumber}\``, 'ORGVNUM — Member Banned')], ephemeral: true });
  },
};

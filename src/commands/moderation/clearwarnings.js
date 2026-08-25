import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { clearAllUserWarnings } from '../../systems/moderation.js';
import { successEmbed } from '../../utils/embeds.js';
import { config } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('clearwarnings')
    .setDescription('Clear all active warnings for a member.')
    .addUserOption((o) => o.setName('user').setDescription('Member whose warnings to clear').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('Reason').setRequired(false)),
  requiredLevel: config.permissionLevels.ADMINISTRATOR,
  requiredPermissions: [PermissionFlagsBits.ModerateMembers],
  cooldown: 3000,
  async execute(interaction) {
    const user = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason');
    const count = clearAllUserWarnings(interaction.guild.id, user.id, interaction.member);
    await interaction.reply({
      embeds: [successEmbed(`Cleared **${count}** active warning(s) for <@${user.id}>.${reason ? `\nReason: ${reason}` : ''}`, 'ORGVNUM — Warnings Cleared')],
      ephemeral: true,
    });
  },
};

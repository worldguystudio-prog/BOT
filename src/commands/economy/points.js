import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { award } from '../../systems/economy.js';
import { successEmbed, errorEmbed } from '../../utils/embeds.js';
import { config } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('points')
    .setDescription('Award or remove points from a member.')
    .addUserOption((o) => o.setName('user').setDescription('Member').setRequired(true))
    .addIntegerOption((o) => o.setName('amount').setDescription('Amount (positive to award, negative to remove)').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('Reason').setRequired(false)),
  requiredLevel: config.permissionLevels.STAFF,
  requiredPermissions: [PermissionFlagsBits.ManageMessages],
  cooldown: 2000,
  async execute(interaction) {
    const user = interaction.options.getUser('user', true);
    const amount = interaction.options.getInteger('amount', true);
    const reason = interaction.options.getString('reason') || 'No reason provided';
    if (amount === 0) return interaction.reply({ embeds: [errorEmbed('Amount must not be zero.')] , ephemeral: true });
    const newBal = award(interaction.guild.id, user.id, amount, reason, interaction.user.id);
    await interaction.reply({ embeds: [successEmbed(`${amount > 0 ? 'Awarded' : 'Removed'} **${Math.abs(amount)}** point(s) ${amount > 0 ? 'to' : 'from'} <@${user.id}>.\nReason: ${reason}\nNew balance: **${newBal}**`)] });
  },
};

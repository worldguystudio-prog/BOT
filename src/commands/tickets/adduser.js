import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { successEmbed, errorEmbed } from '../../utils/embeds.js';
import { config } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('adduser')
    .setDescription('Add a member to this ticket.')
    .addUserOption((o) => o.setName('user').setDescription('Member to add').setRequired(true)),
  requiredLevel: config.permissionLevels.STAFF,
  requiredPermissions: [PermissionFlagsBits.ManageChannels],
  cooldown: 2000,
  async execute(interaction) {
    const user = interaction.options.getUser('user', true);
    try {
      await interaction.channel.permissionOverwrites.edit(user.id, { ViewChannel: true, SendMessages: true, ReadMessageHistory: true });
      await interaction.reply({ embeds: [successEmbed(`<@${user.id}> has been added to this ticket.`)], ephemeral: true });
    } catch (e) {
      await interaction.reply({ embeds: [errorEmbed(`Could not add user: ${e.message}`)], ephemeral: true });
    }
  },
};

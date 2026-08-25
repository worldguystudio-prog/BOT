import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { successEmbed, errorEmbed } from '../../utils/embeds.js';
import { config } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('removeuser')
    .setDescription('Remove a member from this ticket.')
    .addUserOption((o) => o.setName('user').setDescription('Member to remove').setRequired(true)),
  requiredLevel: config.permissionLevels.STAFF,
  requiredPermissions: [PermissionFlagsBits.ManageChannels],
  cooldown: 2000,
  async execute(interaction) {
    const user = interaction.options.getUser('user', true);
    try {
      await interaction.channel.permissionOverwrites.edit(user.id, { ViewChannel: false });
      await interaction.reply({ embeds: [successEmbed(`<@${user.id}> has been removed from this ticket.`)], ephemeral: true });
    } catch (e) {
      await interaction.reply({ embeds: [errorEmbed(`Could not remove user: ${e.message}`)], ephemeral: true });
    }
  },
};

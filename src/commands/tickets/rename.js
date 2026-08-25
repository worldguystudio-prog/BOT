import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { successEmbed, errorEmbed } from '../../utils/embeds.js';
import { config } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('rename')
    .setDescription('Rename the current ticket channel.')
    .addStringOption((o) => o.setName('name').setDescription('New channel name').setRequired(true).setMaxLength(90)),
  requiredLevel: config.permissionLevels.STAFF,
  requiredPermissions: [PermissionFlagsBits.ManageChannels],
  cooldown: 1000,
  async execute(interaction) {
    const name = interaction.options.getString('name', true).toLowerCase().replace(/\s+/g, '-').slice(0, 90);
    try {
      await interaction.channel.setName(name);
      await interaction.reply({ embeds: [successEmbed(`Ticket renamed to \`${name}\`.`)] });
    } catch (e) {
      await interaction.reply({ embeds: [errorEmbed(`Could not rename: ${e.message}`)], ephemeral: true });
    }
  },
};

import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { closeTicket } from '../../systems/tickets.js';
import { successEmbed, errorEmbed } from '../../utils/embeds.js';
import { config } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('closeticket')
    .setDescription('Close the current ticket and generate a transcript.'),
  requiredLevel: config.permissionLevels.STAFF,
  requiredPermissions: [PermissionFlagsBits.ManageChannels],
  cooldown: 2000,
  async execute(interaction) {
    await interaction.deferReply();
    const ok = await closeTicket(interaction.guild, interaction.channel, interaction.user.id).catch(() => false);
    if (!ok) {
      await interaction.editReply({ embeds: [errorEmbed('This channel is not a tracked ticket.')] });
    }
  },
};

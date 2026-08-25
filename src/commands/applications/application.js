import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { getApplication, buildReviewPanel } from '../../systems/applications.js';
import { errorEmbed } from '../../utils/embeds.js';
import { config } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('application')
    .setDescription('View an application and its review panel.')
    .addStringOption((o) => o.setName('id').setDescription('Application ID (e.g. 0042)').setRequired(true)),
  requiredLevel: config.permissionLevels.RECRUITER,
  requiredPermissions: [PermissionFlagsBits.ManageMessages],
  cooldown: 1000,
  async execute(interaction) {
    const id = interaction.options.getString('id', true);
    const app = getApplication(interaction.guild.id, id);
    if (!app) return interaction.reply({ embeds: [errorEmbed(`Application #${id} not found.`)], ephemeral: true });
    await interaction.reply({ ...buildReviewPanel(app), ephemeral: true });
  },
};

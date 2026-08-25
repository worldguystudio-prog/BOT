import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { getApplication, updateApplicationStatus } from '../../systems/applications.js';
import { successEmbed, errorEmbed } from '../../utils/embeds.js';
import { config } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('interview')
    .setDescription('Move an application to interview stage.')
    .addStringOption((o) => o.setName('id').setDescription('Application ID').setRequired(true)),
  requiredLevel: config.permissionLevels.RECRUITER,
  requiredPermissions: [PermissionFlagsBits.ManageMessages],
  cooldown: 1000,
  async execute(interaction) {
    const id = interaction.options.getString('id', true);
    const app = getApplication(interaction.guild.id, id);
    if (!app) return interaction.reply({ embeds: [errorEmbed(`Application #${id} not found.`)], ephemeral: true });
    updateApplicationStatus(interaction.guild, id, 'INTERVIEW', interaction.user.id);
    await interaction.reply({ embeds: [successEmbed(`Application #${id} moved to **INTERVIEW**.\nApplicant: <@${app.user_id}>`)], ephemeral: true });
  },
};

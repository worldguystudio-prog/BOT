import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { getApplication, updateApplicationStatus } from '../../systems/applications.js';
import { successEmbed, errorEmbed } from '../../utils/embeds.js';
import { config } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('accept')
    .setDescription('Accept an application.')
    .addStringOption((o) => o.setName('id').setDescription('Application ID').setRequired(true))
    .addStringOption((o) => o.setName('notes').setDescription('Optional reviewer notes').setRequired(false)),
  requiredLevel: config.permissionLevels.RECRUITER,
  requiredPermissions: [PermissionFlagsBits.ManageMessages],
  cooldown: 1000,
  async execute(interaction) {
    const id = interaction.options.getString('id', true);
    const notes = interaction.options.getString('notes');
    const app = getApplication(interaction.guild.id, id);
    if (!app) return interaction.reply({ embeds: [errorEmbed(`Application #${id} not found.`)], ephemeral: true });
    updateApplicationStatus(interaction.guild, id, 'ACCEPTED', interaction.user.id, notes);
    await interaction.reply({ embeds: [successEmbed(`Application #${id} **accepted**.\nApplicant: <@${app.user_id}>`)] });
  },
};

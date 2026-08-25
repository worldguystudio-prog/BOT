import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { getApplication, updateApplicationStatus, assignAcceptRoles } from '../../systems/applications.js';
import { successEmbed, errorEmbed } from '../../utils/embeds.js';
import { config } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('accept')
    .setDescription('Accept an application and assign configured roles.')
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

    // Assign configured accept roles for this application type.
    let roleMsg = '';
    const roleResult = await assignAcceptRoles(interaction.guild, app.user_id, app.type);
    if (roleResult.assigned.length > 0) {
      roleMsg = `\n\n✅ **Roles assigned:** ${roleResult.assigned.map((r) => `<@&${r}>`).join(', ')}`;
    }
    if (roleResult.failed.length > 0) {
      roleMsg += `\n\n⚠️ **Failed to assign:** ${roleResult.failed.length} role(s) — check bot hierarchy.`;
    }

    await interaction.reply({ embeds: [successEmbed(`Application #${id} **accepted**.\nApplicant: <@${app.user_id}>${roleMsg}`)], ephemeral: true });
  },
};

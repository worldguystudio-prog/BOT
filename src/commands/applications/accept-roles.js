import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { getSetting, setSetting } from '../../database/helpers.js';
import { APPLICATION_TYPES } from '../../systems/dm-applications.js';
import { successEmbed, errorEmbed, brandedEmbed } from '../../utils/embeds.js';
import { config } from '../../config/config.js';

/**
 * /accept-roles — Configure which roles to assign when an application is accepted.
 *
 * Usage:
 *   /accept-roles type:Recruitment add:@Member
 *   /accept-roles type:Recruitment remove:@Member
 *   /accept-roles type:Recruitment view
 *   /accept-roles view
 *
 * Roles are stored as JSON arrays in settings: accept_roles:<ApplicationType>
 */
export default {
  data: new SlashCommandBuilder()
    .setName('accept-roles')
    .setDescription('Configure which roles are auto-assigned when an application is accepted.')
    .addSubcommand((s) =>
      s
        .setName('add')
        .setDescription('Add a role to be assigned when this application type is accepted.')
        .addStringOption((o) => o.setName('type').setDescription('Application type').setRequired(true).addChoices(...APPLICATION_TYPES.map((t) => ({ name: t, value: t }))))
        .addRoleOption((o) => o.setName('role').setDescription('Role to assign on acceptance').setRequired(true)),
    )
    .addSubcommand((s) =>
      s
        .setName('remove')
        .setDescription('Remove a role from the accept list for this application type.')
        .addStringOption((o) => o.setName('type').setDescription('Application type').setRequired(true).addChoices(...APPLICATION_TYPES.map((t) => ({ name: t, value: t }))))
        .addRoleOption((o) => o.setName('role').setDescription('Role to remove').setRequired(true)),
    )
    .addSubcommand((s) =>
      s
        .setName('view')
        .setDescription('View the accept roles for an application type (or all types).')
        .addStringOption((o) => o.setName('type').setDescription('Application type (leave empty to view all)').setRequired(false).addChoices(...APPLICATION_TYPES.map((t) => ({ name: t, value: t })))),
    ),
  requiredLevel: config.permissionLevels.ADMINISTRATOR,
  requiredPermissions: [PermissionFlagsBits.ManageGuild],
  cooldown: 1000,
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'view') {
      const type = interaction.options.getString('type');
      if (type) {
        const roles = getRoles(interaction.guild.id, type);
        return interaction.reply({
          embeds: [brandedEmbed(`**Accept roles for ${type}:**\n\n${roles.length ? roles.map((r) => `• <@&${r}>`).join('\n') : '— none configured —'}`, 'ORGVNUM — Accept Roles')],
          ephemeral: true,
        });
      }
      // View all types.
      const fields = APPLICATION_TYPES.map((type) => {
        const roles = getRoles(interaction.guild.id, type);
        return { name: type, value: roles.length ? roles.map((r) => `• <@&${r}>`).join('\n') : '— none —', inline: false };
      });
      return interaction.reply({
        embeds: [brandedEmbed('**Accept Roles — All Application Types**\n\nThese roles are automatically assigned when an application of each type is accepted.', 'ORGVNUM — Accept Roles').addFields(fields)],
        ephemeral: true,
      });
    }

    if (sub === 'add' || sub === 'remove') {
      const type = interaction.options.getString('type', true);
      const role = interaction.options.getRole('role', true);
      let roles = getRoles(interaction.guild.id, type);

      if (sub === 'add') {
        if (roles.includes(role.id)) {
          return interaction.reply({ embeds: [errorEmbed(`Role <@&${role.id}> is already in the accept list for **${type}**.`)], ephemeral: true });
        }
        roles.push(role.id);
      } else {
        if (!roles.includes(role.id)) {
          return interaction.reply({ embeds: [errorEmbed(`Role <@&${role.id}> is not in the accept list for **${type}**.`)], ephemeral: true });
        }
        roles = roles.filter((r) => r !== role.id);
      }

      setSetting(interaction.guild.id, `accept_roles:${type}`, JSON.stringify(roles));
      return interaction.reply({
        embeds: [successEmbed(`Role <@&${role.id}> **${sub === 'add' ? 'added to' : 'removed from'}** the accept list for **${type}**.\n\nCurrent roles: ${roles.length ? roles.map((r) => `<@&${r}>`).join(', ') : 'none'}`)],
        ephemeral: true,
      });
    }
  },
};

/** Get the configured accept roles for an application type. */
function getRoles(guildId, type) {
  const raw = getSetting(guildId, `accept_roles:${type}`, null);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return raw.split(',').map((s) => s.trim()).filter(Boolean);
  }
}

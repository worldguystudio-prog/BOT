import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { getSetting, setSetting, getAllSettings, addDepartment, removeDepartment, getDepartments } from '../../database/helpers.js';
import { successEmbed, errorEmbed, brandedEmbed } from '../../utils/embeds.js';
import { config } from '../../config/config.js';

const SETTING_CHOICES = [
  { name: 'Log Channel', value: 'log_channel_id' },
  { name: 'Welcome Channel', value: 'welcome_channel_id' },
  { name: 'Welcome Message', value: 'welcome_message' },
  { name: 'Default Role', value: 'default_role_id' },
  { name: 'Ticket Category', value: 'ticket_category_id' },
  { name: 'Staff Role', value: 'staff_role_id' },
  { name: 'Moderator Role', value: 'moderator_role_id' },
  { name: 'Directorate Role', value: 'directorate_role_id' },
  { name: 'Recruiter Role', value: 'recruiter_role_id' },
  { name: 'Muted Role', value: 'muted_role_id' },
  { name: 'Application Channel', value: 'application_channel_id' },
  { name: 'Recruitment Channel', value: 'recruitment_channel_id' },
  { name: 'Tickets Per User (max)', value: 'ticket_max_per_user' },
  { name: 'Economy Enabled', value: 'economy_enabled' },
];

export default {
  data: new SlashCommandBuilder()
    .setName('config')
    .setDescription('Configure ORGVNUM settings.')
    .addSubcommand((s) => s.setName('view').setDescription('View all current settings.'))
    .addSubcommand((s) =>
      s
        .setName('set')
        .setDescription('Set a configuration value.')
        .addStringOption((o) => o.setName('setting').setDescription('Setting name').setRequired(true).addChoices(...SETTING_CHOICES))
        .addStringOption((o) => o.setName('value').setDescription('Value (ID, text, or on/off)').setRequired(true))
        .addChannelOption((o) => o.setName('channel').setDescription('Channel (for channel settings)').setRequired(false))
        .addRoleOption((o) => o.setName('role').setDescription('Role (for role settings)').setRequired(false)),
    )
    .addSubcommand((s) =>
      s
        .setName('permissions')
        .setDescription('Map a role to a permission level.')
        .addRoleOption((o) => o.setName('role').setDescription('Role').setRequired(true))
        .addStringOption((o) =>
          o
            .setName('level')
            .setDescription('Permission level')
            .setRequired(true)
            .addChoices(
              { name: 'Administrator', value: '90' },
              { name: 'Directorate Command', value: '80' },
              { name: 'Department Command', value: '70' },
              { name: 'Moderator', value: '60' },
              { name: 'Recruiter', value: '50' },
              { name: 'Trainer', value: '40' },
              { name: 'Staff', value: '30' },
            ),
        ),
    )
    .addSubcommand((s) =>
      s
        .setName('departments')
        .setDescription('Manage departments.')
        .addStringOption((o) => o.setName('action').setDescription('Action').setRequired(true).addChoices({ name: 'Add', value: 'add' }, { name: 'Remove', value: 'remove' }, { name: 'List', value: 'list' }))
        .addStringOption((o) => o.setName('name').setDescription('Department name').setRequired(false))
        .addRoleOption((o) => o.setName('role').setDescription('Role linked to this department').setRequired(false)),
    ),
  requiredLevel: config.permissionLevels.ADMINISTRATOR,
  requiredPermissions: [PermissionFlagsBits.ManageGuild],
  cooldown: 2000,
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    if (sub === 'view') {
      const settings = getAllSettings(guildId);
      const permRoles = settings.permission_roles ? JSON.parse(settings.permission_roles) : {};
      const permLines = Object.entries(permRoles).map(([rid, lvl]) => `• <@&${rid}> → ${lvl}`);
      const lines = SETTING_CHOICES.map((c) => `• ${c.name}: \`${settings[c.value] || '—'}\``);
      return interaction.reply({
        embeds: [brandedEmbed(`**ORGVNUM — Current Configuration**\n\n**General**\n${lines.join('\n')}${permLines.length ? `\n\n**Permission Roles**\n${permLines.join('\n')}` : ''}`, 'ORGVNUM — Config').addFields(
          { name: 'Departments', value: getDepartments(guildId).map((d) => `• ${d.name}${d.role_id ? ` (<@&${d.role_id}>)` : ''}`).join('\n') || 'None configured', inline: false },
        )],
        ephemeral: true,
      });
    }

    if (sub === 'set') {
      const setting = interaction.options.getString('setting', true);
      const channel = interaction.options.getChannel('channel');
      const role = interaction.options.getRole('role');
      const text = interaction.options.getString('value', true);
      let value = text;
      if (channel) value = channel.id;
      if (role) value = role.id;
      if (setting === 'economy_enabled') value = /^(1|true|on|yes)$/i.test(value) ? '1' : '0';
      setSetting(guildId, setting, value);
      return interaction.reply({ embeds: [successEmbed(`Set **${setting}** to \`${value}\`.`)] });
    }

    if (sub === 'permissions') {
      const role = interaction.options.getRole('role', true);
      const level = parseInt(interaction.options.getString('level', true), 10);
      const raw = getSetting(guildId, 'permission_roles', '{}');
      const map = JSON.parse(raw);
      if (level) {
        map[role.id] = level;
      } else {
        delete map[role.id];
      }
      setSetting(guildId, 'permission_roles', JSON.stringify(map));
      return interaction.reply({ embeds: [successEmbed(`Role <@&${role.id}> mapped to level **${level}**.`)] });
    }

    if (sub === 'departments') {
      const action = interaction.options.getString('action', true);
      const name = interaction.options.getString('name');
      const role = interaction.options.getRole('role');
      if (action === 'list') {
        const depts = getDepartments(guildId);
        return interaction.reply({ embeds: [brandedEmbed(`**Departments (${depts.length})**\n\n${depts.map((d) => `• ${d.name}${d.role_id ? ` → <@&${d.role_id}>` : ''}`).join('\n') || 'None'}`)] });
      }
      if (action === 'add') {
        if (!name) return interaction.reply({ embeds: [errorEmbed('Provide a department name.')] , ephemeral: true });
        addDepartment(guildId, name, role?.id || null, null);
        return interaction.reply({ embeds: [successEmbed(`Department **${name}** added${role ? ` (role: <@&${role.id}>)` : ''}.`)] });
      }
      if (action === 'remove') {
        if (!name) return interaction.reply({ embeds: [errorEmbed('Provide a department name.')] , ephemeral: true });
        removeDepartment(guildId, name);
        return interaction.reply({ embeds: [successEmbed(`Department **${name}** removed.`)] });
      }
    }
  },
};

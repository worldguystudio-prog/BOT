import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';
import { getSetting, setSetting, getAllSettings, addDepartment, removeDepartment, getDepartments } from '../../database/helpers.js';
import { successEmbed, errorEmbed, brandedEmbed } from '../../utils/embeds.js';
import { config } from '../../config/config.js';
import { SETTING_CATALOG, ALL_SETTINGS } from '../../config/settings-catalog.js';

// Note: Discord limits string option choices to 25. We have 30 settings,
// so /config reset takes a free-text key instead of a dropdown. Use
// /config view to see all keys, or use /dashboard for interactive editing.

export default {
  data: new SlashCommandBuilder()
    .setName('config')
    .setDescription('Configure all ORGVNUM settings — channels, roles, and systems.')

    // ─── view ───────────────────────────────────────
    .addSubcommand((s) => s.setName('view').setDescription('View the full ORGVNUM configuration.'))

    // ─── reset ─────────────────────────────────────
    .addSubcommand((s) =>
      s
        .setName('reset')
        .setDescription('Clear a single setting back to its default.')
        .addStringOption((o) => o.setName('setting').setDescription('Setting key to reset (e.g. log_channel_id). Use /config view to see all keys.').setRequired(true).setMaxLength(60)),
    )

    // ─── permissions ───────────────────────────────
    .addSubcommand((s) =>
      s
        .setName('permissions')
        .setDescription('Map a role to a permission level.')
        .addRoleOption((o) => o.setName('role').setDescription('Role to map').setRequired(true))
        .addStringOption((o) =>
          o
            .setName('level')
            .setDescription('Permission level')
            .setRequired(true)
            .addChoices(
              { name: 'Owner (100)', value: '100' },
              { name: 'Administrator (90)', value: '90' },
              { name: 'Directorate Command (80)', value: '80' },
              { name: 'Department Command (70)', value: '70' },
              { name: 'Moderator (60)', value: '60' },
              { name: 'Recruiter (50)', value: '50' },
              { name: 'Trainer (40)', value: '40' },
              { name: 'Staff (30)', value: '30' },
              { name: 'Remove mapping', value: '0' },
            ),
        ),
    )

    // ─── welcome ───────────────────────────────────
    .addSubcommandGroup((g) =>
      g
        .setName('welcome')
        .setDescription('Configure the welcome system.')
        .addSubcommand((s) => s.setName('channel').setDescription('Where welcome messages are sent.').addChannelOption((o) => o.setName('channel').setDescription('Welcome channel').setRequired(true)))
        .addSubcommand((s) => s.setName('leave_channel').setDescription('Where leave messages are logged.').addChannelOption((o) => o.setName('channel').setDescription('Leave log channel').setRequired(true)))
        .addSubcommand((s) => s.setName('message').setDescription('Custom welcome message (use {user} for mention).').addStringOption((o) => o.setName('text').setDescription('Welcome message text').setRequired(true).setMaxLength(1000)))
        .addSubcommand((s) => s.setName('role').setDescription('Role auto-assigned on join.').addRoleOption((o) => o.setName('role').setDescription('Default role').setRequired(true))),
    )

    // ─── logs ──────────────────────────────────────
    .addSubcommandGroup((g) =>
      g
        .setName('logs')
        .setDescription('Configure log channels.')
        .addSubcommand((s) => s.setName('moderation').setDescription('Main moderation log channel.').addChannelOption((o) => o.setName('channel').setDescription('Channel').setRequired(true)))
        .addSubcommand((s) => s.setName('messages').setDescription('Message edit/delete log channel.').addChannelOption((o) => o.setName('channel').setDescription('Channel').setRequired(true)))
        .addSubcommand((s) => s.setName('members').setDescription('Member join/leave log channel.').addChannelOption((o) => o.setName('channel').setDescription('Channel').setRequired(true)))
        .addSubcommand((s) => s.setName('tickets').setDescription('Ticket log channel.').addChannelOption((o) => o.setName('channel').setDescription('Channel').setRequired(true)))
        .addSubcommand((s) => s.setName('applications').setDescription('Application log channel.').addChannelOption((o) => o.setName('channel').setDescription('Channel').setRequired(true))),
    )

    // ─── tickets ───────────────────────────────────
    .addSubcommandGroup((g) =>
      g
        .setName('tickets')
        .setDescription('Configure the ticket system.')
        .addSubcommand((s) => s.setName('category').setDescription('Category new tickets are created under.').addChannelOption((o) => o.setName('category').setDescription('Ticket category').setRequired(true)))
        .addSubcommand((s) => s.setName('panel').setDescription('Channel where /ticket-panel posts the panel.').addChannelOption((o) => o.setName('channel').setDescription('Panel channel').setRequired(true)))
        .addSubcommand((s) => s.setName('transcript').setDescription('Channel where transcripts are sent.').addChannelOption((o) => o.setName('channel').setDescription('Transcript channel').setRequired(true)))
        .addSubcommand((s) => s.setName('staff').setDescription('Staff role that gets ticket access.').addRoleOption((o) => o.setName('role').setDescription('Staff role').setRequired(true)))
        .addSubcommand((s) => s.setName('max').setDescription('Max open tickets per user.').addIntegerOption((o) => o.setName('amount').setDescription('Max tickets (1-10)').setRequired(true).setMinValue(1).setMaxValue(10))),
    )

    // ─── applications ──────────────────────────────
    .addSubcommandGroup((g) =>
      g
        .setName('applications')
        .setDescription('Configure the application system.')
        .addSubcommand((s) => s.setName('channel').setDescription('Where application review panels are posted.').addChannelOption((o) => o.setName('channel').setDescription('Application review channel').setRequired(true)))
        .addSubcommand((s) => s.setName('recruiter').setDescription('Recruiter role (can review applications).').addRoleOption((o) => o.setName('role').setDescription('Recruiter role').setRequired(true))),
    )

    // ─── recruitment ───────────────────────────────
    .addSubcommandGroup((g) =>
      g
        .setName('recruitment')
        .setDescription('Configure recruitment & waitlist channels.')
        .addSubcommand((s) => s.setName('channel').setDescription('Recruitment info channel.').addChannelOption((o) => o.setName('channel').setDescription('Recruitment channel').setRequired(true)))
        .addSubcommand((s) => s.setName('waitlist').setDescription('Waitlist channel.').addChannelOption((o) => o.setName('channel').setDescription('Waitlist channel').setRequired(true))),
    )

    // ─── roleplay ─────────────────────────────────
    .addSubcommandGroup((g) =>
      g
        .setName('roleplay')
        .setDescription('Configure roleplay channels.')
        .addSubcommand((s) => s.setName('dispatch').setDescription('Dispatch channel.').addChannelOption((o) => o.setName('channel').setDescription('Dispatch channel').setRequired(true)))
        .addSubcommand((s) => s.setName('scene').setDescription('Scene channel.').addChannelOption((o) => o.setName('channel').setDescription('Scene channel').setRequired(true)))
        .addSubcommand((s) => s.setName('log').setDescription('Roleplay log channel.').addChannelOption((o) => o.setName('channel').setDescription('Log channel').setRequired(true))),
    )

    // ─── economy ──────────────────────────────────
    .addSubcommandGroup((g) =>
      g
        .setName('economy')
        .setDescription('Configure the points economy.')
        .addSubcommand((s) => s.setName('enable').setDescription('Enable or disable the economy.').addBooleanOption((o) => o.setName('enabled').setDescription('True = on, False = off').setRequired(true)))
        .addSubcommand((s) => s.setName('channel').setDescription('Economy display channel.').addChannelOption((o) => o.setName('channel').setDescription('Channel').setRequired(true))),
    )

    // ─── shifts ───────────────────────────────────
    .addSubcommandGroup((g) =>
      g
        .setName('shifts')
        .setDescription('Configure the shift system.')
        .addSubcommand((s) => s.setName('channel').setDescription('Shift log channel.').addChannelOption((o) => o.setName('channel').setDescription('Channel').setRequired(true))),
    )

    // ─── training ─────────────────────────────────
    .addSubcommandGroup((g) =>
      g
        .setName('training')
        .setDescription('Configure training & events.')
        .addSubcommand((s) => s.setName('channel').setDescription('Training/event channel.').addChannelOption((o) => o.setName('channel').setDescription('Channel').setRequired(true)))
        .addSubcommand((s) => s.setName('log').setDescription('Training log channel.').addChannelOption((o) => o.setName('channel').setDescription('Log channel').setRequired(true))),
    )

    // ─── roles ────────────────────────────────────
    .addSubcommandGroup((g) =>
      g
        .setName('roles')
        .setDescription('Configure staff roles.')
        .addSubcommand((s) => s.setName('moderator').setDescription('Moderator role.').addRoleOption((o) => o.setName('role').setDescription('Role').setRequired(true)))
        .addSubcommand((s) => s.setName('directorate').setDescription('Directorate role.').addRoleOption((o) => o.setName('role').setDescription('Role').setRequired(true)))
        .addSubcommand((s) => s.setName('trainer').setDescription('Trainer role.').addRoleOption((o) => o.setName('role').setDescription('Role').setRequired(true)))
        .addSubcommand((s) => s.setName('muted').setDescription('Muted role (for /mute).').addRoleOption((o) => o.setName('role').setDescription('Role').setRequired(true))),
    )

    // ─── departments ──────────────────────────────
    .addSubcommandGroup((g) =>
      g
        .setName('departments')
        .setDescription('Manage roleplay departments.')
        .addSubcommand((s) => s.setName('add').setDescription('Add a department.').addStringOption((o) => o.setName('name').setDescription('Department name').setRequired(true).setMaxLength(50)).addRoleOption((o) => o.setName('role').setDescription('Role linked to this department').setRequired(false)))
        .addSubcommand((s) => s.setName('remove').setDescription('Remove a department.').addStringOption((o) => o.setName('name').setDescription('Department name').setRequired(true)))
        .addSubcommand((s) => s.setName('list').setDescription('List all departments.')),
    ),

  requiredLevel: config.permissionLevels.ADMINISTRATOR,
  requiredPermissions: [PermissionFlagsBits.ManageGuild],
  cooldown: 1000,

  async execute(interaction) {
    const subcommandGroup = interaction.options.getSubcommandGroup();
    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    // ─── Top-level subcommands (no group) ───────────
    if (!subcommandGroup) {
      // /config view
      if (subcommand === 'view') return handleView(interaction);
      // /config reset
      if (subcommand === 'reset') return handleReset(interaction);
      // /config permissions
      if (subcommand === 'permissions') return handlePermissions(interaction);
    }

    // ─── Grouped subcommands ────────────────────────

    // Handle departments specially FIRST — they're not a setting, they're
    // a separate table, so resolveSettingKey returns null for them.
    if (subcommandGroup === 'departments') return handleDepartments(interaction, subcommand);

    // Resolve the setting key from the group + subcommand.
    const key = resolveSettingKey(subcommandGroup, subcommand);
    if (!key) return interaction.reply({ embeds: [errorEmbed('Unknown configuration option.')], ephemeral: true });

    // Gather the value from whichever option type is present.
    const channel = interaction.options.getChannel('channel') || interaction.options.getChannel('category');
    const role = interaction.options.getRole('role');
    const text = interaction.options.getString('text');
    const bool = interaction.options.getBoolean('enabled');
    const int = interaction.options.getInteger('amount');

    let value = null;
    let pretty = '';
    if (channel) { value = channel.id; pretty = `<#${channel.id}>`; }
    else if (role) { value = role.id; pretty = `<@&${role.id}>`; }
    else if (text !== null) { value = text; pretty = text.slice(0, 80); }
    else if (bool !== null) { value = bool ? '1' : '0'; pretty = bool ? 'Enabled' : 'Disabled'; }
    else if (int !== null) { value = String(int); pretty = String(int); }

    if (value === null) return interaction.reply({ embeds: [errorEmbed('No value provided.')], ephemeral: true });

    setSetting(guildId, key, value);
    const label = SETTING_CATALOG[subcommandGroup]?.items.find((i) => i.key === key)?.label || key;
    return interaction.reply({
      embeds: [successEmbed(`**${label}** set to ${pretty}.\n\n(\`${key}\` = \`${value}\`)`, '✅ Configuration Updated')],
      ephemeral: true,
    });
  },
};

/* ─────────── Handlers ─────────── */

function resolveSettingKey(group, sub) {
  const map = {
    welcome: { channel: 'welcome_channel_id', leave_channel: 'leave_channel_id', message: 'welcome_message', role: 'default_role_id' },
    logs: { moderation: 'log_channel_id', messages: 'message_log_channel_id', members: 'member_log_channel_id', tickets: 'ticket_log_channel_id', applications: 'application_log_channel_id' },
    tickets: { category: 'ticket_category_id', panel: 'ticket_panel_channel_id', transcript: 'ticket_transcript_channel_id', staff: 'staff_role_id', max: 'ticket_max_per_user' },
    applications: { channel: 'application_channel_id', recruiter: 'recruiter_role_id' },
    recruitment: { channel: 'recruitment_channel_id', waitlist: 'waitlist_channel_id' },
    roleplay: { dispatch: 'dispatch_channel_id', scene: 'scene_channel_id', log: 'roleplay_log_channel_id' },
    economy: { enable: 'economy_enabled', channel: 'economy_channel_id' },
    shifts: { channel: 'shift_channel_id' },
    training: { channel: 'training_channel_id', log: 'training_log_channel_id' },
    roles: { moderator: 'moderator_role_id', directorate: 'directorate_role_id', trainer: 'trainer_role_id', muted: 'muted_role_id' },
  };
  return map[group]?.[sub] || null;
}

async function handleView(interaction) {
  const settings = getAllSettings(interaction.guild.id);
  const permRoles = settings.permission_roles ? JSON.parse(settings.permission_roles) : {};
  const depts = getDepartments(interaction.guild.id);

  const fields = [];
  for (const [catKey, group] of Object.entries(SETTING_CATALOG)) {
    const lines = group.items.map((item) => {
      const raw = settings[item.key];
      if (!raw) return `• ${item.label}: \`— not set —\``;
      if (item.type === 'channel') return `• ${item.label}: <#${raw}>`;
      if (item.type === 'role') return `• ${item.label}: <@&${raw}>`;
      if (item.type === 'bool') return `• ${item.label}: ${raw === '1' ? '✅ Enabled' : '❌ Disabled'}`;
      if (item.type === 'int') return `• ${item.label}: \`${raw}\``;
      return `• ${item.label}: \`${raw}\``;
    });
    fields.push({ name: `${group.emoji} ${group.label}`, value: lines.join('\n'), inline: false });
  }

  // Permission roles.
  if (Object.keys(permRoles).length) {
    const lvlNames = { 100: 'Owner', 90: 'Administrator', 80: 'Directorate', 70: 'Department', 60: 'Moderator', 50: 'Recruiter', 40: 'Trainer', 30: 'Staff', 10: 'Member' };
    fields.push({ name: '🛡️ Permission Roles', value: Object.entries(permRoles).map(([rid, lvl]) => `• <@&${rid}> → ${lvlNames[lvl] || lvl}`).join('\n'), inline: false });
  }

  // Departments.
  fields.push({
    name: '🏢 Departments',
    value: depts.length ? depts.map((d) => `• ${d.name}${d.role_id ? ` (<@&${d.role_id}>)` : ''}`).join('\n') : '— none configured —',
    inline: false,
  });

  return interaction.reply({
    embeds: [brandedEmbed('**ORGVNUM — Full Configuration**\n\nAll settings below are configurable via the `/config` subcommands. Changes take effect immediately.', 'ORGVNUM — Configuration').addFields(fields)],
    ephemeral: true,
  });
}

async function handleReset(interaction) {
  const key = interaction.options.getString('setting', true).trim();
  // Verify it's a known setting key.
  const setting = ALL_SETTINGS.find((s) => s.key === key);
  if (!setting) {
    return interaction.reply({ embeds: [errorEmbed(`Unknown setting key: \`${key}\`.\n\nUse \`/config view\` to see all valid keys, or use \`/dashboard\` for interactive editing.`)], ephemeral: true });
  }
  const { run } = await import('../../database/helpers.js');
  run('DELETE FROM settings WHERE guild_id = ? AND key = ?', [interaction.guild.id, key]);
  const label = `${setting.categoryEmoji} ${setting.categoryLabel} → ${setting.label}`;
  return interaction.reply({ embeds: [successEmbed(`**${label}** has been reset to its default.`, '✅ Setting Reset')], ephemeral: true });
}

async function handlePermissions(interaction) {
  const role = interaction.options.getRole('role', true);
  const level = parseInt(interaction.options.getString('level', true), 10);
  const raw = getSetting(interaction.guild.id, 'permission_roles', '{}');
  const map = JSON.parse(raw);
  if (level === 0) {
    delete map[role.id];
    setSetting(interaction.guild.id, 'permission_roles', JSON.stringify(map));
    return interaction.reply({ embeds: [successEmbed(`Role <@&${role.id}> permission mapping removed.`)], ephemeral: true });
  }
  map[role.id] = level;
  setSetting(interaction.guild.id, 'permission_roles', JSON.stringify(map));
  const names = { 100: 'Owner', 90: 'Administrator', 80: 'Directorate Command', 70: 'Department Command', 60: 'Moderator', 50: 'Recruiter', 40: 'Trainer', 30: 'Staff' };
  return interaction.reply({ embeds: [successEmbed(`Role <@&${role.id}> mapped to **${names[level] || level}** (${level}).`)], ephemeral: true });
}

async function handleDepartments(interaction, sub) {
  if (sub === 'list') {
    const depts = getDepartments(interaction.guild.id);
    return interaction.reply({
      embeds: [brandedEmbed(`**Departments (${depts.length})**\n\n${depts.length ? depts.map((d) => `• ${d.name}${d.role_id ? ` → <@&${d.role_id}>` : ''}`).join('\n') : '— none —'}`, '🏢 Departments')],
      ephemeral: true,
    });
  }
  if (sub === 'add') {
    const name = interaction.options.getString('name', true);
    const role = interaction.options.getRole('role');
    addDepartment(interaction.guild.id, name, role?.id || null, null);
    return interaction.reply({ embeds: [successEmbed(`Department **${name}** added${role ? ` (role: <@&${role.id}>)` : ''}.`)], ephemeral: true });
  }
  if (sub === 'remove') {
    const name = interaction.options.getString('name', true);
    removeDepartment(interaction.guild.id, name);
    return interaction.reply({ embeds: [successEmbed(`Department **${name}** removed.`)], ephemeral: true });
  }
}

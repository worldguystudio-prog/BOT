import {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ChannelSelectMenuBuilder,
  RoleSelectMenuBuilder,
  ChannelType,
  ButtonBuilder,
  ButtonStyle,
  TextInputBuilder,
  TextInputStyle,
  ModalBuilder,
} from 'discord.js';
import { getSetting, setSetting, getAllSettings, getDepartments, addDepartment, removeDepartment } from '../database/helpers.js';
import { brandedEmbed, successEmbed, errorEmbed } from '../utils/embeds.js';
import { registerSelect, registerButton, registerModal } from '../registry.js';
import { SETTING_CATALOG, ALL_SETTINGS, findSetting, PERMISSION_LEVELS } from '../config/settings-catalog.js';
import { config } from '../config/config.js';
import logger from '../utils/logger.js';

/**
 * ORGVNUM Management Dashboard.
 *
 * One command (`/dashboard`) opens an interactive panel where the owner can
 * configure every channel, role, and system setting without memorizing keys.
 *
 * Flow:
 *   /dashboard
 *     → category select menu (Welcome, Logs, Tickets, ...)
 *     → setting select menu (lists settings in that category with current values)
 *     → channel/role select OR text/int modal OR bool toggle
 *     → saved, return to category view
 */

/** Build the main dashboard embed + category select. */
export function buildDashboard() {
  const embed = brandedEmbed(
    `**ORGVNUM — Management Dashboard**\n\nSelect a category below to view and edit its settings. Everything is configurable from here — no need to memorize setting keys.`,
    'ORGVNUM — Dashboard',
  );

  const options = Object.entries(SETTING_CATALOG).map(([key, g]) => ({
    label: g.label,
    value: key,
    emoji: g.emoji,
    description: `${g.items.length} setting${g.items.length === 1 ? '' : 's'}`,
  }));

  // Add special categories.
  options.push({ label: 'Departments', value: 'departments', emoji: '🏢', description: 'Manage roleplay departments' });
  options.push({ label: 'Permissions', value: 'permissions', emoji: '🔐', description: 'Map roles to permission levels' });

  const select = new StringSelectMenuBuilder().setCustomId('dash:cat:').setPlaceholder('Select a category…').addOptions(options);
  const row = new ActionRowBuilder().addComponents(select);

  return { embeds: [embed], components: [row] };
}

/** Build the category view: shows current settings + a setting select to edit. */
export function buildCategoryView(guildId, categoryKey) {
  const settings = getAllSettings(guildId);

  if (categoryKey === 'departments') return buildDepartmentsView(guildId);
  if (categoryKey === 'permissions') return buildPermissionsView(guildId, settings);

  const group = SETTING_CATALOG[categoryKey];
  if (!group) return { embeds: [errorEmbed('Unknown category.')], components: [] };

  const lines = group.items.map((item) => {
    const raw = settings[item.key];
    if (!raw) return `• ${item.label}: **— not set —**`;
    if (item.type === 'channel') return `• ${item.label}: <#${raw}>`;
    if (item.type === 'role') return `• ${item.label}: <@&${raw}>`;
    if (item.type === 'bool') return `• ${item.label}: ${raw === '1' ? '✅ Enabled' : '❌ Disabled'}`;
    if (item.type === 'int') return `• ${item.label}: \`${raw}\``;
    return `• ${item.label}: \`${raw}\``;
  });

  const embed = brandedEmbed(
    `${group.emoji} **${group.label}**\n\n${lines.join('\n')}\n\nSelect a setting below to edit it.`,
    'ORGVNUM — Dashboard',
  );

  const options = group.items.map((item) => {
    const raw = settings[item.key];
    let desc = 'Not set';
    if (raw) {
      if (item.type === 'channel') desc = `<#${raw}>`;
      else if (item.type === 'role') desc = `<@&${raw}>`;
      else if (item.type === 'bool') desc = raw === '1' ? 'Enabled' : 'Disabled';
      else desc = String(raw).slice(0, 80);
    }
    return { label: item.label.slice(0, 100), value: item.key, description: desc.slice(0, 100) };
  });

  const select = new StringSelectMenuBuilder().setCustomId(`dash:edit:${categoryKey}`).setPlaceholder('Choose a setting to edit…').addOptions(options);
  const back = new ButtonBuilder().setCustomId('dash:back:').setLabel('Back').setEmoji('⬅️').setStyle(ButtonStyle.Secondary);

  return {
    embeds: [embed],
    components: [new ActionRowBuilder().addComponents(select), new ActionRowBuilder().addComponents(back)],
  };
}

/** Build the edit view for a specific setting (channel/role select or modal trigger). */
export function buildEditView(guildId, categoryKey, settingKey) {
  const item = findSetting(settingKey);
  if (!item) return { embeds: [errorEmbed('Unknown setting.')], components: [] };

  const current = getSetting(guildId, settingKey, null);
  const currentPretty = current
    ? item.type === 'channel' ? `<#${current}>`
      : item.type === 'role' ? `<@&${current}>`
      : item.type === 'bool' ? (current === '1' ? 'Enabled' : 'Disabled')
      : `\`${current}\``
    : '— not set —';

  const embed = brandedEmbed(
    `Edit: **${item.label}**\n\nCategory: ${SETTING_CATALOG[categoryKey]?.label || categoryKey}\nCurrent value: ${currentPretty}\n\nSelect a new value below.`,
    'ORGVNUM — Dashboard',
  );

  const back = new ButtonBuilder().setCustomId(`dash:back:${categoryKey}`).setLabel('Back').setEmoji('⬅️').setStyle(ButtonStyle.Secondary);
  const rows = [new ActionRowBuilder().addComponents(back)];

  if (item.type === 'channel') {
    const channelSelect = new ChannelSelectMenuBuilder().setCustomId(`dash:savechannel:${categoryKey}:${settingKey}`).setPlaceholder('Select a channel…').addChannelTypes(ChannelType.GuildText, ChannelType.GuildCategory);
    rows.unshift(new ActionRowBuilder().addComponents(channelSelect));
  } else if (item.type === 'role') {
    const roleSelect = new RoleSelectMenuBuilder().setCustomId(`dash:saverole:${categoryKey}:${settingKey}`).setPlaceholder('Select a role…');
    rows.unshift(new ActionRowBuilder().addComponents(roleSelect));
  } else if (item.type === 'bool') {
    const enable = new ButtonBuilder().setCustomId(`dash:savebool:${settingKey}:1`).setLabel('Enable').setStyle(ButtonStyle.Success);
    const disable = new ButtonBuilder().setCustomId(`dash:savebool:${settingKey}:0`).setLabel('Disable').setStyle(ButtonStyle.Danger);
    rows.unshift(new ActionRowBuilder().addComponents(enable, disable));
  } else if (item.type === 'text' || item.type === 'int') {
    // These need a modal — we use a button to trigger it.
    const edit = new ButtonBuilder().setCustomId(`dash:modal:${categoryKey}:${settingKey}`).setLabel('✏️ Edit Value').setStyle(ButtonStyle.Primary);
    rows.unshift(new ActionRowBuilder().addComponents(edit));
  }

  return { embeds: [embed], components: rows };
}

function buildDepartmentsView(guildId) {
  const depts = getDepartments(guildId);
  const embed = brandedEmbed(
    `🏢 **Departments**\n\n${depts.length ? depts.map((d) => `• ${d.name}${d.role_id ? ` → <@&${d.role_id}>` : ''}`).join('\n') : '— none configured —'}\n\nUse \`/config departments add\` to add departments.`,
    'ORGVNUM — Dashboard',
  );
  const back = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('dash:back:').setLabel('Back').setEmoji('⬅️').setStyle(ButtonStyle.Secondary));
  return { embeds: [embed], components: [back] };
}

function buildPermissionsView(guildId, settings) {
  const permRoles = settings.permission_roles ? JSON.parse(settings.permission_roles) : {};
  const lines = Object.keys(permRoles).length
    ? Object.entries(permRoles).map(([rid, lvl]) => {
        const name = PERMISSION_LEVELS.find((p) => p.value === String(lvl))?.label || String(lvl);
        return `• <@&${rid}> → **${name}** (${lvl})`;
      })
    : ['— no role mappings set —'];
  const embed = brandedEmbed(
    `🔐 **Permission Roles**\n\n${lines.join('\n')}\n\nMap Discord roles to ORGVNUM permission levels below.`,
    'ORGVNUM — Dashboard',
  );

  const options = PERMISSION_LEVELS.map((p) => ({ label: `${p.label} (${p.value})`, value: p.value, description: `Level ${p.value}` }));
  const levelSelect = new StringSelectMenuBuilder().setCustomId('dash:permlevel:').setPlaceholder('Pick a permission level…').addOptions(options);
  const back = new ButtonBuilder().setCustomId('dash:back:').setLabel('Back').setEmoji('⬅️').setStyle(ButtonStyle.Secondary);

  return {
    embeds: [embed],
    components: [new ActionRowBuilder().addComponents(levelSelect), new ActionRowBuilder().addComponents(back)],
  };
}

/* ───────── Component Handlers ───────── */

// Unified select handler — handles ALL dashboard select menus (string, channel, role).
// (The registry only stores ONE handler per system key, so all branches must
// live in a single function.)
registerSelect('dash', async (interaction, _client, action, id) => {
  const guildId = interaction.guild.id;

  // ─── String selects ───────────────────────────────
  if (action === 'cat') {
    const cat = interaction.values?.[0];
    if (!cat) return;
    await interaction.update(buildCategoryView(guildId, cat));
    return;
  }

  if (action === 'edit') {
    // id is the categoryKey; values[0] is the settingKey.
    const categoryKey = id;
    const settingKey = interaction.values?.[0];
    if (!settingKey) return;
    await interaction.update(buildEditView(guildId, categoryKey, settingKey));
    return;
  }

  if (action === 'permlevel') {
    const level = interaction.values?.[0];
    if (!level) return;
    const roleSelect = new RoleSelectMenuBuilder().setCustomId(`dash:permrole:${level}`).setPlaceholder('Select the role to map to this level…');
    const back = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('dash:back:permissions').setLabel('Back').setEmoji('⬅️').setStyle(ButtonStyle.Secondary));
    const embed = brandedEmbed(`Map a role to permission level **${PERMISSION_LEVELS.find((p) => p.value === level)?.label || level}** (${level}).`);
    await interaction.update({ embeds: [embed], components: [new ActionRowBuilder().addComponents(roleSelect), back] });
    return;
  }

  // ─── Channel / Role selects ───────────────────────
  if (action === 'savechannel') {
    const [categoryKey, settingKey] = id.split(':');
    const channel = interaction.values?.[0];
    if (!channel) return;
    setSetting(guildId, settingKey, channel);
    await interaction.update(buildCategoryView(guildId, categoryKey));
    await interaction.followUp({ embeds: [successEmbed('Setting saved.')], ephemeral: true }).catch(() => {});
    return;
  }

  if (action === 'saverole') {
    const [categoryKey, settingKey] = id.split(':');
    const role = interaction.values?.[0];
    if (!role) return;
    setSetting(guildId, settingKey, role);
    await interaction.update(buildCategoryView(guildId, categoryKey));
    await interaction.followUp({ embeds: [successEmbed('Setting saved.')], ephemeral: true }).catch(() => {});
    return;
  }

  if (action === 'permrole') {
    const level = id;
    const role = interaction.values?.[0];
    if (!role) return;
    const raw = getSetting(guildId, 'permission_roles', '{}');
    const map = JSON.parse(raw);
    map[role] = parseInt(level, 10);
    setSetting(guildId, 'permission_roles', JSON.stringify(map));
    await interaction.update(buildPermissionsView(guildId, getAllSettings(guildId)));
    await interaction.followUp({ embeds: [successEmbed('Role mapped.')], ephemeral: true }).catch(() => {});
    return;
  }

  // Fallback — unknown action. Reply so Discord doesn't show "interaction failed".
  logger.warn(`Unhandled dashboard select action: ${action}`);
  await interaction.reply({ embeds: [errorEmbed('Unknown dashboard action. Please reopen /dashboard.')], ephemeral: true }).catch(() => {});
});

// Buttons — back navigation, bool toggles, modal triggers.
registerButton('dash', async (interaction, _client, action, id) => {
  // Back navigation: dash:back:<categoryKey?> (empty = main dashboard)
  if (action === 'back') {
    if (!id) {
      await interaction.update(buildDashboard());
    } else {
      await interaction.update(buildCategoryView(interaction.guild.id, id));
    }
    return;
  }

  // Bool toggle: dash:savebool:<settingKey>:<0|1>
  if (action === 'savebool') {
    const [settingKey, value] = id.split(':');
    setSetting(interaction.guild.id, settingKey, value);
    // Find the category for this setting to return to its view.
    const cat = ALL_SETTINGS.find((s) => s.key === settingKey)?.category;
    if (cat) {
      await interaction.update(buildCategoryView(interaction.guild.id, cat));
      await interaction.followUp({ embeds: [successEmbed(`Setting saved.`)], ephemeral: true }).catch(() => {});
    }
    return;
  }

  // Modal trigger: dash:modal:<categoryKey>:<settingKey>
  if (action === 'modal') {
    const [categoryKey, settingKey] = id.split(':');
    const item = findSetting(settingKey);
    if (!item) return;
    const current = getSetting(interaction.guild.id, settingKey, '');
    const modal = new ModalBuilder()
      .setCustomId(`dash:modal:${categoryKey}:${settingKey}`)
      .setTitle(`Edit: ${item.label}`.slice(0, 45))
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('value')
            .setLabel(item.label.slice(0, 45))
            .setStyle(item.type === 'int' ? TextInputStyle.Short : TextInputStyle.Paragraph)
            .setRequired(true)
            .setMaxLength(item.type === 'int' ? 10 : 1000)
            .setValue(current || ''),
        ),
      );
    await interaction.showModal(modal);
    return;
  }

  // Fallback — unknown button action.
  logger.warn(`Unhandled dashboard button action: ${action}`);
  await interaction.reply({ embeds: [errorEmbed('Unknown dashboard action. Please reopen /dashboard.')], ephemeral: true }).catch(() => {});
});

// Modal submit — save text/int settings.
registerModal('dash', async (interaction, _client, action, id) => {
  if (action !== 'modal') return;
  const [categoryKey, settingKey] = id.split(':');
  const item = findSetting(settingKey);
  if (!item) return interaction.reply({ embeds: [errorEmbed('Unknown setting.')], ephemeral: true });

  let value = interaction.fields.getTextInputValue('value').trim();
  if (item.type === 'int') {
    const n = parseInt(value, 10);
    if (isNaN(n)) return interaction.reply({ embeds: [errorEmbed('Please enter a valid number.')], ephemeral: true });
    value = String(n);
  }
  setSetting(interaction.guild.id, settingKey, value);
  await interaction.reply({ embeds: [successEmbed(`**${item.label}** set to \`${value.slice(0, 100)}\`.`)], ephemeral: true });
});

export default { buildDashboard, buildCategoryView, buildEditView };

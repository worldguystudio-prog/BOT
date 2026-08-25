import { run, get, all } from '../database/helpers.js';
import { brandedEmbed, successEmbed } from '../utils/embeds.js';
import { logEvent } from './logging.js';
import { config } from '../config/config.js';
import { registerModal } from '../registry.js';

/**
 * ORGVNUM Placement Waitlist system.
 * Submit: roblox username, discord username, age, timezone, activity level,
 * experience, why join, desired role, skills, availability.
 */

export function addToWaitlist({ guildId, userId, fields }) {
  const now = new Date().toISOString();
  const res = run(
    `INSERT INTO waitlist
      (guild_id, user_id, roblox_username, discord_username, age, timezone, activity_level,
       experience, why_join, desired_role, skills, availability, status, added_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      guildId, userId,
      fields.roblox_username, fields.discord_username, fields.age, fields.timezone,
      fields.activity_level, fields.experience, fields.why_join, fields.desired_role,
      fields.skills, fields.availability, 'PENDING REVIEW', now,
    ],
  );
  return res.lastInsertRowid;
}

export function removeFromWaitlist(guildId, waitlistId) {
  const row = get('SELECT * FROM waitlist WHERE guild_id = ? AND (id = ? OR user_id = ?)', [
    guildId,
    Number(waitlistId) || 0,
    String(waitlistId),
  ]);
  if (!row) return null;
  run('DELETE FROM waitlist WHERE id = ?', [row.id]);
  return row;
}

export function getWaitlist(guildId, status = null) {
  if (status) {
    return all('SELECT * FROM waitlist WHERE guild_id = ? AND status = ? ORDER BY added_at DESC LIMIT 50', [guildId, status]);
  }
  return all('SELECT * FROM waitlist WHERE guild_id = ? ORDER BY added_at DESC LIMIT 50', [guildId]);
}

export function getWaitlistEntry(guildId, userIdOrId) {
  return get('SELECT * FROM waitlist WHERE guild_id = ? AND (user_id = ? OR id = ?) ORDER BY id DESC LIMIT 1', [
    guildId,
    String(userIdOrId),
    Number(userIdOrId) || 0,
  ]);
}

export function setWaitlistStatus(guildId, userIdOrId, status, staffId = null) {
  const entry = getWaitlistEntry(guildId, userIdOrId);
  if (!entry) return null;
  run('UPDATE waitlist SET status = ? WHERE id = ?', [status, entry.id]);
  logEvent(
    { id: guildId },
    'WAITLIST',
    'ORGVNUM — Waitlist Updated',
    `<@${entry.user_id}> waitlist entry updated to **${status}**${staffId ? ` by <@${staffId}>` : ''}.`,
    [],
    config.brand.colors.accent,
  ).catch(() => {});
  return getWaitlistEntry(guildId, entry.id);
}

export function promoteWaitlist(guildId, userIdOrId, staffId) {
  return setWaitlistStatus(guildId, userIdOrId, 'PROMOTED', staffId);
}

export function waitlistEmbed(entry) {
  const fields = [
    { name: 'Roblox Username', value: entry.roblox_username || '—', inline: true },
    { name: 'Discord Username', value: entry.discord_username || '—', inline: true },
    { name: 'Age', value: entry.age || '—', inline: true },
    { name: 'Timezone', value: entry.timezone || '—', inline: true },
    { name: 'Activity Level', value: entry.activity_level || '—', inline: true },
    { name: 'Desired Role', value: entry.desired_role || '—', inline: true },
    { name: 'Availability', value: entry.availability || '—', inline: true },
    { name: 'Skills', value: entry.skills || '—', inline: false },
    { name: 'Previous Experience', value: entry.experience || '—', inline: false },
    { name: 'Why Join', value: entry.why_join || '—', inline: false },
  ];
  return brandedEmbed(
    `**ORGVNUM PLACEMENT WAITLIST — #${String(entry.id).padStart(4, '0')}**\n\nApplicant: <@${entry.user_id}>\nStatus: **${entry.status}**`,
    'ORGVNUM — Waitlist',
  ).addFields(fields);
}

export default {
  addToWaitlist, removeFromWaitlist, getWaitlist, getWaitlistEntry,
  setWaitlistStatus, promoteWaitlist, waitlistEmbed,
};

// Modal handler for /waitlist add
registerModal('waitlist', async (interaction, client, action) => {
  if (action !== 'add') return;
  const fields = {};
  const keys = ['roblox_username', 'discord_username', 'age', 'timezone', 'desired_role', 'activity_level', 'experience', 'why_join', 'skills', 'availability'];
  for (const k of keys) {
    try {
      fields[k] = interaction.fields.getTextInputValue(k);
    } catch {
      fields[k] = null;
    }
  }
  const id = addToWaitlist({ guildId: interaction.guild.id, userId: interaction.user.id, fields });
  await interaction.reply({
    embeds: [successEmbed(`Your placement waitlist submission was received.\n\nEntry ID: **#${String(id).padStart(4, '0')}**\nApplication Status: **PENDING REVIEW**\n\nStaff will review your submission. Do not message staff about the status unless requested.`)],
  });
});

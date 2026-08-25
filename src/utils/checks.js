import { config } from '../config/config.js';
import { get, run } from '../database/helpers.js';

/** Get the active cooldown expiry for a user/command, or 0 if none. */
export function getCooldown(guildId, userId, commandName) {
  const row = get(
    'SELECT expires FROM cooldowns WHERE guild_id = ? AND user_id = ? AND command = ? AND expires > ?',
    [guildId, userId, commandName, Date.now()],
  );
  return row?.expires || 0;
}

/** Set a cooldown for a user/command. */
export function setCooldown(guildId, userId, commandName, ms = config.defaults.cooldown) {
  // Clean stale + insert.
  run('DELETE FROM cooldowns WHERE expires <= ?', [Date.now()]);
  run(
    'INSERT INTO cooldowns (guild_id, user_id, command, expires) VALUES (?, ?, ?, ?)',
    [guildId, userId, commandName, Date.now() + ms],
  );
}

/** Apply cooldown if the command declared one. Returns true if allowed, false if on cooldown. */
export function applyCooldown(interaction, command) {
  if (!command?.cooldown) return true;
  const commandName = command.data?.name || command.name;
  const expires = getCooldown(interaction.guildId, interaction.user.id, commandName);
  if (expires > Date.now()) return false;
  setCooldown(interaction.guildId, interaction.user.id, commandName, command.cooldown);
  return true;
}

/** Basic input sanitization: trim, clamp length, strip control chars. */
export function cleanInput(value, maxLen = 1000) {
  if (value == null) return null;
  let s = String(value).trim();
  // Strip control characters except newline/tab.
  s = s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  if (s.length > maxLen) s = s.slice(0, maxLen);
  return s;
}

/** Validate a Discord ID (snowflake-ish). */
export function isValidId(id) {
  return /^\d{17,20}$/.test(String(id));
}

/** Parse a duration string like "10m", "2h", "1d" into seconds. */
export function parseDuration(input) {
  if (!input) return null;
  const match = /^(\d+)\s*(s|m|h|d|w)$/i.exec(String(input).trim());
  if (!match) return null;
  const n = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  const mult = { s: 1, m: 60, h: 3600, d: 86400, w: 604800 }[unit];
  return n * mult;
}

/** Humanize seconds into a readable string. */
export function humanizeDuration(seconds) {
  if (seconds == null) return 'Permanent';
  const s = Math.max(0, Math.floor(seconds));
  if (s < 60) return `${s}s`;
  const units = [
    ['w', 604800],
    ['d', 86400],
    ['h', 3600],
    ['m', 60],
    ['s', 1],
  ];
  const parts = [];
  let rem = s;
  for (const [label, sec] of units) {
    if (rem >= sec) {
      const v = Math.floor(rem / sec);
      parts.push(`${v}${label}`);
      rem -= v * sec;
    }
  }
  return parts.slice(0, 3).join(' ') || '0s';
}

export default { getCooldown, setCooldown, applyCooldown, cleanInput, isValidId, parseDuration, humanizeDuration };

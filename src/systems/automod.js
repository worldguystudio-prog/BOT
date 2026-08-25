import { getAutomodConfig, setAutomodConfig } from '../database/helpers.js';
import { config } from '../config/config.js';
import logger from '../utils/logger.js';

/** Per-guild in-memory spam/flood state. */
const state = new Map(); // guildId -> { messages: Map<userId, number[]>, joins: number[] }

function getState(guildId) {
  if (!state.has(guildId)) state.set(guildId, { messages: new Map(), joins: [] });
  return state.get(guildId);
}

/** Effective automod config: stored settings merged over defaults. */
export function getEffectiveConfig(guildId) {
  const stored = getAutomodConfig(guildId);
  return {
    ...config.defaults.automod,
    ...(stored || {}),
    spam: { ...config.defaults.automod.spam, ...(stored?.spam || {}) },
    mentions: { ...config.defaults.automod.mentions, ...(stored?.mentions || {}) },
    caps: { ...config.defaults.automod.caps, ...(stored?.caps || {}) },
    duplicate: { ...config.defaults.automod.duplicate, ...(stored?.duplicate || {}) },
    links: { ...config.defaults.automod.links, ...(stored?.links || {}) },
    invites: { ...config.defaults.automod.invites, ...(stored?.invites || {}) },
    keywords: { ...config.defaults.automod.keywords, ...(stored?.keywords || {}) },
    flood: { ...config.defaults.automod.flood, ...(stored?.flood || {}) },
    raid: { ...config.defaults.automod.raid, ...(stored?.raid || {}) },
    accountAge: { ...config.defaults.automod.accountAge, ...(stored?.accountAge || {}) },
  };
}

export function saveConfig(guildId, cfg) {
  setAutomodConfig(guildId, cfg);
}

/** Main message-based automod entrypoint. */
export async function runAutomod(message) {
  const cfg = getEffectiveConfig(message.guild.id);
  if (!cfg.enabled) return;

  const member = message.member;
  if (!member) return;
  // Staff are exempt.
  if (member.permissions?.has(16n /* ManageMessages */)) return;

  const content = message.content || '';
  const now = Date.now();

  // Track message timestamps per user for spam/flood.
  const st = getState(message.guild.id);
  const arr = st.messages.get(message.author.id) || [];
  arr.push(now);
  // Keep only the last 20 timestamps.
  st.messages.set(message.author.id, arr.filter((t) => now - t < 60000));

  // --- Spam (X messages in a window) ---
  if (cfg.spam.enabled) {
    const recent = arr.filter((t) => now - t < cfg.spam.window);
    if (recent.length > cfg.spam.max) {
      await punish(message, `Spamming (${recent.length} messages)`);
      return;
    }
  }

  // --- Flood (messages across the channel) ---
  if (cfg.flood.enabled) {
    const recent = arr.filter((t) => now - t < cfg.flood.window);
    if (recent.length > cfg.flood.max) {
      await punish(message, `Message flood (${recent.length} messages)`);
      return;
    }
  }

  // --- Mention spam ---
  if (cfg.mentions.enabled && (message.mentions.users.size + message.mentions.roles.size) > cfg.mentions.max) {
    await punish(message, `Mention spam (${message.mentions.users.size + message.mentions.roles.size} mentions)`);
    return;
  }

  // --- Excessive caps ---
  if (cfg.caps.enabled && content.length >= cfg.caps.minLength) {
    const letters = content.replace(/[^A-Za-z]/g, '');
    if (letters.length) {
      const upper = (content.match(/[A-Z]/g) || []).length;
      if (upper / letters.length >= cfg.caps.threshold) {
        await punish(message, 'Excessive caps');
        return;
      }
    }
  }

  // --- Duplicate messages ---
  if (cfg.duplicate.enabled) {
    const key = `${message.author.id}:${content}`;
    const seen = st[`dup:${key}`] || { count: 0, first: now };
    seen.count += 1;
    st[`dup:${key}`] = seen;
    if (seen.count > cfg.duplicate.max) {
      await punish(message, 'Duplicate message spam');
      return;
    }
  }

  // --- Link filtering ---
  if (cfg.links.enabled && /https?:\/\//i.test(content)) {
    await punish(message, 'Link posting');
    return;
  }

  // --- Invite filtering ---
  if (cfg.invites.enabled && /discord(?:app\.com\/invite|\.gg\/)\S+/i.test(content)) {
    await punish(message, 'Discord invite link');
    return;
  }

  // --- Keyword filtering ---
  if (cfg.keywords.enabled && Array.isArray(cfg.keywords.list) && cfg.keywords.list.length) {
    const lower = content.toLowerCase();
    const hit = cfg.keywords.list.find((k) => k && lower.includes(String(k).toLowerCase()));
    if (hit) {
      await punish(message, `Blocked keyword: \`${hit}\``);
      return;
    }
  }
}

/** Process a new member join for raid / account-age checks. */
export async function onMemberAdd(member) {
  const cfg = getEffectiveConfig(member.guild.id);
  if (!cfg.enabled) return;

  const now = Date.now();
  const st = getState(member.guild.id);
  st.joins.push(now);
  st.joins = st.joins.filter((t) => now - t < 60000);

  // Raid detection.
  if (cfg.raid.enabled) {
    const recent = st.joins.filter((t) => now - t < cfg.raid.window);
    if (recent.length >= cfg.raid.joins) {
      logger.warn(`Raid detected in ${member.guild.id}: ${recent.length} joins in ${cfg.raid.window}ms`);
      const { logEvent } = await import('./logging.js');
      await logEvent(member.guild, 'RAID', 'ORGVNUM — Raid Detected', `Possible raid: ${recent.length} joins in ${Math.round(cfg.raid.window / 1000)}s.`, [], 0xb00020);
      // Do not auto-ban by default — just log. Staff can act on it.
    }
  }

  // Account age check.
  if (cfg.accountAge.enabled) {
    const ageDays = (now - member.user.createdTimestamp) / 86400000;
    if (ageDays < cfg.accountAge.minDays) {
      const { logEvent } = await import('./logging.js');
      await logEvent(member.guild, 'SUSPICIOUS_JOIN', 'ORGVNUM — Suspicious Join', `<@${member.id}> account is only ${ageDays.toFixed(1)} days old.`, [
        { name: 'Account', value: `Created <t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
      ], 0xc9a227);
    }
  }
}

async function punish(message, reason) {
  try {
    // Delete the offending message(s) for the user in the last few seconds.
    await message.delete().catch(() => {});
    // Optionally timeout the user for 60s as a soft deterrent.
    if (message.member?.moderatable) {
      await message.member.timeout(60_000, `Automod: ${reason}`).catch(() => {});
    }
    const { logEvent } = await import('./logging.js');
    await logEvent(message.guild, 'AUTOMOD', 'ORGVNUM — Automod Action', `<@${message.author.id}> was actioned by automod.`, [
      { name: 'Reason', value: reason, inline: true },
      { name: 'Channel', value: `<#${message.channelId}>`, inline: true },
    ], 0xb00020);
  } catch (e) {
    logger.error(`automod punish failed: ${e.message}`);
  }
}

export default { runAutomod, onMemberAdd, getEffectiveConfig, saveConfig };

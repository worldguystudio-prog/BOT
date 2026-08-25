import { ChannelType } from 'discord.js';
import { getSetting, insertLog } from '../database/helpers.js';
import { moderationLogEmbed } from '../utils/embeds.js';
import { logger } from '../utils/logger.js';

/**
 * Centralized logging system.
 *
 * Each log category can have its own dedicated channel. If a category-specific
 * channel isn't set, the main moderation log channel is used as fallback.
 *
 * Categories:
 *   moderation  → log_channel_id (fallback: itself)
 *   message     → message_log_channel_id (fallback: log_channel_id)
 *   member      → member_log_channel_id (fallback: log_channel_id)
 *   ticket      → ticket_log_channel_id (fallback: log_channel_id)
 *   application → application_log_channel_id (fallback: log_channel_id)
 *   roleplay    → roleplay_log_channel_id (fallback: log_channel_id)
 *   shift       → shift_channel_id (fallback: log_channel_id)
 *   training    → training_log_channel_id (fallback: log_channel_id)
 *   economy     → economy_channel_id (fallback: log_channel_id)
 */

const CATEGORY_KEYS = {
  moderation: 'log_channel_id',
  message: 'message_log_channel_id',
  member: 'member_log_channel_id',
  ticket: 'ticket_log_channel_id',
  application: 'application_log_channel_id',
  roleplay: 'roleplay_log_channel_id',
  shift: 'shift_channel_id',
  training: 'training_log_channel_id',
  economy: 'economy_channel_id',
};

/** Resolve the configured channel for a given category (with fallback). */
export function getLogChannel(guild, category = 'moderation') {
  const categoryKey = CATEGORY_KEYS[category] || CATEGORY_KEYS.moderation;
  let id = getSetting(guild?.id, categoryKey, null);

  // Fallback to main moderation log if the category-specific channel is not set
  // (and we're not already looking for the main channel).
  if (!id && categoryKey !== CATEGORY_KEYS.moderation) {
    id = getSetting(guild?.id, CATEGORY_KEYS.moderation, null);
  }
  if (!id) return null;

  const channel = guild.channels?.cache.get(id);
  if (!channel || channel.type !== ChannelType.GuildText) return null;
  return channel;
}

/** Send a generic log embed to the appropriate log channel + persist to DB. */
export async function sendLog(guild, { type = 'moderation', category = 'moderation', embed, data = null }) {
  // Persist to DB audit trail regardless of channel config.
  try {
    insertLog(guild.id, type, data || embed?.data?.description || type);
  } catch (e) {
    logger.error(`sendLog insertLog failed: ${e.message}`);
  }

  const channel = getLogChannel(guild, category);
  if (!channel) return; // no log channel configured — silently skip
  try {
    await channel.send({ embeds: [embed] });
  } catch (e) {
    logger.error(`sendLog channel send failed: ${e.message}`);
  }
}

/** Convenience: send a moderation log entry. */
export async function logModeration(guild, { action, user, moderator, reason, caseId, extra = {} }) {
  const embed = moderationLogEmbed({ action, user, moderator, reason, caseId, extra });
  await sendLog(guild, { type: action, category: 'moderation', embed, data: { userId: user?.id, moderatorId: moderator?.id, reason } });
}

/** Log a generic textual event. */
export async function logEvent(guild, type, title, description, fields = [], color = null, category = null) {
  const { baseEmbed } = await import('../utils/embeds.js');
  const { config } = await import('../config/config.js');

  // Infer category from type if not provided.
  if (!category) {
    if (['MESSAGE_DELETE', 'MESSAGE_EDIT'].includes(type)) category = 'message';
    else if (['MEMBER_JOIN', 'MEMBER_LEAVE', 'SUSPICIOUS_JOIN'].includes(type)) category = 'member';
    else if (type.startsWith('TICKET')) category = 'ticket';
    else if (type.startsWith('APPLICATION') || type.startsWith('WAITLIST')) category = 'application';
    else if (['DISPATCH', 'SCENE', 'ALERT', 'ANNOUNCEMENT'].includes(type)) category = 'roleplay';
    else if (type.startsWith('SHIFT')) category = 'shift';
    else if (type.startsWith('TRAINING') || type.startsWith('EVENT')) category = 'training';
    else if (type.startsWith('POINTS') || type.startsWith('ECONOMY')) category = 'economy';
    else category = 'moderation';
  }

  const embed = baseEmbed({
    title: title || `ORGVNUM — ${type}`,
    description,
    color: color ?? config.brand.colors.info,
    fields,
  });
  await sendLog(guild, { type, category, embed, data: { description } });
}

export default { getLogChannel, sendLog, logModeration, logEvent };

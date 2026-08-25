import { ChannelType } from 'discord.js';
import { getSetting } from '../database/helpers.js';
import { moderationLogEmbed } from '../utils/embeds.js';
import { logger } from '../utils/logger.js';
import { insertLog } from '../database/helpers.js';

/**
 * Centralized logging system.
 * Sends a professional embed to the configured staff log channel and persists
 * a copy in the database `logs` table.
 */

/** Resolve the configured log channel for a guild. */
export function getLogChannel(guild, settingKey = 'log_channel_id') {
  const id = getSetting(guild?.id, settingKey, null);
  if (!id) return null;
  const channel = guild.channels?.cache.get(id);
  if (!channel || channel.type !== ChannelType.GuildText) return null;
  return channel;
}

/** Send a generic log embed to the log channel + persist to DB. */
export async function sendLog(guild, { type, embed, data = null }) {
  // Persist to DB audit trail regardless of channel config.
  try {
    insertLog(guild.id, type, data || embed?.data?.description || type);
  } catch (e) {
    logger.error(`sendLog insertLog failed: ${e.message}`);
  }

  const channel = getLogChannel(guild);
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
  await sendLog(guild, { type: action, embed, data: { userId: user?.id, moderatorId: moderator?.id, reason } });
}

/** Log a generic textual event (joins, leaves, role changes, etc.). */
export async function logEvent(guild, type, title, description, fields = [], color = null) {
  const { baseEmbed } = await import('../utils/embeds.js');
  const { config } = await import('../config/config.js');
  const embed = baseEmbed({
    title: title || `ORGVNUM — ${type}`,
    description,
    color: color ?? config.brand.colors.info,
    fields,
  });
  await sendLog(guild, { type, embed, data: { description } });
}

export default { getLogChannel, sendLog, logModeration, logEvent };

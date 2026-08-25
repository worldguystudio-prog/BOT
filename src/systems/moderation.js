import { time } from 'discord.js';
import { addWarning, getWarnings, clearWarning, clearAllWarnings, nextCaseNumber, createCase } from '../database/helpers.js';
import { logModeration } from './logging.js';
import { sendDM } from '../utils/dm.js';
import logger from '../utils/logger.js';

/**
 * Shared moderation helpers used by slash commands.
 * Each action: performs the Discord operation, creates a case, logs it, and DMs the user.
 */

export async function doKick(guild, member, moderator, reason) {
  await sendModDM(member.user, 'kicked', reason, guild, moderator);
  await member.kick(reason || 'No reason provided');
  const caseNumber = nextCaseNumber(guild.id);
  createCase({ guildId: guild.id, caseNumber, type: 'KICK', userId: member.id, moderatorId: moderator.id, reason });
  await logModeration(guild, { action: 'KICK', user: member.user, moderator, reason, caseId: caseNumber });
  return caseNumber;
}

export async function doBan(guild, userId, moderator, reason, deleteDays = 0) {
  let user = userId;
  try {
    const member = await guild.members.fetch(userId).catch(() => null);
    if (member) await sendModDM(member.user, 'banned', reason, guild, moderator);
  } catch { /* ignore */ }
  await guild.bans.create(userId, { deleteMessageSeconds: deleteDays * 86400, reason: reason || 'No reason provided' });
  const caseNumber = nextCaseNumber(guild.id);
  createCase({ guildId: guild.id, caseNumber, type: 'BAN', userId, moderatorId: moderator.id, reason });
  await logModeration(guild, { action: 'BAN', user: { id: userId }, moderator, reason, caseId: caseNumber });
  return caseNumber;
}

export async function doUnban(guild, userId, moderator, reason) {
  await guild.bans.remove(userId, reason || 'No reason provided').catch(() => {});
  const caseNumber = nextCaseNumber(guild.id);
  createCase({ guildId: guild.id, caseNumber, type: 'UNBAN', userId, moderatorId: moderator.id, reason });
  await logModeration(guild, { action: 'UNBAN', user: { id: userId }, moderator, reason, caseId: caseNumber });
  return caseNumber;
}

export async function doSoftban(guild, member, moderator, reason) {
  // Ban then immediately unban — clears their recent messages.
  await sendModDM(member.user, 'softbanned', reason, guild, moderator);
  await guild.bans.create(member.id, { deleteMessageSeconds: 7 * 86400, reason: reason || 'Softban' });
  await guild.bans.remove(member.id, 'Softban lift');
  const caseNumber = nextCaseNumber(guild.id);
  createCase({ guildId: guild.id, caseNumber, type: 'SOFTBAN', userId: member.id, moderatorId: moderator.id, reason });
  await logModeration(guild, { action: 'SOFTBAN', user: member.user, moderator, reason, caseId: caseNumber });
  return caseNumber;
}

export async function doTimeout(guild, member, moderator, reason, durationSeconds) {
  await sendModDM(member.user, 'timed out', reason, guild, moderator, durationSeconds);
  await member.timeout(durationSeconds * 1000, reason || 'No reason provided');
  const caseNumber = nextCaseNumber(guild.id);
  createCase({
    guildId: guild.id,
    caseNumber,
    type: 'TIMEOUT',
    userId: member.id,
    moderatorId: moderator.id,
    reason,
    duration: `${durationSeconds}s`,
  });
  await logModeration(guild, {
    action: 'TIMEOUT',
    user: member.user,
    moderator,
    reason,
    caseId: caseNumber,
    extra: { duration: `<t:${Math.floor((Date.now() + durationSeconds * 1000) / 1000)}:R>` },
  });
  return caseNumber;
}

export async function doUntimeout(guild, member, moderator, reason) {
  await member.timeout(null, reason || 'Timeout removed').catch(() => {});
  const caseNumber = nextCaseNumber(guild.id);
  createCase({ guildId: guild.id, caseNumber, type: 'UNTIMEOUT', userId: member.id, moderatorId: moderator.id, reason });
  await logModeration(guild, { action: 'UNTIMEOUT', user: member.user, moderator, reason, caseId: caseNumber });
  return caseNumber;
}

export async function doWarn(guild, member, moderator, reason) {
  const { warningId, caseNumber, timestamp } = addWarning({
    guildId: guild.id,
    userId: member.id,
    moderatorId: moderator.id,
    reason,
  });
  await sendModDM(member.user, 'warned', reason, guild, moderator);
  await logModeration(guild, { action: 'WARN', user: member.user, moderator, reason, caseId: caseNumber });
  return { warningId, caseNumber, timestamp };
}

export async function doUnwarn(guild, warningId, moderator) {
  const row = clearWarning(guild.id, warningId);
  if (!row) return null;
  const caseNumber = nextCaseNumber(guild.id);
  createCase({
    guildId: guild.id,
    caseNumber,
    type: 'UNWARN',
    userId: row.user_id,
    moderatorId: moderator.id,
    reason: `Warning ${row.warning_id} removed`,
  });
  await logModeration(guild, { action: 'UNWARN', user: { id: row.user_id }, moderator, reason: `Warning ${row.warning_id} cleared`, caseId: caseNumber });
  return row;
}

export function listWarnings(guildId, userId) {
  return getWarnings(guildId, userId);
}

export function clearAllUserWarnings(guildId, userId, moderator) {
  const count = clearAllWarnings(guildId, userId);
  const caseNumber = nextCaseNumber(guildId);
  createCase({ guildId, caseNumber, type: 'CLEARWARNINGS', userId, moderatorId: moderator.id, reason: `Cleared ${count} warnings` });
  return count;
}

export default {
  doKick, doBan, doUnban, doSoftban, doTimeout, doUntimeout,
  doWarn, doUnwarn, listWarnings, clearAllUserWarnings,
};

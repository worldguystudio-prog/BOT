import { PermissionFlagsBits } from 'discord.js';
import { config, isOwner } from '../config/config.js';
import { getSetting } from '../database/helpers.js';

// Re-export isOwner so commands can import all permission helpers from one place.
export { isOwner };

/**
 * Permission hierarchy for ORGVNUM.
 *
 * Each command may declare `requiredLevel` (a numeric level from config.permissionLevels).
 * A user is authorized if their resolved level is >= the required level.
 */

/** Map a Discord permission bit to a numeric ORGVNUM level as a fallback. */
function levelFromDiscordPerms(member) {
  if (!member) return config.permissionLevels.NONE;
  if (member.permissions.has(PermissionFlagsBits.Administrator)) return config.permissionLevels.ADMINISTRATOR;
  if (member.permissions.has(PermissionFlagsBits.BanMembers | PermissionFlagsBits.KickMembers)) {
    return config.permissionLevels.MODERATOR;
  }
  if (member.permissions.has(PermissionFlagsBits.ManageMessages)) return config.permissionLevels.STAFF;
  return config.permissionLevels.MEMBER;
}

/**
 * Resolve a member's ORGVNUM permission level using configured role mappings,
 * falling back to Discord permissions.
 */
export function resolveLevel(member, guildId) {
  if (!member) return config.permissionLevels.NONE;
  if (isOwner(member.id)) return config.permissionLevels.OWNER;

  // Configured role -> level mapping (stored as JSON in settings).
  const raw = getSetting(guildId, 'permission_roles', null);
  if (raw) {
    try {
      const map = JSON.parse(raw); // { "ROLE_ID": <number>, ... }
      let highest = config.permissionLevels.NONE;
      for (const roleId of member.roles?.cache?.keys() ?? []) {
        if (map[roleId] != null && map[roleId] > highest) highest = map[roleId];
      }
      if (highest >= config.permissionLevels.ADMINISTRATOR) return highest;
      // Blend with Discord-permission fallback (take the max).
      return Math.max(highest, levelFromDiscordPerms(member));
    } catch {
      /* fall through */
    }
  }

  return levelFromDiscordPerms(member);
}

/** Returns true if the member meets the required ORGVNUM level. */
export function hasLevel(member, guildId, requiredLevel) {
  return resolveLevel(member, guildId) >= requiredLevel;
}

/** Returns true if the member is a configured bot owner. */
export function isBotOwner(userId) {
  return isOwner(userId);
}

/**
 * Returns true if the moderator can act on the target member
 * (role hierarchy + not acting on self/owner where inappropriate).
 */
export function canModerate(moderator, target, action = 'moderate') {
  if (!target) return true; // target not in guild — still allow (e.g. ban by id)
  if (isOwner(target.id)) return false; // never act on owners
  if (moderator.id === target.id) return false;
  if (target.id === moderator.guild?.members?.me?.id) return false; // don't act on the bot
  if (!moderator.roles || !target.roles) return true;
  // Compare role positions.
  return moderator.roles.highest.position > target.roles.highest.position;
}

/** Returns true if the bot can manage the target member / role. */
export function botCanManage(target) {
  if (!target) return true;
  if (target.guild?.members?.me && target.roles) {
    return target.guild.members.me.roles.highest.position > target.roles.highest.position;
  }
  return true;
}

export default { resolveLevel, hasLevel, isBotOwner, canModerate, botCanManage };

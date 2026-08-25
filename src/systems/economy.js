import { getPoints, addPoints, pointsLeaderboard, getSetting } from '../database/helpers.js';
import { config } from '../config/config.js';

/** Whether the economy system is enabled for a guild (defaults to off). */
export function economyEnabled(guildId) {
  return getSetting(guildId, 'economy_enabled', '0') === '1' || config.defaults?.economyEnabled === true;
}

/** Award points for an activity. */
export function award(guildId, userId, amount, reason = null, byId = null) {
  addPoints(guildId, userId, amount, reason, byId);
  return getPoints(guildId, userId);
}

export function balance(guildId, userId) {
  return getPoints(guildId, userId);
}

export function leaderboard(guildId, limit = 10) {
  return pointsLeaderboard(guildId, limit);
}

export default { award, balance, leaderboard };

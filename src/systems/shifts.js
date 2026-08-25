import { startShift, endShift, getActiveShift, shiftLeaderboard } from '../database/helpers.js';
import { humanizeDuration } from '../utils/checks.js';

export { startShift, endShift, getActiveShift };

export function leaderboard(guildId, limit = 10) {
  return shiftLeaderboard(guildId, limit).map((r) => ({
    userId: r.user_id,
    seconds: r.total_seconds || 0,
    shifts: r.shifts || 0,
    pretty: humanizeDuration(r.total_seconds || 0),
  }));
}

export default { startShift, endShift, getActiveShift, leaderboard };

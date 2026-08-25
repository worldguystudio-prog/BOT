import { brandedEmbed } from './embeds.js';
import logger from './logger.js';

/**
 * Send a standardized moderation DM to a user.
 * Silently fails if the user has DMs closed — staff will still see the log.
 */
export async function sendDM(user, embed) {
  if (!user?.send) return false;
  try {
    await user.send({ embeds: [embed] });
    return true;
  } catch (e) {
    logger.debug(`DM to ${user.id} failed: ${e.message}`);
    return false;
  }
}

/** Send the standardized "you were actioned" DM. */
export async function sendModDM(user, action, reason, guild, moderator, durationSeconds = null) {
  let durationLine = '';
  if (durationSeconds) {
    const until = Math.floor((Date.now() + durationSeconds * 1000) / 1000);
    durationLine = `\n\nDuration: until <t:${until}:f>`;
  }
  const embed = brandedEmbed(
    `You have received a ${action === 'warned' ? 'warning' : action} in ORGVNUM.\n\n**Reason:** ${reason}\n**Issued by:** ${moderator.tag}${durationLine}\n\nYou may open an appeal ticket if you believe this was issued incorrectly.`,
    `ORGVNUM — Notice`,
  );
  return sendDM(user, embed);
}

export default { sendDM, sendModDM };

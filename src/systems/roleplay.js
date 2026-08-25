import { brandedEmbed } from '../utils/embeds.js';
import { config } from '../config/config.js';
import { time, TimestampStyles } from 'discord.js';

/** Build a standardized dispatch embed. */
export function buildDispatch(location, situation, extra = {}) {
  return brandedEmbed(
    `**ORGVNUM DISPATCH**\n\n**Location:** ${location}\n**Situation:** ${situation}${extra.units ? `\n**Units:** ${extra.units}` : ''}\n\nUnits are advised to proceed according to RP procedures.`,
    'ORGVNUM — Dispatch',
  ).addFields({ name: 'Issued', value: time(new Date(), TimestampStyles.RelativeTime), inline: true });
}

export function buildAlert(message, level = 'info') {
  const colors = {
    info: config.brand.colors.info,
    warning: config.brand.colors.warning,
    danger: config.brand.colors.error,
  };
  return brandedEmbed(`**ORGVNUM ALERT**\n\n${message}`, 'ORGVNUM — Alert').setColor(colors[level] || config.brand.colors.primary);
}

export function buildAnnouncement(title, body) {
  return brandedEmbed(`**${title}**\n\n${body}`, 'ORGVNUM — Announcement');
}

export function buildScene(name, description, participants = []) {
  const embed = brandedEmbed(`**ROLEPLAY SCENE: ${name}**\n\n${description}`, 'ORGVNUM — Scene');
  if (participants.length) {
    embed.addFields({ name: 'Participants', value: participants.map((p) => `<@${p}>`).join(', '), inline: false });
  }
  return embed;
}

export default { buildDispatch, buildAlert, buildAnnouncement, buildScene };

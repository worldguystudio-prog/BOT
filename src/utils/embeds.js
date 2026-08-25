import { EmbedBuilder, TimestampStyles, time } from 'discord.js';
import { config } from '../config/config.js';

/**
 * Centralized embed factory so colors, footer, and branding are changed in one place.
 */
export function baseEmbed({ title = null, description = null, color = config.brand.colors.primary, fields = [], thumbnail = null, image = null, footerText = config.brand.footer } = {}) {
  const embed = new EmbedBuilder().setColor(color).setFooter({ text: footerText });
  if (title) embed.setTitle(title);
  if (description) embed.setDescription(description);
  if (fields.length) embed.addFields(fields);
  if (thumbnail) embed.setThumbnail(thumbnail);
  if (image) embed.setImage(image);
  embed.setTimestamp();
  return embed;
}

export function successEmbed(description, title = '✅ Success') {
  return baseEmbed({ title, description, color: config.brand.colors.success });
}

export function errorEmbed(description, title = '❌ Error') {
  return baseEmbed({ title, description, color: config.brand.colors.error });
}

export function warningEmbed(description, title = '⚠️ Notice') {
  return baseEmbed({ title, description, color: config.brand.colors.warning });
}

export function infoEmbed(description, title = 'ℹ️ ORGVNUM') {
  return baseEmbed({ title, description, color: config.brand.colors.info });
}

export function brandedEmbed(description, title = 'ORGVNUM') {
  return baseEmbed({ title, description, color: config.brand.colors.primary });
}

export function accentEmbed(description, title = 'ORGVNUM') {
  return baseEmbed({ title, description, color: config.brand.colors.accent });
}

/** Standard moderation log embed used by the logging system. */
export function moderationLogEmbed({ action, user, moderator, reason, caseId, extra = {} }) {
  const fields = [
    { name: 'Action', value: `\`${action}\``, inline: true },
    { name: 'User', value: user ? `<@${user.id}> (\`${user.id}\`)` : '`Unknown`', inline: true },
    { name: 'Moderator', value: moderator ? `<@${moderator.id}> (\`${moderator.id}\`)` : '`System`', inline: true },
    { name: 'Reason', value: reason || 'No reason provided', inline: false },
  ];
  if (extra.duration) fields.push({ name: 'Duration', value: extra.duration, inline: true });
  if (extra.channel) fields.push({ name: 'Channel', value: extra.channel, inline: true });
  fields.push({ name: 'Time', value: time(new Date(), TimestampStyles.ShortTime), inline: true });
  if (caseId) fields.push({ name: 'Case ID', value: `\`Case #${caseId}\``, inline: true });

  return baseEmbed({
    title: 'ORGVNUM — MODERATION LOG',
    description: null,
    color: config.brand.colors.primary,
    fields,
  });
}

/** A consistent "loading" embed used while processing. */
export function loadingEmbed(description = 'Processing your request…') {
  return baseEmbed({ title: '⏳ Please wait', description, color: config.brand.colors.accent });
}

export default {
  baseEmbed,
  successEmbed,
  errorEmbed,
  warningEmbed,
  infoEmbed,
  brandedEmbed,
  accentEmbed,
  moderationLogEmbed,
  loadingEmbed,
};

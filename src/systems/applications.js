import {
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  TextInputBuilder,
  TextInputStyle,
  ModalBuilder,
  ChannelType,
} from 'discord.js';
import { run, get, all, getSetting } from '../database/helpers.js';
import { brandedEmbed, successEmbed, errorEmbed } from '../utils/embeds.js';
import { registerButton, registerModal } from '../registry.js';
import { logEvent } from './logging.js';
import { config } from '../config/config.js';
import { PermissionFlagsBits } from 'discord.js';
import logger from '../utils/logger.js';

export const APPLICATION_TYPES = [
  'Recruitment',
  'Placement Application',
  'Staff Application',
  'Leadership Application',
];

export const STATUSES = {
  PENDING: 'PENDING',
  UNDER_REVIEW: 'UNDER REVIEW',
  INTERVIEW: 'INTERVIEW',
  ACCEPTED: 'ACCEPTED',
  DENIED: 'DENIED',
  WAITLISTED: 'WAITLISTED',
  CLOSED: 'CLOSED',
};

export function nextApplicationId(guildId) {
  const row = get('SELECT COUNT(*) AS c FROM applications WHERE guild_id = ?', [guildId]);
  return String((row?.c || 0) + 1).padStart(4, '0');
}

export function createApplication({ guildId, userId, type, data }) {
  const appId = nextApplicationId(guildId);
  const timestamp = new Date().toISOString();
  run(
    `INSERT INTO applications (guild_id, application_id, user_id, type, status, data, submitted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [guildId, appId, userId, type, STATUSES.PENDING, JSON.stringify(data), timestamp],
  );
  return { applicationId: appId, timestamp };
}

export function getApplication(guildId, appId) {
  const row = get('SELECT * FROM applications WHERE guild_id = ? AND (application_id = ? OR id = ?)', [
    guildId,
    appId,
    Number(appId) || 0,
  ]);
  if (row) row.data = row.data ? JSON.parse(row.data) : {};
  return row;
}

export function listApplications(guildId, status = null) {
  const rows = status
    ? all('SELECT * FROM applications WHERE guild_id = ? AND status = ? ORDER BY id DESC LIMIT 50', [guildId, status])
    : all('SELECT * FROM applications WHERE guild_id = ? ORDER BY id DESC LIMIT 50', [guildId]);
  return rows.map((r) => ({ ...r, data: r.data ? JSON.parse(r.data) : {} }));
}

/**
 * Update an application's status and log the decision.
 * @param {import('discord.js').Guild} guild - the real guild object (for log channel routing)
 */
export function updateApplicationStatus(guild, appId, status, reviewerId, notes = null) {
  const guildId = guild.id;
  const app = getApplication(guildId, appId);
  if (!app) return null;
  run('UPDATE applications SET status = ?, reviewer_id = ?, reviewer_notes = COALESCE(?, reviewer_notes), decided_at = ? WHERE id = ?', [
    status,
    reviewerId,
    notes,
    new Date().toISOString(),
    app.id,
  ]);
  logEvent(
    guild,
    'APPLICATION',
    'ORGVNUM — Application Decision',
    `Application #${app.application_id} updated to **${status}** by <@${reviewerId}>.`,
    [{ name: 'Applicant', value: `<@${app.user_id}>`, inline: true }],
    config.brand.colors.accent,
    'application',
  ).catch(() => {});
  return getApplication(guildId, appId);
}

/** Build the interactive review panel for an application. */
export function buildReviewPanel(app) {
  const fields = [];
  if (app.data && typeof app.data === 'object') {
    for (const [k, v] of Object.entries(app.data)) {
      fields.push({ name: k, value: String(v).slice(0, 1024) || '—', inline: false });
    }
  }
  const embed = brandedEmbed(
    `**APPLICATION #${app.application_id}**\n\nApplicant: <@${app.user_id}>\nType: ${app.type}\nStatus: ${app.status}`,
    'ORGVNUM — Application Review',
  );
  if (fields.length) embed.addFields(fields.slice(0, 18));
  embed.setFooter({ text: `${config.brand.footer} • Submitted <t:${Math.floor(new Date(app.submitted_at).getTime() / 1000)}:R>` });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`application:accept:${app.id}`).setLabel('Accept').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`application:deny:${app.id}`).setLabel('Deny').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId(`application:waitlist:${app.id}`).setLabel('Waitlist').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`application:interview:${app.id}`).setLabel('Interview').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`application:info:${app.id}`).setLabel('Request Info').setStyle(ButtonStyle.Secondary),
  );
  return { embeds: [embed], components: [row] };
}

/* ───────── Modal: /apply ───────── */
registerModal('application', async (interaction, client, action, type) => {
  const data = {};
  for (const comp of interaction.components) {
    const input = comp.components[0];
    data[input.label] = interaction.fields.getTextInputValue(input.customId);
  }
  const { applicationId } = createApplication({
    guildId: interaction.guild.id,
    userId: interaction.user.id,
    type: type || 'Recruitment',
    data,
  });
  await interaction.reply({
    embeds: [successEmbed(`Your application has been submitted.\n\nApplication ID: **#${applicationId}**\nStatus: **${STATUSES.PENDING}**\n\nA reviewer will respond in due course.`)],
  });

  // Post review panel to configured application channel.
  const channelId = getSetting(interaction.guild.id, 'application_channel_id', null);
  if (channelId) {
    const channel = interaction.guild.channels.cache.get(channelId);
    if (channel) {
      const app = getApplication(interaction.guild.id, applicationId);
      if (app) await channel.send(buildReviewPanel(app)).catch(() => {});
    }
  }
});

/* ───────── Buttons: application review ───────── */
registerButton('application', async (interaction, _client, action, id) => {
  const app = get('SELECT * FROM applications WHERE id = ?', [Number(id)]);
  if (!app) return interaction.reply({ embeds: [errorEmbed('Application not found.')], ephemeral: true });

  // Permission check: only staff with Manage Messages or configured recruiter role.
  if (!interaction.member?.permissions?.has(PermissionFlagsBits.ManageMessages)) {
    const recruiter = getSetting(interaction.guild.id, 'recruiter_role_id', null);
    if (recruiter && !interaction.member?.roles?.cache?.has(recruiter)) {
      return interaction.reply({ embeds: [errorEmbed('Only authorized reviewers may decide applications.')], ephemeral: true });
    }
  }

  const statusMap = {
    accept: STATUSES.ACCEPTED,
    deny: STATUSES.DENIED,
    waitlist: STATUSES.WAITLISTED,
    interview: STATUSES.INTERVIEW,
    info: STATUSES.UNDER_REVIEW,
  };
  const status = statusMap[action];
  if (!status) return;

  updateApplicationStatus(interaction.guild, app.application_id, status, interaction.user.id);
  await interaction.update({
    embeds: [brandedEmbed(`Application #${app.application_id} updated to **${status}** by <@${interaction.user.id}>.`, 'ORGVNUM — Application Updated')],
    components: [],
  });

  // DM the applicant.
  try {
    const user = await interaction.client.users.fetch(app.user_id);
    await user.send({ embeds: [brandedEmbed(`Your application **#${app.application_id}** has been updated.\n\nNew status: **${status}**\nReviewer: ${interaction.user.tag}`)] }).catch(() => {});
  } catch { /* ignore */ }
});

export default {
  APPLICATION_TYPES, STATUSES, createApplication, getApplication,
  listApplications, updateApplicationStatus, buildReviewPanel,
};

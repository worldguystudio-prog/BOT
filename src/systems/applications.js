import {
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  TextInputBuilder,
  TextInputStyle,
  ModalBuilder,
  ChannelType,
  PermissionFlagsBits,
} from 'discord.js';
import { run, get, all, getSetting } from '../database/helpers.js';
import { brandedEmbed, successEmbed, errorEmbed, accentEmbed } from '../utils/embeds.js';
import { registerButton, registerModal } from '../registry.js';
import { logEvent } from './logging.js';
import { config } from '../config/config.js';
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
 * If status is ACCEPTED, automatically assigns the configured accept roles.
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

/**
 * Assign the configured accept roles to a user when their application is accepted.
 * Roles are configured per application type via the setting key:
 *   accept_roles:<ApplicationType>  → comma-separated role IDs
 *
 * @param {import('discord.js').Guild} guild
 * @param {string} userId
 * @param {string} applicationType
 * @returns {Promise<{assigned: string[], failed: string[]}>}
 */
export async function assignAcceptRoles(guild, userId, applicationType) {
  const result = { assigned: [], failed: [] };
  if (!guild || !userId || !applicationType) return result;

  // Get the configured roles for this application type.
  const raw = getSetting(guild.id, `accept_roles:${applicationType}`, null);
  if (!raw) return result;

  let roleIds = [];
  try {
    roleIds = JSON.parse(raw);
  } catch {
    // Maybe it's a comma-separated string.
    roleIds = raw.split(',').map((s) => s.trim()).filter(Boolean);
  }
  if (!Array.isArray(roleIds) || roleIds.length === 0) return result;

  // Fetch the member.
  const member = await guild.members.fetch(userId).catch(() => null);
  if (!member) {
    result.failed = roleIds;
    return result;
  }

  // Assign each role.
  for (const roleId of roleIds) {
    const role = guild.roles.cache.get(roleId) || await guild.roles.fetch(roleId).catch(() => null);
    if (!role) {
      result.failed.push(roleId);
      continue;
    }
    // Check hierarchy: bot's highest role must be above the target role.
    if (guild.members.me?.roles?.highest?.position <= role.position) {
      result.failed.push(roleId);
      continue;
    }
    try {
      await member.roles.add(role, `Application accepted (${applicationType})`);
      result.assigned.push(roleId);
    } catch (e) {
      result.failed.push(roleId);
      logger.error(`Could not assign role ${roleId} to ${userId}: ${e.message}`);
    }
  }

  return result;
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
    ephemeral: true,
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

  // If accepted, assign the configured accept roles for this application type.
  let roleMsg = '';
  if (status === STATUSES.ACCEPTED) {
    const roleResult = await assignAcceptRoles(interaction.guild, app.user_id, app.type);
    if (roleResult.assigned.length > 0) {
      roleMsg = `\n\n✅ **Roles assigned:** ${roleResult.assigned.map((r) => `<@&${r}>`).join(', ')}`;
    }
    if (roleResult.failed.length > 0) {
      roleMsg += `\n\n⚠️ **Failed to assign:** ${roleResult.failed.length} role(s) — check bot hierarchy/permissions.`;
    }
  }

  await interaction.update({
    embeds: [brandedEmbed(`Application #${app.application_id} updated to **${status}** by <@${interaction.user.id}>.${roleMsg}`, 'ORGVNUM — Application Updated')],
    components: [],
  });

  // DM the applicant.
  try {
    const user = await interaction.client.users.fetch(app.user_id);
    let dmMsg = `Your application **#${app.application_id}** has been updated.\n\nNew status: **${status}**\nReviewer: ${interaction.user.tag}`;
    if (status === STATUSES.ACCEPTED && roleMsg) {
      dmMsg += roleMsg;
    }
    await user.send({ embeds: [brandedEmbed(dmMsg)] }).catch(() => {});
  } catch { /* ignore */ }
});

/* ───────── Buttons: application panel ─────────
 * Clicking a button on the /application-panel starts a DM-based application
 * session. The bot DMs the user questions one at a time and saves their answers.
 * Falls back to a modal if the user has DMs closed.
 */
registerButton('apppanel', async (interaction, _client, action, _id) => {
  const type = action;
  if (!APPLICATION_TYPES.includes(type)) {
    return interaction.reply({ embeds: [errorEmbed('Unknown application type.')], ephemeral: true });
  }

  // Try to start a DM session.
  const { startDMSession, getSession } = await import('./dm-applications.js');
  const existing = getSession(interaction.user.id);
  if (existing) {
    return interaction.reply({
      embeds: [errorEmbed(`You already have an active ${existing.type} application in progress in your DMs. Please finish it first (or type \`cancel\` in your DM to abandon it).`)],
      ephemeral: true,
    });
  }

  // Get the review channel (where the review panel will be posted on completion).
  const reviewChannelId = getSetting(interaction.guild.id, 'application_channel_id', null);

  // Try to DM the user the first question.
  const { QUESTION_SETS } = await import('./dm-applications.js');
  const questions = QUESTION_SETS[type];
  const firstQuestion = questions[0];

  const dmEmbed = accentEmbed(
    `**ORGVNUM — ${type} Application**\n\nYou're starting a ${type} application. I'll ask you ${questions.length} questions one at a time.\n\n**Instructions:**\n• Reply to each question with a single message\n• For multi-line answers, just send one message with line breaks\n• Type \`cancel\` at any time to abandon\n\n─────────────────\n\n**Question 1 of ${questions.length}:**\n${firstQuestion.label}\n\n${firstQuestion.required ? '_This question is required._' : '_This question is optional — type `skip` if you prefer not to answer._'}${firstQuestion.multiline ? '\n\n_You can send a multi-line answer._' : ''}`,
    `${type} Application`,
  );

  try {
    await interaction.user.send({ embeds: [dmEmbed] });
  } catch (e) {
    // DM failed — user has DMs closed. Fall back to the modal.
    const modal = new ModalBuilder()
      .setCustomId(`application:apply:${type}`)
      .setTitle(`ORGVNUM — ${type}`.slice(0, 45))
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('discord_username').setLabel('Discord Username').setPlaceholder('Your Discord username').setStyle(TextInputStyle.Short).setRequired(true),
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('age').setLabel('Age').setPlaceholder('Your age').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(3),
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('timezone').setLabel('Timezone').setPlaceholder('Your timezone (e.g. EST)').setStyle(TextInputStyle.Short).setRequired(true),
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('experience').setLabel('Previous Experience').setPlaceholder('Describe your prior experience').setStyle(TextInputStyle.Paragraph).setRequired(false),
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('why_join').setLabel('Why ORGVNUM?').setPlaceholder('Why do you want to join ORGVNUM?').setStyle(TextInputStyle.Paragraph).setRequired(false),
        ),
      );
    return interaction.showModal(modal);
  }

  // DM succeeded — start the session.
  startDMSession(interaction.user.id, type, interaction.guild.id, reviewChannelId);
  await interaction.reply({
    embeds: [successEmbed(`I've sent you a DM to start your **${type}** application. Check your DMs! If you didn't receive it, make sure your privacy settings allow DMs from server members.`)],
    ephemeral: true,
  });
});

export default {
  APPLICATION_TYPES, STATUSES, createApplication, getApplication,
  listApplications, updateApplicationStatus, buildReviewPanel,
};

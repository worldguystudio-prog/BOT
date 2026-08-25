import { Events } from 'discord.js';
import logger from '../utils/logger.js';

/**
 * Unified MessageCreate handler.
 *
 * Handles BOTH:
 *   1. DM messages (for the DM-based application system)
 *   2. Guild messages (for auto-moderation)
 *
 * discord.js only allows one handler per event name, so we merge them here.
 */
export default {
  name: Events.MessageCreate,
  async execute(client, message) {
    // Ignore bots.
    if (message.author?.bot) return;

    // ─── DM messages → application system ───────────
    if (!message.guild) {
      try {
        const { getSession } = await import('../systems/dm-applications.js');
        const session = getSession(message.author.id);
        if (!session) return; // not in an application session — ignore

        // Check for cancel command.
        if (message.content?.trim().toLowerCase() === 'cancel') {
          const { clearSession } = await import('../systems/dm-applications.js');
          clearSession(message.author.id);
          const { errorEmbed } = await import('../utils/embeds.js');
          await message.author.send({ embeds: [errorEmbed('Your application session has been cancelled. Your answers were NOT saved. You can start a new application anytime by clicking a button on the application panel.')] }).catch(() => {});
          return;
        }

        // Save the answer and advance the session.
        const answer = message.content?.trim();
        if (!answer) {
          const { errorEmbed } = await import('../utils/embeds.js');
          await message.author.send({ embeds: [errorEmbed('Please send a text answer. If you tried to send an image or file, please describe it in text.')] }).catch(() => {});
          return;
        }

        const question = session.questions[session.current];
        if (answer.toLowerCase() === 'skip' && !question.required) {
          session.answers[question.id] = '(skipped)';
        } else {
          session.answers[question.id] = answer.slice(0, question.maxLength || 1000);
        }
        session.current += 1;

        // Check if we've finished all questions.
        if (session.current >= session.questions.length) {
          await completeDMSession(client, message.author, session);
          return;
        }

        // Send the next question.
        const next = session.questions[session.current];
        const { accentEmbed, successEmbed } = await import('../utils/embeds.js');
        const progress = `Question ${session.current + 1} of ${session.questions.length}`;
        const embed = accentEmbed(
          `**${next.label}**\n\n*${progress}*\n${next.required ? '_This question is required._' : '_This question is optional — type `skip` if you prefer not to answer._'}${next.multiline ? '\n\n_You can send a multi-line answer._' : ''}`,
          `${session.type} — Application`,
        );
        await message.author.send({ embeds: [embed] });
        await message.author.send({ embeds: [successEmbed(`Answer saved. (${session.current} of ${session.questions.length} complete)`)] }).catch(() => {});
      } catch (e) {
        logger.error(`DM application session error: ${e.message}`);
      }
      return;
    }

    // ─── Guild messages → auto-moderation ──────────
    try {
      const { runAutomod } = await import('../systems/automod.js');
      await runAutomod(message);
    } catch (e) {
      logger.error(`automod run error: ${e.message}`);
    }
  },
};

/** Complete a DM application session — submit the application. */
async function completeDMSession(client, user, session) {
  const { clearSession } = await import('../systems/dm-applications.js');
  const { createApplication, getApplication, buildReviewPanel } = await import('../systems/applications.js');
  const { successEmbed, errorEmbed } = await import('../utils/embeds.js');
  const { ChannelType } = await import('discord.js');
  const { getSetting } = await import('../database/helpers.js');
  const logger2 = (await import('../utils/logger.js')).default;

  try {
    const data = { ...session.answers };
    const { applicationId } = createApplication({
      guildId: session.guildId,
      userId: user.id,
      type: session.type,
      data,
    });

    await user.send({
      embeds: [
        successEmbed(
          `Your **${session.type}** application has been submitted!\n\n**Application ID:** #${applicationId}\n**Status:** PENDING\n\nA reviewer will respond in due course. You'll get a DM here when there's an update.`,
          '✅ Application Submitted',
        ),
      ],
    });

    // Post the review panel to the configured application channel.
    const reviewChannelId = session.reviewChannelId || getSetting(session.guildId, 'application_channel_id', null);
    if (reviewChannelId) {
      const guild = client.guilds.cache.get(session.guildId);
      if (guild) {
        const channel = guild.channels.cache.get(reviewChannelId);
        if (channel && channel.type === ChannelType.GuildText) {
          const app = getApplication(session.guildId, applicationId);
          if (app) {
            await channel.send(buildReviewPanel(app)).catch((e) => logger2.error(`Could not post review panel: ${e.message}`));
          }
        }
      }
    }

    clearSession(user.id);
  } catch (e) {
    logger2.error(`completeDMSession error: ${e.message}`);
    await user.send({ embeds: [errorEmbed('There was an error submitting your application. Please contact staff.')] }).catch(() => {});
    clearSession(user.id);
  }
}

import { Events, MessageType } from 'discord.js';
import { getSession, clearSession, QUESTION_SETS } from '../systems/dm-applications.js';
import { createApplication } from '../systems/applications.js';
import { buildReviewPanel } from '../systems/applications.js';
import { brandedEmbed, successEmbed, errorEmbed, accentEmbed } from '../utils/embeds.js';
import { getSetting } from '../database/helpers.js';
import { ChannelType } from 'discord.js';
import logger from '../utils/logger.js';

/**
 * Handles DMs from users with active application sessions.
 * Each message they send is saved as the answer to the current question,
 * then the bot sends the next question.
 */
export default {
  name: Events.MessageCreate,
  async execute(client, message) {
    // Only handle DMs from users (not bots, not guild messages).
    if (message.author.bot) return;
    if (message.guild) return; // guild messages are handled by the automod messageCreate handler

    const session = getSession(message.author.id);
    if (!session) return; // no active session — ignore the DM

    // Check for cancel command.
    if (message.content?.trim().toLowerCase() === 'cancel') {
      clearSession(message.author.id);
      await message.author.send({ embeds: [errorEmbed('Your application session has been cancelled. Your answers were NOT saved. You can start a new application anytime by clicking a button on the application panel.')] }).catch(() => {});
      return;
    }

    try {
      const answer = message.content?.trim();
      if (!answer) {
        await message.author.send({ embeds: [errorEmbed('Please send a text answer. If you tried to send an image or file, please describe it in text.')] }).catch(() => {});
        return;
      }

      // Handle "skip" for optional questions.
      const question = session.questions[session.current];
      if (answer.toLowerCase() === 'skip' && !question.required) {
        session.answers[question.id] = '(skipped)';
        session.current += 1;
      } else {
        // Save the answer.
        session.answers[question.id] = answer.slice(0, question.maxLength || 1000);
        session.current += 1;
      }

      // Check if we've finished all questions.
      if (session.current >= session.questions.length) {
        await completeSession(client, message.author, session);
        return;
      }

      // Send the next question.
      const next = session.questions[session.current];
      const progress = `Question ${session.current + 1} of ${session.questions.length}`;
      const embed = accentEmbed(
        `**${next.label}**\n\n*${progress}*\n${next.required ? '_This question is required._' : '_This question is optional — type `skip` if you prefer not to answer._'}\n${next.multiline ? '\n_You can send a multi-line answer._' : ''}`,
        `${session.type} — Application`,
      );
      await message.author.send({ embeds: [embed] });

      // Acknowledge the answer was saved.
      await message.author.send({ embeds: [successEmbed(`Answer saved. (${session.current} of ${session.questions.length} complete)`)] }).catch(() => {});
    } catch (e) {
      logger.error(`DM application session error: ${e.message}`);
      await message.author.send({ embeds: [errorEmbed('Something went wrong saving your answer. Please try sending it again, or contact staff if it keeps failing.')] }).catch(() => {});
    }
  },
};

/** Complete a session — submit the application and notify the user. */
async function completeSession(client, user, session) {
  try {
    // Build the application data.
    const data = { ...session.answers };
    const { applicationId } = createApplication({
      guildId: session.guildId,
      userId: user.id,
      type: session.type,
      data,
    });

    // Confirm to the applicant.
    await user.send({
      embeds: [
        successEmbed(
          `Your **${session.type}** application has been submitted!\n\n**Application ID:** #${applicationId}\n**Status:** PENDING\n\nA reviewer will respond in due course. You'll get a DM here when there's an update.`,
          '✅ Application Submitted',
        ),
      ],
    });

    // Post the review panel to the configured application channel.
    if (session.reviewChannelId) {
      const guild = client.guilds.cache.get(session.guildId);
      if (guild) {
        const channel = guild.channels.cache.get(session.reviewChannelId);
        if (channel && channel.type === ChannelType.GuildText) {
          const app = await import('../systems/applications.js').then((m) => m.getApplication(session.guildId, applicationId));
          if (app) {
            await channel.send(buildReviewPanel(app)).catch((e) => logger.error(`Could not post review panel: ${e.message}`));
          }
        }
      }
    }

    clearSession(user.id);
  } catch (e) {
    logger.error(`completeSession error: ${e.message}`);
    await user.send({ embeds: [errorEmbed('There was an error submitting your application. Please contact staff — your answers were not lost, but they weren\'t saved to the system.')] }).catch(() => {});
    clearSession(user.id);
  }
}

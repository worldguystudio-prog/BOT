import { DiscordAPIError } from 'discord.js';
import { errorEmbed } from './embeds.js';
import { logger } from './logger.js';
import { hasLevel, canModerate, botCanManage } from './permissions.js';
import { config, isOwner } from '../config/config.js';

/**
 * Centralized error handling.
 * Sends a friendly error to the user, logs the technical detail privately.
 */

/** Determine if an error is a Discord rate-limit / API error. */
export function isDiscordError(e) {
  return e instanceof DiscordAPIError;
}

/** Send a reply (or followUp) without crashing if the interaction is stale. */
export async function safeReply(interaction, payload) {
  try {
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(payload).catch(() => interaction.followUp(payload).catch(() => {}));
    } else {
      await interaction.reply(payload);
    }
  } catch (e) {
    logger.error(`safeReply failed: ${e.message}`);
  }
}

export async function handleError(interaction, error) {
  const msg = error?.message || 'Unknown error';

  // Permission / hierarchy errors → friendly messages.
  if (msg.toLowerCase().includes('missing permissions') || msg.toLowerCase().includes('missing access')) {
    await safeReply(interaction, {
      embeds: [errorEmbed('I lack the required permissions or role hierarchy to do that. Please ensure my role is above the target role and I have the needed permissions.')],
      ephemeral: true,
    });
    return;
  }

  if (isDiscordError(error)) {
    await safeReply(interaction, { embeds: [errorEmbed(`Discord API error: ${msg}`)], ephemeral: true });
    logger.error(`Discord API error`, { code: error.code, message: msg });
    return;
  }

  await safeReply(interaction, {
    embeds: [errorEmbed('An unexpected error occurred while processing your command. Staff have been notified.')],
    ephemeral: true,
  });
  logger.error(`Unhandled command error: ${msg}`, { stack: error?.stack });
}

/** Standardized permission gate for commands. Returns true if allowed, false if denied (already replied). */
export async function gateCommand(interaction, command) {
  const required = command.requiredLevel ?? config.permissionLevels.MEMBER;

  // Owner-only commands.
  if (command.ownerOnly && !isOwner(interaction.user.id)) {
    await safeReply(interaction, {
      embeds: [errorEmbed('You do not have permission to use this command. (Owner only)')],
      ephemeral: true,
    });
    return false;
  }

  if (!interaction.inGuild()) {
    await safeReply(interaction, {
      embeds: [errorEmbed('This command can only be used inside the ORGVNUM server.')],
      ephemeral: true,
    });
    return false;
  }

  const member = interaction.member;
  if (!hasLevel(member, interaction.guildId, required)) {
    await safeReply(interaction, {
      embeds: [errorEmbed('You do not have permission to use this command.')],
      ephemeral: true,
    });
    return false;
  }

  // Discord permission bit requirement (if declared).
  if (command.requiredPermissions?.length) {
    for (const perm of command.requiredPermissions) {
      if (!member.permissions?.has(perm)) {
        await safeReply(interaction, {
          embeds: [errorEmbed(`You are missing the required Discord permission: \`${String(perm)}\`.`)],
          ephemeral: true,
        });
        return false;
      }
    }
  }

  return true;
}

/**
 * Validates that the moderator can act on the target.
 * Replies with an error and returns false when not allowed.
 */
export async function assertCanModerate(interaction, target) {
  const moderator = interaction.member;
  if (!canModerate(moderator, target)) {
    await safeReply(interaction, {
      embeds: [errorEmbed('You cannot perform this action on that member due to role hierarchy.')],
      ephemeral: true,
    });
    return false;
  }
  if (!botCanManage(target)) {
    await safeReply(interaction, {
      embeds: [errorEmbed('I cannot act on that member — my role is not high enough in the hierarchy.')],
      ephemeral: true,
    });
    return false;
  }
  return true;
}

export default { handleError, gateCommand, assertCanModerate, safeReply };

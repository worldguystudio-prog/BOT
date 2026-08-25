import { Events } from 'discord.js';
import { handleError, safeReply, gateCommand } from '../utils/errors.js';
import { applyCooldown, getCooldown } from '../utils/checks.js';
import { config } from '../config/config.js';
import logger from '../utils/logger.js';
import { buttonHandlers, selectHandlers, modalHandlers } from '../registry.js';
// Importing the systems that own component handlers registers their
// button/select/modal handlers. registry.js breaks the cycle.
import '../systems/tickets.js';
import '../systems/applications.js';
import '../systems/recruitment.js';

export default {
  name: Events.InteractionCreate,
  async execute(client, interaction) {
    try {
      if (interaction.isChatInputCommand()) {
        await handleCommand(client, interaction);
      } else if (interaction.isAutocomplete()) {
        await handleAutocomplete(client, interaction);
      } else if (interaction.isButton()) {
        await handleButton(client, interaction);
      } else if (interaction.isStringSelectMenu()) {
        await handleSelectMenu(client, interaction);
      } else if (interaction.isModalSubmit()) {
        await handleModal(client, interaction);
      }
    } catch (error) {
      await handleError(interaction, error);
    }
  },
};

async function handleCommand(client, interaction) {
  const command = client.commands.get(interaction.commandName);
  if (!command) {
    await safeReply(interaction, {
      content: '❌ This command is not available.',
      ephemeral: true,
    });
    return;
  }

  // Permission gate (server-side enforced).
  if (!(await gateCommand(interaction, command))) return;

  // Cooldowns.
  if (!applyCooldown(interaction, command)) {
    const remaining = Math.ceil((getCooldownMs(interaction, command) - Date.now()) / 1000);
    await safeReply(interaction, {
      embeds: [],
      content: `⏳ You're using this command too quickly. Try again in ${remaining}s.`,
      ephemeral: true,
    });
    return;
  }

  await command.execute(interaction, client);
}

// Re-export for the cooldown read above.
function getCooldownMs(interaction, command) {
  return getCooldown(interaction.guildId, interaction.user.id, command.data?.name || command.name);
}

async function handleAutocomplete(client, interaction) {
  const command = client.commands.get(interaction.commandName);
  if (command?.autocomplete) {
    try {
      await command.autocomplete(interaction, client);
    } catch (e) {
      logger.error(`autocomplete error: ${e.message}`);
    }
  }
}

async function handleButton(client, interaction) {
  // Routing convention: "system:action:id"
  const [system, action, ...rest] = interaction.customId.split(':');
  const id = rest.join(':');
  const handler = buttonHandlers[system];
  if (!handler) {
    await safeReply(interaction, { content: '❌ This button is no longer valid.', ephemeral: true });
    return;
  }
  await handler(interaction, client, action, id);
}

async function handleSelectMenu(client, interaction) {
  const [system, action, ...rest] = interaction.customId.split(':');
  const id = rest.join(':');
  const handler = selectHandlers[system];
  if (!handler) {
    await safeReply(interaction, { content: '❌ This menu is no longer valid.', ephemeral: true });
    return;
  }
  await handler(interaction, client, action, id);
}

async function handleModal(client, interaction) {
  const [system, action, ...rest] = interaction.customId.split(':');
  const id = rest.join(':');
  const handler = modalHandlers[system];
  if (!handler) {
    await safeReply(interaction, { content: '❌ This form is no longer valid.', ephemeral: true });
    return;
  }
  await handler(interaction, client, action, id);
}

// Registries live in ../registry.js (no circular imports).
// Systems register their button/select/modal handlers when their modules are
// imported (see static imports at the top of this file).

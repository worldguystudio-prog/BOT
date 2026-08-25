import { Client, GatewayIntentBits, Partials, Options } from 'discord.js';
import 'dotenv/config';
import { config, isOwner } from './src/config/config.js';
import { loadCommands, loadEvents } from './src/handlers.js';
import { getDb } from './src/database/database.js';
import logger from './src/utils/logger.js';

// Fail fast if the token is missing — but never print the token itself.
if (!config.token) {
  logger.error('DISCORD_TOKEN is not set. Copy .env.example to .env and fill in your bot token.');
  process.exit(1);
}
if (!config.guildId || !config.ownerId.length) {
  logger.warn('GUILD_ID and/or OWNER_ID are not set. Some features (guild sync, owner commands) will be limited.');
}

// Initialize the database up front so schema errors surface early.
try {
  getDb();
  logger.info('SQLite database initialized.');
} catch (e) {
  logger.error(`Failed to initialize database: ${e.message}`);
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildBans,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.DirectMessages, // Required to receive DMs (for the DM application system)
  ],
  partials: [
    Partials.Channel,
    Partials.GuildMember,
    Partials.Message,
    Partials.User,
    Partials.Reaction,
  ],
  // Reasonable caching to limit gateway traffic.
  presence: { status: 'online' },
  // Sweep old messages to keep memory in check.
  sweepers: {
    messages: { interval: 300, lifetime: 3600 },
  },
});

// Expose a shared commands map on the client.
client.commands = new Map();

// Top-level guards: never let a single error crash the process.
process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled rejection: ${reason?.stack || reason}`);
});
process.on('uncaughtException', (err) => {
  logger.error(`Uncaught exception: ${err?.stack || err?.message || err}`);
});

// Graceful shutdown.
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    logger.info(`${signal} received — shutting down…`);
    client.destroy();
    process.exit(0);
  });
}

await loadEvents(client);

// Reload commands without a full restart (used by /reload).
client.loadCommands = async () => {
  client.commands = await loadCommands();
  return client.commands.size;
};

await client.login(config.token);

export { client, isOwner };

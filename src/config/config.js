import 'dotenv/config';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Centralized ORGVNUM configuration.
 * Secrets come from environment variables only — never hard-coded.
 */
export const config = {
  token: process.env.DISCORD_TOKEN || '',
  guildId: process.env.GUILD_ID || '',
  ownerId: (process.env.OWNER_ID || '').split(',').map((s) => s.trim()).filter(Boolean),
  coOwners: (process.env.CO_OWNERS || '').split(',').map((s) => s.trim()).filter(Boolean),

  dbName: process.env.DB_NAME || 'orgvnum.db',

  // Branding / visual style: dark red, black, charcoal, muted gold, white text.
  brand: {
    name: 'ORGVNUM',
    tagline: 'Personnel & Administration System',
    footer: 'ORGVNUM • Personnel & Administration System',
    colors: {
      primary: 0x8b0000, // dark red
      accent: 0xc9a227, // muted gold
      success: 0x2e7d32,
      error: 0xb00020,
      warning: 0xc9a227,
      info: 0x36454f, // charcoal
    },
  },

  defaults: {
    cooldown: 3000, // ms
    casePadding: 6,
    automod: {
      enabled: false,
      spam: { enabled: false, max: 5, window: 3000 },
      mentions: { enabled: false, max: 4 },
      caps: { enabled: false, threshold: 0.7, minLength: 8 },
      duplicate: { enabled: false, max: 3 },
      links: { enabled: false },
      invites: { enabled: true },
      keywords: { enabled: false, list: [] },
      flood: { enabled: false, max: 7, window: 5000 },
      raid: { enabled: false, joins: 5, window: 10000 },
      accountAge: { enabled: false, minDays: 3 },
    },
  },

  // Permission hierarchy levels (higher = more powerful)
  permissionLevels: {
    OWNER: 100,
    ADMINISTRATOR: 90,
    DIRECTORATE: 80,
    DEPARTMENT: 70,
    MODERATOR: 60,
    RECRUITER: 50,
    TRAINER: 40,
    STAFF: 30,
    MEMBER: 10,
    NONE: 0,
  },

  paths: {
    root: join(__dirname, '..', '..'),
    src: join(__dirname, '..'),
    data: join(__dirname, '..', '..', 'data'),
    db: join(__dirname, '..', '..', 'data', process.env.DB_NAME || 'orgvnum.db'),
    commands: join(__dirname, 'commands'),
    events: join(__dirname, 'events'),
  },
};

// Ensure the data directory exists at startup.
if (!existsSync(config.paths.data)) {
  mkdirSync(config.paths.data, { recursive: true });
}

/** All configured owner IDs (OWNER_ID + CO_OWNERS). */
export function allOwnerIds() {
  return [...config.ownerId, ...config.coOwners];
}

/** Returns true if the given user id is a configured bot owner. */
export function isOwner(userId) {
  return allOwnerIds().includes(String(userId));
}

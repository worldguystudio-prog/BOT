import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { brandedEmbed, successEmbed, errorEmbed } from '../../utils/embeds.js';
import { config } from '../../config/config.js';

// Resolve the guides directory robustly. Railway/PaaS hosts sometimes run
// the bot from /app instead of the repo root, so we check multiple candidates.
const __dirname = dirname(fileURLToPath(import.meta.url));
const CANDIDATE_DIRS = [
  join(__dirname, '..', '..', 'guides'),                          // src/commands/administration/ → ../../guides
  join(process.cwd(), 'guides'),                                 // cwd/guides (Railway /app/guides)
  join(__dirname, '..', '..', '..', 'guides'),                   // one more up, just in case
  '/app/guides',                                                 // Railway default
];

let GUIDES_DIR = null;
for (const candidate of CANDIDATE_DIRS) {
  if (existsSync(candidate)) {
    GUIDES_DIR = candidate;
    break;
  }
}

// Map of guide keys → file names + friendly labels.
const GUIDE_MAP = {
  overview: { file: '00_READ_ME_FIRST.txt', label: 'Overview — Read Me First' },
  owner: { file: '01_Owner_and_Administrators.txt', label: 'Owner & Administrators' },
  directorate: { file: '02_Directorate_Command.txt', label: 'Directorate Command' },
  moderators: { file: '03_Moderators.txt', label: 'Moderators' },
  recruiters: { file: '04_Recruiters.txt', label: 'Recruiters' },
  trainers: { file: '05_Trainers.txt', label: 'Trainers' },
  staff: { file: '06_Staff_General.txt', label: 'Staff (General)' },
  tickets: { file: '07_Tickets_and_Support.txt', label: 'Tickets & Support' },
  roleplay: { file: '08_Roleplay_Personnel.txt', label: 'Roleplay & Personnel' },
  shifts: { file: '09_Shifts_and_Activity.txt', label: 'Shifts & Activity' },
  economy: { file: '10_Economy_and_Points.txt', label: 'Economy & Points' },
  all: { file: null, label: 'All Guides (posts every guide in sequence)' },
};

export default {
  data: new SlashCommandBuilder()
    .setName('post-guide')
    .setDescription('Post a staff guide into a channel, neatly Discord-formatted.')
    .addStringOption((o) =>
      o
        .setName('guide')
        .setDescription('Which guide to post')
        .setRequired(true)
        .addChoices(...Object.entries(GUIDE_MAP).map(([key, g]) => ({ name: g.label, value: key }))),
    )
    .addChannelOption((o) =>
      o
        .setName('channel')
        .setDescription('Channel to post in (defaults to current channel)')
        .setRequired(false)
        .addChannelTypes(0),
    ),
  requiredLevel: config.permissionLevels.OWNER,
  cooldown: 10000,
  async execute(interaction) {
    const guideKey = interaction.options.getString('guide', true);
    const targetChannel = interaction.options.getChannel('channel') || interaction.channel;
    const guide = GUIDE_MAP[guideKey];

    if (!guide) {
      return interaction.reply({ embeds: [errorEmbed('Unknown guide.')], ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    // If guides directory wasn't found at startup, bail with a helpful message.
    if (!GUIDES_DIR) {
      return interaction.editReply({
        embeds: [errorEmbed(
          `Guides folder not found.\n\nChecked:\n${CANDIDATE_DIRS.map((d) => `• \`${d}\``).join('\n')}\n\nMake sure the \`guides/\` folder is included in the deploy. If you're on Railway, the folder should be cloned from GitHub automatically.`,
        )],
      });
    }

    try {
      if (guideKey === 'all') {
        const ordered = ['overview', 'owner', 'directorate', 'moderators', 'recruiters', 'trainers', 'staff', 'tickets', 'roleplay', 'shifts', 'economy'];
        let posted = 0;
        for (const key of ordered) {
          const g = GUIDE_MAP[key];
          if (!g?.file) continue;
          await postGuideFile(targetChannel, g.file, g.label);
          posted++;
        }
        await interaction.editReply({ embeds: [successEmbed(`Posted all ${posted} guides to ${targetChannel}.`)] });
      } else {
        const count = await postGuideFile(targetChannel, guide.file, guide.label);
        await interaction.editReply({ embeds: [successEmbed(`Posted **${guide.label}** to ${targetChannel} (${count} message${count === 1 ? '' : 's'}).`)] });
      }
    } catch (e) {
      await interaction.editReply({ embeds: [errorEmbed(`Failed to post guide: ${e.message}`)] });
    }
  },
};

/**
 * Read a guide file, convert it to Discord-friendly formatting,
 * split into <2000 char chunks, and post each to the channel.
 * Returns the number of messages sent.
 */
async function postGuideFile(channel, filename, label) {
  const filepath = join(GUIDES_DIR, filename);
  if (!existsSync(filepath)) {
    throw new Error(`Guide file not found: ${filename} (looked in ${GUIDES_DIR})`);
  }

  let raw = readFileSync(filepath, 'utf-8');

  // Remove the === border lines (lines of only = characters).
  raw = raw.replace(/^={3,}$/gm, '');
  // Remove the --- separator lines.
  raw = raw.replace(/^-{3,}$/gm, '');

  // Send the branded header embed first.
  const headerEmbed = brandedEmbed(`**${label}**\n\nA plain-English guide for ORGVNUM staff.`, 'ORGVNUM — Staff Guide');
  await channel.send({ embeds: [headerEmbed] });

  // Split into chunks under 1900 chars at paragraph boundaries.
  const paragraphs = raw.split(/\n\n+/).filter((p) => p.trim().length > 0);

  const chunks = [];
  let current = '';
  for (const para of paragraphs) {
    const trimmed = para.trim();
    if ((current + '\n\n' + trimmed).length > 1900) {
      if (current) chunks.push(current);
      current = trimmed;
    } else {
      current = current ? `${current}\n\n${trimmed}` : trimmed;
    }
  }
  if (current) chunks.push(current);

  for (const chunk of chunks) {
    await channel.send({ content: chunk });
    await new Promise((r) => setTimeout(r, 300));
  }

  return chunks.length + 1;
}

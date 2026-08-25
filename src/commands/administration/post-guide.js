import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { brandedEmbed, successEmbed, errorEmbed } from '../../utils/embeds.js';
import { config } from '../../config/config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const GUIDES_DIR = join(__dirname, '..', '..', 'guides');

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

    try {
      if (guideKey === 'all') {
        // Post every guide in order.
        const ordered = ['overview', 'owner', 'directorate', 'moderators', 'recruiters', 'trainers', 'staff', 'tickets', 'roleplay', 'shifts', 'economy'];
        for (const key of ordered) {
          const g = GUIDE_MAP[key];
          if (!g?.file) continue;
          await postGuideFile(targetChannel, g.file, g.label);
        }
        await interaction.editReply({ embeds: [successEmbed(`Posted all ${ordered.length} guides to ${targetChannel}.`)] });
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
    throw new Error(`Guide file not found: ${filename}. Make sure the guides/ folder is deployed with the bot.`);
  }

  let raw = readFileSync(filepath, 'utf-8');

  // Convert the ASCII formatting to Discord markdown:
  // 1. Strip the top/bottom === borders, replace with a branded embed header.
  // 2. Remove --- separator lines (they look messy in Discord).
  // 3. Convert ALL-CAPS section headers (lines surrounded by blank lines)
  //    to bold.
  // 4. Keep • bullets and **bold** as-is (Discord renders them).

  // Remove the === border lines (lines of only = characters).
  raw = raw.replace(/^={3,}$/gm, '');
  // Remove the --- separator lines.
  raw = raw.replace(/^-{3,}$/gm, '');

  // Send the branded header embed first.
  const headerEmbed = brandedEmbed(`**${label}**\n\nA plain-English guide for ORGVNUM staff.`, 'ORGVNUM — Staff Guide');
  await channel.send({ embeds: [headerEmbed] });

  // Split the content into chunks under 1900 chars (leaving room for formatting).
  // Split on double-newlines (paragraph boundaries) to avoid cutting mid-sentence.
  const paragraphs = raw.split(/\n\n+/).filter((p) => p.trim().length > 0);

  const chunks = [];
  let current = '';
  for (const para of paragraphs) {
    const trimmed = para.trim();
    // If adding this paragraph would exceed 1900 chars, flush current and start new.
    if ((current + '\n\n' + trimmed).length > 1900) {
      if (current) chunks.push(current);
      current = trimmed;
    } else {
      current = current ? `${current}\n\n${trimmed}` : trimmed;
    }
  }
  if (current) chunks.push(current);

  // Post each chunk as a plain message (Discord renders the markdown).
  for (const chunk of chunks) {
    await channel.send({ content: chunk });
    // Small delay to avoid rate limits.
    await new Promise((r) => setTimeout(r, 300));
  }

  return chunks.length + 1; // +1 for the header embed
}

import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { getGuideEmbeds, GUIDE_KEYS } from '../../systems/guides.js';
import { successEmbed, errorEmbed } from '../../utils/embeds.js';
import { config } from '../../config/config.js';

const GUIDE_LABELS = {
  overview: 'Overview — Read Me First',
  owner: 'Owner & Administrators',
  directorate: 'Directorate Command',
  moderators: 'Moderators',
  recruiters: 'Recruiters',
  trainers: 'Trainers',
  staff: 'Staff (General)',
  tickets: 'Tickets & Support',
  roleplay: 'Roleplay & Personnel',
  shifts: 'Shifts & Activity',
  economy: 'Economy & Points',
  all: 'All Guides (posts every guide in sequence)',
};

export default {
  data: new SlashCommandBuilder()
    .setName('post-guide')
    .setDescription('Post a staff guide into a channel — branded embeds, Discord-formatted.')
    .addStringOption((o) =>
      o
        .setName('guide')
        .setDescription('Which guide to post')
        .setRequired(true)
        .addChoices(...Object.entries(GUIDE_LABELS).map(([key, label]) => ({ name: label, value: key }))),
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

    await interaction.deferReply({ ephemeral: true });

    try {
      if (guideKey === 'all') {
        // Post every guide in order.
        const ordered = ['overview', 'owner', 'directorate', 'moderators', 'recruiters', 'trainers', 'staff', 'tickets', 'roleplay', 'shifts', 'economy'];
        let posted = 0;
        for (const key of ordered) {
          const embeds = getGuideEmbeds(key);
          if (!embeds) continue;
          // Post each embed as a separate message for readability.
          for (const embed of embeds) {
            await targetChannel.send({ embeds: [embed] });
            await new Promise((r) => setTimeout(r, 400)); // avoid rate limits
          }
          posted++;
        }
        await interaction.editReply({ embeds: [successEmbed(`Posted all ${posted} guides to ${targetChannel}.`)] });
      } else {
        const embeds = getGuideEmbeds(guideKey);
        if (!embeds) {
          return interaction.editReply({ embeds: [errorEmbed('Unknown guide.')] });
        }
        for (const embed of embeds) {
          await targetChannel.send({ embeds: [embed] });
          await new Promise((r) => setTimeout(r, 400));
        }
        await interaction.editReply({ embeds: [successEmbed(`Posted **${GUIDE_LABELS[guideKey]}** to ${targetChannel} (${embeds.length} embed${embeds.length === 1 ? '' : 's'}).`)] });
      }
    } catch (e) {
      await interaction.editReply({ embeds: [errorEmbed(`Failed to post guide: ${e.message}`)] });
    }
  },
};

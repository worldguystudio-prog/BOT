import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { buildAnnouncement } from '../../systems/roleplay.js';
import { successEmbed, errorEmbed } from '../../utils/embeds.js';
import { config } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('announcement')
    .setDescription('Post an ORGVNUM announcement.')
    .addStringOption((o) => o.setName('title').setDescription('Announcement title').setRequired(true))
    .addStringOption((o) => o.setName('body').setDescription('Announcement body').setRequired(true))
    .addBooleanOption((o) => o.setName('mention_everyone').setDescription('Whether to @everyone (default: true)').setRequired(false)),
  requiredLevel: config.permissionLevels.DIRECTORATE,
  requiredPermissions: [PermissionFlagsBits.ManageMessages],
  cooldown: 5000,
  async execute(interaction) {
    const title = interaction.options.getString('title', true);
    const body = interaction.options.getString('body', true);
    const mention = interaction.options.getBoolean('mention_everyone') ?? true;

    try {
      await interaction.channel.send({
        content: mention ? '@everyone' : undefined,
        embeds: [buildAnnouncement(title, body)],
        allowedMentions: mention ? { parse: ['everyone'] } : {},
      });
      await interaction.reply({ embeds: [successEmbed('Announcement posted.')], ephemeral: true });
    } catch (e) {
      await interaction.reply({ embeds: [errorEmbed(`Could not post announcement: ${e.message}`)], ephemeral: true });
    }
  },
};

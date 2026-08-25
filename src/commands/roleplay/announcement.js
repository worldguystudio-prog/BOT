import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { buildAnnouncement } from '../../systems/roleplay.js';
import { config } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('announcement')
    .setDescription('Post an ORGVNUM announcement.')
    .addStringOption((o) => o.setName('title').setDescription('Announcement title').setRequired(true))
    .addStringOption((o) => o.setName('body').setDescription('Announcement body').setRequired(true)),
  requiredLevel: config.permissionLevels.DIRECTORATE,
  requiredPermissions: [PermissionFlagsBits.ManageMessages],
  cooldown: 5000,
  async execute(interaction) {
    const title = interaction.options.getString('title', true);
    const body = interaction.options.getString('body', true);
    await interaction.channel.send({ content: '@everyone', embeds: [buildAnnouncement(title, body)], allowedMentions: { parse: ['everyone'] } });
    await interaction.reply({ content: '✅ Announcement posted.', ephemeral: true });
  },
};

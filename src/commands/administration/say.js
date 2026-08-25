import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { brandedEmbed, successEmbed, errorEmbed } from '../../utils/embeds.js';
import { config } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('say')
    .setDescription('Make the bot send a message in a channel.')
    .addChannelOption((o) =>
      o
        .setName('channel')
        .setDescription('Channel to send the message in')
        .setRequired(true)
        .addChannelTypes(0), // GuildText only
    )
    .addStringOption((o) => o.setName('message').setDescription('Plain text message (mutually exclusive with embed).').setRequired(false).setMaxLength(2000))
    .addStringOption((o) => o.setName('embed_title').setDescription('If set, sends a branded embed with this title.').setRequired(false).setMaxLength(256))
    .addStringOption((o) => o.setName('embed_description').setDescription('Embed body text (required if embed_title is set).').setRequired(false).setMaxLength(4000)),
  requiredLevel: config.permissionLevels.ADMINISTRATOR,
  requiredPermissions: [PermissionFlagsBits.ManageMessages],
  cooldown: 2000,
  async execute(interaction) {
    const channel = interaction.options.getChannel('channel', true);
    const message = interaction.options.getString('message');
    const embedTitle = interaction.options.getString('embed_title');
    const embedDescription = interaction.options.getString('embed_description');

    if (!message && !embedTitle) {
      return interaction.reply({ embeds: [errorEmbed('Provide either a `message` or an `embed_title` (with `embed_description`).')], ephemeral: true });
    }
    if (embedTitle && !embedDescription) {
      return interaction.reply({ embeds: [errorEmbed('When using an embed, you must provide both `embed_title` and `embed_description`.')], ephemeral: true });
    }

    const payload = {};
    if (message) payload.content = message;
    if (embedTitle) {
      payload.embeds = [brandedEmbed(embedDescription, embedTitle)];
    }

    try {
      await channel.send(payload);
      await interaction.reply({ embeds: [successEmbed(`Message sent to ${channel}.`)], ephemeral: true });
    } catch (e) {
      await interaction.reply({ embeds: [errorEmbed(`Could not send message: ${e.message}\n\nCommon causes: missing permissions in that channel, or the channel is not a text channel.`)], ephemeral: true });
    }
  },
};

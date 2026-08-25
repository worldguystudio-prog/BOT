import { SlashCommandBuilder, PermissionFlagsBits, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { brandedEmbed, successEmbed, errorEmbed } from '../../utils/embeds.js';
import { APPLICATION_TYPES } from '../../systems/applications.js';
import { config } from '../../config/config.js';

/**
 * Posts an application panel with a row of buttons — one per application type.
 * Clicking a button opens the application modal (same flow as /apply).
 */
export default {
  data: new SlashCommandBuilder()
    .setName('application-panel')
    .setDescription('Post an application panel with buttons users can click to apply.')
    .addChannelOption((o) =>
      o
        .setName('channel')
        .setDescription('Channel to post the panel in (defaults to current channel)')
        .setRequired(false)
        .addChannelTypes(0),
    ),
  requiredLevel: config.permissionLevels.ADMINISTRATOR,
  requiredPermissions: [PermissionFlagsBits.ManageMessages],
  cooldown: 3000,
  async execute(interaction) {
    const targetChannel = interaction.options.getChannel('channel') || interaction.channel;

    const embed = brandedEmbed(
      `**ORGVNUM — Applications**\n\nWant to join ORGVNUM? Click one of the buttons below to start your application. You'll be asked a few questions in a private form.\n\n**Application Types:**\n${APPLICATION_TYPES.map((t) => `• **${t}**`).join('\n')}\n\nYour application will be reviewed by our recruitment team. You'll be DM'd when there's an update.`,
      'ORGVNUM — Apply',
    );

    // One button per application type (max 25 per row — we have 4, so one row).
    const buttons = APPLICATION_TYPES.map((type) =>
      new ButtonBuilder()
        .setCustomId(`apppanel:${type}:`)
        .setLabel(type)
        .setStyle(ButtonStyle.Primary),
    );
    const row = new ActionRowBuilder().addComponents(...buttons);

    try {
      await targetChannel.send({ embeds: [embed], components: [row] });
      await interaction.reply({ embeds: [successEmbed(`Application panel posted in ${targetChannel}.`)], ephemeral: true });
    } catch (e) {
      await interaction.reply({ embeds: [errorEmbed(`Could not post panel: ${e.message}`)], ephemeral: true });
    }
  },
};

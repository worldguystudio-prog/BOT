import { SlashCommandBuilder, PermissionFlagsBits, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { brandedEmbed, successEmbed, errorEmbed } from '../../utils/embeds.js';
import { config } from '../../config/config.js';

// Application types with descriptions and styling.
const APP_TYPES = [
  {
    type: 'Recruitment',
    emoji: '📋',
    style: ButtonStyle.Success,
    label: 'Recruitment',
    description: 'Want to join ORGVNUM? This is the application you need. Submit this to get into the server and attend tryouts.',
    questions: 5,
    forWho: 'New members looking to join the community.',
  },
  {
    type: 'Placement Application',
    emoji: '📍',
    style: ButtonStyle.Primary,
    label: 'Placement',
    description: 'Already a member? Apply for a specific role or department placement. Tell us your skills and desired position.',
    questions: 7,
    forWho: 'Existing members seeking a role assignment.',
  },
  {
    type: 'Staff Application',
    emoji: '🛡️',
    style: ButtonStyle.Secondary,
    label: 'Staff Application',
    description: 'Want to join the staff team? This is a detailed application with scenario questions. Only submit if you\'re serious and active.',
    questions: 10,
    forWho: 'Dedicated members ready to take on staff responsibilities.',
  },
  {
    type: 'Leadership Application',
    emoji: '⭐',
    style: ButtonStyle.Danger,
    label: 'Leadership',
    description: 'Apply for a leadership position (Directorate, Department Head). Requires significant experience and includes scenario-based questions.',
    questions: 12,
    forWho: 'Experienced staff seeking leadership roles.',
  },
];

export default {
  data: new SlashCommandBuilder()
    .setName('application-panel')
    .setDescription('Post the application panel with buttons + descriptions for each type.')
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

    // Build the main info embed.
    const embed = brandedEmbed(
      `**ORGVNUM — Applications**\n\nWant to join ORGVNUM or take on a new role? Click one of the buttons below to start your application. You'll be DM'd the questions one at a time — answer each, and your application will be submitted automatically.\n\n**How it works:**\n1. Click a button below\n2. Check your DMs — the bot will ask you questions\n3. Reply to each question with one message\n4. Type \`cancel\` at any time to abandon\n5. When done, your application goes to our recruitment team\n\n─────────────────\n\n**Application Types:**`,
      'ORGVNUM — Apply',
    );

    // Add a field for each application type.
    for (const app of APP_TYPES) {
      embed.addFields({
        name: `${app.emoji} ${app.label} — ${app.questions} questions`,
        value: `${app.description}\n**Who it's for:** ${app.forWho}`,
        inline: false,
      });
    }

    embed.addFields({
      name: '📝 Tryout Path',
      value: 'To attend a tryout, you must first submit a **Recruitment** application. Once accepted, you\'ll be invited to a tryout session. Check the recruitment channel for the next scheduled tryout.',
      inline: false,
    });

    // Buttons — one row of 4.
    const buttons = APP_TYPES.map((app) =>
      new ButtonBuilder()
        .setCustomId(`apppanel:${app.type}:`)
        .setLabel(app.label)
        .setEmoji(app.emoji)
        .setStyle(app.style),
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

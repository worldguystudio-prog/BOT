import { SlashCommandBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle, ModalBuilder } from 'discord.js';
import { APPLICATION_TYPES } from '../../systems/applications.js';
import { config } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('apply')
    .setDescription('Submit an application to ORGVNUM.')
    .addStringOption((o) =>
      o
        .setName('type')
        .setDescription('Type of application')
        .setRequired(true)
        .addChoices(...APPLICATION_TYPES.map((t) => ({ name: t, value: t }))),
    ),
  requiredLevel: config.permissionLevels.MEMBER,
  cooldown: 30000,
  async execute(interaction) {
    const type = interaction.options.getString('type', true);
    const modal = new ModalBuilder()
      .setCustomId(`application:apply:${type}`)
      .setTitle(`ORGVNUM — ${type}`)
      .addComponents(
        row('discord_username', 'Discord Username', 'Your Discord username', true, TextInputStyle.Short),
        row('age', 'Age', 'Your age', true, TextInputStyle.Short, 3),
        row('timezone', 'Timezone', 'Your timezone (e.g. EST)', true, TextInputStyle.Short),
        row('experience', 'Previous Experience', 'Describe your prior experience', false, TextInputStyle.Paragraph),
        row('why_join', 'Why ORGVNUM?', 'Why do you want to join ORGVNUM?', false, TextInputStyle.Paragraph),
      );
    await interaction.showModal(modal);
  },
};

function row(id, label, placeholder, required, style, max) {
  const input = new TextInputBuilder().setCustomId(id).setLabel(label).setPlaceholder(placeholder).setStyle(style).setRequired(required);
  if (max) input.setMaxLength(max);
  return new ActionRowBuilder().addComponents(input);
}

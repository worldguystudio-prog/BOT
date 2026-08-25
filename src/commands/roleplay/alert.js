import { SlashCommandBuilder } from 'discord.js';
import { buildAlert } from '../../systems/roleplay.js';
import { config } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('alert')
    .setDescription('Broadcast an ORGVNUM alert.')
    .addStringOption((o) => o.setName('message').setDescription('Alert message').setRequired(true))
    .addStringOption((o) =>
      o
        .setName('level')
        .setDescription('Alert level')
        .setRequired(false)
        .addChoices(
          { name: 'Info', value: 'info' },
          { name: 'Warning', value: 'warning' },
          { name: 'Danger', value: 'danger' },
        ),
    ),
  requiredLevel: config.permissionLevels.STAFF,
  cooldown: 5000,
  async execute(interaction) {
    const message = interaction.options.getString('message', true);
    const level = interaction.options.getString('level') || 'info';
    await interaction.reply({ content: '@here', embeds: [buildAlert(message, level)], allowedMentions: { parse: ['everyone'] } });
  },
};

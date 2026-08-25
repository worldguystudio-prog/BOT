import { SlashCommandBuilder } from 'discord.js';
import { buildDispatch } from '../../systems/roleplay.js';
import { config } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('dispatch')
    .setDescription('Issue an ORGVNUM dispatch call.')
    .addStringOption((o) => o.setName('location').setDescription('Location / sector').setRequired(true))
    .addStringOption((o) => o.setName('situation').setDescription('Situation description').setRequired(true))
    .addStringOption((o) => o.setName('units').setDescription('Optional units to dispatch').setRequired(false)),
  requiredLevel: config.permissionLevels.STAFF,
  cooldown: 5000,
  async execute(interaction) {
    const location = interaction.options.getString('location', true);
    const situation = interaction.options.getString('situation', true);
    const units = interaction.options.getString('units');
    await interaction.reply({ embeds: [buildDispatch(location, situation, units ? { units } : {})] });
  },
};

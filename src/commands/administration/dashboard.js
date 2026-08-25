import { SlashCommandBuilder } from 'discord.js';
import { buildDashboard } from '../../systems/dashboard.js';
import { config } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('dashboard')
    .setDescription('Open the ORGVNUM management dashboard — configure everything from one panel.'),
  requiredLevel: config.permissionLevels.ADMINISTRATOR,
  cooldown: 3000,
  async execute(interaction) {
    await interaction.reply({ ...buildDashboard(), ephemeral: true });
  },
};

import { SlashCommandBuilder } from 'discord.js';
import { balance } from '../../systems/economy.js';
import { brandedEmbed, errorEmbed } from '../../utils/embeds.js';
import { config } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('balance')
    .setDescription('View your ORGVNUM point balance.')
    .addUserOption((o) => o.setName('user').setDescription('Member (defaults to you)').setRequired(false)),
  requiredLevel: config.permissionLevels.MEMBER,
  cooldown: 3000,
  async execute(interaction) {
    const user = interaction.options.getUser('user') || interaction.user;
    const pts = balance(interaction.guild.id, user.id);
    await interaction.reply({ embeds: [brandedEmbed(`<@${user.id}> has **${pts}** ORGVNUM points.`)] });
  },
};

import { SlashCommandBuilder } from 'discord.js';
import { buildPersonnelProfile } from '../../systems/personnel.js';
import { errorEmbed } from '../../utils/embeds.js';
import { config } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('View a member\'s ORGVNUM personnel profile.')
    .addUserOption((o) => o.setName('user').setDescription('Member to view (defaults to you)').setRequired(false)),
  requiredLevel: config.permissionLevels.MEMBER,
  cooldown: 3000,
  async execute(interaction) {
    const user = interaction.options.getUser('user') || interaction.user;
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    const embed = await buildPersonnelProfile(interaction.guild.id, user.id, member);
    if (!embed) return interaction.reply({ embeds: [errorEmbed('No personnel record found.')] , ephemeral: true });
    await interaction.reply({ embeds: [embed] });
  },
};

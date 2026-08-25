import { SlashCommandBuilder } from 'discord.js';
import { accentEmbed, errorEmbed } from '../../utils/embeds.js';
import { config } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('View a member\'s avatar.')
    .addUserOption((o) => o.setName('user').setDescription('Member (defaults to you)').setRequired(false)),
  requiredLevel: config.permissionLevels.MEMBER,
  cooldown: 2000,
  async execute(interaction) {
    const user = interaction.options.getUser('user') || interaction.user;
    const avatar = user.displayAvatarURL({ size: 1024, extension: 'png' });
    if (!avatar) return interaction.reply({ embeds: [errorEmbed('No avatar found.')] , ephemeral: true });
    await interaction.reply({ embeds: [accentEmbed(`Avatar of <@${user.id}>.`, 'ORGVNUM — Avatar').setImage(avatar)] });
  },
};

import { SlashCommandBuilder } from 'discord.js';
import { accentEmbed, errorEmbed } from '../../utils/embeds.js';
import { config } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('banner')
    .setDescription('View a member\'s banner.')
    .addUserOption((o) => o.setName('user').setDescription('Member (defaults to you)').setRequired(false)),
  requiredLevel: config.permissionLevels.MEMBER,
  cooldown: 2000,
  async execute(interaction) {
    const user = interaction.options.getUser('user') || interaction.user;
    const full = await user.fetch(true).catch(() => null);
    const banner = full?.bannerURL?.({ size: 1024 });
    if (!banner) return interaction.reply({ embeds: [errorEmbed(`<@${user.id}> has no banner.`)] , ephemeral: true });
    await interaction.reply({ embeds: [accentEmbed(`Banner of <@${user.id}>.`, 'ORGVNUM — Banner').setImage(banner)] });
  },
};

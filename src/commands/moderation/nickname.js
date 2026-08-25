import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { successEmbed, errorEmbed } from '../../utils/embeds.js';
import { config } from '../../config/config.js';
import { logEvent } from '../../systems/logging.js';

export default {
  data: new SlashCommandBuilder()
    .setName('nickname')
    .setDescription('Change a member\'s nickname.')
    .addUserOption((o) => o.setName('user').setDescription('Member to rename').setRequired(true))
    .addStringOption((o) => o.setName('nickname').setDescription('New nickname (leave empty to reset)').setRequired(false).setMaxLength(32)),
  requiredLevel: config.permissionLevels.MODERATOR,
  requiredPermissions: [PermissionFlagsBits.ManageNicknames],
  cooldown: 2000,
  async execute(interaction) {
    const user = interaction.options.getUser('user', true);
    const nick = interaction.options.getString('nickname') || null;
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (!member) return interaction.reply({ embeds: [errorEmbed('That member is not in the server.')], ephemeral: true });
    try {
      await member.setNickname(nick, `Changed by ${interaction.user.tag}`);
      await logEvent(interaction.guild, 'NICKNAME', 'ORGVNUM — Nickname Changed', `<@${interaction.user.id}> changed <@${user.id}>'s nickname to \`${nick || 'reset'}\`.`, [], config.brand.colors.info);
      await interaction.reply({ embeds: [successEmbed(`Nickname updated for <@${user.id}>.`)] });
    } catch (e) {
      await interaction.reply({ embeds: [errorEmbed(`Could not change nickname: ${e.message}`)], ephemeral: true });
    }
  },
};

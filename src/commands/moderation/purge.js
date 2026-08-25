import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { successEmbed, errorEmbed } from '../../utils/embeds.js';
import { config } from '../../config/config.js';
import { logEvent } from '../../systems/logging.js';

export default {
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Bulk delete messages in this channel.')
    .addIntegerOption((o) => o.setName('amount').setDescription('Number of messages to delete (1-100)').setRequired(true).setMinValue(1).setMaxValue(100))
    .addUserOption((o) => o.setName('user').setDescription('Only delete messages from this user').setRequired(false)),
  requiredLevel: config.permissionLevels.MODERATOR,
  requiredPermissions: [PermissionFlagsBits.ManageMessages],
  cooldown: 3000,
  async execute(interaction) {
    const amount = interaction.options.getInteger('amount', true);
    const targetUser = interaction.options.getUser('user');
    await interaction.deferReply({ ephemeral: true });

    const messages = await interaction.channel.messages.fetch({ limit: 100 }).catch(() => null);
    if (!messages) return interaction.editReply({ embeds: [errorEmbed('Could not fetch messages.')] });

    let toDelete = messages;
    if (targetUser) {
      toDelete = messages.filter((m) => m.author.id === targetUser.id && (Date.now() - m.createdTimestamp) < 14 * 86400 * 1000);
      toDelete = Array.from(toDelete.values()).slice(0, amount);
    } else {
      toDelete = Array.from(messages.values()).slice(0, amount);
    }

    const deleted = await interaction.channel.bulkDelete(toDelete, true).catch((e) => {
      interaction.editReply({ embeds: [errorEmbed(`Bulk delete failed: ${e.message}`)] });
      return null;
    });
    if (!deleted) return;

    const count = deleted.size;
    await logEvent(interaction.guild, 'PURGE', 'ORGVNUM — Messages Purged', `<@${interaction.user.id}> deleted ${count} message(s) in <#${interaction.channelId}>.`, [], config.brand.colors.info);
    await interaction.editReply({ embeds: [successEmbed(`Deleted ${count} message(s).${targetUser ? ` From <@${targetUser.id}>.` : ''}`)] });
  },
};

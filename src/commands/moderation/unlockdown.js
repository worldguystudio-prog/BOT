import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';
import { successEmbed } from '../../utils/embeds.js';
import { config } from '../../config/config.js';
import { logEvent } from '../../systems/logging.js';

export default {
  data: new SlashCommandBuilder()
    .setName('unlockdown')
    .setDescription('Restore all text channels after a lockdown.'),
  requiredLevel: config.permissionLevels.ADMINISTRATOR,
  requiredPermissions: [PermissionFlagsBits.ManageChannels, PermissionFlagsBits.Administrator],
  cooldown: 5000,
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const channels = interaction.guild.channels.cache.filter((c) => c.type === ChannelType.GuildText);
    let unlocked = 0;
    for (const channel of channels.values()) {
      try {
        await channel.permissionOverwrites.edit(interaction.guild.id, { SendMessages: null }, { reason: 'Server lockdown lifted' });
        unlocked++;
      } catch { /* skip */ }
    }
    await logEvent(interaction.guild, 'UNLOCKDOWN', 'ORGVNUM — Lockdown Lifted', `<@${interaction.user.id}> lifted the server lockdown. ${unlocked} channels restored.`, [], config.brand.colors.success);
    await interaction.editReply({ embeds: [successEmbed(`Unlockdown complete. ${unlocked} channel(s) restored.`)] });
  },
};

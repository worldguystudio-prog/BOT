import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';
import { successEmbed, errorEmbed } from '../../utils/embeds.js';
import { config } from '../../config/config.js';
import { logEvent } from '../../systems/logging.js';

export default {
  data: new SlashCommandBuilder()
    .setName('lockdown')
    .setDescription('Lock all text channels in the server (emergency).')
    .addStringOption((o) => o.setName('reason').setDescription('Reason for the lockdown').setRequired(false)),
  requiredLevel: config.permissionLevels.ADMINISTRATOR,
  requiredPermissions: [PermissionFlagsBits.ManageChannels, PermissionFlagsBits.Administrator],
  cooldown: 5000,
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const reason = interaction.options.getString('reason') || 'Server lockdown';
    const channels = interaction.guild.channels.cache.filter(
      (c) => c.type === ChannelType.GuildText && c.permissionsFor(interaction.guild.members.me)?.has(PermissionFlagsBits.ManageChannels),
    );
    let locked = 0;
    for (const channel of channels.values()) {
      try {
        await channel.permissionOverwrites.edit(interaction.guild.id, { SendMessages: false }, { reason });
        locked++;
      } catch { /* skip */ }
    }
    await logEvent(interaction.guild, 'LOCKDOWN', 'ORGVNUM — Server Lockdown', `<@${interaction.user.id}> initiated a server-wide lockdown.\nReason: ${reason}\nChannels locked: ${locked}`, [], config.brand.colors.error);
    await interaction.editReply({ embeds: [successEmbed(`Lockdown complete. ${locked} channel(s) locked.\nUse \`/unlockdown\` to restore.`)] });
  },
};

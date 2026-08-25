import { SlashCommandBuilder } from 'discord.js';
import { restPutCommands, clearCommands, rest } from '../../utils/register.js';
import { loadCommands } from '../../handlers.js';
import { successEmbed, errorEmbed } from '../../utils/embeds.js';
import { isOwner } from '../../utils/permissions.js';
import { config } from '../../config/config.js';
import { Routes } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('sync')
    .setDescription('Re-register slash commands + clear duplicates (owner only).')
    .addBooleanOption((o) => o.setName('clear_global').setDescription('Also clear global commands (fixes duplicates). Default: true').setRequired(false)),
  ownerOnly: true,
  async execute(interaction, client) {
    if (!isOwner(interaction.user.id)) return interaction.reply({ embeds: [errorEmbed('Owner only.')], ephemeral: true });
    await interaction.deferReply({ ephemeral: true });
    const clientId = client.application?.id;
    if (!clientId) return interaction.editReply({ embeds: [errorEmbed('Could not resolve application ID.')] });

    const commands = await loadCommands();
    client.commands = commands;

    // If GUILD_ID is set and clear_global is true (default), clear global commands
    // to remove the duplicates from the old both-scope registration.
    const clearGlobal = interaction.options.getBoolean('clear_global') ?? true;
    if (config.guildId && clearGlobal) {
      try {
        await rest.put(Routes.applicationCommands(clientId), { body: [] });
      } catch (e) {
        // Fall through to normal registration even if clearing failed.
      }
    }

    await restPutCommands([...commands.values()], clientId);
    await interaction.editReply({ embeds: [successEmbed(`Synced **${commands.size}** commands (global cleared: ${config.guildId && clearGlobal ? 'yes' : 'no'}).`)] });
  },
};

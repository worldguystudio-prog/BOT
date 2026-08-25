import { SlashCommandBuilder } from 'discord.js';
import { restPutCommands } from '../../utils/register.js';
import { loadCommands } from '../../handlers.js';
import { successEmbed, errorEmbed } from '../../utils/embeds.js';
import { isOwner } from '../../utils/permissions.js';

export default {
  data: new SlashCommandBuilder().setName('sync').setDescription('Re-register all slash commands (owner only).'),
  ownerOnly: true,
  async execute(interaction, client) {
    if (!isOwner(interaction.user.id)) return interaction.reply({ embeds: [errorEmbed('Owner only.')] , ephemeral: true });
    await interaction.deferReply({ ephemeral: true });
    const commands = await loadCommands();
    client.commands = commands;
    await restPutCommands([...commands.values()]);
    await interaction.editReply({ embeds: [successEmbed(`Synced **${commands.size}** commands to Discord.`)] });
  },
};

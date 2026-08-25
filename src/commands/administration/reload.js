import { SlashCommandBuilder } from 'discord.js';
import { isOwner } from '../../utils/permissions.js';
import { errorEmbed, successEmbed } from '../../utils/embeds.js';

export default {
  data: new SlashCommandBuilder().setName('reload').setDescription('Reload commands without restarting (owner only).'),
  ownerOnly: true,
  async execute(interaction, client) {
    if (!isOwner(interaction.user.id)) return interaction.reply({ embeds: [errorEmbed('Owner only.')] , ephemeral: true });
    const count = await client.loadCommands();
    await interaction.reply({ embeds: [successEmbed(`Reloaded **${count}** commands.`)] , ephemeral: true });
  },
};

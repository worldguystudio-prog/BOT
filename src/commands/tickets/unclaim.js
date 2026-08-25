import { SlashCommandBuilder } from 'discord.js';
import { run, get } from '../../database/helpers.js';
import { successEmbed, errorEmbed } from '../../utils/embeds.js';
import { config } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('unclaim')
    .setDescription('Release your claim on the current ticket.'),
  requiredLevel: config.permissionLevels.STAFF,
  cooldown: 1000,
  async execute(interaction) {
    const ticket = get('SELECT * FROM tickets WHERE channel_id = ?', [interaction.channelId]);
    if (!ticket) return interaction.reply({ embeds: [errorEmbed('This channel is not a ticket.')], ephemeral: true });
    run('UPDATE tickets SET claimed_by = NULL WHERE id = ?', [ticket.id]);
    await interaction.reply({ embeds: [successEmbed('Ticket claim released.')], ephemeral: true });
  },
};

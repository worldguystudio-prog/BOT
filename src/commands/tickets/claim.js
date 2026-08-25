import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { run, get } from '../../database/helpers.js';
import { successEmbed, errorEmbed } from '../../utils/embeds.js';
import { config } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('claim')
    .setDescription('Claim the current ticket.'),
  requiredLevel: config.permissionLevels.STAFF,
  cooldown: 1000,
  async execute(interaction) {
    const ticket = get('SELECT * FROM tickets WHERE channel_id = ?', [interaction.channelId]);
    if (!ticket) return interaction.reply({ embeds: [errorEmbed('This channel is not a ticket.')], ephemeral: true });
    run('UPDATE tickets SET claimed_by = ? WHERE id = ?', [interaction.user.id, ticket.id]);
    await interaction.reply({ embeds: [successEmbed(`This ticket is now claimed by <@${interaction.user.id}>.`, '🎫 Ticket Claimed')], ephemeral: true });
  },
};

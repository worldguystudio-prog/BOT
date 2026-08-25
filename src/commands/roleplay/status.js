import { SlashCommandBuilder } from 'discord.js';
import { getPersonnel, upsertPersonnel } from '../../database/helpers.js';
import { brandedEmbed, errorEmbed } from '../../utils/embeds.js';
import { config } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('status')
    .setDescription('View or update your personnel status.')
    .addStringOption((o) =>
      o
        .setName('set')
        .setDescription('Update your status')
        .setRequired(false)
        .addChoices(
          { name: 'Active', value: 'ACTIVE' },
          { name: 'On Leave', value: 'ON LEAVE' },
          { name: 'Inactive', value: 'INACTIVE' },
          { name: 'LOA', value: 'LOA' },
        ),
    ),
  requiredLevel: config.permissionLevels.MEMBER,
  cooldown: 3000,
  async execute(interaction) {
    const newStatus = interaction.options.getString('set');
    if (newStatus) {
      upsertPersonnel(interaction.guild.id, interaction.user.id, { status: newStatus });
      return interaction.reply({ embeds: [brandedEmbed(`Your status is now **${newStatus}**.`, 'ORGVNUM — Status Updated')] });
    }
    const record = getPersonnel(interaction.guild.id, interaction.user.id);
    if (!record) return interaction.reply({ embeds: [errorEmbed('You have no personnel record yet.')] , ephemeral: true });
    return interaction.reply({ embeds: [brandedEmbed(`Your current status: **${record.status}**`)] });
  },
};

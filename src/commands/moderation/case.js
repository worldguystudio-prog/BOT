import { SlashCommandBuilder, PermissionFlagsBits, time } from 'discord.js';
import { getCaseByNumber } from '../../database/helpers.js';
import { brandedEmbed, errorEmbed } from '../../utils/embeds.js';
import { config } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('case')
    .setDescription('Look up a moderation case by its number.')
    .addStringOption((o) => o.setName('number').setDescription('Case number (e.g. 000123)').setRequired(true)),
  requiredLevel: config.permissionLevels.STAFF,
  requiredPermissions: [PermissionFlagsBits.ModerateMembers],
  cooldown: 1000,
  async execute(interaction) {
    const num = interaction.options.getString('number', true).replace(/^#/, '').trim();
    const row = getCaseByNumber(interaction.guild.id, num);
    if (!row) return interaction.reply({ embeds: [errorEmbed(`No case found with number \`${num}\`.`)], ephemeral: true });
    await interaction.reply({
      embeds: [
        brandedEmbed(`**Case #${row.case_number}**`, 'ORGVNUM — Case Record').addFields(
          { name: 'Type', value: `\`${row.type}\``, inline: true },
          { name: 'User', value: `<@${row.user_id}>`, inline: true },
          { name: 'Moderator', value: `<@${row.moderator_id}>`, inline: true },
          { name: 'Reason', value: row.reason || 'No reason provided', inline: false },
          { name: 'Duration', value: row.duration || '—', inline: true },
          { name: 'Time', value: time(new Date(row.timestamp), 'R'), inline: true },
        ),
      ],
      ephemeral: true,
    });
  },
};

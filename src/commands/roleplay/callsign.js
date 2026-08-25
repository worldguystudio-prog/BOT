import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { assignCallsign, unassignCallsign } from '../../systems/personnel.js';
import { successEmbed, errorEmbed } from '../../utils/embeds.js';
import { config } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('callsign')
    .setDescription('Assign or remove a callsign.')
    .addSubcommand((s) =>
      s
        .setName('set')
        .setDescription('Assign a callsign to a member.')
        .addUserOption((o) => o.setName('user').setDescription('Member').setRequired(true))
        .addStringOption((o) => o.setName('callsign').setDescription('Callsign (e.g. ORV-04)').setRequired(true).setMaxLength(20))
        .addStringOption((o) => o.setName('department').setDescription('Optional department').setRequired(false)),
    )
    .addSubcommand((s) =>
      s
        .setName('remove')
        .setDescription('Remove a callsign from a member.')
        .addUserOption((o) => o.setName('user').setDescription('Member').setRequired(true)),
    ),
  requiredLevel: config.permissionLevels.STAFF,
  requiredPermissions: [PermissionFlagsBits.ManageNicknames],
  cooldown: 2000,
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const user = interaction.options.getUser('user', true);
    if (sub === 'set') {
      const callsign = interaction.options.getString('callsign', true);
      const department = interaction.options.getString('department') || null;
      assignCallsign(interaction.guild.id, user.id, callsign, department);
      return interaction.reply({ embeds: [successEmbed(`Callsign \`${callsign}\` assigned to <@${user.id}>.`)] });
    }
    if (sub === 'remove') {
      unassignCallsign(interaction.guild.id, user.id);
      return interaction.reply({ embeds: [successEmbed(`Callsign removed for <@${user.id}>.`)] });
    }
    return interaction.reply({ embeds: [errorEmbed('Unknown subcommand.')] , ephemeral: true });
  },
};

import { SlashCommandBuilder } from 'discord.js';
import { buildScene } from '../../systems/roleplay.js';
import { config } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('scene')
    .setDescription('Open a roleplay scene.')
    .addStringOption((o) => o.setName('name').setDescription('Scene name').setRequired(true))
    .addStringOption((o) => o.setName('description').setDescription('Scene description').setRequired(true))
    .addStringOption((o) => o.setName('participants').setDescription('Optional: mention participants (e.g. @User @User)').setRequired(false)),
  requiredLevel: config.permissionLevels.STAFF,
  cooldown: 5000,
  async execute(interaction) {
    const name = interaction.options.getString('name', true);
    const description = interaction.options.getString('description', true);
    const rawParticipants = interaction.options.getString('participants') || '';
    const participants = [...rawParticipants.matchAll(/<@!?(\d{17,20})>/g)].map((m) => m[1]);
    await interaction.reply({
      content: participants.length ? participants.map((id) => `<@${id}>`).join(' ') : undefined,
      embeds: [buildScene(name, description, participants)],
      allowedMentions: { users: participants },
    });
  },
};

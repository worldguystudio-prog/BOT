import { SlashCommandBuilder } from 'discord.js';
import { db } from '../../database/database.js';
import { errorEmbed, successEmbed } from '../../utils/embeds.js';
import { isOwner } from '../../utils/permissions.js';
import logger from '../../utils/logger.js';
import { config } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('database')
    .setDescription('Database utilities (owner only).')
    .addStringOption((o) =>
      o.setName('action').setDescription('Action').setRequired(true).addChoices(
        { name: 'Stats', value: 'stats' },
        { name: 'Backup', value: 'backup' },
        { name: 'Vacuum', value: 'vacuum' },
      ),
    ),
  ownerOnly: true,
  async execute(interaction) {
    if (!isOwner(interaction.user.id)) return interaction.reply({ embeds: [errorEmbed('Owner only.')] , ephemeral: true });
    const action = interaction.options.getString('action', true);
    await interaction.deferReply({ ephemeral: true });

    if (action === 'stats') {
      const tables = ['users', 'warnings', 'moderation_cases', 'tickets', 'applications', 'waitlist', 'departments', 'shifts', 'events', 'attendance', 'logs', 'callsigns', 'personnel', 'point_transactions'];
      const lines = [];
      for (const t of tables) {
        try {
          const r = db().prepare(`SELECT COUNT(*) AS c FROM ${t}`).get();
          lines.push(`• ${t}: **${r.c}**`);
        } catch {
          lines.push(`• ${t}: error`);
        }
      }
      return interaction.editReply({ embeds: [successEmbed(`**Database stats**\n\n${lines.join('\n')}`)] });
    }

    if (action === 'backup') {
      try {
        const { copyFileSync } = await import('node:fs');
        const { join } = await import('node:path');
        const { existsSync, mkdirSync } = await import('node:fs');
        const backupDir = join(config.paths.data, 'backups');
        if (!existsSync(backupDir)) mkdirSync(backupDir, { recursive: true });
        const dest = join(backupDir, `orgvnum-${Date.now()}.db`);
        copyFileSync(config.paths.db, dest);
        logger.info(`Database backed up to ${dest}`);
        return interaction.editReply({ embeds: [successEmbed(`Backup created: \`${dest}\`.`)] });
      } catch (e) {
        return interaction.editReply({ embeds: [errorEmbed(`Backup failed: ${e.message}`)] });
      }
    }

    if (action === 'vacuum') {
      try {
        db().exec('VACUUM');
        return interaction.editReply({ embeds: [successEmbed('Database vacuumed and optimized.')] });
      } catch (e) {
        return interaction.editReply({ embeds: [errorEmbed(`Vacuum failed: ${e.message}`)] });
      }
    }
  },
};

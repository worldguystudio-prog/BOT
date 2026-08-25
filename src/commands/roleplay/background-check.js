import { SlashCommandBuilder, PermissionFlagsBits, time, TimestampStyles, EmbedBuilder } from 'discord.js';
import { getWarnings, getPersonnel, getPoints } from '../../database/helpers.js';
import { brandedEmbed, errorEmbed } from '../../utils/embeds.js';
import { config } from '../../config/config.js';

/**
 * /background-check — Trainer+ only
 *
 * Performs a deep background check on a user, showing:
 *   - Account info (ID, created, age, badges)
 *   - Mutual servers + their highest role in each
 *   - ORGVNUM-specific records (warnings, personnel file, points)
 *
 * Note on Discord API limitations:
 *   A bot can only see servers it's a member of. It CANNOT enumerate "all
 *   servers a user is in" — that's private and Discord doesn't expose it.
 *   What we CAN show: every server the bot shares with the user (mutual
 *   servers), including the user's highest role and join date in each.
 */
export default {
  data: new SlashCommandBuilder()
    .setName('background-check')
    .setDescription('Deep background check on a user — mutual servers, roles, warnings, records.')
    .addUserOption((o) => o.setName('user').setDescription('User to investigate').setRequired(true)),
  requiredLevel: config.permissionLevels.TRAINER,
  requiredPermissions: [PermissionFlagsBits.ManageMessages],
  cooldown: 5000,
  async execute(interaction, client) {
    const user = interaction.options.getUser('user', true);
    await interaction.deferReply({ ephemeral: true });

    try {
      // ─── 1. Account Info ────────────────────────────
      const fetchedUser = await client.users.fetch(user.id, { force: true }).catch(() => user);
      const badges = fetchedUser.flags ? fetchedUser.flags.toArray() : [];
      const accountAgeMs = Date.now() - fetchedUser.createdTimestamp;
      const accountAgeDays = Math.floor(accountAgeMs / 86400000);

      // ─── 2. Mutual Servers ───────────────────────────
      // Iterate through all guilds the bot is in, check if the target is a member.
      const mutualServers = [];
      for (const guild of client.guilds.cache.values()) {
        try {
          const member = await guild.members.fetch(user.id).catch(() => null);
          if (member) {
            // Get highest role (excluding @everyone).
            const roles = member.roles.cache.filter((r) => r.id !== guild.id).sort((a, b) => b.position - a.position);
            const highestRole = roles.first();
            const isOwner = guild.ownerId === user.id;
            const hasAdmin = member.permissions?.has(PermissionFlagsBits.Administrator);

            mutualServers.push({
              guild,
              member,
              highestRole,
              isOwner,
              hasAdmin,
              joinedAt: member.joinedAt,
              roleCount: roles.size,
              nickname: member.nickname,
            });
          }
        } catch {
          // Skip guilds where fetch fails (rate limits, etc.)
        }
      }

      // Sort: owner > admin > highest role position > join date.
      mutualServers.sort((a, b) => {
        if (a.isOwner && !b.isOwner) return -1;
        if (!a.isOwner && b.isOwner) return 1;
        if (a.hasAdmin && !b.hasAdmin) return -1;
        if (!a.hasAdmin && b.hasAdmin) return 1;
        const roleDiff = (b.highestRole?.position || 0) - (a.highestRole?.position || 0);
        if (roleDiff !== 0) return roleDiff;
        return (a.joinedAt?.getTime() || 0) - (b.joinedAt?.getTime() || 0);
      });

      // ─── 3. ORGVNUM Records ─────────────────────────
      const warnings = getWarnings(interaction.guild.id, user.id);
      const personnel = getPersonnel(interaction.guild.id, user.id);
      const points = getPoints(interaction.guild.id, user.id);

      // ─── Build the embed ────────────────────────────
      const embed = new EmbedBuilder()
        .setColor(config.brand.colors.primary)
        .setTitle(`🔍 Background Check — ${fetchedUser.tag}`)
        .setThumbnail(fetchedUser.displayAvatarURL({ size: 256 }))
        .setFooter({ text: config.brand.footer })
        .setTimestamp();

      // Account section.
      embed.addFields({
        name: '👤 Account',
        value: [
          `**ID:** \`${fetchedUser.id}\``,
          `**Created:** ${time(fetchedUser.createdAt, TimestampStyles.ShortDateTime)} (${time(fetchedUser.createdAt, TimestampStyles.RelativeTime)})`,
          `**Age:** ${accountAgeDays} days (${(accountAgeDays / 365).toFixed(1)} years)`,
          `**Bot:** ${fetchedUser.bot ? 'Yes ⚠️' : 'No'}`,
          `**Badges:** ${badges.length ? badges.map((b) => `\`${b}\``).join(', ') : 'None'}`,
        ].join('\n'),
        inline: false,
      });

      // Mutual servers summary.
      const ownerIn = mutualServers.filter((s) => s.isOwner).length;
      const adminIn = mutualServers.filter((s) => s.hasAdmin && !s.isOwner).length;
      embed.addFields({
        name: `🌐 Mutual Servers (${mutualServers.length})`,
        value: [
          `**Owner in:** ${ownerIn}`,
          `**Administrator in:** ${adminIn}`,
          `**Member in:** ${mutualServers.length - ownerIn - adminIn}`,
        ].join('\n'),
        inline: true,
      });

      // ORGVNUM records.
      embed.addFields({
        name: '📋 ORGVNUM Records',
        value: [
          `**Warnings:** ${warnings.length}`,
          `**Personnel file:** ${personnel ? `Yes (${personnel.department || 'No dept'}, ${personnel.status || 'No status'})` : 'None'}`,
          `**Points:** ${points}`,
        ].join('\n'),
        inline: true,
      });

      // ─── Per-server breakdown (top 15) ─────────────
      if (mutualServers.length > 0) {
        const serverLines = mutualServers.slice(0, 15).map((s) => {
          const rank = s.isOwner ? '👑 Owner' : s.hasAdmin ? '🛡️ Admin' : s.highestRole ? `🔹 ${s.highestRole.name}` : '👤 Member';
          const joined = s.joinedAt ? time(s.joinedAt, TimestampStyles.RelativeTime) : 'Unknown';
          return `**${s.guild.name}**\n└ ${rank} · Joined ${joined} · ${s.roleCount} role(s)${s.nickname ? ` · Nick: ${s.nickname}` : ''}`;
        });
        embed.addFields({
          name: `📊 Server Breakdown (top 15 of ${mutualServers.length})`,
          value: serverLines.join('\n\n'),
          inline: false,
        });
        if (mutualServers.length > 15) {
          embed.addFields({ name: '...', value: `*${mutualServers.length - 15} more servers not shown.*`, inline: false });
        }
      } else {
        embed.addFields({
          name: '📊 Server Breakdown',
          value: '*No mutual servers found.*',
          inline: false,
        });
      }

      // ─── Warnings detail (if any) ───────────────────
      if (warnings.length > 0) {
        const warnLines = warnings.slice(0, 5).map((w) => `• \`${w.warning_id}\` — ${w.reason || 'No reason'} · ${time(new Date(w.timestamp), TimestampStyles.RelativeTime)}`);
        embed.addFields({
          name: `⚠️ Warnings (${warnings.length})`,
          value: warnLines.join('\n'),
          inline: false,
        });
      }

      // Risk assessment summary.
      let riskLevel = 'Low';
      let riskColor = config.brand.colors.success;
      const riskFactors = [];
      if (accountAgeDays < 7) { riskLevel = 'High'; riskColor = config.brand.colors.error; riskFactors.push('Very new account (< 7 days)'); }
      else if (accountAgeDays < 30) { riskLevel = 'Medium'; riskColor = config.brand.colors.warning; riskFactors.push('New account (< 30 days)'); }
      if (warnings.length >= 3) { riskLevel = 'High'; riskColor = config.brand.colors.error; riskFactors.push(`${warnings.length} warnings on record`); }
      else if (warnings.length >= 1) { riskFactors.push(`${warnings.length} warning(s) on record`); }
      if (fetchedUser.bot) { riskFactors.push('This is a bot account'); }

      embed.setColor(riskColor);
      embed.addFields({
        name: `🎯 Risk Assessment: ${riskLevel}`,
        value: riskFactors.length ? riskFactors.map((f) => `• ${f}`).join('\n') : 'No risk factors identified.',
        inline: false,
      });

      await interaction.editReply({ embeds: [embed] });
    } catch (e) {
      await interaction.editReply({ embeds: [errorEmbed(`Background check failed: ${e.message}`)] });
    }
  },
};

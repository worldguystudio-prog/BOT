import { Events, PermissionFlagsBits } from 'discord.js';
import { getSetting, run } from '../database/helpers.js';
import { logEvent } from '../systems/logging.js';
import { config } from '../config/config.js';
import { time } from 'discord.js';

export default {
  name: Events.GuildMemberAdd,
  async execute(client, member) {
    if (!member.guild) return;
    const guild = member.guild;
    const guildId = guild.id;

    // Record the user in our DB.
    try {
      run(
        `INSERT INTO users (user_id, guild_id, username, join_date, points)
         VALUES (?, ?, ?, ?, 0)
         ON CONFLICT(user_id, guild_id) DO UPDATE SET
           username = excluded.username, join_date = excluded.join_date, leave_date = NULL`,
        [member.id, guildId, member.user.tag, new Date().toISOString()],
      );
    } catch (e) {
      /* ignore */
    }

    // Welcome message (optional).
    const welcomeChannelId = getSetting(guildId, 'welcome_channel_id', null);
    const welcomeText = getSetting(guildId, 'welcome_message', null);
    if (welcomeChannelId) {
      const channel = guild.channels.cache.get(welcomeChannelId);
      if (channel) {
        try {
          const { brandedEmbed } = await import('../utils/embeds.js');
          await channel.send({
            content: welcomeText ? undefined : `<@${member.id}>`,
            embeds: [
              brandedEmbed(
                `**WELCOME TO ORGVNUM**\n\nWelcome, <@${member.id}>.\n\nPlease review the rules and complete the appropriate onboarding process.\n\nAccount created: ${time(member.user.createdAt, 'R')}`,
                'ORGVNUM — Welcome',
              ),
            ],
          });
        } catch (e) {
          /* ignore send errors */
        }
      }
    }

    // Default role (optional).
    const defaultRoleId = getSetting(guildId, 'default_role_id', null);
    if (defaultRoleId) {
      try {
        const role = guild.roles.cache.get(defaultRoleId);
        if (role && member.guild.members.me?.permissions?.has(PermissionFlagsBits.ManageRoles)) {
          await member.roles.add(role).catch(() => {});
        }
      } catch {
        /* ignore */
      }
    }

    // Account-age / suspicious-join checks via automod.
    try {
      const { onMemberAdd } = await import('../systems/automod.js');
      await onMemberAdd(member);
    } catch (e) {
      /* automod optional */
    }

    // Log the join.
    await logEvent(guild, 'MEMBER_JOIN', 'ORGVNUM — Member Joined', `<@${member.id}> (\`${member.id}\`) joined the server.`, [
      { name: 'Account', value: `Created ${time(member.user.createdAt, 'R')}`, inline: true },
      { name: 'Members', value: String(guild.memberCount), inline: true },
    ], config.brand.colors.success);
  },
};

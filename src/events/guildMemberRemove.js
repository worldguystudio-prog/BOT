import { Events } from 'discord.js';
import { getSetting, run } from '../database/helpers.js';
import { logEvent } from '../systems/logging.js';
import { config } from '../config/config.js';

export default {
  name: Events.GuildMemberRemove,
  async execute(client, member) {
    if (!member.guild) return;
    const guild = member.guild;
    const guildId = guild.id;

    // Mark leave date + capture departments for records.
    try {
      run('UPDATE users SET leave_date = ? WHERE user_id = ? AND guild_id = ?', [
        new Date().toISOString(),
        member.id,
        guildId,
      ]);
    } catch {
      /* ignore */
    }

    const departments = getSetting(guildId, `member_departments:${member.id}`, null);

    await logEvent(
      guild,
      'MEMBER_LEAVE',
      'ORGVNUM — Member Left',
      `<@${member.id}> (\`${member.id}\`) left the server.`,
      [
        { name: 'Joined', value: member.joinedAt ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'Unknown', inline: true },
        { name: 'Roles', value: member.roles?.cache?.size ? member.roles.cache.filter((r) => r.id !== guildId).map((r) => r.name).join(', ') || 'None' : 'None', inline: true },
        { name: 'Departments', value: departments || 'None', inline: true },
      ],
      config.brand.colors.warning,
      'member',
    );
  },
};

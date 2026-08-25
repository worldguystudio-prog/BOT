import { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { brandedEmbed, accentEmbed, successEmbed } from '../../utils/embeds.js';
import { config } from '../../config/config.js';

const CATEGORIES = {
  moderation: { label: 'Moderation', emoji: '🛡️', desc: 'Warn, mute, kick, ban, purge, lock, and more.' },
  automod: { label: 'Auto Moderation', emoji: '🤖', desc: 'Spam, caps, invites, raid protection.' },
  tickets: { label: 'Tickets', emoji: '🎫', desc: 'Support tickets, panels, transcripts.' },
  applications: { label: 'Applications', emoji: '📝', desc: 'Apply, review, accept/deny, interview.' },
  recruitment: { label: 'Recruitment', emoji: '📋', desc: 'Placement waitlist management.' },
  roleplay: { label: 'Roleplay', emoji: '🎭', desc: 'Personnel, callsigns, dispatch, scenes.' },
  economy: { label: 'Economy', emoji: '💰', desc: 'Points & leaderboards.' },
  events: { label: 'Training & Shifts', emoji: '📅', desc: 'Training sessions, events, shifts.' },
  administration: { label: 'Administration', emoji: '⚙️', desc: 'Config, sync, database, debug.' },
  utilities: { label: 'Utilities', emoji: '🧰', desc: 'User, server, role info, ping, help.' },
};

export default {
  data: new SlashCommandBuilder().setName('help').setDescription('View the ORGVNUM command reference.'),
  requiredLevel: config.permissionLevels.NONE,
  cooldown: 5000,
  async execute(interaction, client) {
    const embed = brandedEmbed(
      `**ORGVNUM — Personnel & Administration System**\n\nORGVNUM is a custom-built Discord infrastructure platform combining moderation, administration, recruitment, tickets, applications, personnel, roleplay, training, events, logging, and utilities.\n\nSelect a category below to browse its commands.`,
      'ORGVNUM — Help',
    );

    const select = new StringSelectMenuBuilder()
      .setCustomId('help:menu:')
      .setPlaceholder('Select a category…')
      .addOptions(
        Object.entries(CATEGORIES).map(([key, c]) => ({
          label: c.label,
          value: key,
          description: c.desc,
          emoji: c.emoji,
        })),
      );

    const row = new ActionRowBuilder().addComponents(select);
    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setLabel('Website').setStyle(ButtonStyle.Link).setURL('https://github.com/worldguystudio-prog/BOT').setEmoji('🌐'),
      new ButtonBuilder().setCustomId('help:overview:').setLabel('Overview').setStyle(ButtonStyle.Primary).setEmoji('📖'),
    );

    await interaction.reply({ embeds: [embed], components: [row, buttons], ephemeral: true });

    // Register the component handlers dynamically (idempotent).
    const { buttonHandlers, selectHandlers } = await import('../../registry.js');
    if (!selectHandlers.help) {
      selectHandlers.help = async (i) => {
        const cat = i.values?.[0];
        const c = CATEGORIES[cat];
        if (!c) return i.update({ embeds: [accentEmbed('Unknown category.')] });
        const cmds = [...client.commands.values()].filter((cmd) => cmd.data?.name && isCategoryFor(cmd, cat));
        const lines = cmds.length ? cmds.map((cmd) => `• \`/${cmd.data.name}\` — ${cmd.data.description}`) : ['No commands registered in this category yet.'];
        await i.update({ embeds: [brandedEmbed(`**${c.emoji} ${c.label}**\n\n${c.desc}\n\n**Commands (${cmds.length})**\n${lines.join('\n')}`, 'ORGVNUM — Help')] });
      };
    }
    if (!buttonHandlers.help) {
      buttonHandlers.help = async (i) => {
        const count = client.commands.size;
        await i.update({ embeds: [brandedEmbed(`**ORGVNUM Overview**\n\n• **${count}** commands loaded\n• ${Object.keys(CATEGORIES).length} categories\n• Modular SQLite-backed systems\n\nUse the menu to browse commands.`, 'ORGVNUM — Overview')] });
      };
    }
  },
};

function isCategoryFor(cmd, cat) {
  // Infer category from the file path recorded on module import is not reliable; instead map by command name prefixes.
  const name = cmd.data.name;
  const map = {
    moderation: ['warn', 'unwarn', 'warnings', 'clearwarnings', 'mute', 'unmute', 'timeout', 'untimeout', 'kick', 'ban', 'unban', 'softban', 'purge', 'slowmode', 'lock', 'unlock', 'lockdown', 'unlockdown', 'nickname', 'case'],
    automod: ['automod'],
    tickets: ['ticket-panel', 'closeticket', 'adduser', 'removeuser', 'claim', 'unclaim', 'rename', 'lockticket', 'unlockticket'],
    applications: ['apply', 'applications', 'application', 'accept', 'deny', 'interview'],
    recruitment: ['waitlist'],
    roleplay: ['personnel', 'profile', 'status', 'callsign', 'scene', 'dispatch', 'alert', 'announcement'],
    economy: ['balance', 'points', 'leaderboard'],
    events: ['training', 'shift'],
    administration: ['config', 'reload', 'sync', 'database', 'debug'],
    utilities: ['avatar', 'banner', 'userinfo', 'serverinfo', 'roleinfo', 'ping', 'botinfo', 'help'],
  };
  return map[cat]?.includes(name);
}

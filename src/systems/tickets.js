import {
  ChannelType,
  PermissionFlagsBits,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  TextInputBuilder,
  TextInputStyle,
  ModalBuilder,
} from 'discord.js';
import { getSetting, run, get, all } from '../database/helpers.js';
import { brandedEmbed, successEmbed, errorEmbed } from '../utils/embeds.js';
import { registerButton, registerSelect, registerModal } from '../registry.js';
import { logEvent } from './logging.js';
import { config } from '../config/config.js';
import logger from '../utils/logger.js';

export const TICKET_TYPES = [
  { id: 'general', label: 'General Support', emoji: '🎫', value: 'General Support' },
  { id: 'appeal', label: 'Moderation Appeal', emoji: '⚖️', value: 'Moderation Appeal' },
  { id: 'recruitment', label: 'Recruitment', emoji: '📋', value: 'Recruitment' },
  { id: 'placement', label: 'Placement Application', emoji: '📍', value: 'Placement Application' },
  { id: 'staff', label: 'Staff Application', emoji: '📝', value: 'Staff Application' },
  { id: 'partnership', label: 'Partnership', emoji: '🤝', value: 'Partnership' },
  { id: 'report', label: 'Report a User', emoji: '🚨', value: 'Report a User' },
  { id: 'roleplay', label: 'Roleplay Support', emoji: '🎭', value: 'Roleplay Support' },
  { id: 'other', label: 'Other', emoji: '💬', value: 'Other' },
];

/** Build the persistent ticket panel (sent via /ticket-panel). */
export function buildTicketPanel() {
  const select = new StringSelectMenuBuilder()
    .setCustomId('ticket:open:')
    .setPlaceholder('Select a ticket type…')
    .addOptions(
      TICKET_TYPES.map((t) => ({
        label: t.label,
        value: t.id,
        description: `Open a ${t.value} ticket`,
        emoji: t.emoji,
      })),
    );

  const embed = brandedEmbed(
    `**ORGVNUM SUPPORT CENTER**\n\nSelect the type of ticket you need below. A private channel will be created and the appropriate staff will be notified.\n\nPlease be descriptive — include all relevant details so staff can assist you efficiently.`,
    'ORGVNUM — Tickets',
  );

  const row = new ActionRowBuilder().addComponents(select);
  return { embeds: [embed], components: [row] };
}

/** Resolve staff roles that should see a given ticket type. */
function staffRoleIdsFor(guildId, typeId) {
  const override = getSetting(guildId, `ticket_roles:${typeId}`, null);
  if (override) {
    try {
      return JSON.parse(override);
    } catch {
      /* fall through */
    }
  }
  const fallback = getSetting(guildId, 'staff_role_id', null);
  return fallback ? [fallback] : [];
}

/** Create the ticket channel + DB record. */
async function createTicket(guild, user, typeId) {
  const type = TICKET_TYPES.find((t) => t.id === typeId) || TICKET_TYPES[0];
  const categoryId = getSetting(guild.id, 'ticket_category_id', null);
  const staffIds = staffRoleIdsFor(guild.id, typeId);

  const overwrites = [
    { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
    { id: user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles] },
    { id: guild.members.me.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ReadMessageHistory] },
  ];
  for (const rid of staffIds) {
    overwrites.push({
      id: rid,
      allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageMessages],
    });
  }

  const channel = await guild.channels.create({
    name: `ticket-${type.id}-${user.username}`.slice(0, 100),
    type: ChannelType.GuildText,
    parent: categoryId || undefined,
    permissionOverwrites: overwrites,
    topic: `${type.value} — opened by ${user.tag} (${user.id})`,
  });

  const res = run(
    `INSERT INTO tickets (guild_id, channel_id, user_id, type, status, created_at)
     VALUES (?, ?, ?, ?, 'OPEN', ?)`,
    [guild.id, channel.id, user.id, type.value, new Date().toISOString()],
  );
  const ticketId = res.lastInsertRowid;

  const embed = brandedEmbed(
    `**${type.value}**\n\nWelcome, <@${user.id}>.\n\nA staff member will be with you shortly. Use the buttons below to manage this ticket.\n\n• **Claim** — a staff member takes ownership\n• **Close** — generate a transcript and close\n• **Lock** — prevent the requester from sending messages`,
    `ORGVNUM — Ticket #${String(ticketId).padStart(4, '0')}`,
  );

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`ticket:claim:${ticketId}`).setLabel('Claim').setEmoji('🙋').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`ticket:close:${ticketId}`).setLabel('Close').setEmoji('🔒').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId(`ticket:lock:${ticketId}`).setLabel('Lock').setEmoji('⛔').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`ticket:rename:${ticketId}`).setLabel('Rename').setEmoji('✏️').setStyle(ButtonStyle.Secondary),
  );

  await channel.send({ content: `<@${user.id}>${staffIds.map((r) => ` <@&${r}>`).join('')}`, embeds: [embed], components: [row] });

  await logEvent(guild, 'TICKET_OPEN', 'ORGVNUM — Ticket Opened', `<@${user.id}> opened a **${type.value}** ticket → <#${channel.id}>`, [
    { name: 'Ticket', value: `#${String(ticketId).padStart(4, '0')}`, inline: true },
  ], config.brand.colors.accent, 'ticket');

  return channel;
}

/** Generate a text transcript of a channel. */
async function generateTranscript(channel) {
  const messages = [];
  let lastId = null;
  for (let i = 0; i < 50; i++) {
    const batch = await channel.messages.fetch({ limit: 100, before: lastId || undefined });
    if (!batch.size) break;
    messages.push(...batch.values());
    lastId = batch.last().id;
    if (batch.size < 100) break;
  }
  messages.reverse();
  const lines = messages.map((m) => {
    const ts = new Date(m.createdTimestamp).toISOString();
    const author = m.author?.tag || 'Unknown';
    const content = m.content || '';
    const attachments = m.attachments?.map((a) => a.url).join(' ') || '';
    return `[${ts}] ${author}: ${content}${attachments ? ` ${attachments}` : ''}`.trimEnd();
  });
  return `ORGVNUM Ticket Transcript — #${channel.name}\nGenerated ${new Date().toISOString()}\n\n${lines.join('\n')}`;
}

/** Close a ticket: generate transcript, post to log channel, then delete the channel. */
export async function closeTicket(guild, channel, closerId, options = {}) {
  const ticket = get('SELECT * FROM tickets WHERE channel_id = ?', [channel.id]);
  if (!ticket) return false;

  const transcript = await generateTranscript(channel);
  const transcriptId = nextTranscriptId();
  const transcriptName = `transcript-${transcriptId}.txt`;

  // Save transcript text to the DB record.
  run('UPDATE tickets SET status = ?, closed_at = ?, transcript = ? WHERE id = ?', [
    options.reopen ? 'REOPENED' : 'CLOSED',
    new Date().toISOString(),
    transcript.slice(0, 100000),
    ticket.id,
  ]);

  // Send transcript to the configured transcript channel (fallback to ticket log, then main log).
  const transcriptChannelId = getSetting(guild.id, 'ticket_transcript_channel_id', null);
  const { getLogChannel } = await import('./logging.js');
  const logChannel = transcriptChannelId
    ? guild.channels.cache.get(transcriptChannelId)
    : getLogChannel(guild, 'ticket');
  if (logChannel) {
    try {
      const buffer = Buffer.from(transcript, 'utf8');
      await logChannel.send({
        embeds: [brandedEmbed(`Ticket closed by <@${closerId}>.\n\nType: ${ticket.type}\nOpened by: <@${ticket.user_id}>`, `ORGVNUM — Ticket Transcript ${transcriptId}`)],
        files: [{ attachment: buffer, name: transcriptName }],
      });
    } catch (e) {
      logger.error(`transcript send failed: ${e.message}`);
    }
  }

  await logEvent(guild, 'TICKET_CLOSE', 'ORGVNUM — Ticket Closed', `<@${closerId}> closed ticket #${String(ticket.id).padStart(4, '0')} (${ticket.type})`, [], config.brand.colors.warning, 'ticket');

  if (!options.reopen) {
    await channel.delete('Ticket closed').catch(() => {});
  }
  return true;
}

let _transcriptCounter = 0;
function nextTranscriptId() {
  _transcriptCounter += 1;
  return `${Date.now().toString(36)}-${_transcriptCounter}`;
}

/* ───────── Component handlers ───────── */

// Select menu: open a ticket.
registerSelect('ticket', async (interaction, client, _action, _id) => {
  const typeId = interaction.values?.[0];
  if (!typeId) return;
  await interaction.deferReply({ ephemeral: true });
  // Prevent ticket spam (one open ticket per user per type).
  const existing = get('SELECT id FROM tickets WHERE guild_id = ? AND user_id = ? AND status = ? ORDER BY id DESC LIMIT 1', [
    interaction.guild.id,
    interaction.user.id,
    'OPEN',
  ]);
  const max = parseInt(getSetting(interaction.guild.id, 'ticket_max_per_user', '3'), 10) || 3;
  const openCount = all('SELECT id FROM tickets WHERE guild_id = ? AND user_id = ? AND status = ?', [
    interaction.guild.id,
    interaction.user.id,
    'OPEN',
  ]).length;
  if (openCount >= max) {
    await interaction.editReply({ embeds: [errorEmbed(`You already have ${openCount} open ticket(s). Please close one before opening another.`)] });
    return;
  }
  const channel = await createTicket(interaction.guild, interaction.user, typeId).catch((e) => {
    logger.error(`createTicket failed: ${e.message}`);
    return null;
  });
  if (!channel) {
    await interaction.editReply({ embeds: [errorEmbed('Could not create a ticket channel. An administrator may need to configure the ticket category and staff roles via `/config tickets`.')] });
    return;
  }
  await interaction.editReply({ embeds: [successEmbed(`Your ticket has been created: ${channel}`)] });
});

// Buttons.
registerButton('ticket', async (interaction, client, action, id) => {
  const ticket = id ? get('SELECT * FROM tickets WHERE id = ?', [Number(id)]) : null;

  if (action === 'claim') {
    if (!ticket) return interaction.reply({ embeds: [errorEmbed('Ticket not found.')], ephemeral: true });
    run('UPDATE tickets SET claimed_by = ? WHERE id = ?', [interaction.user.id, ticket.id]);
    await interaction.reply({ embeds: [successEmbed(`This ticket has been claimed by <@${interaction.user.id}>.`, '🎫 Ticket Claimed')] });
    return;
  }

  if (action === 'lock') {
    const channel = interaction.channel;
    const opener = ticket?.user_id;
    if (opener) {
      await channel.permissionOverwrites.edit(opener, { SendMessages: false }).catch(() => {});
    }
    await interaction.reply({ embeds: [successEmbed('Ticket locked. The requester can no longer send messages here.')] });
    return;
  }

  if (action === 'unlock') {
    const channel = interaction.channel;
    const opener = ticket?.user_id;
    if (opener) {
      await channel.permissionOverwrites.edit(opener, { SendMessages: true }).catch(() => {});
    }
    await interaction.reply({ embeds: [successEmbed('Ticket unlocked.')] });
    return;
  }

  if (action === 'rename') {
    const modal = new ModalBuilder()
      .setCustomId(`ticket:rename:${id}`)
      .setTitle('Rename Ticket')
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('name')
            .setLabel('New channel name')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMaxLength(90),
        ),
      );
    await interaction.showModal(modal);
    return;
  }

  if (action === 'close') {
    await interaction.deferReply({ ephemeral: false });
    await interaction.editReply({ embeds: [brandedEmbed('Closing ticket and generating transcript…')] });
    const ok = await closeTicket(interaction.guild, interaction.channel, interaction.user.id).catch((e) => {
      logger.error(`closeTicket failed: ${e.message}`);
      return false;
    });
    if (!ok) {
      await interaction.followUp({ embeds: [errorEmbed('This channel is not a tracked ticket.')] }).catch(() => {});
    }
    return;
  }
});

// Modals.
registerModal('ticket', async (interaction, client, action, id) => {
  if (action === 'rename') {
    const name = interaction.fields.getTextInputValue('name').toLowerCase().replace(/\s+/g, '-').slice(0, 90);
    await interaction.channel.setName(name).catch(() => {});
    await interaction.reply({ embeds: [successEmbed(`Ticket renamed to \`${name}\`.`)] });
    return;
  }
});

export default { buildTicketPanel, createTicket, closeTicket, TICKET_TYPES };

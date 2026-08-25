import { getPersonnel, upsertPersonnel, setCallsign, removeCallsign, getCallsign, getDepartments } from '../database/helpers.js';
import { brandedEmbed, accentEmbed } from '../utils/embeds.js';
import { config } from '../config/config.js';
import { time } from 'discord.js';

/** Build a personnel profile embed. */
export async function buildPersonnelProfile(guildId, userId, member) {
  const personnel = getPersonnel(guildId, userId);
  const callsign = getCallsign(guildId, userId);

  if (!personnel && !callsign) {
    return accentEmbed(`<@${userId}> has no personnel record yet. Use \`/callsign set\` or assign them a department to create one.`, 'ORGVNUM — Personnel');
  }

  const fields = [
    { name: 'Name', value: personnel?.name || (member ? member.displayName : '—'), inline: true },
    { name: 'Callsign', value: callsign?.callsign || personnel?.callsign || '—', inline: true },
    { name: 'Department', value: personnel?.department || callsign?.department || 'Unassigned', inline: true },
    { name: 'Status', value: personnel?.status || 'ACTIVE', inline: true },
    { name: 'Join Date', value: personnel?.join_date ? time(new Date(personnel.join_date), 'D') : '—', inline: true },
    { name: 'Account', value: member ? time(member.user.createdAt, 'R') : '—', inline: true },
  ];
  if (personnel?.notes) fields.push({ name: 'Notes', value: personnel.notes, inline: false });

  return brandedEmbed(`**ORGVNUM PERSONNEL FILE**`, 'ORGVNUM — Personnel').addFields(fields);
}

export function assignCallsign(guildId, userId, callsign, department = null) {
  setCallsign(guildId, userId, callsign, department);
  upsertPersonnel(guildId, userId, { callsign, department });
  return getCallsign(guildId, userId);
}

export function unassignCallsign(guildId, userId) {
  removeCallsign(guildId, userId);
}

export function assignDepartment(guildId, userId, departmentName) {
  const depts = getDepartments(guildId);
  const dept = depts.find((d) => d.name.toLowerCase() === String(departmentName).toLowerCase());
  upsertPersonnel(guildId, userId, { department: dept?.name || departmentName });
  return dept || null;
}

export function setStatus(guildId, userId, status) {
  upsertPersonnel(guildId, userId, { status });
}

export default { buildPersonnelProfile, assignCallsign, unassignCallsign, assignDepartment, setStatus };

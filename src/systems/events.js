import { run, get, all } from '../database/helpers.js';

/** Create a training/event. */
export function createEvent({ guildId, name, type, hostId, date }) {
  const now = new Date().toISOString();
  const res = run(
    'INSERT INTO events (guild_id, name, type, host_id, date, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [guildId, name, type || 'Training', hostId, date, 'SCHEDULED', now],
  );
  return res.lastInsertRowid;
}

export function getEvent(guildId, eventId) {
  return get('SELECT * FROM events WHERE guild_id = ? AND id = ?', [guildId, Number(eventId)]);
}

export function setEventStatus(guildId, eventId, status) {
  run('UPDATE events SET status = ? WHERE id = ? AND guild_id = ?', [status, Number(eventId), guildId]);
  return getEvent(guildId, eventId);
}

export function listEvents(guildId, status = null) {
  if (status) return all('SELECT * FROM events WHERE guild_id = ? AND status = ? ORDER BY id DESC LIMIT 25', [guildId, status]);
  return all('SELECT * FROM events WHERE guild_id = ? ORDER BY id DESC LIMIT 25', [guildId]);
}

export function addAttendance(eventId, userId, attended = 1) {
  run('INSERT INTO attendance (event_id, user_id, attended) VALUES (?, ?, ?) ON CONFLICT DO NOTHING', [eventId, userId, attended]);
}

export function attendanceList(eventId) {
  return all('SELECT * FROM attendance WHERE event_id = ?', [eventId]);
}

export default { createEvent, getEvent, setEventStatus, listEvents, addAttendance, attendanceList };

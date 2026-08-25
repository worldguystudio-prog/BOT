import { db } from './database.js';

/** Run an INSERT/UPDATE/DELETE and return the result. */
export function run(sql, params = []) {
  return db().prepare(sql).run(...params);
}

/** Fetch a single row. */
export function get(sql, params = []) {
  return db().prepare(sql).get(...params);
}

/** Fetch all matching rows. */
export function all(sql, params = []) {
  return db().prepare(sql).all(...params);
}

/* ───────── Settings (per-guild key/value store) ───────── */

export function getSetting(guildId, key, fallback = null) {
  const row = get('SELECT value FROM settings WHERE guild_id = ? AND key = ?', [guildId, key]);
  return row ? row.value : fallback;
}

export function setSetting(guildId, key, value) {
  run(
    'INSERT INTO settings (guild_id, key, value) VALUES (?, ?, ?) ON CONFLICT(guild_id, key) DO UPDATE SET value = excluded.value',
    [guildId, key, String(value)],
  );
}

export function getAllSettings(guildId) {
  const rows = all('SELECT key, value FROM settings WHERE guild_id = ?', [guildId]);
  const out = {};
  for (const r of rows) out[r.key] = r.value;
  return out;
}

/* ───────── Moderation cases ───────── */

/** Returns the next zero-padded case number for a guild. */
export function nextCaseNumber(guildId) {
  const row = get('SELECT COUNT(*) AS c FROM moderation_cases WHERE guild_id = ?', [guildId]);
  const n = (row?.c || 0) + 1;
  return String(n).padStart(6, '0');
}

export function createCase({ guildId, caseNumber, type, userId, moderatorId, reason, duration = null }) {
  const timestamp = new Date().toISOString();
  const res = run(
    `INSERT INTO moderation_cases (guild_id, case_number, type, user_id, moderator_id, reason, duration, timestamp)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [guildId, caseNumber, type, userId, moderatorId, reason, duration, timestamp],
  );
  return { caseId: res.lastInsertRowid, caseNumber, timestamp };
}

export function getCaseByNumber(guildId, caseNumber) {
  return get('SELECT * FROM moderation_cases WHERE guild_id = ? AND case_number = ?', [
    guildId,
    caseNumber,
  ]);
}

/* ───────── Warnings ───────── */

export function addWarning({ guildId, userId, moderatorId, reason }) {
  const caseNumber = nextCaseNumber(guildId);
  const warningId = `WARN-${caseNumber}`;
  const timestamp = new Date().toISOString();
  run(
    `INSERT INTO warnings (guild_id, warning_id, user_id, moderator_id, reason, timestamp, active)
     VALUES (?, ?, ?, ?, ?, ?, 1)`,
    [guildId, warningId, userId, moderatorId, reason, timestamp],
  );
  // Also create a moderation case for unified audit history.
  createCase({ guildId, caseNumber, type: 'WARN', userId, moderatorId, reason });
  return { warningId, caseNumber, timestamp };
}

export function getWarnings(guildId, userId, includeInactive = false) {
  const sql = includeInactive
    ? 'SELECT * FROM warnings WHERE guild_id = ? AND user_id = ? ORDER BY id DESC'
    : 'SELECT * FROM warnings WHERE guild_id = ? AND user_id = ? AND active = 1 ORDER BY id DESC';
  return all(sql, [guildId, userId]);
}

export function clearWarning(guildId, warningId) {
  const row = get('SELECT * FROM warnings WHERE guild_id = ? AND (warning_id = ? OR id = ?)', [
    guildId,
    warningId,
    Number(warningId) || 0,
  ]);
  if (!row) return null;
  run('UPDATE warnings SET active = 0 WHERE id = ?', [row.id]);
  return row;
}

export function clearAllWarnings(guildId, userId) {
  const res = run('UPDATE warnings SET active = 0 WHERE guild_id = ? AND user_id = ? AND active = 1', [
    guildId,
    userId,
  ]);
  return res.changes;
}

/* ───────── Personnel ───────── */

export function getPersonnel(guildId, userId) {
  return get('SELECT * FROM personnel WHERE guild_id = ? AND user_id = ?', [guildId, userId]);
}

export function upsertPersonnel(guildId, userId, fields = {}) {
  const existing = getPersonnel(guildId, userId);
  const data = {
    name: fields.name ?? existing?.name ?? null,
    callsign: fields.callsign ?? existing?.callsign ?? null,
    department: fields.department ?? existing?.department ?? null,
    join_date: fields.join_date ?? existing?.join_date ?? new Date().toISOString(),
    status: fields.status ?? existing?.status ?? 'ACTIVE',
    notes: fields.notes ?? existing?.notes ?? null,
  };
  run(
    `INSERT INTO personnel (guild_id, user_id, name, callsign, department, join_date, status, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(guild_id, user_id) DO UPDATE SET
       name = excluded.name, callsign = excluded.callsign, department = excluded.department,
       join_date = excluded.join_date, status = excluded.status, notes = excluded.notes`,
    [guildId, userId, data.name, data.callsign, data.department, data.join_date, data.status, data.notes],
  );
  return getPersonnel(guildId, userId);
}

/* ───────── Callsigns ───────── */

export function setCallsign(guildId, userId, callsign, department = null) {
  run(
    `INSERT INTO callsigns (guild_id, user_id, callsign, department)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(guild_id, user_id) DO UPDATE SET callsign = excluded.callsign, department = excluded.department`,
    [guildId, userId, callsign, department],
  );
  upsertPersonnel(guildId, userId, { callsign, department });
}

export function removeCallsign(guildId, userId) {
  run('DELETE FROM callsigns WHERE guild_id = ? AND user_id = ?', [guildId, userId]);
  upsertPersonnel(guildId, userId, { callsign: null });
}

export function getCallsign(guildId, userId) {
  return get('SELECT * FROM callsigns WHERE guild_id = ? AND user_id = ?', [guildId, userId]);
}

/* ───────── Departments ───────── */

export function addDepartment(guildId, name, roleId = null, description = null) {
  const res = run(
    'INSERT INTO departments (guild_id, name, role_id, description) VALUES (?, ?, ?, ?)',
    [guildId, name, roleId, description],
  );
  return res.lastInsertRowid;
}

export function removeDepartment(guildId, name) {
  run('DELETE FROM departments WHERE guild_id = ? AND name = ?', [guildId, name]);
}

export function getDepartments(guildId) {
  return all('SELECT * FROM departments WHERE guild_id = ? ORDER BY name COLLATE NOCASE', [guildId]);
}

/* ───────── Shifts ───────── */

export function startShift(guildId, userId, department) {
  const now = new Date().toISOString();
  const res = run(
    'INSERT INTO shifts (guild_id, user_id, department, start_time) VALUES (?, ?, ?, ?)',
    [guildId, userId, department, now],
  );
  return { id: res.lastInsertRowid, startTime: now };
}

export function endShift(id) {
  const shift = get('SELECT * FROM shifts WHERE id = ?', [id]);
  if (!shift) return null;
  const end = new Date();
  const start = new Date(shift.start_time);
  const duration = Math.round((end - start) / 1000);
  run('UPDATE shifts SET end_time = ?, duration = ? WHERE id = ?', [end.toISOString(), duration, id]);
  return { ...shift, end_time: end.toISOString(), duration };
}

export function getActiveShift(guildId, userId) {
  return get('SELECT * FROM shifts WHERE guild_id = ? AND user_id = ? AND end_time IS NULL', [
    guildId,
    userId,
  ]);
}

export function shiftLeaderboard(guildId, limit = 10) {
  return all(
    `SELECT user_id, SUM(duration) AS total_seconds, COUNT(*) AS shifts
     FROM shifts WHERE guild_id = ? AND duration IS NOT NULL
     GROUP BY user_id ORDER BY total_seconds DESC LIMIT ?`,
    [guildId, limit],
  );
}

/* ───────── Points / Economy ───────── */

export function getPoints(guildId, userId) {
  const row = get('SELECT points FROM users WHERE user_id = ? AND guild_id = ?', [guildId, userId]);
  return row?.points ?? 0;
}

export function addPoints(guildId, userId, amount, reason = null, byId = null) {
  run(
    `INSERT INTO users (user_id, guild_id, points) VALUES (?, ?, ?)
     ON CONFLICT(user_id, guild_id) DO UPDATE SET points = users.points + ?`,
    [userId, guildId, amount, amount],
  );
  run(
    'INSERT INTO point_transactions (guild_id, user_id, amount, reason, by_id, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
    [guildId, userId, amount, reason, byId, new Date().toISOString()],
  );
}

export function pointsLeaderboard(guildId, limit = 10) {
  return all(
    'SELECT user_id, points FROM users WHERE guild_id = ? AND points > 0 ORDER BY points DESC LIMIT ?',
    [guildId, limit],
  );
}

/* ───────── Automod ───────── */

export function getAutomodConfig(guildId) {
  const row = get('SELECT settings FROM automod_config WHERE guild_id = ?', [guildId]);
  if (!row) return null;
  try {
    return JSON.parse(row.settings);
  } catch {
    return null;
  }
}

export function setAutomodConfig(guildId, settings) {
  run(
    'INSERT INTO automod_config (guild_id, settings) VALUES (?, ?) ON CONFLICT(guild_id) DO UPDATE SET settings = excluded.settings',
    [guildId, JSON.stringify(settings)],
  );
}

/* ───────── Logs (database-side audit trail) ───────── */

export function insertLog(guildId, type, data) {
  run('INSERT INTO logs (guild_id, type, data, timestamp) VALUES (?, ?, ?, ?)', [
    guildId,
    type,
    typeof data === 'string' ? data : JSON.stringify(data),
    new Date().toISOString(),
  ]);
}

export default { run, get, all };

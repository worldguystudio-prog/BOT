/**
 * SQLite schema initialization for ORGVNUM.
 * All tables use IF NOT EXISTS so this is safe to call on every boot.
 *
 * @param {import('better-sqlite3').Database} db
 */
export function initSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      guild_id  TEXT NOT NULL,
      key       TEXT NOT NULL,
      value     TEXT,
      PRIMARY KEY (guild_id, key)
    );

    CREATE TABLE IF NOT EXISTS users (
      user_id    TEXT NOT NULL,
      guild_id   TEXT NOT NULL,
      username   TEXT,
      join_date  TEXT,
      leave_date TEXT,
      points     INTEGER DEFAULT 0,
      PRIMARY KEY (user_id, guild_id)
    );

    CREATE TABLE IF NOT EXISTS warnings (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id     TEXT NOT NULL,
      warning_id   TEXT NOT NULL,
      user_id      TEXT NOT NULL,
      moderator_id TEXT NOT NULL,
      reason       TEXT,
      timestamp    TEXT NOT NULL,
      active       INTEGER DEFAULT 1
    );
    CREATE INDEX IF NOT EXISTS idx_warnings_user ON warnings(guild_id, user_id);

    CREATE TABLE IF NOT EXISTS moderation_cases (
      case_id     INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id    TEXT NOT NULL,
      case_number TEXT NOT NULL,
      type        TEXT NOT NULL,
      user_id     TEXT NOT NULL,
      moderator_id TEXT NOT NULL,
      reason      TEXT,
      duration    TEXT,
      timestamp   TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_cases_guild ON moderation_cases(guild_id);
    CREATE INDEX IF NOT EXISTS idx_cases_user ON moderation_cases(guild_id, user_id);

    CREATE TABLE IF NOT EXISTS tickets (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id    TEXT NOT NULL,
      channel_id  TEXT,
      user_id     TEXT NOT NULL,
      type        TEXT,
      status      TEXT DEFAULT 'OPEN',
      claimed_by  TEXT,
      created_at  TEXT NOT NULL,
      closed_at   TEXT,
      transcript  TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_tickets_channel ON tickets(channel_id);

    CREATE TABLE IF NOT EXISTS applications (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id       TEXT NOT NULL,
      application_id TEXT NOT NULL,
      user_id        TEXT NOT NULL,
      type           TEXT NOT NULL,
      status         TEXT DEFAULT 'PENDING',
      data           TEXT,
      submitted_at  TEXT NOT NULL,
      reviewer_id    TEXT,
      reviewer_notes TEXT,
      decided_at     TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_apps_user ON applications(guild_id, user_id);
    CREATE INDEX IF NOT EXISTS idx_apps_status ON applications(guild_id, status);

    CREATE TABLE IF NOT EXISTS waitlist (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id        TEXT NOT NULL,
      user_id         TEXT NOT NULL,
      roblox_username TEXT,
      discord_username TEXT,
      age             TEXT,
      timezone        TEXT,
      activity_level  TEXT,
      experience      TEXT,
      why_join        TEXT,
      desired_role    TEXT,
      skills          TEXT,
      availability    TEXT,
      status          TEXT DEFAULT 'PENDING REVIEW',
      added_at        TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_waitlist_status ON waitlist(guild_id, status);

    CREATE TABLE IF NOT EXISTS departments (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id    TEXT NOT NULL,
      name        TEXT NOT NULL,
      role_id     TEXT,
      description TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_deps_guild ON departments(guild_id);

    CREATE TABLE IF NOT EXISTS shifts (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id   TEXT NOT NULL,
      user_id    TEXT NOT NULL,
      department TEXT,
      start_time TEXT NOT NULL,
      end_time   TEXT,
      duration   INTEGER
    );
    CREATE INDEX IF NOT EXISTS idx_shifts_user ON shifts(guild_id, user_id);

    CREATE TABLE IF NOT EXISTS events (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id   TEXT NOT NULL,
      name       TEXT NOT NULL,
      type       TEXT,
      host_id    TEXT,
      date       TEXT,
      status     TEXT DEFAULT 'SCHEDULED',
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_events_guild ON events(guild_id);

    CREATE TABLE IF NOT EXISTS attendance (
      id       INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL,
      user_id  TEXT NOT NULL,
      attended INTEGER DEFAULT 0,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_att_event ON attendance(event_id);

    CREATE TABLE IF NOT EXISTS logs (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id  TEXT NOT NULL,
      type      TEXT NOT NULL,
      data      TEXT,
      timestamp TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_logs_guild ON logs(guild_id, type);

    CREATE TABLE IF NOT EXISTS callsigns (
      guild_id   TEXT NOT NULL,
      user_id    TEXT NOT NULL,
      callsign   TEXT,
      department TEXT,
      PRIMARY KEY (guild_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS personnel (
      guild_id   TEXT NOT NULL,
      user_id    TEXT NOT NULL,
      name       TEXT,
      callsign   TEXT,
      department TEXT,
      join_date  TEXT,
      status     TEXT DEFAULT 'ACTIVE',
      notes      TEXT,
      PRIMARY KEY (guild_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS automod_config (
      guild_id TEXT PRIMARY KEY,
      settings TEXT
    );

    CREATE TABLE IF NOT EXISTS point_transactions (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      user_id  TEXT NOT NULL,
      amount   INTEGER NOT NULL,
      reason   TEXT,
      by_id    TEXT,
      timestamp TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_points_user ON point_transactions(guild_id, user_id);

    CREATE TABLE IF NOT EXISTS cooldowns (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT,
      user_id  TEXT,
      command  TEXT,
      expires  INTEGER
    );
  `);
}

export default initSchema;

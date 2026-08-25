# Settings

Server-specific settings (logs, welcome, tickets, automod, recruitment, roleplay,
departments, permissions) are managed at runtime through the **`/config`** command
(see `src/commands/administration/config.js`) and persisted in the SQLite database
under the `settings` table.

This folder is reserved for future settings commands. No hard-coded IDs are required
elsewhere in the codebase — everything is configurable via `/config`.

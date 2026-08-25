# ORGVNUM — Discord Bot

A professional, production-quality, all-in-one Discord bot for the **ORGVNUM** community.
It combines **Moderation + Administration + Recruitment + Tickets + Applications + Personnel + Roleplay + Training + Events + Logging + Utilities** into a single, modular, custom-built platform.

> Built with **Node.js**, **Discord.js v14**, and **SQLite (better-sqlite3)**.

---

## Table of Contents

1. [Features](#features)
2. [Requirements](#requirements)
3. [Installation](#installation)
4. [Environment Variables](#environment-variables)
5. [Inviting the Bot](#inviting-the-bot)
6. [Server Configuration](#server-configuration)
7. [Starting the Bot](#starting-the-bot)
8. [Command Reference](#command-reference)
9. [Troubleshooting](#troubleshooting)
10. [Deployment / Hosting](#deployment--hosting)
11. [Security](#security)
12. [Project Structure](#project-structure)
13. [License](#license)

---

## Features

- **Moderation** — `warn`, `unwarn`, `warnings`, `clearwarnings`, `mute`, `unmute`, `timeout`, `untimeout`, `kick`, `ban`, `unban`, `softban`, `purge`, `slowmode`, `lock`, `unlock`, `lockdown`, `unlockdown`, `nickname`. Warnings are a counter/history system — **no automatic punishment escalation**.
- **Auto Moderation** — spam, mention-spam, caps, duplicate messages, link/invite/keyword filtering, flood & raid protection, account-age & suspicious-join detection. Fully configurable. Calm by default.
- **Audit & Logging** — every important action (warnings, mutes, kicks, bans, joins/leaves, role/nickname changes, ticket & application events) is written to a configurable staff log channel with professional embeds and unique case numbers.
- **Ticket System** — button/select panel, 9 ticket types, claim/lock/close, transcript generation, add/remove members, rename.
- **Recruitment & Applications** — apply, review, accept/deny/waitlist/interview/request-info, reviewer notes, persistent application records.
- **ORGVNUM Placement Waitlist** — Roblox/Discord username, age, timezone, activity, experience, desired role, skills, availability. Staff promote/status tools.
- **Roleplay / Personnel** — `personnel`, `profile`, `status`, callsign assignment, configurable departments.
- **Roleplay Scenes** — `scene`, `dispatch`, `alert`, `announcement`.
- **Training / Events** — create/start/end/cancel/roster, attendance tracking.
- **Shift System** — start/end/status/leaderboard with department tagging.
- **Economy / Points** — `balance`, `points`, `leaderboard`. **No gambling.** Optional & configurable.
- **Welcome / Leave** — welcome messages, default role, leave tracking with department history.
- **Administration** — `config` for welcome/logs/tickets/automod/recruitment/roleplay/departments/permissions. All IDs stored in SQLite.
- **Utilities** — `avatar`, `banner`, `userinfo`, `serverinfo`, `roleinfo`, `ping`, `botinfo`, interactive `help`.
- **Owner-only** — `reload`, `sync`, `database`, `debug`, `config`.
- **Case Numbers** — unique, zero-padded, retrievable via `/case`.

---

## Requirements

- **Node.js v18.0.0 or newer** (Node 20+ recommended)
- A Discord application with a bot account (and its token)
- `npm` (bundled with Node.js)
- A C++ toolchain for compiling `better-sqlite3` (on most systems this is preinstalled; see Troubleshooting)

### Installing Node.js

Download the LTS installer for your platform: <https://nodejs.org/>

Verify:
```bash
node --version   # v18.x or newer
npm --version
```

---

## Installation

```bash
# 1. Clone the repository
git clone https://github.com/worldguystudio-prog/BOT.git ORGVNUM
cd ORGVNUM

# 2. Install dependencies
npm install
```

If `better-sqlite3` fails to compile, install build tools:
- **Windows:** run "Visual Studio Build Tools" with the "Desktop development with C++" workload.
- **macOS:** `xcode-select --install`
- **Linux (Debian/Ubuntu):** `sudo apt-get install build-essential python3`

---

## Environment Variables

Copy the example file and fill in your values:
```bash
cp .env.example .env
```

```env
DISCORD_TOKEN=your-bot-token-here
GUILD_ID=your-guild-id-here
OWNER_ID=your-discord-user-id-here
```

| Variable        | Required | Description                                                       |
|-----------------|----------|-------------------------------------------------------------------|
| `DISCORD_TOKEN` | ✅       | The bot token from the Discord Developer Portal.                  |
| `GUILD_ID`      | ✅       | The main ORGVNUM guild ID (used for slash-command sync & defaults).|
| `OWNER_ID`      | ✅       | Your Discord user ID (full bot owner). Multiple IDs via comma in `CO_OWNERS`. |
| `CO_OWNERS`     | ⛔       | Optional, comma-separated additional owner IDs.                   |
| `DB_NAME`       | ⛔       | SQLite file name (default: `orgvnum.db`).                         |

> ⚠️ Never commit `.env`. It is git-ignored by default.

---

## Inviting the Bot

1. Go to the **[Discord Developer Portal](https://discord.com/developers/applications)** → your application → **OAuth2 → URL Generator**.
2. Scopes: `bot`, `applications.commands`.
3. Bot Permissions (recommended): `Administrator` (or scope to: Manage Roles, Manage Channels, Kick Members, Ban Members, Manage Messages, View Audit Log, Send Messages, Embed Links, Manage Threads, Read Message History, Add Reactions, Use External Emojis, Moderate Members).
4. Open the generated URL and authorize the bot into ORGVNUM.

---

## Server Configuration

All server-specific IDs (log channel, ticket category, staff/moderator/directorate roles, etc.) are stored in the SQLite database and managed with `/config`. You do **not** need to edit code.

Start by setting the essentials:
```
/config logs        # set the moderation / audit log channel
/config welcome     # set welcome channel + default role
/config tickets     # set ticket category + staff roles
/config permissions # map role IDs to permission levels
/config departments # add/remove departments
/config automod     # configure auto-moderation
/config roleplay    # configure roleplay departments
```

Use `/config` (no subcommand) to view the current configuration.

---

## Starting the Bot

```bash
npm start
```

For development with auto-restart on file change:
```bash
npm run dev
```

On first start the bot will:
- Initialize the SQLite database (`data/orgvnum.db`) and create all tables.
- Register slash commands globally (and immediately for the configured `GUILD_ID`).

> It can take up to 1 hour for global commands to appear. Guild commands appear within seconds.

---

## Command Reference

### Moderation
`/warn` `/unwarn` `/warnings` `/clearwarnings` `/mute` `/unmute` `/timeout` `/untimeout` `/kick` `/ban` `/unban` `/softban` `/purge` `/slowmode` `/lock` `/unlock` `/lockdown` `/unlockdown` `/nickname` `/case`

### Auto Moderation
`/automod enable` `/automod disable` `/automod settings`

### Tickets
`/ticket-panel` `/closeticket` `/adduser` `/removeuser` `/claim` `/unclaim` `/rename` `/lockticket` `/unlockticket`

### Recruitment & Applications
`/apply` `/applications` `/application` `/accept` `/deny` `/waitlist` `/interview` `/request-info`

### Waitlist
`/waitlist add` `/waitlist remove` `/waitlist view` `/waitlist promote` `/waitlist status`

### Roleplay / Personnel
`/personnel` `/profile` `/status` `/callsign set` `/callsign remove` `/scene` `/dispatch` `/alert` `/announcement`

### Training / Events
`/training create` `/training start` `/training end` `/training cancel` `/training roster`

### Shifts
`/shift start` `/shift end` `/shift status` `/shift leaderboard`

### Economy
`/balance` `/points` `/leaderboard`

### Utilities
`/avatar` `/banner` `/userinfo` `/serverinfo` `/roleinfo` `/ping` `/botinfo` `/help`

### Administration / Owner
`/config` `/reload` `/sync` `/database` `/debug`

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `Cannot find module 'better-sqlite3'` | Run `npm install`. Ensure build tools are installed (see Installation). |
| `Used disallowed intents` | Enable **Server Members Intent** and **Message Content Intent** in the Developer Portal → Bot. |
| Slash commands not showing | Use `/sync` (owner-only) or wait up to 1 hour for global sync. Make sure the bot was invited with `applications.commands` scope. |
| `Missing Permissions` errors | Move the bot's role **above** the roles it must manage, and give it the required permissions. |
| Bot won't start | Check `.env` exists and has `DISCORD_TOKEN`, `GUILD_ID`, `OWNER_ID`. Check logs in console. |
| Database locked | Ensure only one bot instance is running. |
| Commands work but no logs appear | Set the log channel with `/config logs`. |

---

## Deployment / Hosting

ORGVNUM runs on any Node.js host:

1. **VPS / Dedicated** — clone the repo, `npm install`, `cp .env.example .env`, fill `.env`, then run with a process manager:
   ```bash
   npm install -g pm2
   pm2 start index.js --name orgvnum-bot
   pm2 save && pm2 startup
   ```
2. **Containers (Docker)** — build a minimal image from `node:20-bookworm-slim`, copy the project, `npm ci`, and run `node index.js`. Persist the `data/` folder.
3. **PaaS (Railway / Render / Fly.io)** — set the start command `node index.js`, expose no ports (Discord uses a gateway, not HTTP), and mount a persistent volume at `data/`.

> Make sure the host has a C++ toolchain for `better-sqlite3`, or use a Node image that includes one (e.g. `node:20-bookworm`).

---

## Security

- The bot token is **only** read from `process.env.DISCORD_TOKEN`. It is never logged, never stored in the database, and never committed.
- `.env` is in `.gitignore`.
- All privileged commands perform server-side permission checks.
- No shell/eval/exec is exposed through Discord.
- Role-hierarchy errors are handled gracefully — the bot will never assign a role above its own.

> **If you ever accidentally leak your token**, revoke it immediately at <https://discord.com/developers/applications> → your app → **Bot → Reset Token**.

---

## Project Structure

```
ORGVNUM/
├── index.js                  # Entry point
├── package.json
├── .env.example
├── .gitignore
├── README.md
├── src/
│   ├── config/config.js       # Centralized configuration
│   ├── database/              # SQLite connection, schema, helpers
│   ├── utils/                 # embeds, permissions, checks, logger, errors
│   ├── systems/               # Core logic modules
│   ├── events/                # Discord gateway event handlers
│   └── commands/              # Slash commands (modular, per category)
└── data/                      # SQLite database (runtime, git-ignored)
```

---

## License

MIT © ORGVNUM. See `LICENSE` for details.

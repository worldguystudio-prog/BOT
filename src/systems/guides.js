/**
 * ORGVNUM — Guide embed definitions.
 *
 * Each guide is a function returning an array of EmbedBuilder objects.
 * Posters split content across multiple embeds for readability.
 */
import { EmbedBuilder, time, TimestampStyles } from 'discord.js';
import { config } from '../config/config.js';

const BRAND = config.brand;

/** Helper: create a branded embed with the ORGVNUM style. */
function embed(title, description = null, color = BRAND.colors.primary, fields = []) {
  const e = new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setFooter({ text: BRAND.footer })
    .setTimestamp();
  if (description) e.setDescription(description);
  if (fields.length) e.addFields(fields);
  return e;
}

export const GUIDES = {
  overview: () => [
    embed(
      'ORGVNUM — Staff Guides Overview',
      `**Welcome to the ORGVNUM staff team.**\n\nThis bot has a dedicated guide for every role. Pick the one that matches your position and read it — each one takes about 5 minutes and tells you exactly what you can do, what you can't, and how to use the bot to do your job.`,
      BRAND.colors.primary,
      [
        { name: '📊 Available Guides', value: [
          '• **Owner & Administrators** — dashboard, config, sync, database',
          '• **Directorate Command** — announcements + oversight',
          '• **Moderators** — warnings, mutes, kicks, bans, cases',
          '• **Recruiters** — applications, waitlist, interviews',
          '• **Trainers** — events, attendance, points',
          '• **Staff (General)** — tickets, shifts, everyday tools',
          '• **Tickets & Support** — full ticket lifecycle',
          '• **Roleplay & Personnel** — profiles, callsigns, dispatch',
          '• **Shifts & Activity** — clock in/out, leaderboard',
          '• **Economy & Points** — award points, balances',
        ].join('\n'), inline: false },
        { name: '📍 How to Use', value: 'Run `/post-guide` (owner only) to post any guide into a channel. Each guide is formatted as branded embeds — no wall of text. Staff can read it in seconds.', inline: false },
      ],
    ),
  ],

  owner: () => [
    embed(
      '🛡️ Owner & Administrators — Level 90–100',
      `**You own the server or you're a full administrator.** This guide covers the high-level tools only you can use.`,
      BRAND.colors.error,
      [
        { name: '🎛️ The Dashboard', value: 'Run `/dashboard` to open an interactive panel. Configure every channel, role, and system by clicking through menus. Nobody below Administrator can use this.', inline: false },
        { name: '⚙️ /config (alternative)', value: [
          'Same settings as the dashboard, via typed subcommands:',
          '`/config welcome channel #welcome`',
          '`/config logs moderation #mod-log`',
          '`/config tickets category #support`',
          '`/config roles muted @Muted`',
          '`/config departments add "Operations" @Operations`',
          '`/config view` — see everything at once',
        ].join('\n'), inline: false },
        { name: '🔐 Permissions Mapping', value: [
          'Map Discord roles to ORGVNUM permission levels:',
          '`/config permissions role:@Moderator level:60`',
          '`/config permissions role:@Admin level:90`',
          '',
          '**Levels:** Owner 100 · Admin 90 · Directorate 80 · Dept 70 · Mod 60 · Recruiter 50 · Trainer 40 · Staff 30 · Member 10',
        ].join('\n'), inline: false },
      ],
    ),
    embed(
      '🛡️ Owner & Admin — Commands',
      null,
      BRAND.colors.error,
      [
        { name: '💬 /say', value: 'Posts a message as the bot in any channel. Supports plain text or branded embeds.\n`/say channel:#general message:Welcome!`', inline: false },
        { name: '🎫 /ticket-panel', value: 'Posts the ticket panel (with the type dropdown) in a channel.', inline: false },
        { name: '📝 /application-panel', value: 'Posts the application buttons panel.', inline: false },
        { name: '🔒 /lockdown & /unlockdown', value: 'Locks/unlocks every text channel. Emergency use only.', inline: false },
        { name: '🗑️ /clearwarnings', value: 'Wipes ALL active warnings for a member. Use carefully.', inline: false },
        { name: '🔧 Owner-Only', value: [
          '`/reload` — reload commands without restarting',
          '`/sync` — re-register slash commands + clear duplicates',
          '`/database stats` — table row counts',
          '`/database backup` — create a .db backup',
          '`/debug` — diagnostic info',
        ].join('\n'), inline: false },
      ],
    ),
    embed(
      '🛡️ Owner & Admin — Setup Checklist',
      `Run this once to fully configure the bot:`,
      BRAND.colors.error,
      [
        { name: '✅ Quick Setup', value: [
          '1. `/dashboard` → map your roles to permission levels',
          '2. `/dashboard` → set the main mod-log channel',
          '3. `/dashboard` → set welcome channel + default role',
          '4. `/dashboard` → set ticket category, staff role',
          '5. `/dashboard` → set application review channel + recruiter role',
          '6. `/ticket-panel channel:#support`',
          '7. `/application-panel channel:#applications`',
          '',
          'Done. The bot is fully configured.',
        ].join('\n'), inline: false },
        { name: '⚠️ Persistence Note', value: 'Settings save to SQLite automatically. On Railway, add a persistent volume mounted at `/app/data` so the database survives restarts. Set `DATA_DIR=/app/data` as an env var if needed.', inline: false },
      ],
    ),
  ],

  directorate: () => [
    embed(
      '⭐ Directorate Command — Level 80',
      `**You're senior command.** Directorate sits above moderators and department heads, below only administrators and the owner. You set the tone, post the big announcements, and have oversight over the whole operation.`,
      BRAND.colors.warning,
      [
        { name: '📣 /announcement', value: 'Posts a branded announcement that pings @everyone by default.\n`/announcement title:Weekly Brief body:New protocols in effect Monday.`\n`/announcement title:Update body:... mention_everyone:false`', inline: false },
        { name: '⚡ You Also Have', value: [
          '• All **moderation** commands (warn, mute, kick, ban, etc.)',
          '• `/training create/start/end/roster`',
          '• `/shift start/end/status/leaderboard`',
          '• `/points` — award points',
          '• `/dispatch` `/scene` `/alert` `/callsign`',
          '• All ticket, application, and waitlist management',
        ].join('\n'), inline: false },
        { name: '🚫 What You Cannot Do', value: [
          '• `/dashboard` / `/config` — admin only',
          '• `/ticket-panel` / `/application-panel` — admin only',
          '• `/automod enable/disable` — admin only',
          '• `/lockdown` / `/unlockdown` — admin only',
          '• `/clearwarnings` — admin only',
          '• `/reload` / `/sync` / `/database` / `/debug` — owner only',
        ].join('\n'), inline: false },
      ],
    ),
    embed(
      '⭐ Directorate — Tips',
      null,
      BRAND.colors.warning,
      [
        { name: '💡 Best Practices', value: [
          '• Don\'t overuse `/announcement` with @everyone. Save it for the important stuff.',
          '• Use `/alert` for quick broadcasts that ping @here (less disruptive).',
          '• Every action you take is logged with your name. Be deliberate.',
          '• When you moderate someone, they get a DM automatically — no need to message separately.',
        ].join('\n'), inline: false },
        { name: '🎯 Your Signature Move', value: '`/announcement title:... body:...`\nThat\'s the big one. Use it well.', inline: false },
      ],
    ),
  ],

  moderators: () => [
    embed(
      '🛡️ Moderators — Level 60',
      `**You're on the mod team.** Your job is keeping the server orderly — warning rule-breakers, removing troublemakers, and keeping a clean record of every action.`,
      BRAND.colors.primary,
      [
        { name: '⚠️ Warnings (the bread & butter)', value: [
          'Warnings are a counter/history system. They do NOT auto-punish.',
          '',
          '`/warn user:@someone reason:Disruptive behavior`',
          '`/unwarn warning_id:WARN-000123`',
          '`/warnings user:@someone`',
          '`/clearwarnings user:@someone` ← admin only',
          '',
          'When you warn: saved to DB · user gets a DM · logged to mod-log.',
        ].join('\n'), inline: false },
        { name: '🔇 Mutes & Timeouts', value: [
          '`/mute user:@someone reason:Spamming duration:10m`',
          '`/unmute user:@someone`',
          '`/timeout user:@someone duration:30m reason:Disruptive`',
          '`/untimeout user:@someone`',
          '',
          '`/mute` uses a Muted role (admin sets it). `/timeout` uses Discord native (no role, max 28d).',
        ].join('\n'), inline: false },
      ],
    ),
    embed(
      '🛡️ Moderators — Removal & Cleanup',
      null,
      BRAND.colors.primary,
      [
        { name: '👢 Kick / Ban / Softban', value: [
          '`/kick user:@someone reason:Rule violation`',
          '`/ban user:<id or @mention> reason:Toxic delete_days:7`',
          '`/unban user:<id> reason:Appeal approved`',
          '`/softban user:@someone reason:Cleanup`',
          '',
          '`/softban` bans then immediately unbans — clears recent messages without a permanent ban.',
        ].join('\n'), inline: false },
        { name: '🧹 Purge & Slowmode', value: [
          '`/purge amount:50`',
          '`/purge amount:50 user:@spammer`',
          '`/slowmode seconds:30`',
        ].join('\n'), inline: false },
        { name: '🔒 Locks', value: [
          '`/lock` — members can\'t send messages in this channel',
          '`/unlock` — restores it',
          '`/lockdown` / `/unlockdown` ← admin only (server-wide)',
        ].join('\n'), inline: false },
        { name: '📛 /nickname', value: '`/nickname user:@someone nickname:NewNick`', inline: false },
        { name: '📁 /case', value: 'Look up any moderation case by number:\n`/case 000123`', inline: false },
      ],
    ),
    embed(
      '🛡️ Moderators — How to Handle Situations',
      null,
      BRAND.colors.primary,
      [
        { name: '🚨 Common Scenarios', value: [
          '**Someone\'s spamming?** → `/timeout user:@spammer duration:10m reason:Spamming` then `/purge amount:20 user:@spammer`',
          '**First offense, toxic?** → `/warn user:@someone reason:Toxic behavior in #general`',
          '**Repeat offender?** → `/timeout` then `/kick` or `/ban` if it continues',
          '**Channel getting raided?** → `/lock` the affected channels, tell an admin',
          '**Someone appeals a warning?** → `/case 000123` to review, `/unwarn` if you agree',
        ].join('\n'), inline: false },
        { name: '🏅 Golden Rules', value: [
          '1. **ALWAYS include a clear reason.** It goes to the user AND the log.',
          '2. **Escalate gradually:** warn → timeout → kick → ban.',
          '3. **Every action is logged with your name.** Be deliberate.',
          '4. **If unsure, ask** in your staff channel before acting.',
          '5. **Don\'t moderate in anger.** Step away if you need to.',
        ].join('\n'), inline: false },
        { name: '⭐ Most-Used Commands', value: '`/warn` `/warnings` `/timeout` `/purge` `/case`', inline: false },
      ],
    ),
  ],

  recruiters: () => [
    embed(
      '📋 Recruiters — Level 50',
      `**You're on the recruitment team.** Your job is handling applications, running the placement waitlist, and bringing new members into ORGVNUM.`,
      BRAND.colors.accent,
      [
        { name: '📝 The Application Flow', value: [
          '1. Admin posts the panel: `/application-panel channel:#applications`',
          '2. Members see buttons: [Recruitment] [Placement] [Staff] [Leadership]',
          '3. They click → a form pops up (username, age, timezone, experience, why ORGVNUM)',
          '4. On submit: saved with a unique ID (#0001, #0002…) + review panel posted to your review channel + applicant gets a hidden confirmation',
          '5. You review it and decide.',
        ].join('\n'), inline: false },
        { name: '👀 Viewing Applications', value: [
          '`/applications` — list recent',
          '`/applications status:PENDING` — filter by status',
          '`/application id:0042` — view one + review buttons',
          '',
          '**Statuses:** PENDING → UNDER REVIEW → INTERVIEW → ACCEPTED / DENIED / WAITLISTED / CLOSED',
        ].join('\n'), inline: false },
      ],
    ),
    embed(
      '📋 Recruiters — Decisions & Waitlist',
      null,
      BRAND.colors.accent,
      [
        { name: '✅ Making Decisions', value: [
          'Use buttons on the review panel OR commands:',
          '`/accept id:0042 notes:Great fit, welcome`',
          '`/deny id:0042 notes:Reapply in 30 days`',
          '`/interview id:0042` — moves to INTERVIEW status',
          '',
          'Applicant gets a DM automatically with the new status.',
        ].join('\n'), inline: false },
        { name: '📍 Placement Waitlist', value: [
          'Members join: `/waitlist add` (opens a form)',
          '',
          '**Staff management:**',
          '`/waitlist view` — list all entries',
          '`/waitlist view status:PENDING REVIEW`',
          '`/waitlist status user:@someone`',
          '`/waitlist promote id:5`',
          '`/waitlist remove id:5`',
          '',
          'Statuses: PENDING REVIEW → PROMOTED / REJECTED / CLOSED',
          'We NEVER auto-accept. You review and decide.',
        ].join('\n'), inline: false },
        { name: '🎤 Interviews', value: 'No built-in calendar. `/interview` moves them to INTERVIEW status — then DM them to schedule. Conduct in voice or DM, then `/accept` or `/deny`.', inline: false },
      ],
    ),
    embed(
      '📋 Recruiters — Tips',
      null,
      BRAND.colors.accent,
      [
        { name: '💡 Best Practices', value: [
          '• Be responsive — review new submissions within 24-48h.',
          '• Be clear in denial notes. "Reapply in 30 days with more RP experience" beats "denied."',
          '• Don\'t accept everyone to boost numbers. Quality > quantity.',
          '• Watch for applicants who submit multiple times after denial. Check `/applications` first.',
        ].join('\n'), inline: false },
        { name: '⭐ Your Daily Workflow', value: [
          '`/applications status:PENDING` in the morning → work through them → done.',
          '',
          'That\'s your to-do list. Keep it clear.',
        ].join('\n'), inline: false },
        { name: '🚫 What You Cannot Do', value: '`/application-panel` (admin only) · `/dashboard` / `/config` (admin only) · Moderation commands (that\'s moderators)', inline: false },
      ],
    ),
  ],

  trainers: () => [
    embed(
      '📅 Trainers — Level 40',
      `**You're on the training team.** Your job is creating and running training sessions, operations, patrols, ceremonies, interviews, and recruitment events — and tracking who showed up.`,
      BRAND.colors.info,
      [
        { name: '🎯 The Training Flow', value: [
          '1. `/training create` — create the event',
          '2. `/training start` — mark IN PROGRESS when it begins',
          '3. `/training roster` — mark attendance as people show up',
          '4. `/training end` — mark COMPLETED when done',
          '5. `/points` — award points to attendees',
        ].join('\n'), inline: false },
        { name: '➕ Creating Events', value: [
          '`/training create name:Basic Training type:Training date:"tomorrow 8pm"`',
          '`/training create name:Operation Blackout type:Operation date:"Friday 9pm"`',
          '`/training create name:Patrol Sector 4 type:Patrol`',
          '',
          '**Types:** Training · Operation · Patrol · Ceremony · Interview · Recruitment Event',
          '',
          'You get an Event ID (#1, #2, #3…) — note it for the other commands.',
        ].join('\n'), inline: false },
      ],
    ),
    embed(
      '📅 Trainers — Running & Tracking',
      null,
      BRAND.colors.info,
      [
        { name: '▶️ Running the Event', value: [
          '`/training start id:1` — mark IN PROGRESS',
          '`/training end id:1` — mark COMPLETED',
          '`/training cancel id:1` — mark CANCELLED (if it didn\'t happen)',
        ].join('\n'), inline: false },
        { name: '✅ Attendance', value: [
          '`/training roster id:1` — view the roster',
          '`/training roster id:1 user:@someone` — mark someone as attended',
          '',
          'You can mark attendance any time after the event ends — the roster stays open.',
        ].join('\n'), inline: false },
        { name: '💰 Awarding Points', value: [
          '`/points user:@someone amount:10 reason:Attended Basic Training #1`',
          '',
          'Be consistent — if training always = 10 pts, stick with that. Don\'t play favorites.',
        ].join('\n'), inline: false },
        { name: '⏱️ Shifts', value: 'When running a training, you\'re on the clock:\n`/shift start department:Training` → `/shift end`', inline: false },
      ],
    ),
    embed(
      '📅 Trainers — Tips',
      null,
      BRAND.colors.info,
      [
        { name: '💡 Best Practices', value: [
          '• Create events ahead of time so people can see them coming.',
          '• Mark attendance immediately after the event ends.',
          '• If you cancel, use `/training cancel` — don\'t leave it in SCHEDULED forever.',
          '• Award points consistently. Same reward for same effort.',
        ].join('\n'), inline: false },
        { name: '⭐ Most-Used Commands', value: '`/training create` `/training start` `/training roster` `/training end` `/points`', inline: false },
      ],
    ),
  ],

  staff: () => [
    embed(
      '🎫 Staff (General) — Level 30',
      `**You're on the staff team.** This guide covers the everyday tools every staff member uses — tickets, shifts, and the utility commands you'll reach for constantly.`,
      BRAND.colors.info,
      [
        { name: '🎫 Tickets (your main job)', value: [
          'Most staff work happens in tickets. Members open them for help, appeals, reports.',
          '',
          '**Managing tickets:**',
          '`/claim` — take ownership of the current ticket',
          '`/unclaim` — release your claim',
          '`/adduser user:@someone` — add a specialist',
          '`/removeuser user:@someone` — remove someone',
          '`/rename name:new-name`',
          '`/lockticket` — stop the requester from sending messages',
          '`/unlockticket`',
          '`/closeticket` — transcript + close + delete channel',
          '',
          'The buttons on the ticket message do the same things.',
        ].join('\n'), inline: false },
        { name: '⏱️ Shifts', value: [
          '`/shift start department:Support`',
          '`/shift end`',
          '`/shift status` — see how long you\'ve been on shift',
          '`/shift leaderboard`',
          '',
          'Start a shift when you come online, end it when you leave. It\'s how we track activity.',
        ].join('\n'), inline: false },
      ],
    ),
    embed(
      '🎫 Staff — Utilities & Daily Routine',
      null,
      BRAND.colors.info,
      [
        { name: '🧰 Everyday Tools', value: [
          '`/ping` — is the bot alive?',
          '`/userinfo user:@someone` — member info',
          '`/serverinfo` — server stats',
          '`/roleinfo role:@Staff` — role details',
          '`/avatar` `/banner` — view avatars/banners',
          '`/botinfo` — bot version, uptime',
          '`/help` — interactive command browser',
        ].join('\n'), inline: false },
        { name: '🎭 Roleplay Basics', value: [
          '`/profile` — view your personnel file',
          '`/status set:Active` — Active/On Leave/LOA/Inactive',
          'If you\'re assigned to a department, your callsign shows on your profile.',
        ].join('\n'), inline: false },
        { name: '🗓️ Your Daily Routine', value: [
          '1. Come online',
          '2. `/shift start department:Support`',
          '3. Check the ticket category for open tickets',
          '4. Claim one, handle it, close it',
          '5. Repeat',
          '6. `/shift end` before you leave',
          '',
          'Simple. Effective. Keep the queue clear.',
        ].join('\n'), inline: false },
        { name: '🚫 What You Cannot Do', value: 'Moderation (warn/mute/kick/ban) — that\'s moderators · Application decisions — that\'s recruiters · Creating training events — that\'s trainers · `/dashboard` / `/config` — admin only', inline: false },
        { name: '⭐ Most-Used', value: '`/claim` `/closeticket` `/shift start` `/shift end` `/profile` `/ping`', inline: false },
      ],
    ),
  ],

  tickets: () => [
    embed(
      '🎫 Tickets & Support — Full Guide',
      `**For anyone working the ticket queue.** This covers the full lifecycle, the gotchas, and how to handle tricky situations.`,
      BRAND.colors.accent,
      [
        { name: '📋 Ticket Types', value: [
          '🎫 General Support · ⚖️ Moderation Appeal · 📋 Recruitment',
          '📍 Placement Application · 📝 Staff Application',
          '🤝 Partnership · 🚨 Report a User · 🎭 Roleplay Support · 💬 Other',
          '',
          'Each type can have its own staff roles assigned (via `/dashboard` → Tickets).',
        ].join('\n'), inline: false },
        { name: '🔄 The Lifecycle', value: [
          '**OPEN** → member + staff can send messages',
          '**CLAIMED** → one staff "owns" it; others can still participate',
          '**LOCKED** → member can\'t send messages; staff still can',
          '**CLOSED** → transcript generated, posted, channel deleted',
        ].join('\n'), inline: false },
        { name: '🛠️ The Commands', value: [
          '`/claim` `/unclaim`',
          '`/adduser user:@someone` `/removeuser user:@someone`',
          '`/rename name:new-name`',
          '`/lockticket` `/unlockticket`',
          '`/closeticket`',
          '',
          'Or use the buttons: [🙋 Claim] [🔒 Close] [⛔ Lock] [✏️ Rename]',
        ].join('\n'), inline: false },
      ],
    ),
    embed(
      '🎫 Tickets — When To Do What',
      null,
      BRAND.colors.accent,
      [
        { name: '🙋 When to Claim', value: '• Claim as soon as you start working it.\n• It tells other staff "I\'ve got this" so they don\'t pile in.\n• If you can\'t finish, `/unclaim` so someone else can.', inline: false },
        { name: '🔒 When to Lock', value: '• Member is spamming or abusive\n• Ticket is waiting on staff discussion and member keeps interrupting\n• You\'ve made a decision and are about to close (lock first so they can\'t sneak in a last message)\n\nLocking is reversible — `/unlockticket` when ready.', inline: false },
        { name: '✅ When to Close', value: '• Issue is resolved\n• Member stopped responding (give a 24h heads-up first)\n• Opened by mistake or duplicate\n\nAlways summarize the outcome before closing. The transcript captures everything, but a clean summary helps reviewers.', inline: false },
        { name: '➕➖ Add/Remove Users', value: '`/adduser` — bring in a specialist (developer, translator)\n`/removeuser` — remove someone no longer needed\n\nThe member who opened the ticket can\'t be removed.', inline: false },
      ],
    ),
    embed(
      '🎫 Tickets — Handling Special Cases',
      null,
      BRAND.colors.accent,
      [
        { name: '⚖️ Moderation Appeals', value: [
          '1. Read the original case: `/case 000123`',
          '2. Look up history: `/warnings user:@someone`',
          '3. Decide: uphold or overturn?',
          '4. If overturning: `/unwarn` or `/unban`',
          '5. Explain the decision in the ticket',
          '6. Close the ticket',
          '',
          'Don\'t argue in the ticket. If denied, say so clearly, close, move on.',
        ].join('\n'), inline: false },
        { name: '🚨 Report a User', value: [
          '1. Get details: who, what, when, evidence',
          '2. Pull up reported user: `/warnings user:@reported`',
          '3. Decide: warn / timeout / kick / ban / no action',
          '4. Take the action',
          '5. Tell the reporter "action taken" (don\'t share exact punishment)',
          '6. Close the ticket',
        ].join('\n'), inline: false },
        { name: '📄 Transcripts', value: 'When a ticket closes, the bot:\n• Collects every message (up to ~5000)\n• Formats as a text file: [timestamp] author: message\n• Posts to the transcript channel\n• Saves to the database\n\nUseful for: reviewing handling, appeals evidence, training new staff.', inline: false },
        { name: '⚠️ Gotchas', value: [
          '• `/closeticket` only works in actual ticket channels.',
          '• If the panel doesn\'t work, admin needs to set ticket category + staff role.',
          '• If transcripts aren\'t posting, admin needs to set transcript channel.',
          '• You can\'t `/adduser` someone who isn\'t in the server.',
        ].join('\n'), inline: false },
        { name: '🏅 Golden Rules', value: '1. Claim before you work.\n2. Acknowledge quickly, even without an answer yet.\n3. Be clear and patient.\n4. Summarize before you close.\n5. Close when done — don\'t leave tickets hanging.', inline: false },
      ],
    ),
  ],

  roleplay: () => [
    embed(
      '🎭 Roleplay & Personnel — Guide',
      `**For roleplay staff and personnel managers.** You handle personnel files, callsigns, departments, dispatch calls, scenes, and alerts.`,
      BRAND.colors.primary,
      [
        { name: '👤 Personnel Files', value: [
          'Every member can have a personnel file: Name, Callsign, Department, Join Date, Status, Notes',
          '',
          '`/profile` — your own file',
          '`/profile user:@someone` — someone else\'s (any member can use)',
          '`/personnel user:@someone` — staff view',
          '',
          'Files are created automatically when a callsign or department is assigned.',
        ].join('\n'), inline: false },
        { name: '🔄 Status', value: [
          '`/status set:Active` — options: Active, On Leave, Inactive, LOA',
          '`/status` — view your current status',
          '',
          'Mark yourself On Leave when you\'ll be away.',
        ].join('\n'), inline: false },
        { name: '🏷️ Callsigns', value: [
          '`/callsign set user:@someone callsign:ORV-04 department:Operations`',
          '`/callsign remove user:@someone`',
          '',
          'Callsigns show on the personnel profile. Required for active RP personnel.',
        ].join('\n'), inline: false },
      ],
    ),
    embed(
      '🎭 Roleplay — Dispatch, Scenes, Alerts',
      null,
      BRAND.colors.primary,
      [
        { name: '🚨 /dispatch', value: [
          '`/dispatch location:Sector 04 situation:Unauthorized activity units:Alpha Squad`',
          '',
          'Posts a branded dispatch embed. Units are advised to proceed per RP procedures. This is your "call to action" command.',
        ].join('\n'), inline: false },
        { name: '🎬 /scene', value: [
          '`/scene name:Bank Heist description:"Armed robbery in progress" participants:@user1 @user2`',
          '',
          'Opens a roleplay scene and tags the participants. Use to kick off coordinated RP.',
        ].join('\n'), inline: false },
        { name: '📢 /alert', value: [
          '`/alert message:All units stand down level:warning`',
          '',
          '**Levels:** info (charcoal) · warning (gold) · danger (red)\nPings @here. Use sparingly — only when you need attention right now.',
        ].join('\n'), inline: false },
        { name: '📣 /announcement', value: 'Directorate and above only. Pings @everyone. Use `/alert` instead for staff broadcasts.', inline: false },
      ],
    ),
    embed(
      '🎭 Roleplay — Departments & Tips',
      null,
      BRAND.colors.primary,
      [
        { name: '🏢 Departments', value: [
          'Admins configure them: `/config departments add "Operations" @Operations`',
          '`/config departments list`',
          '`/config departments remove "Operations"`',
          '',
          'Typical departments: Operations, Security, Internal Affairs, Administration, Recruitment, Training, Command',
          '',
          'Once a department exists, assign personnel: `/callsign set user:@someone callsign:ORV-04 department:Operations`',
        ].join('\n'), inline: false },
        { name: '💡 Tips', value: [
          '• Keep callsigns consistent. If Operations uses ORV-XX, stick with that format.',
          '• Use `/dispatch` for in-RP emergencies, `/alert` for out-of-RP announcements.',
          '• Don\'t spam `/alert`. If everything is an alert, nothing is.',
          '• Keep your personnel file accurate. Update status when it changes.',
        ].join('\n'), inline: false },
        { name: '🚫 What You Cannot Do', value: '`/announcement` (Directorate+) · `/dashboard` / `/config` (admin only) · Create/delete departments (admin only)', inline: false },
        { name: '⭐ Most-Used', value: '`/profile` `/callsign set` `/dispatch` `/alert` `/scene`', inline: false },
      ],
    ),
  ],

  shifts: () => [
    embed(
      '⏱️ Shifts & Activity — Guide',
      `**For everyone on the staff team.** The shift system tracks who's actually contributing. Promotions, commendations, and inactivity warnings are based on this data — use it honestly.`,
      BRAND.colors.info,
      [
        { name: '▶️ Starting a Shift', value: [
          '`/shift start department:Support`',
          '',
          'The department is optional but recommended:',
          '• `Support` — working tickets',
          '• `Moderation` — handling reports',
          '• `Training` — running a session',
          '• `Recruitment` — reviewing applications',
          '• `Roleplay` — running RP',
        ].join('\n'), inline: false },
        { name: '📊 Checking Status', value: '`/shift status` — shows start time, elapsed time, department', inline: false },
        { name: '⏹️ Ending a Shift', value: '`/shift end` — tells you how long you worked. Saved to the database.', inline: false },
        { name: '🏆 Leaderboard', value: [
          '`/shift leaderboard` — top 10 by total shift time',
          '`/leaderboard type:shifts` — same thing',
          '`/leaderboard type:points` — points leaderboard',
        ].join('\n'), inline: false },
      ],
    ),
    embed(
      '⏱️ Shifts — Honesty & Routine',
      null,
      BRAND.colors.info,
      [
        { name: '✅ DO', value: [
          '• Start a shift when you come online and start working.',
          '• End it when you stop (before you go AFK, not after).',
          '• Use the department tag so the data is meaningful.',
        ].join('\n'), inline: false },
        { name: '❌ DON\'T', value: [
          '• Start a shift and walk away. Inflated hours but zero contribution. Staff notice.',
          '• Forget to end shifts. 8 hours while you slept skews the data.',
          '• Use shifts to compete. The goal is tracking real activity, not gaming a metric.',
          '',
          'If you forget to end a shift, tell an admin — they can adjust the record.',
        ].join('\n'), inline: false },
        { name: '🗓️ Typical Day', value: [
          '1. Come online',
          '2. `/shift start department:Support`',
          '3. Work tickets, help members',
          '4. If you switch tasks: `/shift end` → `/shift start department:Training`',
          '5. Done for the day: `/shift end`',
        ].join('\n'), inline: false },
        { name: '⭐ The Commands', value: '`/shift start` `/shift status` `/shift end` `/shift leaderboard`\n\nFour commands. Use them and your activity gets tracked fairly.', inline: false },
      ],
    ),
  ],

  economy: () => [
    embed(
      '💰 Economy & Points — Guide',
      `**For staff who award points.** Points are OPTIONAL — an admin enables it via \`/dashboard → Economy\`. If disabled, \`/points\` still works (stores internally) but nothing's visible to members until enabled.`,
      BRAND.colors.accent,
      [
        { name: '🎯 What Points Are For', value: [
          'Points reward members for contributing to ORGVNUM:',
          '• Attending training sessions',
          '• Participating in events / operations / patrols',
          '• Approved roleplay activities',
          '• Staff contributions',
          '',
          'Points are NOT currency. No gambling, no shop, no transfers. They\'re a recognition system — a way to say "you showed up and did the work."',
        ].join('\n'), inline: false },
        { name: '➕ Awarding Points', value: [
          '`/points user:@someone amount:10 reason:Attended Basic Training #1`',
          '`/points user:@someone amount:25 reason:Ran a great RP scene`',
          '`/points user:@someone amount:-5 reason:Correcting previous over-award`',
          '',
          'Positive adds, negative removes. Always include a clear reason.',
        ].join('\n'), inline: false },
        { name: '👀 Balances', value: [
          '`/balance` — your balance (any member)',
          '`/balance user:@someone` — staff only',
          '`/leaderboard` — top 10 by points',
        ].join('\n'), inline: false },
      ],
    ),
    embed(
      '💰 Economy — Suggested Values & Tips',
      null,
      BRAND.colors.accent,
      [
        { name: '📊 Suggested Point Values', value: [
          'Attended a training session — 10 pts',
          'Ran a training session (trainer) — 25 pts',
          'Participated in an operation — 15 pts',
          'Led an operation — 30 pts',
          'Helped onboard a new member — 20 pts',
          'Quality RP scene — 15 pts',
          'Monthly activity bonus (top 3) — 50 pts',
          '',
          'Agree on values with your team and stick with them.',
        ].join('\n'), inline: false },
        { name: '✅ DO', value: [
          '• Award immediately after the activity, while it\'s fresh.',
          '• Use round numbers (5, 10, 25, 50) for consistency.',
          '• Be transparent — tell members why they\'re getting points.',
          '• Recognize effort, not just outcomes.',
        ].join('\n'), inline: false },
        { name: '❌ DON\'T', value: [
          '• Award points for showing up once. Reward contribution, not presence.',
          '• Use points as a punishment tool routinely. They\'re for recognition.',
          '• Give huge amounts casually. Inflation makes them meaningless.',
          '• Award points to yourself.',
        ].join('\n'), inline: false },
        { name: '⭐ The Commands', value: '`/points` `/balance` `/leaderboard`', inline: false },
      ],
    ),
  ],
};

export const GUIDE_KEYS = Object.keys(GUIDES);

/** Get the embeds for a guide. Returns an array of EmbedBuilder. */
export function getGuideEmbeds(key) {
  const fn = GUIDES[key];
  if (!fn) return null;
  return fn();
}

export default { GUIDES, GUIDE_KEYS, getGuideEmbeds };

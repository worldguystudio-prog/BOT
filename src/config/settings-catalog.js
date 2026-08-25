/**
 * ORGVNUM — Centralized settings catalog.
 *
 * Shared between /config and /dashboard so both systems always agree on
 * which settings exist, their labels, types, and categories.
 *
 * Item types:
 *   channel → uses a channel select menu
 *   role    → uses a role select menu
 *   text    → uses a modal text input
 *   bool    → toggle (enable/disable buttons)
 *   int     → uses a modal number input
 */

export const SETTING_CATALOG = {
  welcome: {
    label: 'Welcome System',
    emoji: '👋',
    items: [
      { key: 'welcome_channel_id', label: 'Welcome Channel', type: 'channel' },
      { key: 'leave_channel_id', label: 'Leave Log Channel', type: 'channel' },
      { key: 'welcome_message', label: 'Welcome Message', type: 'text' },
      { key: 'default_role_id', label: 'Default Role (auto on join)', type: 'role' },
    ],
  },
  logs: {
    label: 'Logging Channels',
    emoji: '📋',
    items: [
      { key: 'log_channel_id', label: 'Main Moderation Log', type: 'channel' },
      { key: 'message_log_channel_id', label: 'Message Edit/Delete Log', type: 'channel' },
      { key: 'member_log_channel_id', label: 'Member Join/Leave Log', type: 'channel' },
      { key: 'ticket_log_channel_id', label: 'Ticket Log', type: 'channel' },
      { key: 'application_log_channel_id', label: 'Application Log', type: 'channel' },
    ],
  },
  tickets: {
    label: 'Ticket System',
    emoji: '🎫',
    items: [
      { key: 'ticket_category_id', label: 'Ticket Category', type: 'channel' },
      { key: 'ticket_panel_channel_id', label: 'Panel Channel', type: 'channel' },
      { key: 'ticket_transcript_channel_id', label: 'Transcript Channel', type: 'channel' },
      { key: 'staff_role_id', label: 'Staff Role (ticket access)', type: 'role' },
      { key: 'ticket_max_per_user', label: 'Max Tickets Per User', type: 'int' },
    ],
  },
  applications: {
    label: 'Applications',
    emoji: '📝',
    items: [
      { key: 'application_channel_id', label: 'Application Review Channel', type: 'channel' },
      { key: 'recruiter_role_id', label: 'Recruiter Role', type: 'role' },
    ],
  },
  recruitment: {
    label: 'Recruitment & Waitlist',
    emoji: '📋',
    items: [
      { key: 'recruitment_channel_id', label: 'Recruitment Channel', type: 'channel' },
      { key: 'waitlist_channel_id', label: 'Waitlist Channel', type: 'channel' },
    ],
  },
  roleplay: {
    label: 'Roleplay',
    emoji: '🎭',
    items: [
      { key: 'dispatch_channel_id', label: 'Dispatch Channel', type: 'channel' },
      { key: 'scene_channel_id', label: 'Scene Channel', type: 'channel' },
      { key: 'roleplay_log_channel_id', label: 'Roleplay Log Channel', type: 'channel' },
    ],
  },
  economy: {
    label: 'Economy / Points',
    emoji: '💰',
    items: [
      { key: 'economy_enabled', label: 'Economy Enabled', type: 'bool' },
      { key: 'economy_channel_id', label: 'Economy Display Channel', type: 'channel' },
    ],
  },
  shifts: {
    label: 'Shifts',
    emoji: '⏱️',
    items: [
      { key: 'shift_channel_id', label: 'Shift Log Channel', type: 'channel' },
    ],
  },
  training: {
    label: 'Training & Events',
    emoji: '📅',
    items: [
      { key: 'training_channel_id', label: 'Training/Event Channel', type: 'channel' },
      { key: 'training_log_channel_id', label: 'Training Log Channel', type: 'channel' },
    ],
  },
  roles: {
    label: 'Staff Roles',
    emoji: '🛡️',
    items: [
      { key: 'moderator_role_id', label: 'Moderator Role', type: 'role' },
      { key: 'directorate_role_id', label: 'Directorate Role', type: 'role' },
      { key: 'trainer_role_id', label: 'Trainer Role', type: 'role' },
      { key: 'muted_role_id', label: 'Muted Role', type: 'role' },
    ],
  },
};

/** Flatten all setting keys with their category for reset lists, etc. */
export const ALL_SETTINGS = Object.entries(SETTING_CATALOG).flatMap(([cat, g]) =>
  g.items.map((i) => ({ ...i, category: cat, categoryLabel: g.label, categoryEmoji: g.emoji })),
);

/** Find a single setting by key. */
export function findSetting(key) {
  return ALL_SETTINGS.find((s) => s.key === key);
}

/** Permission level metadata (for the permissions category in the dashboard). */
export const PERMISSION_LEVELS = [
  { value: '100', label: 'Owner' },
  { value: '90', label: 'Administrator' },
  { value: '80', label: 'Directorate Command' },
  { value: '70', label: 'Department Command' },
  { value: '60', label: 'Moderator' },
  { value: '50', label: 'Recruiter' },
  { value: '40', label: 'Trainer' },
  { value: '30', label: 'Staff' },
];

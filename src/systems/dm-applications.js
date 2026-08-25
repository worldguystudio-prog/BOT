/**
 * ORGVNUM — DM-based Application System
 *
 * Each application type has its own set of questions. Difficulty scales:
 *   Recruitment      — 5 basic questions
 *   Placement        — 7 questions (more detailed)
 *   Staff            — 10 questions (harder, scenario-based)
 *   Leadership       — 12 questions (hardest, includes situational judgment)
 *
 * Flow:
 *   1. User clicks an application button or runs /apply
 *   2. Bot DMs them the first question
 *   3. User replies (in DM) — bot saves the answer, sends next question
 *   4. After all questions, bot posts a summary embed + submits to the review channel
 *   5. Applicant gets a confirmation with their application ID
 *
 * If the user has DMs closed, the bot falls back to the modal form.
 */

// Question definitions per application type.
// Each question: { id, label, placeholder, required, multiline, maxLength }
export const QUESTION_SETS = {
  Recruitment: [
    { id: 'discord_username', label: 'What is your Discord username?', placeholder: 'e.g. user#1234', required: true, multiline: false, maxLength: 50 },
    { id: 'age', label: 'How old are you?', placeholder: 'e.g. 19', required: true, multiline: false, maxLength: 3 },
    { id: 'timezone', label: 'What timezone are you in?', placeholder: 'e.g. EST, GMT, PST', required: true, multiline: false, maxLength: 10 },
    { id: 'experience', label: 'Do you have any previous experience with Discord communities or roleplay servers?', placeholder: 'Describe any prior experience...', required: false, multiline: true, maxLength: 500 },
    { id: 'why_join', label: 'Why do you want to join ORGVNUM?', placeholder: 'Tell us why you\'re interested...', required: true, multiline: true, maxLength: 500 },
  ],

  'Placement Application': [
    { id: 'roblox_username', label: 'What is your Roblox username?', placeholder: 'Your Roblox username', required: true, multiline: false, maxLength: 50 },
    { id: 'discord_username', label: 'What is your Discord username?', placeholder: 'e.g. user#1234', required: true, multiline: false, maxLength: 50 },
    { id: 'age', label: 'How old are you?', placeholder: 'e.g. 19', required: true, multiline: false, maxLength: 3 },
    { id: 'timezone', label: 'What timezone are you in?', placeholder: 'e.g. EST, GMT, PST', required: true, multiline: false, maxLength: 10 },
    { id: 'activity_level', label: 'How active can you be? (hours per week)', placeholder: 'e.g. 10-15 hours/week', required: true, multiline: false, maxLength: 30 },
    { id: 'desired_role', label: 'What role are you hoping to get in ORGVNUM?', placeholder: 'e.g. Security, Operations, Training', required: true, multiline: false, maxLength: 50 },
    { id: 'experience', label: 'Describe any previous experience relevant to your desired role.', placeholder: 'Prior experience...', required: false, multiline: true, maxLength: 500 },
  ],

  'Staff Application': [
    { id: 'discord_username', label: 'What is your Discord username?', placeholder: 'e.g. user#1234', required: true, multiline: false, maxLength: 50 },
    { id: 'age', label: 'How old are you?', placeholder: 'e.g. 19', required: true, multiline: false, maxLength: 3 },
    { id: 'timezone', label: 'What timezone are you in?', placeholder: 'e.g. EST, GMT, PST', required: true, multiline: false, maxLength: 10 },
    { id: 'availability', label: 'How many hours per week can you commit to staff duties?', placeholder: 'e.g. 15-20 hours/week', required: true, multiline: false, maxLength: 30 },
    { id: 'previous_staff_experience', label: 'Have you been a staff member on a Discord server before? If yes, describe your role and responsibilities.', placeholder: 'Describe previous staff roles...', required: true, multiline: true, maxLength: 500 },
    { id: 'why_staff', label: 'Why do you want to join the ORGVNUM staff team specifically?', placeholder: 'Why this server, why staff?', required: true, multiline: true, maxLength: 500 },
    { id: 'strengths', label: 'What are your strengths that would make you a good staff member?', placeholder: 'e.g. patience, conflict resolution, availability...', required: true, multiline: true, maxLength: 500 },
    { id: 'weakness', label: 'What is one weakness you\'re working on, and how does it affect your staff work?', placeholder: 'Be honest — self-awareness matters.', required: true, multiline: true, maxLength: 500 },
    { id: 'scenario_conflict', label: 'SCENARIO: Two members are arguing in a public channel and it\'s escalating. One is a regular, one is new. How do you handle it?', placeholder: 'Walk through your step-by-step response...', required: true, multiline: true, maxLength: 800 },
    { id: 'scenario_abuse', label: 'SCENARIO: You witness a fellow staff member abusing their power. What do you do?', placeholder: 'Walk through your response...', required: true, multiline: true, maxLength: 800 },
  ],

  'Leadership Application': [
    { id: 'discord_username', label: 'What is your Discord username?', placeholder: 'e.g. user#1234', required: true, multiline: false, maxLength: 50 },
    { id: 'current_role', label: 'What is your current role in ORGVNUM?', placeholder: 'e.g. Moderator, Trainer', required: true, multiline: false, maxLength: 50 },
    { id: 'time_in_server', label: 'How long have you been part of ORGVNUM?', placeholder: 'e.g. 6 months', required: true, multiline: false, maxLength: 30 },
    { id: 'leadership_experience', label: 'Describe any leadership experience you have — in ORGVNUM or elsewhere.', placeholder: 'Detail your leadership background...', required: true, multiline: true, maxLength: 600 },
    { id: 'why_leadership', label: 'Why are you applying for a leadership position? What drives you to lead?', placeholder: 'Your motivation...', required: true, multiline: true, maxLength: 600 },
    { id: 'vision', label: 'What is your vision for ORGVNUM over the next 6 months? Be specific.', placeholder: 'Your strategic vision...', required: true, multiline: true, maxLength: 800 },
    { id: 'strengths', label: 'What leadership strengths do you bring? Give a concrete example of each.', placeholder: 'Strengths with examples...', required: true, multiline: true, maxLength: 600 },
    { id: 'weakness', label: 'What is your biggest leadership weakness, and what are you doing to improve it?', placeholder: 'Honest self-assessment...', required: true, multiline: true, maxLength: 600 },
    { id: 'scenario_crisis', label: 'SCENARIO: A major incident occurs (raid, mass rule violation, staff meltdown). Walk through your first 30 minutes of response.', placeholder: 'Step-by-step crisis response...', required: true, multiline: true, maxLength: 1000 },
    { id: 'scenario_underperformer', label: 'SCENARIO: A staff member under your supervision is consistently underperforming and missing shifts. How do you handle it?', placeholder: 'Your management approach...', required: true, multiline: true, maxLength: 800 },
    { id: 'scenario_disagreement', label: 'SCENARIO: You disagree with a decision made by the Directorate. How do you handle it?', placeholder: 'Your approach to upward disagreement...', required: true, multiline: true, maxLength: 600 },
    { id: 'references', label: 'List 2-3 current ORGVNUM staff who can vouch for you (Discord names or IDs).', placeholder: 'References...', required: false, multiline: true, maxLength: 300 },
  ],
};

export const APPLICATION_TYPES = Object.keys(QUESTION_SETS);

export const STATUSES = {
  PENDING: 'PENDING',
  UNDER_REVIEW: 'UNDER REVIEW',
  INTERVIEW: 'INTERVIEW',
  ACCEPTED: 'ACCEPTED',
  DENIED: 'DENIED',
  WAITLISTED: 'WAITLISTED',
  CLOSED: 'CLOSED',
};

// In-memory tracking of active DM application sessions.
// Key: userId → { type, questions, current, answers, startedAt, guildId, channel }
const activeSessions = new Map();

/** Start a DM-based application session for a user. */
export function startDMSession(userId, type, guildId, reviewChannelId) {
  const questions = QUESTION_SETS[type];
  if (!questions) return false;
  activeSessions.set(userId, {
    type,
    questions,
    current: 0,
    answers: {},
    startedAt: new Date().toISOString(),
    guildId,
    reviewChannelId,
  });
  return true;
}

/** Get an active session for a user (or null). */
export function getSession(userId) {
  return activeSessions.get(userId) || null;
}

/** Clear a session (on completion, cancellation, or timeout). */
export function clearSession(userId) {
  activeSessions.delete(userId);
}

/** Get all active sessions (for admin/debug). */
export function getActiveSessions() {
  return Array.from(activeSessions.entries()).map(([userId, s]) => ({ userId, ...s }));
}

export default { QUESTION_SETS, APPLICATION_TYPES, STATUSES, startDMSession, getSession, clearSession, getActiveSessions };

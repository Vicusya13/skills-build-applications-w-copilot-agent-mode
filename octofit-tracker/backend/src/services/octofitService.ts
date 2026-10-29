import { isValidObjectId } from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

type HttpError = Error & { status: number };

function httpError(status: number, message: string): HttpError {
  return Object.assign(new Error(message), { status });
}

function asRecord(input: unknown): Record<string, unknown> {
  return input && typeof input === 'object' ? (input as Record<string, unknown>) : {};
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw httpError(400, `${field} is required`);
  }
  return value.trim();
}

// Activity types mapped to the fitness focus they train.
const ACTIVITY_FOCUS: Record<string, string> = {
  run: 'endurance',
  walk: 'endurance',
  cycle: 'endurance',
  swim: 'endurance',
  strength: 'strength',
  weights: 'strength',
  yoga: 'mobility',
  stretch: 'mobility',
};

// Points reward effort: 1 point per minute, with a bonus for higher-intensity types.
const POINT_MULTIPLIER: Record<string, number> = { run: 1.2, swim: 1.2, strength: 1.1 };

export function calculatePoints(type: string, minutes: number) {
  return Math.round(minutes * (POINT_MULTIPLIER[type] ?? 1));
}

export async function listActivities() {
  return Activity.find().sort({ occurredAt: -1 }).lean();
}

export async function createActivity(input: unknown) {
  const body = asRecord(input);
  const userId = requireString(body.userId, 'userId');
  const teamId = requireString(body.teamId, 'teamId');
  const type = requireString(body.type, 'type').toLowerCase();
  const minutes = Number(body.minutes);

  if (!Number.isFinite(minutes) || minutes <= 0) {
    throw httpError(400, 'minutes must be a positive number');
  }
  if (!isValidObjectId(userId)) throw httpError(400, 'userId is not a valid id');
  if (!isValidObjectId(teamId)) throw httpError(400, 'teamId is not a valid id');

  const [user, team] = await Promise.all([User.exists({ _id: userId }), Team.exists({ _id: teamId })]);
  if (!user) throw httpError(404, 'User not found');
  if (!team) throw httpError(404, 'Team not found');

  const activity = await Activity.create({
    user: userId,
    team: teamId,
    type,
    minutes,
    points: calculatePoints(type, minutes),
    occurredAt: body.occurredAt ? new Date(String(body.occurredAt)) : new Date(),
  });
  return activity.toObject();
}

export async function listTeams() {
  return Team.find().sort({ name: 1 }).lean();
}

export async function createTeam(input: unknown) {
  const body = asRecord(input);
  const name = requireString(body.name, 'name');
  const mascot = requireString(body.mascot, 'mascot');
  const members = Array.isArray(body.members) ? body.members.map(String) : [];

  if (members.some((id) => !isValidObjectId(id))) {
    throw httpError(400, 'members must contain valid user ids');
  }
  const existing = await User.countDocuments({ _id: { $in: members } });
  if (existing !== new Set(members).size) {
    throw httpError(404, 'One or more members were not found');
  }

  const team = await Team.create({ name, mascot, members });
  return team.toObject();
}

export async function getLeaderboard() {
  const totals = await Activity.aggregate<{ _id: unknown; totalPoints: number }>([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
  ]);
  const teams = await Team.find({ _id: { $in: totals.map((t) => t._id) } }).lean();
  const names = new Map(teams.map((team) => [team._id.toString(), team.name]));

  return totals
    .filter((entry) => names.has(String(entry._id)))
    .map((entry) => ({ teamId: String(entry._id), teamName: names.get(String(entry._id)) as string, totalPoints: entry.totalPoints }))
    .sort((a, b) => b.totalPoints - a.totalPoints || a.teamName.localeCompare(b.teamName))
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail.trim().toLowerCase() }).lean();
  if (!user) throw httpError(404, `No user found for ${userEmail}`);

  const recent = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(10).lean();
  const minutesByFocus = new Map<string, number>();
  for (const activity of recent) {
    const focus = ACTIVITY_FOCUS[activity.type] ?? user.fitnessGoal;
    minutesByFocus.set(focus, (minutesByFocus.get(focus) ?? 0) + activity.minutes);
  }
  const [topFocus] = [...minutesByFocus.entries()].sort((a, b) => b[1] - a[1]);
  const focus = topFocus?.[0] ?? user.fitnessGoal;
  const reason = topFocus
    ? `Your recent activity is mostly ${focus} (${topFocus[1]} minutes), which matches your ${user.fitnessGoal} goal.`
    : `Based on your ${user.fitnessGoal} goal; log an activity to get more tailored suggestions.`;

  const workouts = await Workout.find().lean();
  return workouts
    .sort((a, b) => Number(b.focus === focus) - Number(a.focus === focus) || Number(b.focus === user.fitnessGoal) - Number(a.focus === user.fitnessGoal))
    .map((workout) => ({
      ...workout,
      reason: workout.focus === focus ? reason : `Balances your training with some ${workout.focus} work.`,
    }));
}

export { User };

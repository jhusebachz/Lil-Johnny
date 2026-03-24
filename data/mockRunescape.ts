// =========================
// TYPES
// =========================

export type TopGain = {
  skill: string;
  xp: number;
};

export type FriendGain = {
  skill: string;
  xp: number;
  level: number;
};

export type FriendRace = {
  name: string;
  xpToday: number;
  diff: number;
  topGains: FriendGain[];
};

export type GoalProgress = {
  skill: string;
  level: number;
  pct: number;
  remainingXp: number;
  eta: string;
};

export type MaxSkill = {
  skill: string;
  level: number;
  remainingXp: number;
  eta: string;
  pct: number;
};

// =========================
// DATA
// =========================

export const runescapeMockData = {
  today: 'March 17, 2026',

  yourTotalXp: 184250,

  topGains: [
    { skill: 'Strength', xp: 68250 },
    { skill: 'Attack', xp: 45100 },
    { skill: 'Fishing', xp: 32750 },
    { skill: 'Magic', xp: 21150 },
    { skill: 'Agility', xp: 7000 },
  ] as TopGain[],

  friends: [
    {
      name: 'mufkr',
      xpToday: 126300,
      diff: 57950,
      topGains: [
        { skill: 'Strength', xp: 55000, level: 91 },
        { skill: 'Attack', xp: 40200, level: 90 },
        { skill: 'Fishing', xp: 18100, level: 84 },
      ],
    },
    {
      name: 'kingxdabber',
      xpToday: 95200,
      diff: 89050,
      topGains: [
        { skill: 'Magic', xp: 41000, level: 88 },
        { skill: 'Ranged', xp: 23500, level: 86 },
        { skill: 'Cooking', xp: 15200, level: 83 },
      ],
    },
    {
      name: 'beefmissle13',
      xpToday: 211000,
      diff: -26750,
      topGains: [
        { skill: 'Mining', xp: 82000, level: 89 },
        { skill: 'Smithing', xp: 50000, level: 85 },
        { skill: 'Strength', xp: 33000, level: 87 },
      ],
    },
    {
      name: 'hedith',
      xpToday: 0,
      diff: 184250,
      topGains: [],
    },
  ] as FriendRace[],

  base90Remaining: [
    {
      skill: 'Agility',
      level: 78,
      pct: 68.4,
      remainingXp: 1625000,
      eta: '~23.2d',
    },
    {
      skill: 'Runecraft',
      level: 76,
      pct: 61.7,
      remainingXp: 1912000,
      eta: '~no recent xp',
    },
    {
      skill: 'Hunter',
      level: 82,
      pct: 79.6,
      remainingXp: 982000,
      eta: '~11.4d',
    },
    {
      skill: 'Construction',
      level: 84,
      pct: 84.1,
      remainingXp: 731500,
      eta: '~9.2d',
    },
  ] as GoalProgress[],

  totalLevelCurrent: 2142,
  totalLevelTarget: 2250,
  totalLevelsNeeded: 108,

  maxClosest: [
    {
      skill: 'Strength',
      level: 92,
      remainingXp: 4720000,
      eta: '~69.2d',
      pct: 64.5,
    },
    {
      skill: 'Attack',
      level: 91,
      remainingXp: 5210000,
      eta: '~83.1d',
      pct: 60.8,
    },
    {
      skill: 'Fishing',
      level: 90,
      remainingXp: 5740000,
      eta: '~175.3d',
      pct: 56.9,
    },
    {
      skill: 'Magic',
      level: 89,
      remainingXp: 6290000,
      eta: '~297.4d',
      pct: 52.8,
    },
    {
      skill: 'Hitpoints',
      level: 88,
      remainingXp: 7020000,
      eta: '~no recent xp',
      pct: 47.4,
    },
  ] as MaxSkill[],

  maxedSkills: ['Cooking', 'Firemaking'],

  coachingText:
    "Strong day. You beat mufkr and kingxdabber comfortably, but beefmissle13 still outpaced you. Your Base 90 goal is the most urgent because Agility, Runecraft, and Hunter are still lagging and the deadline is much closer than your max cape target. Construction and Hunter are two of your best near-term opportunities because they’re relatively close and your recent pace makes them realistic wins. If you want to protect momentum, keep using high-consistency combat training while adding one focused push each week into a lagging non-combat skill.",
};
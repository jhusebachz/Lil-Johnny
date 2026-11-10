import { useMemo } from 'react';
import { Text, View } from 'react-native';

import Pill from '../Pill';
import ProgressBar from '../ProgressBar';
import SectionCard from '../SectionCard';
import StatRow from '../StatRow';
import AccountStatsCard from './AccountStatsCard';
import { formatOsrsSkillName } from '../../data/osrsEffectiveHours';
import { xpForLevel } from '../../data/osrsTrackerGoals';
import { buildTrackerSevenDayTopSkills } from '../../data/osrsTrackerSevenDay';
import { BOSS_TIER_ORDER } from '../../data/osrsTrackerTypes';
import type {
  LiveRunescapeTracker,
  TrackerBossProgression,
  TrackerWeeklyRaidGoal,
} from '../../data/osrsTrackerTypes';
import type { ThemeColors } from '../../data/theme';

type RunescapeSectionProps = {
  colors: ThemeColors;
  tracker: LiveRunescapeTracker;
  trackerError: string | null;
  trackerLoading: boolean;
};

const EMPTY_BOSS_PROGRESS: TrackerBossProgression = {
  triedCount: 0,
  totalTracked: 0,
  untriedCount: 0,
  remainingByTier: {
    Easy: [],
    Medium: [],
    Hard: [],
    Elite: [],
    Master: [],
    Grandmaster: [],
  },
};

const EMPTY_RAID_GOAL: TrackerWeeklyRaidGoal = {
  target: 1,
  completed: 0,
  weekStartDateKey: null,
  gainsByRaid: [],
};

function formatCompactXp(value: number) {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  }

  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }

  return value.toLocaleString();
}

function clampPct(value: number) {
  return Math.max(0, Math.min(100, value));
}

export default function RunescapeSectionV2({ colors, tracker, trackerError, trackerLoading }: RunescapeSectionProps) {
  const maxPace = tracker.maxCapePace;
  const ironman = tracker.ironmanMilestone;
  const hasEffectiveHours = tracker.effectiveHours.source !== 'unavailable';
  const hasSevenDaySummary = tracker.lastSevenDays.daysTracked > 0;
  const sevenDayTopSkills = buildTrackerSevenDayTopSkills(tracker.lastSevenDays);
  const topEffectiveHourContributors = tracker.effectiveHours.bySkill
    .slice(0, 3)
    .map((entry) => `${formatOsrsSkillName(entry.skill)} ${entry.hours.toFixed(1)}h`)
    .join(' | ');
  const bossProgression = tracker.bossProgression ?? EMPTY_BOSS_PROGRESS;
  const dailyBossActivity = tracker.dailyBossActivity ?? { topPlayers: [] };
  const weeklyRaidGoal = tracker.weeklyRaidGoal ?? EMPTY_RAID_GOAL;
  const bossPct = bossProgression.totalTracked > 0
    ? clampPct((bossProgression.triedCount / bossProgression.totalTracked) * 100)
    : 0;
  const raidPct = clampPct(
    (weeklyRaidGoal.completed / Math.max(weeklyRaidGoal.target, 1)) * 100
  );

  const coachingText = useMemo(() => {
    const maxText = maxPace
      ? `Max Cape: ${maxPace.maxedSkills}/${maxPace.totalSkills} skills at 99; ${Math.abs(maxPace.hoursAhead).toFixed(1)} cumulative timed hours ${maxPace.hoursAhead >= 0 ? 'ahead' : 'behind'} the December 2027 plan. Combat levels have no timed target.`
      : 'Max Cape pacing will appear with the next complete snapshot.';
    const baseText = `${24 - tracker.baseGoalRemaining.length}/24 Base-92 targets complete.`;
    const bossText = bossProgression.totalTracked > 0
      ? `Boss checklist: ${bossProgression.triedCount}/${bossProgression.totalTracked} complete; ${bossProgression.untriedCount} remaining.`
      : 'Boss KC data will populate on the next daily HiScores snapshot.';
    const raidText = weeklyRaidGoal.weekStartDateKey
      ? weeklyRaidGoal.completed >= weeklyRaidGoal.target
        ? 'Weekly raid goal is complete.'
        : 'Weekly raid goal still needs one CoX, ToA, or ToB completion.'
      : 'Weekly raid tracking will begin with the next daily snapshot.';

    return `${maxText} ${baseText} ${bossText} ${raidText}`;
  }, [maxPace, bossProgression, tracker.baseGoalRemaining.length, weeklyRaidGoal]);

  return (
    <>
      <View
        style={{
          backgroundColor: colors.hero,
          borderRadius: 16,
          padding: 20,
          marginBottom: 18,
        }}
      >
        <Text style={{ color: colors.heroText, fontSize: 30, fontWeight: '800' }}>
          {tracker.totalXp.toLocaleString()}
        </Text>
        <Text style={{ color: colors.heroSubtext, marginTop: 2 }}>
          {tracker.mode === 'delta' ? 'XP since last snapshot' : 'Total account XP'}
        </Text>
        <Text style={{ color: colors.heroSubtext, marginTop: 6, fontSize: 12 }}>
          {trackerLoading
            ? 'Refreshing OSRS tracker...'
            : trackerError
              ? trackerError
              : tracker.mode === 'delta'
                ? `Snapshot loaded for ${tracker.snapshotDateLabel}.`
                : 'Live snapshot loaded. Deltas begin after two saved snapshots.'}
        </Text>
        <Text style={{ color: colors.heroSubtext, marginTop: 4, fontSize: 12 }}>
          Last updated: {tracker.generatedAtLabel}
        </Text>

        {tracker.topSkills.length > 0 ? (
          <View style={{ marginTop: 14 }}>
            {tracker.topSkills.map((item) => (
              <Text key={item.skill} style={{ color: colors.heroSubtext, fontSize: 13, marginBottom: 4 }}>
                <Text style={{ fontWeight: '700' }}>{item.skill}</Text>
                {tracker.mode === 'delta' ? ': +' : ': '}
                {item.xp.toLocaleString()} xp
              </Text>
            ))}
          </View>
        ) : null}

        {hasEffectiveHours ? (
          <View style={{ marginTop: 14 }}>
            <Text style={{ color: colors.heroText, fontSize: 14, fontWeight: '800' }}>
              OSRS effective hours since last report: {tracker.effectiveHours.totalHours.toFixed(1)}h
            </Text>
            {topEffectiveHourContributors ? (
              <Text style={{ color: colors.heroSubtext, marginTop: 4, fontSize: 12 }}>
                Top effective-hour contributors: {topEffectiveHourContributors}
              </Text>
            ) : null}
          </View>
        ) : null}

        {hasSevenDaySummary ? (
          <Text style={{ color: colors.heroSubtext, marginTop: 14, fontSize: 13 }}>
            Last 7 days: {formatCompactXp(tracker.lastSevenDays.totalXp)} xp |{' '}
            {tracker.lastSevenDays.totalEffectiveHours.toFixed(1)}h
          </Text>
        ) : null}
      </View>

      <SectionCard title="Road to Max Cape - December 31, 2027" emoji={'\uD83C\uDFC6'} colors={colors}>
        {maxPace ? (
          <>
            <StatRow label="Skills at 99" value={`${maxPace.maxedSkills}/${maxPace.totalSkills}`} colors={colors} />
            <StatRow label="Total level" value={`${maxPace.totalLevel.toLocaleString()}/${maxPace.totalSkills * 99}`} colors={colors} />
            <StatRow label="XP progress to all 99s" value={`${maxPace.xpProgressPct.toFixed(1)}%`} colors={colors} />
            <ProgressBar pct={maxPace.xpProgressPct} color={colors.accent} colors={colors} />
            <View style={{ height: 1, backgroundColor: colors.cardBorder, marginVertical: 12 }} />
            <StatRow label="Timed work completed" value={`${maxPace.completedTimedHours.toFixed(1)}h`} colors={colors} />
            <StatRow label="Expected by this date" value={`${maxPace.expectedTimedHours.toFixed(1)}h`} colors={colors} />
            <StatRow label="Timed work remaining" value={`${maxPace.remainingTimedHours.toFixed(1)}h`} colors={colors} />
            <Text style={{ color: maxPace.hoursAhead >= 0 ? colors.success : colors.danger, fontWeight: '800', fontSize: 17, marginTop: 10 }}>
              {Math.abs(maxPace.hoursAhead).toFixed(1)} cumulative hours {maxPace.hoursAhead >= 0 ? 'ahead' : 'behind'}
            </Text>
            <Text style={{ color: colors.subtext, fontSize: 12, marginTop: 4 }}>
              Hours are measured from November 10, 2026 using your configured XP/hour rates, against the December 31, 2027 deadline.
            </Text>
            {maxPace.timedSkills.length > 0 ? (
              <View style={{ marginTop: 14 }}>
                <Text style={{ fontSize: 12, fontWeight: '800', color: colors.text, marginBottom: 8 }}>TIMED SKILLS (LONGEST FIRST)</Text>
                {maxPace.timedSkills.map((item) => (
                  <View key={`timed-${item.skill}`} style={{ marginBottom: 10 }}>
                    <Text style={{ fontSize: 13, color: colors.text, marginBottom: 3 }}>
                      {formatOsrsSkillName(item.skill)} Lv{item.level}: {item.hoursLeft.toFixed(1)}h remaining
                    </Text>
                    <ProgressBar pct={100 * (1 - item.remainingXp / xpForLevel(99))} color={colors.accent} colors={colors} />
                  </View>
                ))}
              </View>
            ) : null}
            <Text style={{ color: colors.subtext, fontSize: 12, marginTop: 10 }}>
              Combat: {maxPace.untimedCombat.length > 0
                ? maxPace.untimedCombat.map((item) => `${formatOsrsSkillName(item.skill)} ${item.level}`).join(' | ')
                : 'All combat skills maxed'}. Tracked toward 99 without individual time estimates because Slayer trains them too.
            </Text>
          </>
        ) : <Text style={{ color: colors.subtext }}>Max Cape pacing will appear after a complete HiScores snapshot.</Text>}
      </SectionCard>

      <SectionCard title="Ironman Milestones - JorbisBTW" emoji={'\uD83D\uDEE1\uFE0F'} colors={colors}>
        {ironman ? (
          <>
            <StatRow label="Total level" value={ironman.totalLevel.toLocaleString()} colors={colors} />
            <StatRow label="Current milestone" value={`Base ${ironman.targetLevel}`} colors={colors} />
            <StatRow label="Skills at target" value={`${ironman.completed}/${ironman.totalSkills}`} colors={colors} />
            {ironman.levelsGainedSincePrevious !== null ? (
              <StatRow label="Levels since previous report" value={`+${ironman.levelsGainedSincePrevious}`} colors={colors} />
            ) : null}
            <ProgressBar pct={100 * ironman.completed / ironman.totalSkills} color={colors.success} colors={colors} />
            {ironman.nextTier ? (
              <Text style={{ color: colors.subtext, fontSize: 12, marginTop: 9 }}>
                Next tier preview: Base {ironman.nextTier.level}, {ironman.nextTier.completed}/{ironman.totalSkills} skills already there.
              </Text>
            ) : null}
            {ironman.remaining.length > 0 ? (
              <View style={{ marginTop: 12 }}>
                <Text style={{ fontSize: 12, color: colors.text, fontWeight: '800', marginBottom: 7 }}>STILL NEEDED FOR BASE {ironman.targetLevel}</Text>
                {ironman.remaining.map((item) => (
                  <Text key={`iron-${item.skill}`} style={{ color: colors.text, fontSize: 13, marginBottom: 5 }}>
                    {'\u2022'} {formatOsrsSkillName(item.skill)}: Lv{item.level}/{ironman.targetLevel}
                  </Text>
                ))}
              </View>
            ) : <Text style={{ color: colors.success, marginTop: 8 }}>All skills maxed!</Text>}
            <Text style={{ color: colors.subtext, fontSize: 12, marginTop: 12 }}>
              Milestones advance automatically through Base 30, 40, 50, 60, 70, 80, 90, and 99. No hourly pace or deadline.
            </Text>
          </>
        ) : <Text style={{ color: colors.subtext }}>Ironman milestones will appear after a complete HiScores snapshot.</Text>}
      </SectionCard>

      {hasSevenDaySummary ? (
        <SectionCard title="Last 7 Days" emoji={'\uD83D\uDCC8'} colors={colors}>
          <StatRow label="Total progress" value={`${tracker.lastSevenDays.totalXp.toLocaleString()} xp`} colors={colors} />
          <StatRow label="Effective hours" value={`${tracker.lastSevenDays.totalEffectiveHours.toFixed(1)} h`} colors={colors} />
          <StatRow label="Active days" value={`${tracker.lastSevenDays.activeDays} / ${tracker.lastSevenDays.daysTracked}`} colors={colors} />
          {sevenDayTopSkills.length > 0 ? (
            <View style={{ marginTop: 8 }}>
              <Text style={{ color: colors.subtext, fontSize: 12, marginBottom: 4 }}>Top skills</Text>
              {sevenDayTopSkills.map((skill) => (
                <Text key={`seven-day-${skill.skill}`} style={{ color: colors.text, fontSize: 12, marginBottom: 3 }}>
                  {'\u2022'} {formatOsrsSkillName(skill.skill)} {formatCompactXp(skill.xp)} xp
                </Text>
              ))}
            </View>
          ) : null}
        </SectionCard>
      ) : null}

      <SectionCard
        title={tracker.mode === 'delta' ? 'Since Last Snapshot - You vs Friends' : 'Account Snapshot - You vs Friends'}
        emoji={'\u2694'}
        colors={colors}
      >
        <StatRow
          label={tracker.mode === 'delta' ? 'Your XP since last snapshot' : 'Your total account XP'}
          value={tracker.totalXp.toLocaleString()}
          colors={colors}
        />
        <View style={{ height: 1, backgroundColor: colors.cardBorder, marginVertical: 12 }} />
        {tracker.friends.map((friend) => {
          const ahead = friend.diff > 0;
          const even = friend.diff === 0;
          return (
            <View key={friend.name} style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text }}>
                {friend.name}
                <Text style={{ fontWeight: '400', color: colors.subtext }}>
                  {' '} - {friend.overallXp.toLocaleString()} {tracker.mode === 'delta' ? 'xp since last snapshot' : 'total xp'}
                </Text>
              </Text>
              {!even && ahead && <Pill text={`Ahead by ${friend.diff.toLocaleString()} xp`} color={colors.success} />}
              {!even && !ahead && <Pill text={`Trailing by ${Math.abs(friend.diff).toLocaleString()} xp`} color={colors.danger} />}
              {even && <Pill text="Dead even" color={colors.warning} />}
              {tracker.mode === 'delta' && friend.effectiveHours > 0 ? (
                <Text style={{ fontSize: 12, color: colors.subtext, marginTop: 8 }}>
                  Hours played: {friend.effectiveHours.toFixed(1)}h
                </Text>
              ) : null}
            </View>
          );
        })}
      </SectionCard>

      {dailyBossActivity.topPlayers.length > 0 ? (
        <SectionCard title="Boss Kills Since Last Update" emoji={'\u2694\uFE0F'} colors={colors}>
          {dailyBossActivity.topPlayers.map((player, index) => (
            <View
              key={`boss-activity-${player.name}`}
              style={{
                marginBottom: index === dailyBossActivity.topPlayers.length - 1 ? 0 : 14,
                paddingBottom: index === dailyBossActivity.topPlayers.length - 1 ? 0 : 14,
                borderBottomWidth: index === dailyBossActivity.topPlayers.length - 1 ? 0 : 1,
                borderBottomColor: colors.cardBorder,
              }}
            >
              <Text style={{ fontSize: 14, color: colors.text, fontWeight: '800' }}>
                {index + 1}. {player.name}
                <Text style={{ color: colors.subtext, fontWeight: '500' }}>
                  {' '} - {player.totalBossKcGained.toLocaleString()} KC
                </Text>
              </Text>
              {player.bossGains.map((boss) => (
                <Text
                  key={`boss-activity-${player.name}-${boss.name}`}
                  style={{ fontSize: 12, color: colors.subtext, marginTop: 5, paddingLeft: 12 }}
                >
                  {'\u2022'} {boss.name} +{boss.gained.toLocaleString()}
                </Text>
              ))}
            </View>
          ))}
        </SectionCard>
      ) : null}

      {tracker.baseGoalRemaining.length > 0 ? (
        <SectionCard title="Finish Base 92s (Runecrafting 90)" emoji={'\uD83C\uDFAF'} colors={colors}>
          <StatRow label="Skills at goal" value={`${24 - tracker.baseGoalRemaining.length}/24`} colors={colors} />
          {tracker.baseGoalRemaining.map((item) => (
            <View key={item.skill} style={{ marginTop: 8 }}>
              <Text style={{ fontSize: 12, color: colors.text }}>
                {item.skill} Lv{item.level}/{item.targetLevel}: {item.remainingXp.toLocaleString()} XP remaining
              </Text>
              <ProgressBar pct={item.pct} color={colors.accent} colors={colors} />
            </View>
          ))}
        </SectionCard>
      ) : null}

      <SectionCard title="Boss Completion Checklist - Get 1 KC" emoji={'\uD83D\uDC80'} colors={colors}>
        {bossProgression.totalTracked > 0 ? (
          <>
            <StatRow
              label="Bosses / encounters completed once"
              value={`${bossProgression.triedCount} / ${bossProgression.totalTracked}`}
              colors={colors}
            />
            <StatRow label="Remaining" value={`${bossProgression.untriedCount}`} colors={colors} />
            <ProgressBar pct={bossPct} color={colors.danger} colors={colors} />
            <Text style={{ fontSize: 12, color: colors.subtext, marginTop: 8, marginBottom: 8 }}>
              Every unfinished encounter stays visible in the curated Wiki ladder order, regardless of access requirements.
            </Text>
            {BOSS_TIER_ORDER.map((tier) => {
              const bosses = bossProgression.remainingByTier[tier];
              if (bosses.length === 0) {
                return null;
              }

              return (
                <View key={`boss-tier-${tier}`} style={{ marginTop: 12 }}>
                  <Text
                    style={{
                      color: colors.accent,
                      fontSize: 12,
                      fontWeight: '900',
                      letterSpacing: 0.7,
                      marginBottom: 7,
                    }}
                  >
                    {tier.toUpperCase()}
                  </Text>
                  {bosses.map((boss) => (
                    <Text key={`boss-${boss.name}`} style={{ fontSize: 13, color: colors.text, marginBottom: 7 }}>
                      {'\u2022'} <Text style={{ fontWeight: '800' }}>{boss.name}</Text>
                      <Text style={{ color: colors.subtext }}> - {boss.kc} KC</Text>
                    </Text>
                  ))}
                </View>
              );
            })}
            {bossProgression.untriedCount === 0 ? (
              <Text style={{ fontSize: 13, color: colors.success, fontWeight: '800', marginTop: 10 }}>
                Every tracked boss or encounter has at least 1 KC.
              </Text>
            ) : null}
          </>
        ) : (
          <Text style={{ fontSize: 13, color: colors.subtext }}>
            Boss KC data will populate after the next daily HiScores snapshot.
          </Text>
        )}
      </SectionCard>

      <SectionCard title="Weekly Raid Goal - 1 Completion" emoji={'\uD83C\uDFF0'} colors={colors}>
        <StatRow
          label="This week"
          value={`${Math.min(weeklyRaidGoal.completed, weeklyRaidGoal.target)}/${weeklyRaidGoal.target}`}
          colors={colors}
        />
        {weeklyRaidGoal.weekStartDateKey ? (
          <StatRow label="Week started" value={weeklyRaidGoal.weekStartDateKey} colors={colors} />
        ) : null}
        <ProgressBar pct={raidPct} color={colors.warning} colors={colors} />
        <Text style={{ fontSize: 12, color: colors.subtext, marginTop: 8 }}>
          Counts Chambers of Xeric (regular or CM), Tombs of Amascut (regular or expert), or Theatre of Blood (regular or hard mode).
        </Text>
        {weeklyRaidGoal.completed >= weeklyRaidGoal.target ? (
          <Text style={{ fontSize: 13, color: colors.success, fontWeight: '800', marginTop: 8 }}>
            Weekly raid goal complete.
          </Text>
        ) : weeklyRaidGoal.weekStartDateKey ? (
          <Text style={{ fontSize: 13, color: colors.warning, fontWeight: '800', marginTop: 8 }}>
            One raid completion still needed this week.
          </Text>
        ) : (
          <Text style={{ fontSize: 12, color: colors.subtext, marginTop: 8 }}>
            Weekly raid tracking will establish its baseline on the next daily snapshot.
          </Text>
        )}
        {weeklyRaidGoal.gainsByRaid.map((raid) => (
          <Text key={`raid-${raid.name}`} style={{ fontSize: 12, color: colors.text, marginTop: 5 }}>
            {'\u2022'} {raid.name}: +{raid.gained}
          </Text>
        ))}
      </SectionCard>

      <SectionCard title="Hours Left Until Next Level" emoji={'\u23F3'} colors={colors}>
        {tracker.hoursToNextLevel.length > 0 ? (
          tracker.hoursToNextLevel.map((item) => (
            <View
              key={`${item.skill}-${item.targetLevel}`}
              style={{ marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.cardBorder }}
            >
              <Text style={{ fontSize: 13, color: colors.text, fontWeight: '800', marginBottom: 4 }}>
                {item.skill}
                <Text style={{ color: colors.subtext, fontWeight: '400' }}> - Lv{item.level} to {item.targetLevel}</Text>
              </Text>
              <Text style={{ fontSize: 12, color: colors.subtext }}>
                {item.remainingXp.toLocaleString()} xp left
                {item.hoursLeft !== null ? ` | ${item.hoursLeft.toFixed(1)}h (${item.mode})` : ` | ${item.mode}`}
              </Text>
            </View>
          ))
        ) : (
          <Text style={{ fontSize: 13, color: colors.subtext }}>No tracked next-level estimates left.</Text>
        )}
      </SectionCard>

      <SectionCard title="Coaching Insight" emoji={'\uD83E\uDDE0'} colors={colors}>
        <Text style={{ fontSize: 14, color: colors.text, lineHeight: 22 }}>{coachingText}</Text>
      </SectionCard>
      <AccountStatsCard accounts={tracker.accountStats} generatedAtLabel={tracker.generatedAtLabel} colors={colors} />
    </>
  );
}

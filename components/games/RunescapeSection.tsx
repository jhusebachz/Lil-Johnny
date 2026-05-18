import { Text, View } from 'react-native';

import Pill from '../Pill';
import ProgressBar from '../ProgressBar';
import SectionCard from '../SectionCard';
import StatRow from '../StatRow';
import { formatOsrsSkillName } from '../../data/osrsEffectiveHours';
import { ThemeColors } from '../../data/theme';
import type { LiveRunescapeTracker } from '../../data/osrsTracker';
import TrackerGoalCard from './TrackerGoalCard';

type RunescapeSectionProps = {
  colors: ThemeColors;
  tracker: LiveRunescapeTracker;
  trackerError: string | null;
  trackerLoading: boolean;
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

export default function RunescapeSection({ colors, tracker, trackerError, trackerLoading }: RunescapeSectionProps) {
  const totalLevelTarget = 2250;
  const goal1Projection = tracker.goalProjections.baseGoal;
  const goal2Projection = tracker.goalProjections.runefest;
  const goal3Projection = tracker.goalProjections.maxCape;
  const hasEffectiveHours = tracker.effectiveHours.source !== 'unavailable';
  const topEffectiveHourContributors = tracker.effectiveHours.bySkill
    .slice(0, 3)
    .map((entry) => `${formatOsrsSkillName(entry.skill)} ${entry.hours.toFixed(1)}h`)
    .join(' · ');
  const hasSevenDaySummary = tracker.lastSevenDays.daysTracked > 0;

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
              ? 'Tracker unavailable, showing latest cached snapshot.'
              : tracker.mode === 'delta'
                ? `Snapshot loaded for ${tracker.snapshotDateLabel}.`
                : 'Live snapshot loaded. Deltas begin after two saved snapshots.'}
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
              OSRS effective hours: {tracker.effectiveHours.totalHours.toFixed(1)}h
            </Text>
            {topEffectiveHourContributors ? (
              <Text style={{ color: colors.heroSubtext, marginTop: 4, fontSize: 12 }}>
                Top effective-hour contributors: {topEffectiveHourContributors}
              </Text>
            ) : null}
          </View>
        ) : null}

        {hasSevenDaySummary ? (
          <View style={{ marginTop: 14 }}>
            <Text style={{ color: colors.heroText, fontSize: 14, fontWeight: '800' }}>
              Last 7 days: {formatCompactXp(tracker.lastSevenDays.totalXp)} xp ·{' '}
              {tracker.lastSevenDays.totalEffectiveHours.toFixed(1)}h
            </Text>
            <Text style={{ color: colors.heroSubtext, marginTop: 4, fontSize: 12 }}>
              {tracker.lastSevenDays.activeDays} active day{tracker.lastSevenDays.activeDays === 1 ? '' : 's'} tracked
            </Text>
          </View>
        ) : null}
      </View>

      {hasSevenDaySummary ? (
        <SectionCard title="Last 7 Days" emoji={'📈'} colors={colors}>
          <StatRow
            label="Total progress"
            value={`${tracker.lastSevenDays.totalXp.toLocaleString()} xp`}
            colors={colors}
          />
          <StatRow
            label="Effective hours"
            value={`${tracker.lastSevenDays.totalEffectiveHours.toFixed(1)} h`}
            colors={colors}
          />
          <StatRow
            label="Active days"
            value={`${tracker.lastSevenDays.activeDays} / ${tracker.lastSevenDays.daysTracked}`}
            colors={colors}
          />
          <StatRow
            label="Average per tracked day"
            value={`${Math.round(tracker.lastSevenDays.averageXp).toLocaleString()} xp · ${tracker.lastSevenDays.averageEffectiveHours.toFixed(1)}h`}
            colors={colors}
          />
          <View style={{ marginTop: 10 }}>
            {tracker.lastSevenDays.days.map((day) => (
              <View
                key={day.dateKey}
                style={{
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.cardBorder,
                  backgroundColor: colors.inputBackground,
                  padding: 12,
                  marginBottom: 10,
                }}
              >
                <Text style={{ color: colors.text, fontSize: 14, fontWeight: '800', marginBottom: 4 }}>
                  {day.label}
                </Text>
                <Text style={{ color: colors.subtext, fontSize: 12 }}>
                  {day.totalXp.toLocaleString()} xp · {day.effectiveHours.toFixed(1)}h
                </Text>
                {day.topSkills.length > 0 ? (
                  <Text style={{ color: colors.subtext, fontSize: 12, marginTop: 4 }}>
                    Top skills:{' '}
                    {day.topSkills.map((skill) => `${formatOsrsSkillName(skill.skill)} ${formatCompactXp(skill.xp)} xp`).join(' · ')}
                  </Text>
                ) : null}
              </View>
            ))}
          </View>
        </SectionCard>
      ) : null}

      <SectionCard
        title={tracker.mode === 'delta' ? 'Since Last Snapshot - You vs Friends' : 'Account Snapshot - You vs Friends'}
        emoji={'⚔'}
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
                  {' '}
                  - {friend.overallXp.toLocaleString()} {tracker.mode === 'delta' ? 'xp since last snapshot' : 'total xp'}
                </Text>
              </Text>

              {!even && ahead && <Pill text={`Ahead by ${friend.diff.toLocaleString()} xp`} color={colors.success} />}
              {!even && !ahead && (
                <Pill text={`Trailing by ${Math.abs(friend.diff).toLocaleString()} xp`} color={colors.danger} />
              )}
              {even && <Pill text="Dead even" color={colors.warning} />}

              {friend.topSkills.length > 0 ? (
                <>
                  <Text style={{ fontSize: 12, color: colors.subtext, marginTop: 8, marginBottom: 4 }}>
                    {tracker.mode === 'delta' ? 'Top gains:' : 'Top skills:'}
                  </Text>
                  {friend.topSkills.map((gain) => (
                    <Text key={`${friend.name}-${gain.skill}`} style={{ fontSize: 12, color: colors.text, marginBottom: 3 }}>
                      {'•'} {gain.skill}: {gain.xp.toLocaleString()} xp (Lv{gain.level})
                    </Text>
                  ))}
                </>
              ) : tracker.mode === 'snapshot' ? (
                <Text style={{ fontSize: 12, color: colors.subtext, marginTop: 8 }}>No skill data available</Text>
              ) : null}
            </View>
          );
        })}
      </SectionCard>

      <TrackerGoalCard
        title="Goal 1 - Base 92s (Runecrafting 90) by RuneFest"
        emoji={'🎯'}
        colors={colors}
        deadlineLabel={`2026-10-03 - RuneFest (${goal1Projection.daysLeft} days left)`}
        projection={goal1Projection}
        paceColor={colors.accent}
        statRows={[{ label: 'Skills at target+', value: `${24 - tracker.baseGoalRemaining.length}/24` }]}
      >
        <Text
          style={{
            marginTop: 10,
            marginBottom: 8,
            fontSize: 12,
            fontWeight: '800',
            color: colors.text,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}
        >
          Still needed
        </Text>

        {tracker.baseGoalRemaining.slice(0, 5).map((item) => (
          <View key={item.skill} style={{ marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 12, color: colors.text, flex: 1 }}>
                <Text style={{ fontWeight: '700' }}>{item.skill}</Text> Lv{item.level} / {item.targetLevel}
              </Text>
              <View style={{ alignItems: 'flex-end', marginLeft: 12 }}>
                <Text style={{ fontSize: 12, color: colors.subtext, textAlign: 'right' }}>{item.pct.toFixed(1)}%</Text>
                <Text style={{ fontSize: 12, color: colors.subtext, textAlign: 'right' }}>
                  {item.remainingXp.toLocaleString()} xp left
                </Text>
                <Text style={{ fontSize: 12, color: colors.subtext, textAlign: 'right' }}>
                  {item.hoursLeft != null ? `${item.hoursLeft.toFixed(1)}h @ ${item.xpPerHour?.toLocaleString()} xp/hr` : 'Manual estimate'}
                </Text>
              </View>
            </View>
            <ProgressBar pct={item.pct} color={item.pct >= 80 ? colors.warning : colors.accent} colors={colors} />
          </View>
        ))}
      </TrackerGoalCard>

      <TrackerGoalCard
        title="Goal 2 - Total Level 2250 by RuneFest"
        emoji={'⛵'}
        colors={colors}
        deadlineLabel={`2026-10-03 - RuneFest (${goal2Projection.daysLeft} days left)`}
        projection={goal2Projection}
        paceColor={colors.accent}
        statRows={[
          { label: 'Current total level', value: `${tracker.totalLevel} / ${totalLevelTarget}` },
          {
            label: 'Levels still needed',
            value: `${tracker.runefestEffectiveLevelsRemaining.toFixed(2)} effective`,
          },
          ...(hasEffectiveHours ? [{ label: 'Effective hours today', value: `${tracker.effectiveHours.totalHours.toFixed(1)} h` }] : []),
        ]}
      >
        <Text style={{ fontSize: 12, color: colors.subtext, marginTop: 4 }}>
          Need{' '}
          <Text style={{ fontWeight: '700', color: colors.text }}>
            {goal2Projection.hoursPerDay !== null ? `${goal2Projection.hoursPerDay.toFixed(2)} hours/day` : 'a manual estimate'}
          </Text>{' '}
          of estimated training to hit 2250 in time
        </Text>
        <Text style={{ fontSize: 12, color: colors.subtext, marginTop: 4 }}>
          That currently works out to about{' '}
          <Text style={{ fontWeight: '700', color: colors.text }}>
            {tracker.runefestEffectiveLevelsPerDayNeeded.toFixed(2)}
          </Text>{' '}
          effective levels/day.
          {tracker.runefestLevelsPerDayNeeded > 0
            ? ` (${tracker.runefestLevelsPerDayNeeded.toFixed(2)} full levels/day)`
            : ''}
        </Text>
        <Text style={{ fontSize: 12, color: colors.subtext, marginTop: 4 }}>
          Pace check: {goal2Projection.status}
          {goal2Projection.hoursPerDay !== null ? ` at ${goal2Projection.hoursPerDay.toFixed(2)} hours/day` : ''}
        </Text>
      </TrackerGoalCard>

      <TrackerGoalCard
        title="Goal 3 - Max Cape by 33rd Birthday"
        emoji={'🎂'}
        colors={colors}
        deadlineLabel={`2027-03-15 - 33rd birthday (${goal3Projection.daysLeft} days left)`}
        projection={goal3Projection}
        paceColor="#ec4899"
        statRows={[{ label: 'Skills maxed', value: `${tracker.maxedSkills.length}/24` }]}
      >
        <ProgressBar pct={(tracker.maxedSkills.length / 24) * 100} color="#ec4899" colors={colors} />

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, marginBottom: 8 }}>
          {tracker.maxedSkills.slice(0, 8).map((skill) => (
            <View
              key={skill}
              style={{
                backgroundColor: colors.success,
                borderRadius: 999,
                paddingHorizontal: 10,
                paddingVertical: 4,
                marginRight: 6,
                marginBottom: 6,
              }}
            >
              <Text style={{ color: 'white', fontSize: 12, fontWeight: '700' }}>{skill}</Text>
            </View>
          ))}
        </View>

        {tracker.maxClosest.map((item) => (
          <View key={item.skill} style={{ marginBottom: 10 }}>
            <Text style={{ fontSize: 12, color: colors.text }}>
              <Text style={{ fontWeight: '700' }}>{item.skill}</Text> Lv{item.level}
              <Text style={{ color: colors.subtext }}> - {item.remainingXp.toLocaleString()} xp to 99</Text>
            </Text>
            <ProgressBar pct={item.pct} color="#ec4899" colors={colors} />
          </View>
        ))}
      </TrackerGoalCard>

      <SectionCard title="Hours Left Until Next Level" emoji={'⏳'} colors={colors}>
        {tracker.hoursToNextLevel.length > 0 ? (
          tracker.hoursToNextLevel.map((item) => (
            <View
              key={`${item.skill}-${item.targetLevel}`}
              style={{
                marginBottom: 12,
                paddingBottom: 12,
                borderBottomWidth: 1,
                borderBottomColor: colors.cardBorder,
              }}
            >
              <Text style={{ fontSize: 13, color: colors.text, fontWeight: '800', marginBottom: 4 }}>
                {item.skill}
                <Text style={{ color: colors.subtext, fontWeight: '400' }}>
                  {' '}
                  - Lv{item.level} to {item.targetLevel}
                </Text>
              </Text>
              <Text style={{ fontSize: 12, color: colors.subtext, marginBottom: 3 }}>
                {item.remainingXp.toLocaleString()} xp left
              </Text>
              <Text style={{ fontSize: 12, color: colors.subtext }}>
                {item.hoursLeft !== null
                  ? `${item.hoursLeft.toFixed(1)} hours at ${item.xpPerHour.toLocaleString()} xp/hr (${item.mode})`
                  : item.mode === 'trained via Slayer'
                    ? 'Trained via Slayer'
                    : `${item.mode} - no direct hourly estimate`}
              </Text>
            </View>
          ))
        ) : (
          <Text style={{ fontSize: 13, color: colors.subtext }}>No tracked next-level estimates left.</Text>
        )}
      </SectionCard>

      <SectionCard title="Milestone Alerts" emoji={'🚨'} colors={colors}>
        {tracker.milestoneAlerts.length > 0 ? (
          tracker.milestoneAlerts.map((item) => (
            <View
              key={`${item.skill}-${item.target}`}
              style={{
                marginBottom: 12,
                paddingBottom: 12,
                borderBottomWidth: 1,
                borderBottomColor: colors.cardBorder,
              }}
            >
              <Text style={{ fontSize: 13, color: colors.text, fontWeight: '800', marginBottom: 4 }}>
                {item.skill}
                <Text style={{ color: colors.subtext, fontWeight: '400' }}> - {item.target}</Text>
              </Text>
              <Text style={{ fontSize: 12, color: colors.subtext }}>
                {item.remainingXp.toLocaleString()} xp left to the next milestone
              </Text>
            </View>
          ))
        ) : (
          <Text style={{ fontSize: 13, color: colors.subtext }}>
            No tracked milestone alerts are inside the short-push window right now.
          </Text>
        )}
      </SectionCard>

      <SectionCard title="Coaching Insight" emoji={'🧠'} colors={colors}>
        <Text style={{ fontSize: 14, color: colors.text, lineHeight: 22 }}>{tracker.coachingText}</Text>
      </SectionCard>
    </>
  );
}

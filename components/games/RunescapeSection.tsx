import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import Pill from '../Pill';
import ProgressBar from '../ProgressBar';
import SectionCard from '../SectionCard';
import StatRow from '../StatRow';
import {
  LiveRunescapeTracker,
  fetchRunescapeTrackerSnapshot,
  getFallbackRunescapeTracker,
} from '../../data/osrsTracker';
import { ThemeColors } from '../../data/theme';

type RunescapeSectionProps = {
  colors: ThemeColors;
  refreshToken: number;
};

export default function RunescapeSection({ colors, refreshToken }: RunescapeSectionProps) {
  const [tracker, setTracker] = useState<LiveRunescapeTracker>(getFallbackRunescapeTracker());
  const [trackerLoading, setTrackerLoading] = useState(true);
  const [trackerError, setTrackerError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadTracker = async () => {
      setTrackerLoading(true);
      setTrackerError(null);

      try {
        const liveTracker = await fetchRunescapeTrackerSnapshot();

        if (mounted) {
          setTracker(liveTracker);
        }
      } catch (error) {
        if (mounted) {
          setTracker(getFallbackRunescapeTracker());
          setTrackerError(error instanceof Error ? error.message : 'Unable to load live OSRS stats.');
        }
      } finally {
        if (mounted) {
          setTrackerLoading(false);
        }
      }
    };

    void loadTracker();

    return () => {
      mounted = false;
    };
  }, [refreshToken]);

  const totalLevelTarget = 2250;
  const totalLevelsNeeded = Math.max(totalLevelTarget - tracker.totalLevel, 0);
  const goal1Projection = tracker.goalProjections.base90;
  const goal2Projection = tracker.goalProjections.runefest;
  const goal3Projection = tracker.goalProjections.maxCape;

  const renderPaceCheck = (projection: typeof goal1Projection, color: string) => (
    <View style={{ marginTop: 10, marginBottom: 12 }}>
      <Text style={{ fontSize: 12, fontWeight: '800', color: colors.text, marginBottom: 6 }}>
        Pace Check
      </Text>
      <ProgressBar pct={projection.progressPct} markerPct={projection.pacePct} color={color} colors={colors} height={10} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
        <Text style={{ fontSize: 11, color: colors.subtext }}>
          Actual {projection.progressPct.toFixed(1)}%
        </Text>
        <Text style={{ fontSize: 11, color: colors.subtext }}>
          Pace {projection.pacePct.toFixed(1)}%
        </Text>
      </View>
    </View>
  );

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

        <View style={{ marginTop: 14 }}>
          {tracker.topSkills.map((item) => (
            <Text key={item.skill} style={{ color: colors.heroSubtext, fontSize: 13, marginBottom: 4 }}>
              <Text style={{ fontWeight: '700' }}>{item.skill}</Text>
              {tracker.mode === 'delta' ? ': +' : ': '}
              {item.xp.toLocaleString()} xp
            </Text>
          ))}
        </View>
      </View>

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
                  {' '}
                  - {friend.overallXp.toLocaleString()} {tracker.mode === 'delta' ? 'xp since last snapshot' : 'total xp'}
                </Text>
              </Text>

              {!even && ahead && <Pill text={`Ahead by ${friend.diff.toLocaleString()} xp`} color={colors.success} />}
              {!even && !ahead && (
                <Pill text={`Trailing by ${Math.abs(friend.diff).toLocaleString()} xp`} color={colors.danger} />
              )}
              {even && <Pill text="Dead even" color={colors.warning} />}

              <Text style={{ fontSize: 12, color: colors.subtext, marginTop: 8, marginBottom: 4 }}>
                {tracker.mode === 'delta' ? 'Top gains:' : 'Top skills:'}
              </Text>

              {friend.topSkills.length > 0 ? (
                friend.topSkills.map((gain) => (
                  <Text
                    key={`${friend.name}-${gain.skill}`}
                    style={{ fontSize: 12, color: colors.text, marginBottom: 3 }}
                  >
                    {'\u2022'} {gain.skill}: {gain.xp.toLocaleString()} xp (Lv{gain.level})
                  </Text>
                ))
              ) : (
                <Text style={{ fontSize: 12, color: colors.subtext }}>No skill data available</Text>
              )}
            </View>
          );
        })}
      </SectionCard>

      <SectionCard title="Goal 1 - Base 90 All Skills" emoji={'\uD83C\uDFAF'} colors={colors}>
        <StatRow label="Deadline" value={`2026-05-22 (${goal1Projection.daysLeft} days left)`} colors={colors} />
        <StatRow label="Skills at 90+" value={`${24 - tracker.base90Remaining.length}/24`} colors={colors} />
        <StatRow
          label="Estimated grind"
          value={
            goal1Projection.hoursLeft !== null
              ? `${goal1Projection.hoursLeft.toFixed(1)} hours`
              : 'Manual estimate needed'
          }
          colors={colors}
        />
        <StatRow
          label="Required pace"
          value={
            goal1Projection.hoursPerDay !== null
              ? `${goal1Projection.hoursPerDay.toFixed(2)} h/day`
              : 'Manual estimate needed'
          }
          colors={colors}
        />

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

        {tracker.base90Remaining.map((item) => (
          <View key={item.skill} style={{ marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 12, color: colors.text, flex: 1 }}>
                <Text style={{ fontWeight: '700' }}>{item.skill}</Text> Lv{item.level}
              </Text>
              <View style={{ alignItems: 'flex-end', marginLeft: 12 }}>
                <Text style={{ fontSize: 12, color: colors.subtext, textAlign: 'right' }}>{item.pct.toFixed(1)}%</Text>
                <Text style={{ fontSize: 12, color: colors.subtext, textAlign: 'right' }}>
                  {item.remainingXp.toLocaleString()} xp left
                </Text>
                <Text style={{ fontSize: 12, color: colors.subtext, textAlign: 'right' }}>
                  {item.hoursLeft !== null
                    ? `${item.hoursLeft.toFixed(1)}h @ ${item.xpPerHour?.toLocaleString()} xp/hr`
                    : 'Manual estimate'}
                </Text>
              </View>
            </View>
            <ProgressBar pct={item.pct} color={item.pct >= 80 ? colors.warning : colors.accent} colors={colors} />
          </View>
        ))}
        {renderPaceCheck(goal1Projection, colors.accent)}
      </SectionCard>

      <SectionCard title="Goal 2 - Total Level 2250 by RuneFest" emoji={'\u26F5'} colors={colors}>
        <StatRow
          label="Deadline"
          value={`2026-10-03 - RuneFest (${goal2Projection.daysLeft} days left)`}
          colors={colors}
        />
        <StatRow
          label="Current total level"
          value={`${tracker.totalLevel} / ${totalLevelTarget}`}
          colors={colors}
        />
        <StatRow label="Levels still needed" value={`${totalLevelsNeeded}`} colors={colors} />
        <StatRow
          label="Estimated grind"
          value={
            goal2Projection.hoursLeft !== null
              ? `${goal2Projection.hoursLeft.toFixed(1)} hours`
              : 'Manual estimate needed'
          }
          colors={colors}
        />
        <StatRow
          label="Required pace"
          value={
            goal2Projection.hoursPerDay !== null
              ? `${goal2Projection.hoursPerDay.toFixed(2)} h/day`
              : 'Manual estimate needed'
          }
          colors={colors}
        />

        <Text style={{ fontSize: 12, color: colors.subtext, marginTop: 4 }}>
          Need <Text style={{ fontWeight: '700', color: colors.text }}>{tracker.runefestLevelsPerDayNeeded.toFixed(2)}</Text>{' '}
          levels/day to hit 2250 in time
        </Text>
        <Text style={{ fontSize: 12, color: colors.subtext, marginTop: 4 }}>
          Pace check: {goal2Projection.status}
          {goal2Projection.hoursPerDay !== null
            ? ` at ${goal2Projection.hoursPerDay.toFixed(2)} hours/day`
            : ''}
        </Text>
        {renderPaceCheck(goal2Projection, colors.accent)}
      </SectionCard>

      <SectionCard title="Goal 3 - Max Cape by 33rd Birthday" emoji={'\uD83C\uDF82'} colors={colors}>
        <StatRow
          label="Deadline"
          value={`2027-03-15 - 33rd birthday (${goal3Projection.daysLeft} days left)`}
          colors={colors}
        />
        <StatRow label="Skills maxed" value={`${tracker.maxedSkills.length}/24`} colors={colors} />
        <StatRow
          label="Estimated grind"
          value={
            goal3Projection.hoursLeft !== null
              ? `${goal3Projection.hoursLeft.toFixed(1)} hours`
              : 'Manual estimate needed'
          }
          colors={colors}
        />
        <StatRow
          label="Required pace"
          value={
            goal3Projection.hoursPerDay !== null
              ? `${goal3Projection.hoursPerDay.toFixed(2)} h/day`
              : 'Manual estimate needed'
          }
          colors={colors}
        />
        <ProgressBar pct={(tracker.maxedSkills.length / 24) * 100} color="#ec4899" colors={colors} />

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, marginBottom: 8 }}>
          {tracker.maxedSkills.map((skill) => (
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
              <Text style={{ color: colors.subtext }}>
                {' '}
                - {item.remainingXp.toLocaleString()} xp to 99
              </Text>
            </Text>
            <ProgressBar pct={item.pct} color="#ec4899" colors={colors} />
          </View>
        ))}
        {renderPaceCheck(goal3Projection, '#ec4899')}
      </SectionCard>

      <SectionCard title="Hours Left Until Next Level" emoji={'\u23F3'} colors={colors}>
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

      <SectionCard title="Milestone Alerts" emoji={'\uD83D\uDEA8'} colors={colors}>
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

      <SectionCard title="Coaching Insight" emoji={'\uD83E\uDDE0'} colors={colors}>
        <Text style={{ fontSize: 14, color: colors.text, lineHeight: 22 }}>{tracker.coachingText}</Text>
      </SectionCard>
    </>
  );
}

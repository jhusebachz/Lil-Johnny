import { ReactNode } from 'react';
import { Text, View } from 'react-native';

import ProgressBar from '../ProgressBar';
import SectionCard from '../SectionCard';
import StatRow from '../StatRow';
import { ThemeColors } from '../../data/theme';
import type { GoalProjection } from '../../data/osrsTrackerTypes';

type TrackerGoalCardProps = {
  children?: ReactNode;
  colors: ThemeColors;
  deadlineLabel: string;
  emoji: string;
  paceColor: string;
  projection: GoalProjection;
  statRows?: {
    label: string;
    value: string;
  }[];
  title: string;
};

export default function TrackerGoalCard({
  children,
  colors,
  deadlineLabel,
  emoji,
  paceColor,
  projection,
  statRows = [],
  title,
}: TrackerGoalCardProps) {
  return (
    <SectionCard title={title} emoji={emoji} colors={colors}>
      <StatRow label="Deadline" value={deadlineLabel} colors={colors} />
      {statRows.map((row) => (
        <StatRow key={`${title}-${row.label}`} label={row.label} value={row.value} colors={colors} />
      ))}
      <StatRow
        label="Estimated grind"
        value={projection.hoursLeft !== null ? `${projection.hoursLeft.toFixed(1)} hours` : 'Manual estimate needed'}
        colors={colors}
      />
      <StatRow
        label="Required pace"
        value={projection.hoursPerDay !== null ? `${projection.hoursPerDay.toFixed(2)} h/day` : 'Manual estimate needed'}
        colors={colors}
      />
      {children}
      <View style={{ marginTop: 10, marginBottom: 12 }}>
        <Text style={{ fontSize: 12, fontWeight: '800', color: colors.text, marginBottom: 6 }}>Pace Check</Text>
        <ProgressBar pct={projection.progressPct} markerPct={projection.pacePct} color={paceColor} colors={colors} height={10} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
          <Text style={{ fontSize: 11, color: colors.subtext }}>Actual {projection.progressPct.toFixed(1)}%</Text>
          <Text style={{ fontSize: 11, color: colors.subtext }}>Pace {projection.pacePct.toFixed(1)}%</Text>
        </View>
      </View>
    </SectionCard>
  );
}

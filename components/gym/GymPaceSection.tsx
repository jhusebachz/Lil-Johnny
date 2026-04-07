import { Text, View } from 'react-native';

import { formatLoopRunTime } from '../../data/lifeTrackerData';
import { ThemeColors } from '../../data/theme';
import ProgressBar from '../ProgressBar';
import SectionCard from '../SectionCard';

type GymPaceSectionProps = {
  colors: ThemeColors;
  latestWeightLabel: string;
  loopRunGoalPct: number;
  weeklyGymPacePct: number;
  weeklyGymPct: number;
  weightGoalPacePct: number;
  weightGoalPct: number;
  bestLoopRunSeconds?: number;
  goalWeightLb: number;
};

export default function GymPaceSection({
  colors,
  latestWeightLabel,
  loopRunGoalPct,
  weeklyGymPacePct,
  weeklyGymPct,
  weightGoalPacePct,
  weightGoalPct,
  bestLoopRunSeconds,
  goalWeightLb,
}: GymPaceSectionProps) {
  return (
    <SectionCard title="Health Pace" emoji={'📈'} colors={colors}>
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 14, color: colors.text, fontWeight: '800', marginBottom: 6 }}>Weekly gym target</Text>
        <ProgressBar pct={weeklyGymPct} markerPct={weeklyGymPacePct} color={colors.accent} colors={colors} height={10} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 11, color: colors.subtext }}>Actual {weeklyGymPct.toFixed(1)}%</Text>
          <Text style={{ fontSize: 11, color: colors.subtext }}>Pace {weeklyGymPacePct.toFixed(1)}%</Text>
        </View>
      </View>

      <View>
        <Text style={{ fontSize: 14, color: colors.text, fontWeight: '800', marginBottom: 6 }}>Weight loss goal</Text>
        <ProgressBar pct={weightGoalPct} markerPct={weightGoalPacePct} color={colors.warning} colors={colors} height={10} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
          <Text style={{ fontSize: 11, color: colors.subtext }}>Actual {weightGoalPct.toFixed(1)}%</Text>
          <Text style={{ fontSize: 11, color: colors.subtext }}>Pace {weightGoalPacePct.toFixed(1)}%</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
          <Text style={{ fontSize: 11, color: colors.subtext }}>{latestWeightLabel}</Text>
          <Text style={{ fontSize: 11, color: colors.subtext }}>Target {goalWeightLb} lb</Text>
        </View>
      </View>

      <View>
        <Text style={{ fontSize: 14, color: colors.text, fontWeight: '800', marginBottom: 6 }}>Loop run sub-9 goal</Text>
        <ProgressBar pct={loopRunGoalPct} color={colors.success} colors={colors} height={10} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 11, color: colors.subtext }}>
            {bestLoopRunSeconds !== undefined ? `Best ${formatLoopRunTime(bestLoopRunSeconds)}` : 'No run logged'}
          </Text>
          <Text style={{ fontSize: 11, color: colors.subtext }}>Target 9:00</Text>
        </View>
      </View>
    </SectionCard>
  );
}

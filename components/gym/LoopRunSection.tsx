import { Pressable, Text, TextInput, View } from 'react-native';

import { LoopRunEntry, formatLoopRunTime } from '../../data/lifeTrackerData';
import { ThemeColors } from '../../data/theme';
import SectionCard from '../SectionCard';

type LoopRunSectionProps = {
  bestLoopRun?: LoopRunEntry;
  colors: ThemeColors;
  draftLoopRun: string;
  recentLoopRuns: LoopRunEntry[];
  totalLoopRuns: number;
  onDraftLoopRunChange: (value: string) => void;
  onLogLoopRun: () => void;
};

export default function LoopRunSection({
  bestLoopRun,
  colors,
  draftLoopRun,
  recentLoopRuns,
  totalLoopRuns,
  onDraftLoopRunChange,
  onLogLoopRun,
}: LoopRunSectionProps) {
  return (
    <SectionCard title="Loop Run Tracker" emoji={'🏃'} colors={colors}>
      <Text style={{ fontSize: 13, color: colors.text, fontWeight: '800', marginBottom: 4 }}>
        Best time: {bestLoopRun ? formatLoopRunTime(bestLoopRun.timeSeconds) : 'No run logged yet'}
      </Text>
      <Text style={{ fontSize: 13, color: colors.subtext, marginBottom: 12 }}>Total loop runs logged: {totalLoopRuns}</Text>

      <TextInput
        value={draftLoopRun}
        onChangeText={onDraftLoopRunChange}
        placeholder="8:57 or 537"
        placeholderTextColor={colors.subtext}
        style={{
          borderWidth: 1,
          borderColor: colors.inputBorder,
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 10,
          fontSize: 15,
          color: colors.text,
          backgroundColor: colors.inputBackground,
          marginBottom: 12,
        }}
      />
      <Pressable
        onPress={onLogLoopRun}
        style={{
          borderRadius: 12,
          backgroundColor: colors.accent,
          paddingVertical: 12,
          paddingHorizontal: 14,
          marginBottom: 14,
        }}
      >
        <Text style={{ color: 'white', textAlign: 'center', fontWeight: '800' }}>Log loop run</Text>
      </Pressable>

      {recentLoopRuns.map((run) => (
        <View
          key={run.id}
          style={{
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.cardBorder,
            backgroundColor: colors.inputBackground,
            padding: 12,
            marginBottom: 10,
          }}
        >
          <Text style={{ color: colors.text, fontSize: 15, fontWeight: '800', marginBottom: 2 }}>
            {formatLoopRunTime(run.timeSeconds)}
          </Text>
          <Text style={{ color: colors.subtext, fontSize: 13 }}>{run.label}</Text>
        </View>
      ))}
    </SectionCard>
  );
}

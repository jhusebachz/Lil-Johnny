import { Pressable, Text, TextInput, View } from 'react-native';

import { WeightEntry } from '../../data/lifeTrackerData';
import { ThemeColors } from '../../data/theme';
import SectionCard from '../SectionCard';

type BodyMetricsSectionProps = {
  colors: ThemeColors;
  draftWeight: string;
  goalWeightDelta: number | null;
  goalWeightLb: number;
  latestWeight?: WeightEntry;
  recentWeights: WeightEntry[];
  weightMax: number;
  weightMin: number;
  onDraftWeightChange: (value: string) => void;
  onLogWeight: () => void;
};

export default function BodyMetricsSection({
  colors,
  draftWeight,
  goalWeightDelta,
  goalWeightLb,
  latestWeight,
  recentWeights,
  weightMax,
  weightMin,
  onDraftWeightChange,
  onLogWeight,
}: BodyMetricsSectionProps) {
  return (
    <SectionCard title="Body Metrics" emoji={'⚖'} colors={colors}>
      <Text style={{ fontSize: 13, color: colors.text, fontWeight: '800', marginBottom: 10 }}>
        Latest weight: {latestWeight ? `${latestWeight.weight.toFixed(1)} lb` : 'No entries yet'}
      </Text>
      <Text style={{ fontSize: 12, color: colors.subtext, marginBottom: 12 }}>
        2026 goal weight: {goalWeightLb} lb
        {goalWeightDelta !== null
          ? goalWeightDelta === 0
            ? ' | On target'
            : ` | ${Math.abs(goalWeightDelta).toFixed(1)} lb ${goalWeightDelta > 0 ? 'above' : 'below'} target`
          : ''}
      </Text>

      <View
        style={{
          height: 190,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: colors.cardBorder,
          backgroundColor: colors.inputBackground,
          marginBottom: 12,
          overflow: 'hidden',
          paddingHorizontal: 12,
          paddingVertical: 12,
        }}
      >
        {[0.2, 0.5, 0.8].map((line) => (
          <View
            key={line}
            style={{
              position: 'absolute',
              left: 12,
              right: 12,
              bottom: 12 + line * 150,
              height: 1,
              backgroundColor: colors.cardBorder,
            }}
          />
        ))}
        <View
          style={{
            position: 'absolute',
            left: 12,
            right: 12,
            bottom: 12,
            height: 1,
            backgroundColor: colors.cardBorder,
          }}
        />

        {recentWeights.map((entry, index) => {
          const normalizedY = weightMax === weightMin ? 0.5 : (entry.weight - weightMin) / (weightMax - weightMin);
          const normalizedX = recentWeights.length === 1 ? 0.5 : index / Math.max(recentWeights.length - 1, 1);

          return (
            <View
              key={entry.id}
              style={{
                position: 'absolute',
                left: `${normalizedX * 100}%`,
                bottom: 12 + normalizedY * 150,
                marginLeft: -5,
                marginBottom: -5,
                width: 10,
                height: 10,
                borderRadius: 999,
                backgroundColor: colors.accent,
                borderWidth: 2,
                borderColor: colors.card,
              }}
            />
          );
        })}
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
        <Text style={{ color: colors.subtext, fontSize: 10 }}>{recentWeights[0]?.label.split(',')[0] ?? ''}</Text>
        <Text style={{ color: colors.subtext, fontSize: 10 }}>{recentWeights.at(-1)?.label.split(',')[0] ?? ''}</Text>
      </View>

      <TextInput
        value={draftWeight}
        onChangeText={onDraftWeightChange}
        keyboardType="decimal-pad"
        placeholder="Log weight"
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
        onPress={onLogWeight}
        style={{
          borderRadius: 12,
          backgroundColor: colors.accent,
          paddingVertical: 12,
          paddingHorizontal: 14,
        }}
      >
        <Text style={{ color: 'white', textAlign: 'center', fontWeight: '800' }}>Add weight entry</Text>
      </Pressable>
    </SectionCard>
  );
}

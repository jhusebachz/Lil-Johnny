import { useMemo, useState } from 'react';
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
  const [chartWidth, setChartWidth] = useState(0);
  const chartHeight = 150;
  const pointSize = 10;
  const chartPoints = useMemo(
    () =>
      recentWeights.map((entry, index) => {
        const normalizedY = weightMax === weightMin ? 0.5 : (entry.weight - weightMin) / (weightMax - weightMin);
        const normalizedX = recentWeights.length === 1 ? 0.5 : index / Math.max(recentWeights.length - 1, 1);

        return {
          entry,
          x: chartWidth * normalizedX,
          y: chartHeight - normalizedY * chartHeight,
        };
      }),
    [chartWidth, recentWeights, weightMax, weightMin]
  );

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
        onLayout={(event) => {
          setChartWidth(Math.max(event.nativeEvent.layout.width - 24, 0));
        }}
      >
        {[0.2, 0.5, 0.8].map((line) => (
          <View
            key={line}
            style={{
              position: 'absolute',
              left: 12,
              right: 12,
              bottom: 12 + line * chartHeight,
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

        {chartPoints.slice(1).map((point, index) => {
          const previousPoint = chartPoints[index];
          const deltaX = point.x - previousPoint.x;
          const deltaY = point.y - previousPoint.y;
          const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
          const midpointX = (previousPoint.x + point.x) / 2;
          const midpointY = (previousPoint.y + point.y) / 2;

          return (
            <View
              key={`${previousPoint.entry.id}-${point.entry.id}`}
              style={{
                position: 'absolute',
                left: 12 + midpointX - length / 2,
                top: 12 + midpointY - 1,
                width: length,
                height: 2,
                backgroundColor: colors.accent,
                borderRadius: 999,
                transform: [{ rotate: `${(Math.atan2(deltaY, deltaX) * 180) / Math.PI}deg` }],
              }}
            />
          );
        })}

        {chartPoints.map((point) => (
          <View
            key={point.entry.id}
            style={{
              position: 'absolute',
              left: 12 + point.x - pointSize / 2,
              top: 12 + point.y - pointSize / 2,
              width: pointSize,
              height: pointSize,
              borderRadius: 999,
              backgroundColor: colors.accent,
              borderWidth: 2,
              borderColor: colors.card,
            }}
          />
        ))}
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

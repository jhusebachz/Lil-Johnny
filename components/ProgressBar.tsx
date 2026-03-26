import { View } from 'react-native';
import { ThemeColors } from '../data/theme';

type ProgressBarProps = {
  pct: number;
  color?: string;
  colors: ThemeColors;
  markerPct?: number;
  height?: number;
};

export default function ProgressBar({
  pct,
  color,
  colors,
  markerPct,
  height = 8,
}: ProgressBarProps) {
  const safePct = Math.max(0, Math.min(100, pct));
  const safeMarkerPct =
    typeof markerPct === 'number' ? Math.max(0, Math.min(100, markerPct)) : null;

  return (
    <View
      style={{
        backgroundColor: colors.cardBorder,
        borderRadius: 999,
        height,
        marginTop: 6,
        marginBottom: 8,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          backgroundColor: color ?? colors.accent,
          width: `${safePct}%`,
          height,
          borderRadius: 999,
        }}
      />
      {safeMarkerPct !== null ? (
        <View
          style={{
            position: 'absolute',
            left: `${safeMarkerPct}%`,
            marginLeft: -1,
            top: -2,
            bottom: -2,
            width: 2,
            borderRadius: 999,
            backgroundColor: colors.text,
            opacity: 0.9,
          }}
        />
      ) : null}
    </View>
  );
}

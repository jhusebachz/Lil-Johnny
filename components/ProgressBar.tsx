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
  const safePct = Number.isFinite(pct) ? Math.max(0, Math.min(100, pct)) : 0;
  const safeMarkerPct =
    typeof markerPct === 'number' && Number.isFinite(markerPct) ? Math.max(0, Math.min(100, markerPct)) : null;

  return (
    <View
      style={{
        marginTop: 6,
        marginBottom: 8,
        minHeight: height + 6,
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          backgroundColor: colors.cardBorder,
          borderRadius: 999,
          height,
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
      </View>
      {safeMarkerPct !== null ? (
        <View
          style={{
            position: 'absolute',
            left: `${safeMarkerPct}%`,
            marginLeft: -1.5,
            top: 0,
            bottom: 0,
            width: 3,
            borderRadius: 999,
            backgroundColor: '#ffffff',
            borderWidth: 1,
            borderColor: 'rgba(15, 23, 42, 0.18)',
            opacity: 0.98,
          }}
        />
      ) : null}
    </View>
  );
}

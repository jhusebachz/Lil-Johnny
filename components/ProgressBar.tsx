import { View } from 'react-native';
import { ThemeColors } from '../data/theme';

type ProgressBarProps = {
  pct: number;
  color?: string;
  colors: ThemeColors;
};

export default function ProgressBar({
  pct,
  color,
  colors,
}: ProgressBarProps) {
  const safePct = Math.max(0, Math.min(100, pct));

  return (
    <View
      style={{
        backgroundColor: colors.cardBorder,
        borderRadius: 999,
        height: 8,
        marginTop: 6,
        marginBottom: 8,
      }}
    >
      <View
        style={{
          backgroundColor: color ?? colors.accent,
          width: `${safePct}%`,
          height: 8,
          borderRadius: 999,
        }}
      />
    </View>
  );
}
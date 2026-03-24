import { Text, View } from 'react-native';
import { ThemeColors } from '../data/theme';

type StatRowProps = {
  label: string;
  value: string;
  muted?: boolean;
  colors: ThemeColors;
};

export default function StatRow({
  label,
  value,
  muted = false,
  colors,
}: StatRowProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 4,
      }}
    >
      <Text
        style={{
          color: colors.subtext,
          fontSize: 13,
          width: '58%',
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          color: muted ? colors.subtext : colors.text,
          fontSize: 13,
          fontWeight: '700',
          textAlign: 'right',
          width: '42%',
        }}
      >
        {value}
      </Text>
    </View>
  );
}
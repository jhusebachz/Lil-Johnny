import { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { ThemeColors } from '../data/theme';

type SectionCardProps = {
  title: string;
  emoji: string;
  children: ReactNode;
  colors: ThemeColors;
};

export default function SectionCard({
  title,
  emoji,
  children,
  colors,
}: SectionCardProps) {
  return (
    <View
      style={{
        marginBottom: 18,
        backgroundColor: colors.card,
        borderRadius: 14,
        borderLeftWidth: 5,
        borderLeftColor: colors.accent,
        borderWidth: 1,
        borderColor: colors.cardBorder,
        padding: 16,
      }}
    >
      <Text
        style={{
          fontSize: 14,
          fontWeight: '800',
          color: colors.text,
          marginBottom: 12,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}
      >
        {emoji} {title}
      </Text>
      {children}
    </View>
  );
}
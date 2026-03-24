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
        overflow: 'hidden',
      }}
    >
      {colors.metallicGlint ? (
        <>
          <View
            style={{
              position: 'absolute',
              width: 120,
              height: 120,
              borderRadius: 999,
              backgroundColor: 'rgba(255,255,255,0.04)',
              top: -46,
              right: -34,
            }}
          />
          <View
            style={{
              position: 'absolute',
              width: 54,
              height: 54,
              borderRadius: 999,
              backgroundColor: 'rgba(255,255,255,0.03)',
              bottom: -18,
              left: -10,
            }}
          />
        </>
      ) : null}
      {!colors.metallicGlint && colors.accent === '#22c55e' ? (
        <View
          style={{
            position: 'absolute',
            width: 140,
            height: 140,
            borderRadius: 999,
            backgroundColor: 'rgba(34,197,94,0.05)',
            top: -50,
            right: -40,
          }}
        />
      ) : null}
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

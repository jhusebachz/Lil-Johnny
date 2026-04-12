import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { dailyMobilityRoutine, formatMobilityTarget, quickResetItemIds } from '../../data/mobilityRoutine';
import { ThemeColors } from '../../data/theme';
import SectionCard from '../SectionCard';

type MobilityRoutineSectionProps = {
  colors: ThemeColors;
};

export default function MobilityRoutineSection({ colors }: MobilityRoutineSectionProps) {
  const [guideOpen, setGuideOpen] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const quickResetItems = useMemo(
    () =>
      quickResetItemIds
        .map((itemId) =>
          dailyMobilityRoutine.sections.flatMap((section) => section.items).find((item) => item.id === itemId)
        )
        .filter((item): item is NonNullable<typeof item> => item !== undefined),
    []
  );

  return (
    <SectionCard title="Stretching Guide" emoji={'\uD83E\uDDD8'} colors={colors}>
      <Pressable
        onPress={() => setGuideOpen((current) => !current)}
        style={{
          borderRadius: 14,
          borderWidth: 1,
          borderColor: colors.accent,
          backgroundColor: guideOpen ? colors.accentSoft : colors.card,
          paddingVertical: 14,
          paddingHorizontal: 16,
          marginBottom: guideOpen ? 16 : 0,
        }}
      >
        <Text style={{ color: colors.text, fontSize: 15, fontWeight: '800', textAlign: 'center' }}>
          {guideOpen ? 'Hide Stretching Guide' : 'Stretching Guide'}
        </Text>
      </Pressable>

      {guideOpen ? (
        <>
          <View
            style={{
              borderWidth: 1,
              borderColor: colors.cardBorder,
              borderRadius: 14,
              backgroundColor: colors.inputBackground,
              padding: 12,
              marginBottom: 16,
            }}
          >
            <Text style={{ color: colors.text, fontSize: 14, fontWeight: '800', marginBottom: 10 }}>Quick version</Text>
            {quickResetItems.map((item) => (
              <View
                key={item.id}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  gap: 12,
                  marginBottom: item.id === quickResetItems.at(-1)?.id ? 0 : 8,
                }}
              >
                <Text style={{ color: colors.text, fontSize: 13, fontWeight: '700', flex: 1 }}>{item.name}</Text>
                <Text style={{ color: colors.accent, fontSize: 12, fontWeight: '700' }}>{formatMobilityTarget(item)}</Text>
              </View>
            ))}
          </View>

          {dailyMobilityRoutine.sections.map((section) => {
            const isOpen = openSections[section.id] ?? false;

            return (
              <View
                key={section.id}
                style={{
                  borderWidth: 1,
                  borderColor: colors.cardBorder,
                  borderRadius: 14,
                  backgroundColor: colors.inputBackground,
                  padding: 12,
                  marginBottom: 12,
                }}
              >
                <Pressable
                  onPress={() =>
                    setOpenSections((current) => ({
                      ...current,
                      [section.id]: !(current[section.id] ?? false),
                    }))
                  }
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontSize: 15, fontWeight: '800', marginBottom: 4 }}>
                      {section.title}
                    </Text>
                    <Text style={{ color: colors.subtext, fontSize: 12 }}>{section.items.length} movements</Text>
                  </View>
                  <Text style={{ color: colors.accent, fontSize: 12, fontWeight: '800' }}>
                    {isOpen ? 'Hide' : 'Open'}
                  </Text>
                </Pressable>

                {isOpen ? (
                  <View style={{ marginTop: 12 }}>
                    {section.items.map((item) => (
                      <View
                        key={item.id}
                        style={{
                          borderWidth: 1,
                          borderColor: colors.cardBorder,
                          borderRadius: 12,
                          backgroundColor: colors.card,
                          padding: 12,
                          marginBottom: item.id === section.items.at(-1)?.id ? 0 : 10,
                        }}
                      >
                        <Text style={{ color: colors.text, fontSize: 14, fontWeight: '800', marginBottom: 4 }}>
                          {item.name}
                        </Text>
                        <Text style={{ color: colors.accent, fontSize: 12, fontWeight: '700', marginBottom: 6 }}>
                          {formatMobilityTarget(item)}
                        </Text>
                        <Text style={{ color: colors.subtext, fontSize: 12, lineHeight: 18, marginBottom: 6 }}>
                          {item.instructions[0]}
                        </Text>
                        {item.cues?.length ? (
                          <Text style={{ color: colors.subtext, fontSize: 11, lineHeight: 16 }}>
                            {item.cues.join(' | ')}
                          </Text>
                        ) : null}
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            );
          })}

          <Text style={{ color: colors.subtext, fontSize: 11, lineHeight: 18 }}>
            Stop if you get sharp pain, numbness, radiating pain, dizziness, or worse jaw locking.
          </Text>
        </>
      ) : null}
    </SectionCard>
  );
}

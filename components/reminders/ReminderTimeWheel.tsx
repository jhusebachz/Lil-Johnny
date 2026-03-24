import { useEffect, useRef } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { formatReminderTime, parseReminderTime } from '../../data/reminders';
import { ThemeColors } from '../../data/theme';

const hourOptions = Array.from({ length: 12 }, (_, index) => String(index + 1));
const minuteOptions = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, '0'));
const meridiemOptions = ['AM', 'PM'] as const;
const WHEEL_ITEM_HEIGHT = 40;
const WHEEL_HEIGHT = WHEEL_ITEM_HEIGHT * 5;

function TimeWheelColumn({
  values,
  selectedValue,
  onChange,
  colors,
}: {
  values: string[];
  selectedValue: string;
  onChange: (value: string) => void;
  colors: ThemeColors;
}) {
  const scrollRef = useRef<ScrollView>(null);
  const wheelPadding = (WHEEL_HEIGHT - WHEEL_ITEM_HEIGHT) / 2;

  useEffect(() => {
    const selectedIndex = Math.max(values.indexOf(selectedValue), 0);

    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        y: selectedIndex * WHEEL_ITEM_HEIGHT,
        animated: false,
      });
    });
  }, [selectedValue, values]);

  const snapToValue = (offsetY: number) => {
    const rawIndex = Math.round(offsetY / WHEEL_ITEM_HEIGHT);
    const index = Math.max(0, Math.min(values.length - 1, rawIndex));
    const nextValue = values[index];

    scrollRef.current?.scrollTo({
      y: index * WHEEL_ITEM_HEIGHT,
      animated: true,
    });

    if (nextValue !== selectedValue) {
      onChange(nextValue);
    }
  };

  return (
    <View
      style={{
        flex: 1,
        height: WHEEL_HEIGHT,
        borderRadius: 10,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.inputBorder,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: wheelPadding,
          height: WHEEL_ITEM_HEIGHT,
          borderTopWidth: 1,
          borderBottomWidth: 1,
          borderColor: colors.accent,
          backgroundColor: colors.accentSoft,
          zIndex: 0,
        }}
      />
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={WHEEL_ITEM_HEIGHT}
        decelerationRate="fast"
        nestedScrollEnabled
        contentContainerStyle={{ paddingVertical: wheelPadding }}
        style={{ zIndex: 1 }}
        onMomentumScrollEnd={(event) => snapToValue(event.nativeEvent.contentOffset.y)}
      >
        {values.map((value) => {
          const selected = value === selectedValue;

          return (
            <View
              key={value}
              style={{
                height: WHEEL_ITEM_HEIGHT,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  color: selected ? colors.heroText : colors.subtext,
                  fontSize: selected ? 18 : 15,
                  fontWeight: selected ? '800' : '500',
                }}
              >
                {value}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

type ReminderTimeWheelProps = {
  time: string;
  onChange: (value: string) => void;
  colors: ThemeColors;
};

export default function ReminderTimeWheel({ time, onChange, colors }: ReminderTimeWheelProps) {
  const timeParts = parseReminderTime(time) ?? { hour: 6, minute: '00', meridiem: 'PM' as const };

  return (
    <View
      style={{
        backgroundColor: colors.inputBackground,
        borderWidth: 1,
        borderColor: colors.inputBorder,
        borderRadius: 10,
        padding: 12,
        marginBottom: 10,
      }}
    >
      <Text style={{ fontSize: 16, color: colors.text, fontWeight: '800', marginBottom: 10 }}>{time}</Text>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TimeWheelColumn
          values={hourOptions}
          selectedValue={String(timeParts.hour)}
          onChange={(hour) => onChange(formatReminderTime(Number(hour), timeParts.minute, timeParts.meridiem))}
          colors={colors}
        />
        <TimeWheelColumn
          values={minuteOptions}
          selectedValue={timeParts.minute}
          onChange={(minute) => onChange(formatReminderTime(timeParts.hour, minute, timeParts.meridiem))}
          colors={colors}
        />
        <TimeWheelColumn
          values={[...meridiemOptions]}
          selectedValue={timeParts.meridiem}
          onChange={(meridiem) =>
            onChange(formatReminderTime(timeParts.hour, timeParts.minute, meridiem as 'AM' | 'PM'))
          }
          colors={colors}
        />
      </View>
    </View>
  );
}

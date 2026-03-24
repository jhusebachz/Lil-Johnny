import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SectionCard from '../../components/SectionCard';
import { useAppSettings } from '../../context/AppSettingsContext';
import {
  formatReminderTime,
  formatUpcomingReminder,
  getNextReminder,
  parseReminderTime,
} from '../../data/reminders';
import { getThemeColors } from '../../data/theme';

const hourOptions = Array.from({ length: 12 }, (_, index) => String(index + 1));
const minuteOptions = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, '0'));
const meridiemOptions = ['AM', 'PM'] as const;
const WHEEL_ITEM_HEIGHT = 40;
const WHEEL_HEIGHT = WHEEL_ITEM_HEIGHT * 5;

function ReminderToggle({
  enabled,
  onPress,
  colors,
}: {
  enabled: boolean;
  onPress: () => void;
  colors: ReturnType<typeof getThemeColors>;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        width: 52,
        height: 30,
        backgroundColor: enabled ? colors.success : colors.inputBorder,
        borderRadius: 999,
        padding: 3,
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 999,
          backgroundColor: 'white',
          alignSelf: enabled ? 'flex-end' : 'flex-start',
        }}
      />
    </Pressable>
  );
}

function TimeWheelColumn({
  values,
  selectedValue,
  onChange,
  colors,
}: {
  values: string[];
  selectedValue: string;
  onChange: (value: string) => void;
  colors: ReturnType<typeof getThemeColors>;
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

function ReminderTimeWheel({
  time,
  onChange,
  colors,
}: {
  time: string;
  onChange: (value: string) => void;
  colors: ReturnType<typeof getThemeColors>;
}) {
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

export default function Reminders() {
  const {
    reminders,
    addReminder,
    updateReminder,
    theme,
    preferences,
    notificationAccess,
    requestNotificationAccess,
    triggerHaptic,
  } = useAppSettings();
  const colors = getThemeColors(theme);
  const enabledReminders = reminders.filter((reminder) => reminder.enabled);
  const nextReminderEntry = getNextReminder(reminders);
  const [expandedReminderId, setExpandedReminderId] = useState<string | null>(null);
  const [draftReminderTime, setDraftReminderTime] = useState<string | null>(null);
  const expandedReminder = reminders.find((reminder) => reminder.id === expandedReminderId) ?? null;
  const nextReminderLabel = nextReminderEntry
    ? formatUpcomingReminder(nextReminderEntry.occurrence)
    : 'None';

  const openReminderTimePicker = async (reminderId: string, time: string) => {
    await triggerHaptic();
    setDraftReminderTime(time);
    setExpandedReminderId(reminderId);
  };

  const closeReminderTimePicker = () => {
    if (expandedReminder && draftReminderTime && expandedReminder.time !== draftReminderTime) {
      updateReminder(expandedReminder.id, { time: draftReminderTime });
    }

    setExpandedReminderId(null);
    setDraftReminderTime(null);
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={16}
      >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
      >
        <View
          style={{
            backgroundColor: colors.hero,
            borderRadius: 16,
            padding: 20,
            marginBottom: 18,
          }}
        >
          <Text
            style={{
              color: colors.heroSubtext,
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: 1,
              marginBottom: 6,
            }}
          >
            Reminder Center
          </Text>
          <Text style={{ color: colors.heroText, fontSize: 28, fontWeight: '800', marginBottom: 10 }}>
            Let&apos;s keep you on track
          </Text>
          <Text style={{ color: colors.heroSubtext, fontSize: 15, lineHeight: 22, marginBottom: 14 }}>
            Keep your schedule clear, visible, and easy to adjust as the week changes.
          </Text>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View
              style={{
                flex: 1,
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderRadius: 16,
                padding: 14,
              }}
            >
              <Text style={{ color: colors.heroSubtext, fontSize: 11, marginBottom: 4 }}>Active now</Text>
              <Text style={{ color: colors.heroText, fontSize: 16, fontWeight: '800' }}>
                {enabledReminders.length}/{reminders.length}
              </Text>
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderRadius: 16,
                padding: 14,
              }}
            >
              <Text style={{ color: colors.heroSubtext, fontSize: 11, marginBottom: 4 }}>Next up</Text>
              <Text style={{ color: colors.heroText, fontSize: 16, fontWeight: '800' }}>
                {nextReminderLabel}
              </Text>
            </View>
          </View>
        </View>

        <SectionCard title="Reminder Status" emoji={'\u23F0'} colors={colors}>
          <Text style={{ fontSize: 14, color: colors.subtext, lineHeight: 22, marginBottom: 10 }}>
            Notifications are {preferences.notificationsEnabled ? 'enabled' : 'disabled'} globally, so
            reminder alerts will follow that master setting.
          </Text>
          <Text style={{ fontSize: 13, color: colors.text, marginBottom: 8 }}>
            Alert access: {notificationAccess}
          </Text>
          <Text style={{ fontSize: 13, color: colors.text }}>
            Next tracked reminder:{' '}
            {nextReminderEntry
              ? `${nextReminderEntry.reminder.topic} at ${formatUpcomingReminder(nextReminderEntry.occurrence)}`
              : 'None'}
          </Text>
          <Text style={{ fontSize: 12, color: colors.subtext, marginTop: 10, lineHeight: 18 }}>
            Phone alerts are scheduled directly on-device. Browser alerts work while the app stays open in the tab.
          </Text>
          {notificationAccess !== 'granted' ? (
            <Pressable
              onPress={async () => {
                await triggerHaptic();
                await requestNotificationAccess();
              }}
              style={{
                marginTop: 12,
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderRadius: 10,
                backgroundColor: colors.accent,
                alignSelf: 'flex-start',
              }}
            >
              <Text style={{ color: 'white', fontWeight: '700' }}>Allow reminder alerts</Text>
            </Pressable>
          ) : null}
        </SectionCard>

        <SectionCard title="Reminders" emoji={'\uD83D\uDCDD'} colors={colors}>
          <Pressable
            onPress={async () => {
              await triggerHaptic();
              const nextReminder = addReminder();
              await openReminderTimePicker(nextReminder.id, nextReminder.time);
            }}
            style={{
              alignSelf: 'flex-start',
              paddingVertical: 10,
              paddingHorizontal: 12,
              borderRadius: 10,
              backgroundColor: colors.accent,
              marginBottom: 14,
            }}
          >
            <Text style={{ color: 'white', fontWeight: '800' }}>Add reminder</Text>
          </Pressable>

          {reminders.map((reminder) => (
            <View
              key={reminder.id}
              style={{
                backgroundColor: colors.card,
                borderRadius: 12,
                padding: 14,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: colors.cardBorder,
              }}
            >
              <Text style={{ fontSize: 13, color: colors.subtext, marginBottom: 6 }}>Topic</Text>
              <TextInput
                value={reminder.topic}
                onChangeText={(text) => updateReminder(reminder.id, { topic: text })}
                placeholder="Reminder topic"
                placeholderTextColor={colors.subtext}
                style={{
                  borderWidth: 1,
                  borderColor: colors.inputBorder,
                  borderRadius: 10,
                  paddingHorizontal: 10,
                  paddingVertical: 10,
                  fontSize: 14,
                  color: colors.text,
                  marginBottom: 10,
                  backgroundColor: colors.inputBackground,
                }}
              />

              <Text style={{ fontSize: 13, color: colors.subtext, marginBottom: 6 }}>Time</Text>
              <Pressable
                onPress={async () => {
                  await openReminderTimePicker(reminder.id, reminder.time);
                }}
                style={{
                  backgroundColor: colors.inputBackground,
                  borderWidth: 1,
                  borderColor: colors.inputBorder,
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 12,
                  marginBottom: 10,
                }}
              >
                <Text style={{ fontSize: 16, color: colors.text, fontWeight: '800' }}>{reminder.time}</Text>
              </Pressable>

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginTop: 2,
                }}
              >
                <Text style={{ fontSize: 13, color: colors.text, fontWeight: '700' }}>
                  {reminder.enabled ? 'Enabled' : 'Disabled'}
                </Text>
                <View style={{ marginLeft: 10 }}>
                  <ReminderToggle
                    enabled={reminder.enabled}
                    onPress={async () => {
                      await triggerHaptic();
                      updateReminder(reminder.id, { enabled: !reminder.enabled });
                    }}
                    colors={colors}
                  />
                </View>
              </View>
            </View>
          ))}
        </SectionCard>
      </ScrollView>
      </KeyboardAvoidingView>
      <Modal
        visible={expandedReminder !== null}
        transparent
        animationType="fade"
        onRequestClose={() => closeReminderTimePicker()}
      >
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <Pressable
            onPress={() => closeReminderTimePicker()}
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              backgroundColor: 'rgba(0,0,0,0.45)',
            }}
          />
          {expandedReminder ? (
            <View
              style={{
                backgroundColor: colors.card,
                borderRadius: 18,
                padding: 18,
                borderWidth: 1,
                borderColor: colors.cardBorder,
                zIndex: 1,
              }}
            >
              <Text style={{ fontSize: 12, color: colors.subtext, marginBottom: 6, textTransform: 'uppercase' }}>
                Adjust Time
              </Text>
              <Text style={{ fontSize: 20, color: colors.text, fontWeight: '800', marginBottom: 12 }}>
                {expandedReminder.topic}
              </Text>
              <ReminderTimeWheel
                time={draftReminderTime ?? expandedReminder.time}
                onChange={(value) => {
                  void triggerHaptic();
                  setDraftReminderTime(value);
                }}
                colors={colors}
              />
            </View>
          ) : null}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

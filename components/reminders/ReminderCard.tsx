import { memo } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { ReminderItem, ReminderRecurrence } from '../../context/AppSettingsContext';
import {
  getReminderCustomWeekdaySummary,
  getReminderRecurrenceLabel,
  REMINDER_CUSTOM_WEEKDAY_OPTIONS,
} from '../../data/reminders';
import { ThemeColors } from '../../data/theme';
import ReminderToggle from './ReminderToggle';

type ReminderCardProps = {
  reminder: ReminderItem;
  colors: ThemeColors;
  onChange: (id: string, updates: Partial<ReminderItem>) => void;
  onAction: (id: string, updates: Partial<ReminderItem>) => void;
  onTimePress: (id: string, time: string) => void;
  onCompleteToggle: (id: string) => void;
  completedToday: boolean;
};

const recurrenceOptions: ReminderRecurrence[] = ['daily', 'weekdays', 'weekends', 'custom'];

function ReminderCard({
  reminder,
  colors,
  onChange,
  onAction,
  onTimePress,
  onCompleteToggle,
  completedToday,
}: ReminderCardProps) {
  return (
    <View
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
        onChangeText={(text) => onChange(reminder.id, { topic: text })}
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
        onPress={() => onTimePress(reminder.id, reminder.time)}
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

      <Text style={{ fontSize: 13, color: colors.subtext, marginBottom: 6 }}>Notes</Text>
      <TextInput
        value={reminder.notes}
        onChangeText={(text) => onChange(reminder.id, { notes: text })}
        placeholder="Optional reminder notes"
        placeholderTextColor={colors.subtext}
        multiline
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
          minHeight: 72,
          textAlignVertical: 'top',
        }}
      />

      <Text style={{ fontSize: 13, color: colors.subtext, marginBottom: 8 }}>Schedule</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>
        {recurrenceOptions.map((option) => {
          const selected = reminder.recurrence === option;

          return (
            <Pressable
              key={`${reminder.id}-${option}`}
              onPress={() => onAction(reminder.id, { recurrence: option })}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 10,
                borderRadius: 999,
                backgroundColor: selected ? colors.accent : colors.inputBackground,
                borderWidth: 1,
                borderColor: selected ? colors.accent : colors.inputBorder,
                marginRight: 8,
                marginBottom: 8,
              }}
            >
              <Text style={{ color: selected ? 'white' : colors.text, fontSize: 12, fontWeight: '700' }}>
                {getReminderRecurrenceLabel(option)}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {reminder.recurrence === 'custom' ? (
        <View style={{ marginTop: -2, marginBottom: 12 }}>
          <Text style={{ fontSize: 12, color: colors.subtext, marginBottom: 8 }}>
            Pick the days this alarm should go off
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {REMINDER_CUSTOM_WEEKDAY_OPTIONS.map((option) => {
              const selected = reminder.customWeekdays.includes(option.value);
              const nextWeekdays = selected
                ? reminder.customWeekdays.filter((day) => day !== option.value)
                : [...reminder.customWeekdays, option.value];

              return (
                <Pressable
                  key={`${reminder.id}-weekday-${option.value}`}
                  onPress={() => onAction(reminder.id, { customWeekdays: nextWeekdays })}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 10,
                    borderRadius: 999,
                    backgroundColor: selected ? colors.accent : colors.inputBackground,
                    borderWidth: 1,
                    borderColor: selected ? colors.accent : colors.inputBorder,
                    marginRight: 8,
                    marginBottom: 8,
                    minWidth: 54,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: selected ? 'white' : colors.text, fontSize: 12, fontWeight: '700' }}>
                    {option.shortLabel}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={{ fontSize: 12, color: colors.subtext }}>
            {reminder.customWeekdays.length > 0
              ? `Selected: ${getReminderCustomWeekdaySummary(reminder)}`
              : 'Select at least one day to activate this alarm.'}
          </Text>
        </View>
      ) : null}

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 2,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: 13, color: colors.text, fontWeight: '700' }}>
            {reminder.enabled ? 'Enabled' : 'Disabled'}
          </Text>
          <View style={{ marginLeft: 10 }}>
            <ReminderToggle
              enabled={reminder.enabled}
              onPress={() => onAction(reminder.id, { enabled: !reminder.enabled })}
              colors={colors}
            />
          </View>
        </View>
        <Pressable
          onPress={() => onCompleteToggle(reminder.id)}
          style={{
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: 999,
            backgroundColor: completedToday ? colors.success : colors.inputBackground,
            borderWidth: 1,
            borderColor: completedToday ? colors.success : colors.inputBorder,
          }}
        >
          <Text style={{ color: completedToday ? 'white' : colors.text, fontSize: 12, fontWeight: '800' }}>
            {completedToday ? 'Done today' : 'Mark done'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export default memo(ReminderCard);

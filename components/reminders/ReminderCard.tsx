import { Pressable, Text, TextInput, View } from 'react-native';
import { ReminderItem, ReminderRecurrence } from '../../context/AppSettingsContext';
import { getReminderRecurrenceLabel } from '../../data/reminders';
import { ThemeColors } from '../../data/theme';
import ReminderToggle from './ReminderToggle';

type ReminderCardProps = {
  reminder: ReminderItem;
  colors: ThemeColors;
  onTopicChange: (text: string) => void;
  onNotesChange: (text: string) => void;
  onTimePress: () => void;
  onToggle: () => void;
  onRecurrenceChange: (recurrence: ReminderRecurrence) => void;
  onCompleteToggle: () => void;
  completedToday: boolean;
};

const recurrenceOptions: ReminderRecurrence[] = ['daily', 'weekdays', 'weekends'];

export default function ReminderCard({
  reminder,
  colors,
  onTopicChange,
  onNotesChange,
  onTimePress,
  onToggle,
  onRecurrenceChange,
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
        onChangeText={onTopicChange}
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
        onPress={onTimePress}
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
        onChangeText={onNotesChange}
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
              onPress={() => onRecurrenceChange(option)}
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
            <ReminderToggle enabled={reminder.enabled} onPress={onToggle} colors={colors} />
          </View>
        </View>
        <Pressable
          onPress={onCompleteToggle}
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

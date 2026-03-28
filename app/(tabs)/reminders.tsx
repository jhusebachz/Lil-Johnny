import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ReminderCard from '../../components/reminders/ReminderCard';
import ReminderTimeWheel from '../../components/reminders/ReminderTimeWheel';
import SectionCard from '../../components/SectionCard';
import { useAppSettings } from '../../context/AppSettingsContext';
import { useTimedRefresh } from '../../hooks/use-timed-refresh';
import {
  formatUpcomingReminder,
  getReminderCompletionStreak,
  getTodayReminderSummary,
  getNextReminder,
  isReminderCompleteOnDate,
} from '../../data/reminders';
import { getThemeColors } from '../../data/theme';

export default function Reminders() {
  const {
    reminders,
    addReminder,
    updateReminder,
    toggleReminderCompletion,
    theme,
    preferences,
    notificationAccess,
    requestNotificationAccess,
    triggerHaptic,
  } = useAppSettings();
  const colors = getThemeColors(theme);
  const nextReminderEntry = getNextReminder(reminders);
  const todaySummary = getTodayReminderSummary(reminders);
  const reminderStreak = getReminderCompletionStreak(reminders);
  const [expandedReminderId, setExpandedReminderId] = useState<string | null>(null);
  const [draftReminderTime, setDraftReminderTime] = useState<string | null>(null);
  const { refreshing, triggerRefresh } = useTimedRefresh();
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

  const refreshReminders = () => {
    triggerRefresh();
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={16}
      >
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshReminders}
            tintColor={colors.accent}
            colors={[colors.accent]}
            progressBackgroundColor={colors.card}
          />
        }
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
            Reminders
          </Text>
          <Text style={{ color: colors.heroText, fontSize: 28, fontWeight: '800', marginBottom: 10 }}>
            Reminder tracker
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
              <Text style={{ color: colors.heroSubtext, fontSize: 11, marginBottom: 4 }}>Done today</Text>
              <Text style={{ color: colors.heroText, fontSize: 16, fontWeight: '800' }}>
                {todaySummary.completed}/{Math.max(todaySummary.scheduled, 1)}
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
              <Text style={{ color: colors.heroSubtext, fontSize: 11, marginBottom: 4 }}>Next reminder</Text>
              <Text style={{ color: colors.heroText, fontSize: 16, fontWeight: '800' }}>
                {nextReminderLabel}
              </Text>
            </View>
          </View>
        </View>

        <SectionCard title="Tracker Snapshot" emoji={'\u23F0'} colors={colors}>
          <Text style={{ fontSize: 14, color: colors.subtext, lineHeight: 22, marginBottom: 10 }}>
            Reminder alerts are {preferences.notificationsEnabled ? 'enabled' : 'disabled'} globally, so this lane
            follows the main notification setting from the app.
          </Text>
          <Text style={{ fontSize: 13, color: colors.text, marginBottom: 8 }}>
            Alert access: {notificationAccess}
          </Text>
          <Text style={{ fontSize: 13, color: colors.text, marginBottom: 8 }}>
            Today: {todaySummary.completed} logged, {todaySummary.remaining} still open
          </Text>
          <Text style={{ fontSize: 13, color: colors.text }}>
            Next reminder:{' '}
            {nextReminderEntry
              ? `${nextReminderEntry.reminder.topic} at ${formatUpcomingReminder(nextReminderEntry.occurrence)}`
              : 'None'}
          </Text>
          <Text style={{ fontSize: 12, color: colors.subtext, marginTop: 10, lineHeight: 18 }}>
            Phone alerts are scheduled directly on-device. Browser alerts only work while the app stays open in the tab.
          </Text>
          <Text style={{ fontSize: 12, color: colors.subtext, marginTop: 8 }}>
            Completion streak: {reminderStreak} {reminderStreak === 1 ? 'day' : 'days'}
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

        <SectionCard title="Reminder List" emoji={'\uD83D\uDCDD'} colors={colors}>
          <Text style={{ fontSize: 14, color: colors.subtext, lineHeight: 22, marginBottom: 14 }}>
            Use this list to keep study blocks, routines, and accountability check-ins locked to the schedule.
          </Text>
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
            <ReminderCard
              key={reminder.id}
              reminder={reminder}
              colors={colors}
              onTopicChange={(text) => updateReminder(reminder.id, { topic: text })}
              onNotesChange={(text) => updateReminder(reminder.id, { notes: text })}
              onTimePress={async () => {
                await openReminderTimePicker(reminder.id, reminder.time);
              }}
              onToggle={async () => {
                await triggerHaptic();
                updateReminder(reminder.id, { enabled: !reminder.enabled });
              }}
              onRecurrenceChange={async (recurrence) => {
                await triggerHaptic();
                updateReminder(reminder.id, { recurrence });
              }}
              onCompleteToggle={async () => {
                await triggerHaptic();
                toggleReminderCompletion(reminder.id);
              }}
              completedToday={isReminderCompleteOnDate(reminder, new Date())}
            />
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

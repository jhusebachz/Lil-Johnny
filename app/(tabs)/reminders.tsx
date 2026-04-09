import { useEffect, useMemo, useState } from 'react';
import {
  Animated,
  Easing,
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
import StreakGoalCard from '../../components/streaks/StreakGoalCard';
import { usePreferenceSettings, useReminderSettings, useThemeSettings } from '../../context/AppSettingsContext';
import { useLifeTrackerData } from '../../context/LifeTrackerContext';
import { useTimedRefresh } from '../../hooks/use-timed-refresh';
import {
  YearGoal,
  getAvoidanceStreak,
  getTodayDateKey,
} from '../../data/lifeTrackerData';
import {
  formatUpcomingReminder,
  getNextReminder,
  isReminderCompleteOnDate,
} from '../../data/reminders';
import { getThemeColors } from '../../data/theme';

type StreaksView = 'streaks' | 'alarms';

export default function Reminders() {
  const { theme } = useThemeSettings();
  const {
    reminders,
    addReminder,
    updateReminder,
    toggleReminderCompletion,
  } = useReminderSettings();
  const {
    notificationAccess,
    requestNotificationAccess,
    triggerHaptic,
  } = usePreferenceSettings();
  const colors = getThemeColors(theme);
  const nextReminderEntry = getNextReminder(reminders);
  const enabledReminderCount = reminders.filter((reminder) => reminder.enabled).length;
  const [selectedView, setSelectedView] = useState<StreaksView>('streaks');
  const [expandedReminderId, setExpandedReminderId] = useState<string | null>(null);
  const [draftReminderTime, setDraftReminderTime] = useState<string | null>(null);
  const { lifeData, setLifeData } = useLifeTrackerData();
  const { refreshing, triggerRefresh } = useTimedRefresh();
  const heroOpacity = useState(() => new Animated.Value(0))[0];
  const heroLift = useState(() => new Animated.Value(18))[0];
  const expandedReminder = reminders.find((reminder) => reminder.id === expandedReminderId) ?? null;

  useEffect(() => {
    const reveal = Animated.parallel([
      Animated.timing(heroOpacity, {
        toValue: 1,
        duration: 460,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(heroLift, {
        toValue: 0,
        duration: 460,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    reveal.start();
  }, [heroLift, heroOpacity]);

  const updateGoal = async (goalId: string, updater: (goal: YearGoal) => YearGoal) => {
    await triggerHaptic();
    setLifeData((current) => ({
      ...current,
      goals2026: current.goals2026.map((goal) => (goal.id === goalId ? updater(goal) : goal)),
    }));
  };

  const avoidanceGoals = useMemo(
    () =>
      lifeData.goals2026
        .filter((goal) => goal.type === 'avoidance')
        .map((goal) => ({
          goal,
          streak: getAvoidanceStreak(goal),
        })),
    [lifeData.goals2026]
  );

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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={triggerRefresh}
              tintColor={colors.accent}
              colors={[colors.accent]}
              progressBackgroundColor={colors.card}
            />
          }
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
        >
          <Animated.View
            style={{
              backgroundColor: colors.hero,
              borderRadius: 16,
              padding: 20,
              minHeight: 112,
              justifyContent: 'center',
              marginBottom: 18,
              opacity: heroOpacity,
              transform: [{ translateY: heroLift }],
            }}
          >
            <Text style={{ color: colors.heroText, fontSize: 28, fontWeight: '800' }}>Streaks</Text>
          </Animated.View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 18 }}>
            {(['streaks', 'alarms'] as StreaksView[]).map((view) => {
              const selected = selectedView === view;
              const label = view === 'streaks' ? '2026 Streaks' : 'Reminder Alarms';

              return (
                <Pressable
                  key={view}
                  onPress={async () => {
                    await triggerHaptic();
                    setSelectedView(view);
                  }}
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 14,
                    borderRadius: 999,
                    backgroundColor: selected ? colors.accent : colors.card,
                    borderWidth: 1,
                    borderColor: selected ? colors.accent : colors.cardBorder,
                    marginRight: 10,
                    marginBottom: 10,
                  }}
                >
                  <Text style={{ color: selected ? 'white' : colors.text, fontSize: 14, fontWeight: '700' }}>{label}</Text>
                </Pressable>
              );
            })}
          </View>

          {selectedView === 'streaks' ? (
            <>
              <SectionCard title="Streaks" emoji={'🔥'} colors={colors}>
                {avoidanceGoals.map(({ goal, streak }) => (
                  <StreakGoalCard
                    key={goal.id}
                    goal={goal}
                    colors={colors}
                    streak={streak}
                    onMarkFailure={async () => {
                      await updateGoal(goal.id, (currentGoal) => ({
                        ...currentGoal,
                        lastFailureDate: getTodayDateKey(),
                      }));
                    }}
                  />
                ))}
              </SectionCard>
            </>
          ) : null}

          {selectedView === 'alarms' ? (
            <>
              <SectionCard title="Alarm Snapshot" emoji={'⏰'} colors={colors}>
                <Text style={{ fontSize: 13, color: colors.text, marginBottom: 8 }}>
                  Enabled alarms: {enabledReminderCount}
                </Text>
                <Text style={{ fontSize: 13, color: colors.text }}>
                  Next reminder:{' '}
                  {nextReminderEntry
                    ? `${nextReminderEntry.reminder.topic} at ${formatUpcomingReminder(nextReminderEntry.occurrence)}`
                    : 'None'}
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

              <SectionCard title="Reminder Alarms" emoji={'📝'} colors={colors}>
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
            </>
          ) : null}
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

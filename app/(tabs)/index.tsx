import { Image, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import SectionCard from '../../components/SectionCard';
import { useAppSettings } from '../../context/AppSettingsContext';
import { cyberDefaults } from '../../data/cyberData';
import {
  formatUpcomingReminder,
  getNextReminder,
  getReminderCompletionStreak,
  getTodayReminderSummary,
} from '../../data/reminders';
import { getThemeColors } from '../../data/theme';
import { useTimedRefresh } from '../../hooks/use-timed-refresh';

function DashboardBlock({
  label,
  title,
  summary,
  footer,
  footerTone,
  colors,
}: {
  label: string;
  title: string;
  summary: string;
  footer: string;
  footerTone: string;
  colors: ReturnType<typeof getThemeColors>;
}) {
  return (
    <View
      style={{
        backgroundColor: colors.inputBackground,
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: colors.cardBorder,
        marginBottom: 12,
      }}
    >
      <Text
        style={{
          color: footerTone,
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: 1,
          marginBottom: 6,
          fontWeight: '800',
        }}
      >
        {label}
      </Text>
      <Text style={{ color: colors.text, fontSize: 18, fontWeight: '800', marginBottom: 6 }}>{title}</Text>
      <Text style={{ color: colors.subtext, fontSize: 13, lineHeight: 21, marginBottom: 10 }}>{summary}</Text>
      <Text style={{ color: colors.text, fontSize: 12, fontWeight: '700' }}>{footer}</Text>
    </View>
  );
}

export default function Dashboard() {
  const { theme, reminders: scheduledReminders, preferences } = useAppSettings();
  const colors = getThemeColors(theme);
  const { refreshing, triggerRefresh } = useTimedRefresh();
  const reminderSummary = getTodayReminderSummary(scheduledReminders);
  const reminderStreak = getReminderCompletionStreak(scheduledReminders);
  const nextReminderEntry = getNextReminder(scheduledReminders);
  const nextReminderLabel = nextReminderEntry
    ? formatUpcomingReminder(nextReminderEntry.occurrence)
    : 'No reminders set';
  const todayLabel = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date());
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const mostUsedKey = Object.entries(preferences.usageCounts).sort((left, right) => right[1] - left[1])[0]?.[0] as
    | keyof typeof preferences.customTabLabels
    | undefined;
  const mostUsedLane = mostUsedKey ? preferences.customTabLabels[mostUsedKey] : preferences.customTabLabels.cyber;
  const focusLabel =
    preferences.favoriteFocus === 'cyber'
      ? preferences.customTabLabels.cyber
      : preferences.favoriteFocus === 'gym'
        ? preferences.customTabLabels.gym
        : preferences.customTabLabels.reminders;
  const greeting = `${timeGreeting}, ${preferences.profileName || 'Lil Johnny'}`;
  const subtitle =
    theme === 'silver-black'
      ? 'Keep the day sharp, stay disciplined on the primary lane, and let the schedule stay clean underneath it.'
      : theme === 'gangsta-green'
        ? 'Keep the rhythm tight, stay on the training block, and keep the schedule moving with less friction.'
        : 'Keep the threat picture tight, stay on the training block, and keep the reminder lane clean so the day moves with less friction.';
  const overviewSummary =
    'This is the fast read for the day: what needs attention first, where momentum matters most, and what has to stay locked to schedule.';
  const dailyPlan = [
    {
      label: '1',
      text: nextReminderEntry
        ? `Lock ${nextReminderEntry.reminder.topic} for ${nextReminderLabel}.`
        : 'Set a reminder so the next move is obvious.',
    },
    {
      label: '2',
      text: `Run the ${preferences.preferredWorkoutSplit} block through ${preferences.customTabLabels.gym}.`,
    },
    {
      label: '3',
      text: `${cyberDefaults.actions[0]?.title ?? 'Validate the top cyber action first.'}`,
    },
  ];
  const priorityTitle =
    preferences.favoriteFocus === 'cyber'
      ? 'Threat review window'
      : preferences.favoriteFocus === 'gym'
        ? 'Training block'
        : 'Reminder lane';
  const prioritySummary =
    preferences.favoriteFocus === 'cyber'
      ? 'Stay on the phishing, identity, and external-edge lane first. That is still the highest-leverage cyber block to keep clean this week.'
      : preferences.favoriteFocus === 'gym'
        ? 'Use the Gym tab to log the current day, keep the lift history honest, and keep the weekly trend line building from real entries.'
        : 'Keep the schedule clean so the rest of the app can stay useful. The next reminder should always be obvious and easy to adjust.';

  const refreshDashboard = () => {
    triggerRefresh();
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshDashboard}
            tintColor={colors.accent}
            colors={[colors.accent]}
            progressBackgroundColor={colors.card}
          />
        }
        contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
      >
        <View
          style={{
            backgroundColor: colors.hero,
            borderRadius: 16,
            padding: 20,
            marginBottom: 18,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              position: 'absolute',
              width: 180,
              height: 180,
              borderRadius: 999,
              backgroundColor: 'rgba(255,255,255,0.08)',
              top: -60,
              right: -30,
            }}
          />
          <View
            style={{
              position: 'absolute',
              width: 120,
              height: 120,
              borderRadius: 999,
              backgroundColor: colors.accentSoft,
              opacity: 0.35,
              bottom: -28,
              left: -18,
            }}
          />
          <Text
            style={{
              color: colors.heroSubtext,
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: 1.2,
              marginBottom: 8,
            }}
          >
            Command Center
          </Text>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 18,
            }}
          >
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={{ color: colors.heroText, fontSize: 30, fontWeight: '900', marginBottom: 8 }}>
                {greeting}
              </Text>
              <Text style={{ color: colors.heroSubtext, fontSize: 15, lineHeight: 22 }}>{subtitle}</Text>
            </View>

            <Image
              source={require('../../assets/images/Huse Logo.png')}
              style={{ width: 150, height: 150 }}
              resizeMode="contain"
            />
          </View>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View
              style={{
                flex: 1,
                backgroundColor: 'rgba(255,255,255,0.12)',
                borderRadius: 16,
                padding: 14,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.12)',
              }}
            >
              <Text style={{ color: colors.heroSubtext, fontSize: 11, marginBottom: 4 }}>Primary front</Text>
              <Text style={{ color: colors.heroText, fontSize: 16, fontWeight: '800' }}>{focusLabel}</Text>
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: 'rgba(255,255,255,0.12)',
                borderRadius: 16,
                padding: 14,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.12)',
              }}
            >
              <Text style={{ color: colors.heroSubtext, fontSize: 11, marginBottom: 4 }}>Schedule</Text>
              <Text style={{ color: colors.heroText, fontSize: 16, fontWeight: '800' }}>
                {nextReminderLabel}
              </Text>
            </View>
          </View>
        </View>

        <SectionCard title="Overview" emoji={'\uD83E\uDDED'} colors={colors}>
          <Text style={{ fontSize: 14, color: colors.text, lineHeight: 22, marginBottom: 12 }}>
            {overviewSummary}
          </Text>

          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
            <View
              style={{
                flex: 1,
                backgroundColor: colors.inputBackground,
                borderRadius: 14,
                padding: 14,
                borderWidth: 1,
                borderColor: colors.cardBorder,
              }}
            >
              <Text style={{ color: colors.subtext, fontSize: 11, marginBottom: 4 }}>Today</Text>
              <Text style={{ color: colors.text, fontSize: 15, fontWeight: '800' }}>{todayLabel}</Text>
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: colors.inputBackground,
                borderRadius: 14,
                padding: 14,
                borderWidth: 1,
                borderColor: colors.cardBorder,
              }}
            >
              <Text style={{ color: colors.subtext, fontSize: 11, marginBottom: 4 }}>Active reminders</Text>
              <Text style={{ color: colors.text, fontSize: 15, fontWeight: '800' }}>
                {reminderSummary.remaining} left
              </Text>
            </View>
          </View>

          <View
            style={{
              backgroundColor: colors.hero,
              borderRadius: 16,
              padding: 14,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                position: 'absolute',
                width: 90,
                height: 90,
                borderRadius: 999,
                backgroundColor: 'rgba(255,255,255,0.08)',
                right: -18,
                top: -18,
              }}
            />
            <Text
              style={{
                color: colors.heroSubtext,
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: 1,
                marginBottom: 6,
              }}
            >
              Next move
            </Text>
            <Text style={{ color: colors.heroText, fontSize: 18, fontWeight: '800', marginBottom: 6 }}>
              Lock the next reminder, then move straight into the highest-leverage block.
            </Text>
            <Text style={{ color: colors.heroSubtext, fontSize: 13, lineHeight: 20 }}>
              Most-used lane: {mostUsedLane}. Schedule window: {preferences.scheduleWindow}.
            </Text>
          </View>
        </SectionCard>

        <SectionCard title="Today Plan" emoji={'\u2705'} colors={colors}>
          <Text style={{ fontSize: 14, color: colors.text, lineHeight: 22, marginBottom: 14 }}>
            Three things to keep the day moving: next reminder, current training block, and the top cyber action.
          </Text>
          {dailyPlan.map((item) => (
            <View
              key={item.label}
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                backgroundColor: colors.inputBackground,
                borderRadius: 14,
                padding: 12,
                borderWidth: 1,
                borderColor: colors.cardBorder,
                marginBottom: 10,
              }}
            >
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 999,
                  backgroundColor: colors.accent,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 10,
                  marginTop: 2,
                }}
              >
                <Text style={{ color: 'white', fontWeight: '800', fontSize: 12 }}>{item.label}</Text>
              </View>
              <Text style={{ color: colors.text, fontSize: 14, lineHeight: 21, flex: 1 }}>{item.text}</Text>
            </View>
          ))}
        </SectionCard>

        <SectionCard title="Today" emoji={'\u26A1'} colors={colors}>
          <Text style={{ fontSize: 14, color: colors.text, lineHeight: 22, marginBottom: 14 }}>
            The home screen is set up to show the three blocks that matter most right now: where attention needs
            to go first, where momentum should stay high, and what has to stay on schedule.
          </Text>

          <DashboardBlock
            label="Priority One"
            title={priorityTitle}
            summary={prioritySummary}
            footer={`Favorite focus: ${focusLabel}`}
            footerTone={colors.danger}
            colors={colors}
          />
          <DashboardBlock
            label="Momentum"
            title="Training block"
            summary="Use the Gym tab to log the current day, keep the lift history honest, and keep the weekly trend line building from real entries."
            footer={`Current split: ${preferences.preferredWorkoutSplit}`}
            footerTone={colors.success}
            colors={colors}
          />
          <DashboardBlock
            label="Keep Tight"
            title="Reminders"
            summary="Keep the schedule clean so the rest of the app can stay useful. The next reminder should always be obvious and easy to adjust."
            footer={`Next alert: ${nextReminderLabel} | Streak: ${reminderStreak} days`}
            footerTone={colors.warning}
            colors={colors}
          />
        </SectionCard>
      </ScrollView>
    </SafeAreaView>
  );
}

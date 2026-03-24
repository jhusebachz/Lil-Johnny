import { Image, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import SectionCard from '../../components/SectionCard';
import { useAppSettings } from '../../context/AppSettingsContext';
import { formatUpcomingReminder, getNextReminder } from '../../data/reminders';
import { dashboardMockData } from '../../data/mockDashboard';
import { getThemeColors } from '../../data/theme';

export default function Dashboard() {
  const { greeting, subtitle, cyber, reminders } = dashboardMockData;
  const { theme, reminders: scheduledReminders } = useAppSettings();
  const colors = getThemeColors(theme);
  const nextReminderEntry = getNextReminder(scheduledReminders);
  const nextReminderLabel = nextReminderEntry
    ? formatUpcomingReminder(nextReminderEntry.occurrence)
    : reminders.statValue;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 28 }}>
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
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderRadius: 16,
                padding: 14,
              }}
            >
              <Text style={{ color: colors.heroSubtext, fontSize: 11, marginBottom: 4 }}>Primary front</Text>
              <Text style={{ color: colors.heroText, fontSize: 16, fontWeight: '800' }}>Cyber + Gym</Text>
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

        <SectionCard title="Today" emoji={'\u26A1'} colors={colors}>
          <Text style={{ fontSize: 14, color: colors.text, lineHeight: 22, marginBottom: 8 }}>
            Your day is split between threat intel, training, and reminders that keep the rest of the system
            moving. The dashboard is front-loading the items that need action first.
          </Text>
          <Text style={{ fontSize: 13, color: colors.subtext, lineHeight: 21 }}>
            Prioritize the cyber review window, hit the gym block with intent, and keep the reminder schedule
            tight so the day stays structured.
          </Text>
          <View
            style={{
              backgroundColor: colors.inputBackground,
              borderRadius: 16,
              padding: 14,
              marginTop: 14,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: colors.cardBorder,
            }}
          >
            <Text
              style={{
                color: colors.danger,
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: 1,
                marginBottom: 6,
                fontWeight: '800',
              }}
            >
              Priority One
            </Text>
            <Text style={{ color: colors.text, fontSize: 17, fontWeight: '800', marginBottom: 6 }}>
              {cyber.title}
            </Text>
            <Text style={{ color: colors.subtext, fontSize: 13, lineHeight: 21, marginBottom: 10 }}>
              {cyber.summary}
            </Text>
            <Text style={{ color: colors.text, fontSize: 12, fontWeight: '700' }}>
              {cyber.statLabel}: {cyber.statValue}
            </Text>
          </View>

          <View
            style={{
              backgroundColor: colors.inputBackground,
              borderRadius: 16,
              padding: 14,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: colors.cardBorder,
            }}
          >
            <Text
              style={{
                color: colors.success,
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: 1,
                marginBottom: 6,
                fontWeight: '800',
              }}
            >
              Momentum
            </Text>
            <Text style={{ color: colors.text, fontSize: 17, fontWeight: '800', marginBottom: 6 }}>Gym</Text>
            <Text style={{ color: colors.subtext, fontSize: 13, lineHeight: 21, marginBottom: 10 }}>
              Push, Pull, and Legs workouts are staged in the Gym tab so you can swap routines in as you
              refine the split.
            </Text>
            <Text style={{ color: colors.text, fontSize: 12, fontWeight: '700' }}>
              Current block: Push / Pull / Legs
            </Text>
          </View>

          <View
            style={{
              backgroundColor: colors.inputBackground,
              borderRadius: 16,
              padding: 14,
              borderWidth: 1,
              borderColor: colors.cardBorder,
            }}
          >
            <Text
              style={{
                color: colors.warning,
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: 1,
                marginBottom: 6,
                fontWeight: '800',
              }}
            >
              Keep Tight
            </Text>
            <Text style={{ color: colors.text, fontSize: 17, fontWeight: '800', marginBottom: 6 }}>
              {reminders.title}
            </Text>
            <Text style={{ color: colors.subtext, fontSize: 13, lineHeight: 21, marginBottom: 10 }}>
              {reminders.summary}
            </Text>
            <Text style={{ color: colors.text, fontSize: 12, fontWeight: '700' }}>
              {reminders.statLabel}: {nextReminderLabel}
            </Text>
          </View>
        </SectionCard>
      </ScrollView>
    </SafeAreaView>
  );
}

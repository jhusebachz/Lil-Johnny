import { Pressable, Text, View } from 'react-native';

import { YearGoal, getTodayDateKey } from '../../data/lifeTrackerData';
import { getThemeColors } from '../../data/theme';

export default function StreakGoalCard({
  goal,
  colors,
  streak,
  onToggleToday,
  onMarkFailure,
}: {
  goal: YearGoal;
  colors: ReturnType<typeof getThemeColors>;
  streak: number;
  onToggleToday: () => Promise<void>;
  onMarkFailure: () => Promise<void>;
}) {
  const todayKey = getTodayDateKey();
  const dailyCompleted = goal.type === 'daily-check' ? goal.completedDates.includes(todayKey) : false;

  return (
    <View
      style={{
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.cardBorder,
        backgroundColor: colors.inputBackground,
        padding: 14,
        marginBottom: 12,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flex: 1, paddingRight: 14 }}>
          <Text style={{ fontSize: 17, color: colors.text, fontWeight: '800', marginBottom: 6 }}>{goal.title}</Text>
          <Text style={{ fontSize: 16, color: colors.subtext }}>
            Current streak: <Text style={{ color: colors.text, fontWeight: '800' }}>{streak}</Text>{' '}
            {streak === 1 ? 'day' : 'days'}
          </Text>
        </View>

        {goal.type === 'daily-check' ? (
          <Pressable
            onPress={() => {
              void onToggleToday();
            }}
            style={{
              width: 76,
              height: 76,
              borderRadius: 18,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: dailyCompleted ? colors.success : colors.accent,
              paddingHorizontal: 8,
            }}
          >
            <Text style={{ color: 'white', textAlign: 'center', fontWeight: '800', fontSize: 12, lineHeight: 15 }}>
              {dailyCompleted ? 'Done' : 'Mark'}
            </Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={() => {
              void onMarkFailure();
            }}
            style={{
              minWidth: 112,
              height: 76,
              borderRadius: 18,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.danger,
              paddingHorizontal: 10,
            }}
          >
            <Text style={{ color: 'white', textAlign: 'center', fontWeight: '800', fontSize: 12, lineHeight: 15 }}>
              I broke this streak
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

import { useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import RunescapeSection from '../../components/games/RunescapeSection';
import ProgressBar from '../../components/ProgressBar';
import SectionCard from '../../components/SectionCard';
import { useAppSettings } from '../../context/AppSettingsContext';
import {
  DiyTask,
  LifeTrackerData,
  defaultLifeTrackerData,
  formatTrackerDate,
  getTodayDateKey,
  readPersistedLifeTrackerData,
  writePersistedLifeTrackerData,
} from '../../data/lifeTrackerData';
import { getThemeColors } from '../../data/theme';
import { useTimedRefresh } from '../../hooks/use-timed-refresh';

type HobbiesView = 'osrs' | 'diy';

function DiyTaskCard({
  task,
  colors,
  onToggle,
}: {
  task: DiyTask;
  colors: ReturnType<typeof getThemeColors>;
  onToggle: () => Promise<void>;
}) {
  return (
    <Pressable
      onPress={() => {
        void onToggle();
      }}
      style={{
        borderRadius: 16,
        borderWidth: 1,
        borderColor: task.completed ? colors.success : colors.cardBorder,
        backgroundColor: colors.inputBackground,
        padding: 14,
        marginBottom: 12,
      }}
    >
      <Text
        style={{
          fontSize: 16,
          color: colors.text,
          fontWeight: '800',
          marginBottom: 6,
          textDecorationLine: task.completed ? 'line-through' : 'none',
        }}
      >
        {task.title}
      </Text>
      {task.note ? (
        <Text style={{ fontSize: 13, color: colors.subtext, lineHeight: 20, marginBottom: 8 }}>{task.note}</Text>
      ) : null}
      <Text style={{ fontSize: 12, color: task.completed ? colors.success : colors.subtext, fontWeight: '700' }}>
        {task.completed ? 'Completed' : 'Open task'}
      </Text>
    </Pressable>
  );
}

export default function Goals() {
  const { theme, triggerHaptic } = useAppSettings();
  const colors = getThemeColors(theme);
  const [selectedView, setSelectedView] = useState<HobbiesView>('osrs');
  const [runescapeRefreshToken, setRunescapeRefreshToken] = useState(0);
  const [lifeData, setLifeData] = useState<LifeTrackerData>(defaultLifeTrackerData);
  const [hydrated, setHydrated] = useState(false);
  const [draftDiyTitle, setDraftDiyTitle] = useState('');
  const [draftDiyNote, setDraftDiyNote] = useState('');
  const { refreshing, triggerRefresh } = useTimedRefresh();

  useEffect(() => {
    let mounted = true;

    const hydrate = async () => {
      const persisted = await readPersistedLifeTrackerData().catch(() => null);
      if (!mounted) {
        return;
      }

      if (persisted) {
        setLifeData({
          ...defaultLifeTrackerData,
          ...persisted,
          goals2026: persisted.goals2026?.length ? persisted.goals2026 : defaultLifeTrackerData.goals2026,
          diyTasks: persisted.diyTasks?.length ? persisted.diyTasks : defaultLifeTrackerData.diyTasks,
        });
      }
      setHydrated(true);
    };

    void hydrate();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    void writePersistedLifeTrackerData(lifeData);
  }, [hydrated, lifeData]);

  const toggleDiyTask = async (taskId: string) => {
    await triggerHaptic();
    const todayKey = getTodayDateKey();
    setLifeData((current) => ({
      ...current,
      diyTasks: current.diyTasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              completed: !task.completed,
              completedAt: !task.completed ? todayKey : null,
            }
          : task
      ),
    }));
  };

  const addDiyTask = async () => {
    const title = draftDiyTitle.trim();
    const note = draftDiyNote.trim();

    if (!title) {
      return;
    }

    await triggerHaptic();
    setLifeData((current) => ({
      ...current,
      diyTasks: [
        {
          id: `diy-${Date.now()}`,
          title,
          note: note || undefined,
          completed: false,
          createdAt: getTodayDateKey(),
          completedAt: null,
        },
        ...current.diyTasks,
      ],
    }));
    setDraftDiyTitle('');
    setDraftDiyNote('');
  };

  const openDiyCount = lifeData.diyTasks.filter((task) => !task.completed).length;
  const completedDiyCount = lifeData.diyTasks.length - openDiyCount;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              triggerRefresh();
              setRunescapeRefreshToken((current) => current + 1);
            }}
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
            minHeight: 112,
            justifyContent: 'center',
            marginBottom: 18,
          }}
        >
          <Text style={{ color: colors.heroText, fontSize: 28, fontWeight: '800', marginBottom: 10 }}>Hobbies</Text>
          <Text style={{ color: colors.heroSubtext, fontSize: 12, lineHeight: 18 }}>
            Open DIY tasks: {openDiyCount} | {formatTrackerDate()}
          </Text>
        </View>

        <SectionCard title="Hobbies View" emoji={'🧩'} colors={colors}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {(['osrs', 'diy'] as HobbiesView[]).map((view) => {
              const selected = view === selectedView;
              const label = view === 'osrs' ? 'OSRS' : 'DIY To-Do';

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
                    borderRadius: 12,
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
        </SectionCard>

        {selectedView === 'osrs' ? <RunescapeSection colors={colors} refreshToken={runescapeRefreshToken} /> : null}

        {selectedView === 'diy' ? (
          <SectionCard title="DIY To-Do List" emoji={'🛠️'} colors={colors}>
            <Text style={{ color: colors.text, fontSize: 13, fontWeight: '800', marginBottom: 10 }}>
              Open: {openDiyCount} | Completed: {completedDiyCount}
            </Text>
            <ProgressBar
              pct={lifeData.diyTasks.length > 0 ? (completedDiyCount / lifeData.diyTasks.length) * 100 : 0}
              color={colors.success}
              colors={colors}
              height={10}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: -2, marginBottom: 14 }}>
              <Text style={{ fontSize: 11, color: colors.subtext }}>
                Actual {lifeData.diyTasks.length > 0 ? ((completedDiyCount / lifeData.diyTasks.length) * 100).toFixed(1) : '0.0'}%
              </Text>
              <Text style={{ fontSize: 11, color: colors.subtext }}>Completion progress</Text>
            </View>

            <TextInput
              value={draftDiyTitle}
              onChangeText={setDraftDiyTitle}
              placeholder="Add a DIY task"
              placeholderTextColor={colors.subtext}
              style={{
                borderWidth: 1,
                borderColor: colors.inputBorder,
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 10,
                fontSize: 15,
                color: colors.text,
                backgroundColor: colors.inputBackground,
                marginBottom: 10,
              }}
            />
            <TextInput
              value={draftDiyNote}
              onChangeText={setDraftDiyNote}
              placeholder="Optional note"
              placeholderTextColor={colors.subtext}
              style={{
                borderWidth: 1,
                borderColor: colors.inputBorder,
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 10,
                fontSize: 15,
                color: colors.text,
                backgroundColor: colors.inputBackground,
                marginBottom: 12,
              }}
            />
            <Pressable
              onPress={() => {
                void addDiyTask();
              }}
              style={{
                borderRadius: 12,
                backgroundColor: colors.accent,
                paddingVertical: 12,
                paddingHorizontal: 14,
                marginBottom: 14,
              }}
            >
              <Text style={{ color: 'white', textAlign: 'center', fontWeight: '800' }}>Add DIY task</Text>
            </Pressable>

            {lifeData.diyTasks.map((task) => (
              <DiyTaskCard
                key={task.id}
                task={task}
                colors={colors}
                onToggle={async () => {
                  await toggleDiyTask(task.id);
                }}
              />
            ))}
          </SectionCard>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

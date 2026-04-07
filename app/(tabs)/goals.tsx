import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import RunescapeSection from '../../components/games/RunescapeSection';
import ProgressBar from '../../components/ProgressBar';
import SectionCard from '../../components/SectionCard';
import { usePreferenceSettings, useThemeSettings } from '../../context/AppSettingsContext';
import {
  DiyTask,
  formatTrackerDate,
  getTodayDateKey,
} from '../../data/lifeTrackerData';
import { getThemeColors } from '../../data/theme';
import { useLifeTrackerData } from '../../hooks/use-life-tracker-data';
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
    <SectionCard title={task.title} emoji={'\uD83D\uDD28'} colors={colors}>
      <Text
        style={{
          fontSize: 12,
          color: task.completed ? colors.success : colors.subtext,
          fontWeight: '800',
          marginBottom: 8,
          textTransform: 'uppercase',
          letterSpacing: 0.6,
        }}
      >
        {task.completed ? 'Completed' : 'Open task'}
      </Text>
      {task.note ? (
        <Text
          style={{
            fontSize: 14,
            color: colors.text,
            lineHeight: 22,
            marginBottom: 12,
            textDecorationLine: task.completed ? 'line-through' : 'none',
          }}
        >
          {task.note}
        </Text>
      ) : null}
      <Text
        style={{
          fontSize: 12,
          color: colors.subtext,
          marginBottom: 12,
        }}
      >
        Created {task.createdAt}
        {task.completedAt ? ` | Completed ${task.completedAt}` : ''}
      </Text>
      <Pressable
        onPress={() => {
          void onToggle();
        }}
        style={{
          alignSelf: 'flex-start',
          borderRadius: 12,
          backgroundColor: task.completed ? colors.success : colors.accent,
          paddingVertical: 10,
          paddingHorizontal: 14,
        }}
      >
        <Text
          style={{
            color: 'white',
          fontWeight: '800',
          }}
        >
          {task.completed ? 'Completed' : 'Task completed'}
        </Text>
      </Pressable>
    </SectionCard>
  );
}

function DiyAddCard({
  colors,
  draftDiyTitle,
  draftDiyNote,
  setDraftDiyTitle,
  setDraftDiyNote,
  addDiyTask,
}: {
  colors: ReturnType<typeof getThemeColors>;
  draftDiyTitle: string;
  draftDiyNote: string;
  setDraftDiyTitle: (value: string) => void;
  setDraftDiyNote: (value: string) => void;
  addDiyTask: () => Promise<void>;
}) {
  return (
    <SectionCard title="Add DIY Task" emoji={'\uD83E\uDDF0'} colors={colors}>
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
      >
      </TextInput>
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
        }}
      >
        <Text style={{ color: 'white', textAlign: 'center', fontWeight: '800' }}>Add DIY task</Text>
      </Pressable>
    </SectionCard>
  );
}

export default function Goals() {
  const { theme } = useThemeSettings();
  const { triggerHaptic } = usePreferenceSettings();
  const colors = getThemeColors(theme);
  const [selectedView, setSelectedView] = useState<HobbiesView>('diy');
  const [runescapeRefreshToken, setRunescapeRefreshToken] = useState(0);
  const { lifeData, setLifeData } = useLifeTrackerData();
  const [draftDiyTitle, setDraftDiyTitle] = useState('');
  const [draftDiyNote, setDraftDiyNote] = useState('');
  const { refreshing, triggerRefresh } = useTimedRefresh();

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

        <SectionCard title="Hobbies View" emoji={'\uD83E\uDDE9'} colors={colors}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {(['diy', 'osrs'] as HobbiesView[]).map((view) => {
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
          <>
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
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: -2, marginBottom: 2 }}>
                <Text style={{ fontSize: 11, color: colors.subtext }}>
                  Actual {lifeData.diyTasks.length > 0 ? ((completedDiyCount / lifeData.diyTasks.length) * 100).toFixed(1) : '0.0'}%
                </Text>
                <Text style={{ fontSize: 11, color: colors.subtext }}>Completion progress</Text>
              </View>
            </SectionCard>

            <DiyAddCard
              colors={colors}
              draftDiyTitle={draftDiyTitle}
              draftDiyNote={draftDiyNote}
              setDraftDiyTitle={setDraftDiyTitle}
              setDraftDiyNote={setDraftDiyNote}
              addDiyTask={addDiyTask}
            />

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
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

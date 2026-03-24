import { useIsFocused } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { InteractionManager, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Pill from '../../components/Pill';
import ProgressBar from '../../components/ProgressBar';
import SectionCard from '../../components/SectionCard';
import StatRow from '../../components/StatRow';
import { useAppSettings } from '../../context/AppSettingsContext';
import {
  fallbackPokopiaNews,
  fallbackSteamNews,
  fallbackSwitchNews,
  GameNewsItem,
} from '../../data/mockGames';
import {
  fetchRunescapeTrackerSnapshot,
  getFallbackRunescapeTracker,
  LiveRunescapeTracker,
} from '../../data/osrsTracker';
import { getThemeColors } from '../../data/theme';

type GamesView = 'gaming' | 'pokopia' | 'runescape';

type RedditChild = {
  data: {
    id: string;
    title: string;
    subreddit: string;
    permalink: string;
    selftext?: string;
  };
};

type RedditResponse = {
  data?: {
    children?: RedditChild[];
  };
};

const gameViews: { label: string; value: GamesView }[] = [
  { label: 'Gaming News', value: 'gaming' },
  { label: 'Pokopia', value: 'pokopia' },
  { label: 'RuneScape', value: 'runescape' },
];

async function fetchRedditNews(query: string, tag: string): Promise<GameNewsItem[]> {
  const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&sort=new&t=day&limit=5`;
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'johnny-app/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`Reddit request failed: ${response.status}`);
  }

  const json = (await response.json()) as RedditResponse;
  const children = json.data?.children ?? [];

  return children
    .map((child) => {
      const item = child.data;
      const summarySource = item.selftext?.trim();

      return {
        id: `${tag}-${item.id}`,
        title: item.title,
        subreddit: item.subreddit,
        url: `https://www.reddit.com${item.permalink}`,
        summary:
          summarySource && summarySource.length > 0
            ? `${summarySource.slice(0, 140)}${summarySource.length > 140 ? '...' : ''}`
            : `Latest Reddit discussion surfaced for ${tag}.`,
        tag,
      };
    })
    .filter((item) => item.title);
}

function NewsCard({ item, colors }: { item: GameNewsItem; colors: ReturnType<typeof getThemeColors> }) {
  return (
    <Pressable
      onPress={() => Linking.openURL(item.url)}
      style={{
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.cardBorder,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
        <Text style={{ color: colors.subtext, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>
          r/{item.subreddit}
        </Text>
        <Text style={{ color: colors.accent, fontSize: 11, fontWeight: '800' }}>{item.tag}</Text>
      </View>
      <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800', marginBottom: 8 }}>
        {item.title}
      </Text>
      <Text style={{ color: colors.subtext, fontSize: 13, lineHeight: 20 }}>{item.summary}</Text>
    </Pressable>
  );
}

function RunescapeSection({ colors }: { colors: ReturnType<typeof getThemeColors> }) {
  const [tracker, setTracker] = useState<LiveRunescapeTracker>(getFallbackRunescapeTracker());
  const [trackerLoading, setTrackerLoading] = useState(true);
  const [trackerError, setTrackerError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadTracker = async () => {
      setTrackerLoading(true);
      setTrackerError(null);

      try {
        const liveTracker = await fetchRunescapeTrackerSnapshot();

        if (mounted) {
          setTracker(liveTracker);
        }
      } catch (error) {
        if (mounted) {
          setTracker(getFallbackRunescapeTracker());
          setTrackerError(error instanceof Error ? error.message : 'Unable to load live OSRS stats.');
        }
      } finally {
        if (mounted) {
          setTrackerLoading(false);
        }
      }
    };

    loadTracker();

    return () => {
      mounted = false;
    };
  }, []);

  const totalLevelTarget = 2250;
  const totalLevelsNeeded = Math.max(totalLevelTarget - tracker.totalLevel, 0);
  const totalLevelPct = (tracker.totalLevel / totalLevelTarget) * 100;

  return (
    <>
      <View
        style={{
          backgroundColor: colors.hero,
          borderRadius: 16,
          padding: 20,
          marginBottom: 18,
        }}
      >
        <Text style={{ color: colors.heroText, fontSize: 30, fontWeight: '800' }}>
          {tracker.totalXp.toLocaleString()}
        </Text>
        <Text style={{ color: colors.heroSubtext, marginTop: 2 }}>
          {tracker.mode === 'delta' ? 'XP since last snapshot' : 'Total account XP'}
        </Text>
        <Text style={{ color: colors.heroSubtext, marginTop: 6, fontSize: 12 }}>
          {trackerLoading
            ? 'Refreshing OSRS tracker...'
            : trackerError
              ? 'Tracker unavailable, showing fallback snapshot.'
              : tracker.mode === 'delta'
                ? `Snapshot loaded for ${tracker.snapshotDateLabel}.`
                : 'Live snapshot loaded. Deltas begin after two saved snapshots.'}
        </Text>

        <View style={{ marginTop: 14 }}>
          {tracker.topSkills.map((item) => (
              <Text key={item.skill} style={{ color: colors.heroSubtext, fontSize: 13, marginBottom: 4 }}>
                <Text style={{ fontWeight: '700' }}>{item.skill}</Text>
                {tracker.mode === 'delta' ? ': +' : ': '}
                {item.xp.toLocaleString()} xp
              </Text>
            ))}
          </View>
        </View>

      <SectionCard
        title={tracker.mode === 'delta' ? 'Since Last Snapshot - You vs Friends' : 'Account Snapshot - You vs Friends'}
        emoji={'\u2694'}
        colors={colors}
      >
        <StatRow
          label={tracker.mode === 'delta' ? 'Your XP since last snapshot' : 'Your total account XP'}
          value={tracker.totalXp.toLocaleString()}
          colors={colors}
        />
        <View style={{ height: 1, backgroundColor: colors.cardBorder, marginVertical: 12 }} />

        {tracker.friends.map((friend) => {
          const ahead = friend.diff > 0;
          const even = friend.diff === 0;

          return (
            <View key={friend.name} style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text }}>
                {friend.name}
                <Text style={{ fontWeight: '400', color: colors.subtext }}>
                  {' '}
                  - {friend.overallXp.toLocaleString()} {tracker.mode === 'delta' ? 'xp since last snapshot' : 'total xp'}
                </Text>
              </Text>

              {!even && ahead && (
                <Pill text={`Ahead by ${friend.diff.toLocaleString()} xp`} color={colors.success} />
              )}
              {!even && !ahead && (
                <Pill text={`Trailing by ${Math.abs(friend.diff).toLocaleString()} xp`} color={colors.danger} />
              )}
              {even && <Pill text="Dead even" color={colors.warning} />}

              <Text style={{ fontSize: 12, color: colors.subtext, marginTop: 8, marginBottom: 4 }}>
                {tracker.mode === 'delta' ? 'Top gains:' : 'Top skills:'}
              </Text>

              {friend.topSkills.length > 0 ? (
                friend.topSkills.map((gain) => (
                  <Text
                    key={`${friend.name}-${gain.skill}`}
                    style={{ fontSize: 12, color: colors.text, marginBottom: 3 }}
                  >
                    • {gain.skill}: {gain.xp.toLocaleString()} xp (Lv{gain.level})
                  </Text>
                ))
              ) : (
                <Text style={{ fontSize: 12, color: colors.subtext }}>No skill data available</Text>
              )}
            </View>
          );
        })}
      </SectionCard>

      <SectionCard title="Goal 1 - Base 90 All Skills" emoji={'\uD83C\uDFAF'} colors={colors}>
        <StatRow label="Deadline" value="2026-05-22 (66 days left)" colors={colors} />
        <StatRow label="Skills at 90+" value={`${24 - tracker.base90Remaining.length}/24`} colors={colors} />

        <Text
          style={{
            marginTop: 10,
            marginBottom: 8,
            fontSize: 12,
            fontWeight: '800',
            color: colors.text,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}
        >
          Still needed
        </Text>

        {tracker.base90Remaining.map((item) => (
          <View key={item.skill} style={{ marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 12, color: colors.text }}>
                <Text style={{ fontWeight: '700' }}>{item.skill}</Text> Lv{item.level}
              </Text>
              <Text style={{ fontSize: 12, color: colors.subtext }}>
                {item.pct.toFixed(1)}% - {item.remainingXp.toLocaleString()} xp left
              </Text>
            </View>
            <ProgressBar
              pct={item.pct}
              color={item.pct >= 80 ? colors.warning : colors.accent}
              colors={colors}
            />
          </View>
        ))}
      </SectionCard>

      <SectionCard title="Goal 2 - Total Level 2250 by RuneFest" emoji={'\u26F5'} colors={colors}>
        <StatRow label="Deadline" value="2026-10-03 - RuneFest (200 days left)" colors={colors} />
        <StatRow
          label="Current total level"
          value={`${tracker.totalLevel} / ${totalLevelTarget}`}
          colors={colors}
        />
        <StatRow label="Levels still needed" value={`${totalLevelsNeeded}`} colors={colors} />
        <ProgressBar pct={totalLevelPct} color={colors.accent} colors={colors} />

        <Text style={{ fontSize: 12, color: colors.subtext, marginTop: 4 }}>
          Need <Text style={{ fontWeight: '700', color: colors.text }}>0.54</Text> levels/day to hit 2250 in
          time
        </Text>
      </SectionCard>

      <SectionCard title="Goal 3 - Max Cape by 33rd Birthday" emoji={'\uD83C\uDF82'} colors={colors}>
        <StatRow label="Deadline" value="2027-03-15 - 33rd birthday (363 days left)" colors={colors} />
        <StatRow label="Skills maxed" value={`${tracker.maxedSkills.length}/24`} colors={colors} />
        <ProgressBar pct={(tracker.maxedSkills.length / 24) * 100} color="#ec4899" colors={colors} />

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, marginBottom: 8 }}>
          {tracker.maxedSkills.map((skill) => (
            <View
              key={skill}
              style={{
                backgroundColor: colors.success,
                borderRadius: 999,
                paddingHorizontal: 10,
                paddingVertical: 4,
                marginRight: 6,
                marginBottom: 6,
              }}
            >
              <Text style={{ color: 'white', fontSize: 12, fontWeight: '700' }}>{skill}</Text>
            </View>
          ))}
        </View>

        {tracker.maxClosest.map((item) => (
          <View key={item.skill} style={{ marginBottom: 10 }}>
            <Text style={{ fontSize: 12, color: colors.text }}>
              <Text style={{ fontWeight: '700' }}>{item.skill}</Text> Lv{item.level}
              <Text style={{ color: colors.subtext }}>
                {' '}
                - {item.remainingXp.toLocaleString()} xp to 99
              </Text>
            </Text>
            <ProgressBar pct={item.pct} color="#ec4899" colors={colors} />
          </View>
        ))}
      </SectionCard>

      <SectionCard title="Hours Left Until Next Level" emoji={'\u23F3'} colors={colors}>
        <Text style={{ fontSize: 14, color: colors.subtext, lineHeight: 22, marginBottom: 12 }}>
          Based on your current skill XP and the next level for each tracked skill.
        </Text>

        {tracker.hoursToNextLevel.length > 0 ? (
          tracker.hoursToNextLevel.map((item) => (
            <View
              key={`${item.skill}-${item.targetLevel}`}
              style={{
                marginBottom: 12,
                paddingBottom: 12,
                borderBottomWidth: 1,
                borderBottomColor: colors.cardBorder,
              }}
            >
              <Text style={{ fontSize: 13, color: colors.text, fontWeight: '800', marginBottom: 4 }}>
                {item.skill}
                <Text style={{ color: colors.subtext, fontWeight: '400' }}>
                  {' '}
                  - Lv{item.level} to {item.targetLevel}
                </Text>
              </Text>
              <Text style={{ fontSize: 12, color: colors.subtext, marginBottom: 3 }}>
                {item.remainingXp.toLocaleString()} xp left
              </Text>
              <Text style={{ fontSize: 12, color: colors.subtext }}>
                {item.hoursLeft !== null
                  ? `${item.hoursLeft.toFixed(1)} hours at ${item.xpPerHour.toLocaleString()} xp/hr (${item.mode})`
                  : item.mode === 'trained via Slayer'
                    ? 'Trained via Slayer'
                    : `${item.mode} - no direct hourly estimate`}
              </Text>
            </View>
          ))
        ) : (
          <Text style={{ fontSize: 13, color: colors.subtext }}>No tracked next-level estimates left.</Text>
        )}
      </SectionCard>

      <SectionCard title="Coaching Insight" emoji={'\uD83E\uDDE0'} colors={colors}>
        <Text style={{ fontSize: 14, color: colors.text, lineHeight: 22 }}>{tracker.coachingText}</Text>
      </SectionCard>
    </>
  );
}

export default function Games() {
  const { theme, preferences } = useAppSettings();
  const colors = getThemeColors(theme);
  const isFocused = useIsFocused();
  const [selectedView, setSelectedView] = useState<GamesView>(preferences.defaultGamesView);
  const [pokopiaNews, setPokopiaNews] = useState<GameNewsItem[]>(fallbackPokopiaNews);
  const [switchNews, setSwitchNews] = useState<GameNewsItem[]>(fallbackSwitchNews);
  const [steamNews, setSteamNews] = useState<GameNewsItem[]>(fallbackSteamNews);
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsError, setNewsError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('Using fallback headlines');

  useEffect(() => {
    setSelectedView(preferences.defaultGamesView);
  }, [preferences.defaultGamesView]);

  useEffect(() => {
    if (!isFocused) {
      return;
    }

    if (!preferences.autoRefreshGamingNews) {
      setNewsLoading(false);
      setNewsError(null);
      setLastUpdated('Auto refresh disabled');
      return;
    }

    const interaction = InteractionManager.runAfterInteractions(() => {
      const refreshNews = async () => {
        setNewsLoading(true);
        setNewsError(null);

        try {
          const [pokopia, nintendoSwitch, steam] = await Promise.all([
            fetchRedditNews('Pokopia', 'Pokopia'),
            fetchRedditNews('"Nintendo Switch 2"', 'Switch 2'),
            fetchRedditNews('Steam PC gaming', 'Steam'),
          ]);

          if (pokopia.length > 0) {
            setPokopiaNews(pokopia);
          }
          if (nintendoSwitch.length > 0) {
            setSwitchNews(nintendoSwitch);
          }
          if (steam.length > 0) {
            setSteamNews(steam);
          }

          setLastUpdated(
            new Intl.DateTimeFormat('en-US', {
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            }).format(new Date())
          );
        } catch (error) {
          setNewsError(error instanceof Error ? error.message : 'Unable to refresh Reddit headlines.');
          setLastUpdated('Using fallback headlines');
        } finally {
          setNewsLoading(false);
        }
      };

      void refreshNews();
    });

    return () => interaction.cancel();
  }, [isFocused, preferences.autoRefreshGamingNews]);

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 28 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 18 }}>
          {gameViews.map((view) => {
            const selected = selectedView === view.value;

            return (
              <Pressable
                key={view.value}
                onPress={() => setSelectedView(view.value)}
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
                <Text
                  style={{
                    color: selected ? 'white' : colors.text,
                    fontSize: 14,
                    fontWeight: '700',
                  }}
                >
                  {view.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {selectedView === 'gaming' ? (
          <SectionCard title="News Feed" emoji={'\uD83D\uDCF0'} colors={colors}>
            <Text style={{ fontSize: 12, color: colors.subtext, marginBottom: 12 }}>
              {newsLoading ? 'Refreshing Reddit...' : lastUpdated}
              {newsError ? ' | Reddit refresh failed, showing fallback items.' : ''}
            </Text>

            <Text
              style={{
                color: colors.text,
                fontSize: 15,
                fontWeight: '800',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                marginTop: 12,
                marginBottom: 10,
              }}
            >
              Nintendo Switch 2
            </Text>
            {switchNews.map((item) => (
              <NewsCard key={item.id} item={item} colors={colors} />
            ))}

            <Text
              style={{
                color: colors.text,
                fontSize: 15,
                fontWeight: '800',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                marginTop: 18,
                marginBottom: 10,
              }}
            >
              Steam and PC Gaming
            </Text>
            {steamNews.map((item) => (
              <NewsCard key={item.id} item={item} colors={colors} />
            ))}
          </SectionCard>
        ) : null}

        {selectedView === 'pokopia' ? (
          <SectionCard title="Pokopia Feed" emoji={'\uD83C\uDFAF'} colors={colors}>
            <Text style={{ fontSize: 14, color: colors.subtext, lineHeight: 22, marginBottom: 12 }}>
              One running feed for the latest Pokopia discussion, impressions, and meta chatter.
            </Text>
            <Text style={{ fontSize: 12, color: colors.subtext, marginBottom: 12 }}>
              {newsLoading ? 'Refreshing Reddit...' : lastUpdated}
              {newsError ? ' | Reddit refresh failed, showing fallback items.' : ''}
            </Text>
            {pokopiaNews.map((item) => (
              <NewsCard key={item.id} item={item} colors={colors} />
            ))}
          </SectionCard>
        ) : null}

        {selectedView === 'runescape' ? <RunescapeSection colors={colors} /> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

import { useIsFocused } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import { InteractionManager, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import NewsCard from '../../components/games/NewsCard';
import RunescapeSection from '../../components/games/RunescapeSection';
import SectionCard from '../../components/SectionCard';
import { DefaultGamesView, useAppSettings } from '../../context/AppSettingsContext';
import { buildFallbackNewsItems, fetchRedditNews, GameNewsItem } from '../../data/gamesNews';
import { getThemeColors } from '../../data/theme';
import { useTimedRefresh } from '../../hooks/use-timed-refresh';

type GamesView = DefaultGamesView;

const gameViews: { label: string; value: GamesView }[] = [
  { label: 'Gaming News', value: 'gaming' },
  { label: 'Pokopia', value: 'pokopia' },
  { label: 'RuneScape', value: 'runescape' },
];

const newsQueries = {
  pokopia: { label: 'Pokopia', query: 'Pokopia' },
  switch: { label: 'Switch 2', query: '"Nintendo Switch 2"' },
  steam: { label: 'Steam', query: 'Steam PC gaming' },
} as const;

export default function Games() {
  const { theme, preferences } = useAppSettings();
  const colors = getThemeColors(theme);
  const isFocused = useIsFocused();
  const queryMap = {
    pokopia: preferences.gamesFeeds.pokopiaQuery || newsQueries.pokopia.query,
    switch: preferences.gamesFeeds.switchQuery || newsQueries.switch.query,
    steam: preferences.gamesFeeds.steamQuery || newsQueries.steam.query,
  };
  const [selectedView, setSelectedView] = useState<GamesView>(preferences.defaultGamesView);
  const [pokopiaNews, setPokopiaNews] = useState<GameNewsItem[]>(
    buildFallbackNewsItems(newsQueries.pokopia.label, 'search', queryMap.pokopia)
  );
  const [switchNews, setSwitchNews] = useState<GameNewsItem[]>(
    buildFallbackNewsItems(newsQueries.switch.label, 'search', queryMap.switch)
  );
  const [steamNews, setSteamNews] = useState<GameNewsItem[]>(
    buildFallbackNewsItems(newsQueries.steam.label, 'search', queryMap.steam)
  );
  const [newsLoading, setNewsLoading] = useState(true);
  const { refreshing, setRefreshing, triggerRefresh } = useTimedRefresh(700);
  const [newsError, setNewsError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('Open search results if live headlines do not load');
  const [runescapeRefreshToken, setRunescapeRefreshToken] = useState(0);

  useEffect(() => {
    setSelectedView(preferences.defaultGamesView);
  }, [preferences.defaultGamesView]);

  const refreshNews = useCallback(
    async (options?: { pullToRefresh?: boolean }) => {
      if (!preferences.autoRefreshGamingNews) {
        setNewsLoading(false);
        setRefreshing(false);
        setNewsError(null);
        setLastUpdated('Auto refresh disabled');
        return;
      }

      if (options?.pullToRefresh) {
        setRefreshing(true);
      } else {
        setNewsLoading(true);
      }
      setNewsError(null);

      try {
        const [pokopiaResult, switchResult, steamResult] = await Promise.allSettled([
          fetchRedditNews(queryMap.pokopia, newsQueries.pokopia.label),
          fetchRedditNews(queryMap.switch, newsQueries.switch.label),
          fetchRedditNews(queryMap.steam, newsQueries.steam.label),
        ]);

        const pokopiaOk = pokopiaResult.status === 'fulfilled' && pokopiaResult.value.length > 0;
        const switchOk = switchResult.status === 'fulfilled' && switchResult.value.length > 0;
        const steamOk = steamResult.status === 'fulfilled' && steamResult.value.length > 0;

        setPokopiaNews(
          pokopiaOk
            ? pokopiaResult.value
            : buildFallbackNewsItems(newsQueries.pokopia.label, 'search', queryMap.pokopia)
        );
        setSwitchNews(
          switchOk
            ? switchResult.value
            : buildFallbackNewsItems(newsQueries.switch.label, 'search', queryMap.switch)
        );
        setSteamNews(
          steamOk
            ? steamResult.value
            : buildFallbackNewsItems(newsQueries.steam.label, 'search', queryMap.steam)
        );

        setNewsError(
          !pokopiaOk && !switchOk && !steamOk
            ? 'Unable to refresh Reddit headlines.'
            : !pokopiaOk || !switchOk || !steamOk
              ? 'Some news feeds are unavailable.'
              : null
        );

        setLastUpdated(
          !pokopiaOk && !switchOk && !steamOk
            ? 'Showing useful search links instead of stale placeholder headlines'
            : !pokopiaOk || !switchOk || !steamOk
              ? 'Partially refreshed | Some lanes are using search links'
              : new Intl.DateTimeFormat('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                }).format(new Date())
        );
      } finally {
        setNewsLoading(false);
        setRefreshing(false);
      }
    },
    [preferences.autoRefreshGamingNews, queryMap.pokopia, queryMap.steam, queryMap.switch, setRefreshing]
  );

  const refreshAllGamesContent = async () => {
    if (selectedView === 'runescape') {
      triggerRefresh(700);
      setRunescapeRefreshToken((current) => current + 1);
      return;
    }

    await refreshNews({ pullToRefresh: true });
  };

  useEffect(() => {
    if (!isFocused) {
      return;
    }

    const interaction = InteractionManager.runAfterInteractions(() => {
      void refreshNews();
    });

    return () => interaction.cancel();
  }, [isFocused, refreshNews]);

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              void refreshAllGamesContent();
            }}
            tintColor={colors.accent}
            colors={[colors.accent]}
            progressBackgroundColor={colors.card}
          />
        }
        contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
      >
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
              {newsError ? ' | Reddit refresh failed, showing useful search links.' : ''}
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
              {newsError ? ' | Reddit refresh failed, showing useful search links.' : ''}
            </Text>
            {pokopiaNews.map((item) => (
              <NewsCard key={item.id} item={item} colors={colors} />
            ))}
          </SectionCard>
        ) : null}

        {selectedView === 'runescape' ? (
          <RunescapeSection colors={colors} refreshToken={runescapeRefreshToken} />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

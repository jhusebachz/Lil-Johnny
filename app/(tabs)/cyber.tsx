import { useIsFocused } from '@react-navigation/native';
import { useEffect, useMemo, useState } from 'react';
import { InteractionManager, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Pill from '../../components/Pill';
import SectionCard from '../../components/SectionCard';
import StatRow from '../../components/StatRow';

import { useAppSettings } from '../../context/AppSettingsContext';
import { cyberMockData, IntelItem } from '../../data/mockCyber';
import { getThemeColors } from '../../data/theme';

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

async function fetchCyberIntel(): Promise<IntelItem[]> {
  const queries = ['cybersecurity phishing banking CVE', '"German banking" cybersecurity'];
  const results = await Promise.all(
    queries.map(async (query) => {
      const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&sort=new&t=day&limit=4`;
      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'johnny-app/1.0',
        },
      });

      if (!response.ok) {
        throw new Error(`Cyber intel request failed: ${response.status}`);
      }

      const json = (await response.json()) as RedditResponse;
      return json.data?.children ?? [];
    })
  );

  const seen = new Set<string>();

  return results
    .flat()
    .map((child) => {
      const item = child.data;
      const body = item.selftext?.trim() ?? '';
      const lower = `${item.title} ${body}`.toLowerCase();

      let priority: IntelItem['priority'] = 'Low';

      if (/(critical|ransomware|phishing|breach|zero[- ]day|actively exploited|bank)/.test(lower)) {
        priority = 'High';
      } else if (/(cve|malware|credential|fraud|vulnerability|exploit)/.test(lower)) {
        priority = 'Medium';
      }

      const tags = [
        lower.includes('phishing') ? 'Phishing' : null,
        lower.includes('bank') ? 'Banking' : null,
        lower.includes('credential') ? 'Credentials' : null,
        lower.includes('cve') || lower.includes('vulnerability') ? 'Vulnerability' : null,
        lower.includes('ransomware') ? 'Ransomware' : null,
      ].filter((tag): tag is string => Boolean(tag));

      return {
        id: item.id,
        title: item.title,
        source: `r/${item.subreddit}`,
        summary:
          body.length > 0
            ? `${body.slice(0, 160)}${body.length > 160 ? '...' : ''}`
            : 'Fresh cyber discussion surfaced from the latest feed.',
        priority,
        tags: tags.length > 0 ? tags : ['Cyber'],
      };
    })
    .filter((item) => {
      if (seen.has(item.id)) {
        return false;
      }

      seen.add(item.id);
      return true;
    })
    .slice(0, 5)
    .map(({ id: _id, ...item }) => item);
}

function formatThreatLevel(items: IntelItem[]) {
  const highCount = items.filter((item) => item.priority === 'High').length;

  if (highCount >= 3) {
    return 'High';
  }

  if (highCount >= 1) {
    return 'Elevated';
  }

  return 'Guarded';
}

export default function Cyber() {
  const { vulnerabilities, keyTakeaways, actions, regionFocus, headlineSummary } = cyberMockData;
  const { theme } = useAppSettings();
  const colors = getThemeColors(theme);
  const isFocused = useIsFocused();
  const [topIntel, setTopIntel] = useState<IntelItem[]>(cyberMockData.topIntel);
  const [intelLoading, setIntelLoading] = useState(false);
  const [intelError, setIntelError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('Using fallback cyber intel');

  useEffect(() => {
    if (!isFocused) {
      return;
    }

    const interaction = InteractionManager.runAfterInteractions(() => {
      const refreshIntel = async () => {
        setIntelLoading(true);
        setIntelError(null);

        try {
          const liveIntel = await fetchCyberIntel();

          if (liveIntel.length > 0) {
            setTopIntel(liveIntel);
          } else {
            setTopIntel(cyberMockData.topIntel);
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
          setTopIntel(cyberMockData.topIntel);
          setIntelError(error instanceof Error ? error.message : 'Unable to refresh cyber intel.');
          setLastUpdated('Using fallback cyber intel');
        } finally {
          setIntelLoading(false);
        }
      };

      void refreshIntel();
    });

    return () => interaction.cancel();
  }, [isFocused]);

  const today = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }).format(new Date()),
    []
  );

  const threatLevel = formatThreatLevel(topIntel);
  const threatColor =
    threatLevel === 'High'
      ? colors.danger
      : threatLevel === 'Elevated'
        ? colors.warning
        : colors.accent;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
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
            Cyber Center
          </Text>

          <Text style={{ color: colors.heroText, fontSize: 26, fontWeight: '800', marginBottom: 10 }}>
            Stay ahead of the week
          </Text>

          <Text style={{ color: colors.heroSubtext, fontSize: 15, marginBottom: 10 }}>
            Keep the threat picture tight, track the most relevant intel, and move quickly on what matters.
          </Text>

          <Text style={{ color: colors.heroSubtext, fontSize: 12, marginBottom: 12 }}>
            {intelLoading ? 'Refreshing cyber intel...' : lastUpdated}
            {intelError ? ' | Live refresh failed, showing fallback intel.' : ''}
          </Text>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            <Pill text={regionFocus} color={colors.accent} />
            <Pill text={`Threat Level: ${threatLevel}`} color={threatColor} />
            <Pill text={today} color={colors.accentSoft} />
          </View>
        </View>

        <SectionCard title="Operational Snapshot" emoji={'\uD83D\uDCCD'} colors={colors}>
          <StatRow label="Primary focus" value={regionFocus} colors={colors} />
          <StatRow label="Threat level" value={threatLevel} colors={colors} />
          <StatRow label="Top priority" value="Identity & phishing" colors={colors} />
          <Text style={{ fontSize: 13, color: colors.subtext, lineHeight: 20, marginTop: 12 }}>
            {headlineSummary}
          </Text>
        </SectionCard>

        <SectionCard title="Top Intel Items" emoji={'\uD83D\uDCF0'} colors={colors}>
          {topIntel.map((item) => (
            <View
              key={item.title}
              style={{
                marginBottom: 14,
                paddingBottom: 14,
                borderBottomWidth: 1,
                borderBottomColor: colors.cardBorder,
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: 4 }}>
                {item.title}
              </Text>

              <Text style={{ fontSize: 12, color: colors.subtext, marginBottom: 6 }}>{item.source}</Text>

              <Text style={{ fontSize: 13, color: colors.text, lineHeight: 20, marginBottom: 8 }}>
                {item.summary}
              </Text>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                <Pill
                  text={item.priority}
                  color={
                    item.priority === 'High'
                      ? colors.danger
                      : item.priority === 'Medium'
                        ? colors.warning
                        : colors.accent
                  }
                />
                {item.tags.map((tag) => (
                  <Pill key={`${item.title}-${tag}`} text={tag} color={colors.accentSoft} />
                ))}
              </View>
            </View>
          ))}
        </SectionCard>

        <SectionCard title="Vulnerabilities to Watch" emoji={'\uD83D\uDEE1'} colors={colors}>
          {vulnerabilities.map((item) => (
            <View
              key={item.cve}
              style={{
                marginBottom: 14,
                paddingBottom: 14,
                borderBottomWidth: 1,
                borderBottomColor: colors.cardBorder,
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: 4 }}>
                {item.cve}
              </Text>
              <Text style={{ fontSize: 13, color: colors.text, marginBottom: 4 }}>
                {item.product} | {item.severity}
              </Text>
              <Text style={{ fontSize: 13, color: colors.subtext, lineHeight: 20 }}>{item.note}</Text>
            </View>
          ))}
        </SectionCard>

        <SectionCard title="Key Takeaways" emoji={'\uD83E\uDDE0'} colors={colors}>
          {keyTakeaways.map((item, index) => (
            <Text
              key={`${index}-${item}`}
              style={{ fontSize: 13, color: colors.text, lineHeight: 22, marginBottom: 8 }}
            >
              • {item}
            </Text>
          ))}
        </SectionCard>

        <SectionCard title="Recommended Actions" emoji={'\u2705'} colors={colors}>
          {actions.map((item) => (
            <View
              key={item.title}
              style={{
                marginBottom: 12,
                paddingBottom: 12,
                borderBottomWidth: 1,
                borderBottomColor: colors.cardBorder,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 4 }}>
                {item.title}
              </Text>
              <Text style={{ fontSize: 12, color: colors.subtext }}>
                Owner: {item.owner} | Due: {item.due}
              </Text>
            </View>
          ))}
        </SectionCard>
      </ScrollView>
    </SafeAreaView>
  );
}

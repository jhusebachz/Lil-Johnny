import { useIsFocused } from '@react-navigation/native';
import { useEffect, useMemo, useState } from 'react';
import { InteractionManager, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Pill from '../../components/Pill';
import SectionCard from '../../components/SectionCard';
import StatRow from '../../components/StatRow';

import { useAppSettings } from '../../context/AppSettingsContext';
import { CyberBriefEntry, getCyberBriefMeta, getCyberBriefStreak, readCyberBriefs, writeCyberBriefs } from '../../data/cyberBriefs';
import {
  ActionItem,
  cyberDefaults,
  fetchCyberIntel,
  fetchKnownExploitedVulnerabilities,
  formatThreatLevel,
  getFallbackIntel,
  getFallbackVulnerabilities,
  IntelItem,
  VulnerabilityItem,
} from '../../data/cyberData';
import { getThemeColors } from '../../data/theme';

export default function Cyber() {
  const { theme, preferences, triggerHaptic } = useAppSettings();
  const colors = getThemeColors(theme);
  const isFocused = useIsFocused();
  const [topIntel, setTopIntel] = useState<IntelItem[]>(getFallbackIntel());
  const [vulnerabilities, setVulnerabilities] = useState<VulnerabilityItem[]>(getFallbackVulnerabilities());
  const [intelLoading, setIntelLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [intelError, setIntelError] = useState<string | null>(null);
  const [kevError, setKevError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('Refreshing cyber sources...');
  const [briefEntries, setBriefEntries] = useState<CyberBriefEntry[]>([]);
  const [draftBrief, setDraftBrief] = useState('');

  useEffect(() => {
    let mounted = true;

    void readCyberBriefs().then((entries) => {
      if (!mounted) {
        return;
      }

      setBriefEntries(entries);
      const todayMeta = getCyberBriefMeta();
      const todayEntry = entries.find((entry) => entry.dateKey === todayMeta.dateKey);
      setDraftBrief(todayEntry?.note ?? '');
    });

    return () => {
      mounted = false;
    };
  }, []);

  const refreshIntel = async (options?: { pullToRefresh?: boolean }) => {
    if (options?.pullToRefresh) {
      setRefreshing(true);
    } else {
      setIntelLoading(true);
    }
    setIntelError(null);
    setKevError(null);

    try {
      const [intelResult, kevResult] = await Promise.allSettled([
        fetchCyberIntel(),
        fetchKnownExploitedVulnerabilities(),
      ]);

      const intelOk = intelResult.status === 'fulfilled' && intelResult.value.length > 0;
      const kevOk = kevResult.status === 'fulfilled' && kevResult.value.length > 0;

      if (intelOk) {
        setTopIntel(intelResult.value);
      } else {
        setTopIntel(getFallbackIntel());
      }

      if (kevOk) {
        setVulnerabilities(kevResult.value);
      } else {
        setVulnerabilities(getFallbackVulnerabilities());
      }

      setIntelError(
        intelResult.status === 'rejected'
          ? intelResult.reason instanceof Error
            ? intelResult.reason.message
            : 'Unable to refresh cyber intel.'
          : null
      );
      setKevError(
        kevResult.status === 'rejected'
          ? kevResult.reason instanceof Error
            ? kevResult.reason.message
            : 'Unable to refresh KEV data.'
          : null
      );

      setLastUpdated(
        !intelOk && !kevOk
          ? 'Using fallback cyber guidance'
          : !intelOk
            ? 'Live KEV loaded | Intel feed unavailable'
            : !kevOk
              ? 'Live intel loaded | KEV feed unavailable'
              : new Intl.DateTimeFormat('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                }).format(new Date())
      );
    } finally {
      setIntelLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!isFocused) {
      return;
    }

    const interaction = InteractionManager.runAfterInteractions(() => {
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
  const statusSuffix =
    intelError && kevError
      ? ' | Both live sources are unavailable.'
      : intelError
        ? ' | Intel feed unavailable.'
        : '';
  const kevIssueMessage = kevError
    ? kevError.includes('403')
      ? 'CISA blocked the app from reaching the KEV list right now.'
      : kevError.includes('404')
        ? 'The KEV link did not return the list.'
        : kevError.includes('Network request failed')
          ? 'The app could not reach the KEV site from this device.'
          : kevError.includes('timed out')
            ? 'The KEV site took too long to respond.'
            : 'The app could not load the KEV list right now.'
    : null;
  const briefStreak = getCyberBriefStreak(briefEntries);
  const latestBriefs = [...briefEntries].sort((left, right) => right.dateKey.localeCompare(left.dateKey)).slice(0, 4);
  const cyberTabLabel = preferences.customTabLabels.cyber || 'Cyber';

  const saveBrief = async () => {
    const meta = getCyberBriefMeta();
    const trimmed = draftBrief.trim();
    await triggerHaptic();
    setBriefEntries((current) => {
      const nextEntries = current.filter((entry) => entry.dateKey !== meta.dateKey);
      const merged = trimmed ? [{ dateKey: meta.dateKey, label: meta.label, note: trimmed }, ...nextEntries] : nextEntries;
      void writeCyberBriefs(merged);
      return merged;
    });
  };
  const headerStatusText = intelLoading
    ? 'Refreshing cyber intel...'
    : kevIssueMessage && !intelError
      ? `Live intel loaded | ${kevIssueMessage}`
      : `${lastUpdated}${statusSuffix}`;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              void refreshIntel({ pullToRefresh: true });
            }}
            tintColor={colors.accent}
            colors={[colors.accent]}
            progressBackgroundColor={colors.card}
          />
        }
        contentContainerStyle={{ padding: 16 }}
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
            {cyberTabLabel}
          </Text>

          <Text style={{ color: colors.heroText, fontSize: 26, fontWeight: '800', marginBottom: 10 }}>
            Stay ahead of the week
          </Text>

          <Text style={{ color: colors.heroSubtext, fontSize: 15, marginBottom: 10 }}>
            Keep the threat picture tight, track the most relevant intel, and move quickly on what matters.
          </Text>

          <Text style={{ color: colors.heroSubtext, fontSize: 12, marginBottom: 12 }}>{headerStatusText}</Text>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            <Pill text={cyberDefaults.regionFocus} color={colors.accent} />
            <Pill text={`Threat Level: ${threatLevel}`} color={threatColor} />
            <Pill text={today} color={colors.accentSoft} />
          </View>
        </View>

        <SectionCard title="Operational Snapshot" emoji={'\uD83D\uDCCD'} colors={colors}>
          <StatRow label="Primary focus" value={cyberDefaults.regionFocus} colors={colors} />
          <StatRow label="Threat level" value={threatLevel} colors={colors} />
          <StatRow label="Top priority" value="Identity & phishing" colors={colors} />
          <Text style={{ fontSize: 13, color: colors.subtext, lineHeight: 20, marginTop: 12 }}>
            {cyberDefaults.headlineSummary}
          </Text>
          <Text style={{ fontSize: 12, color: colors.subtext, marginTop: 10 }}>
            Threat brief streak: {briefStreak} {briefStreak === 1 ? 'day' : 'days'}
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

        <SectionCard title="Known Exploited Vulnerabilities" emoji={'\uD83D\uDEE1'} colors={colors}>
          {kevIssueMessage ? (
            <Text style={{ fontSize: 13, color: colors.subtext, lineHeight: 20, marginBottom: 12 }}>
              {kevIssueMessage}
            </Text>
          ) : null}
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
              {item.dueDate ? (
                <Text style={{ fontSize: 12, color: colors.subtext, marginTop: 6 }}>
                  CISA due date: {item.dueDate}
                </Text>
              ) : null}
            </View>
          ))}
        </SectionCard>

        <SectionCard title="Key Takeaways" emoji={'\uD83E\uDDE0'} colors={colors}>
          {cyberDefaults.keyTakeaways.map((item, index) => (
            <Text
              key={`${index}-${item}`}
              style={{ fontSize: 13, color: colors.text, lineHeight: 22, marginBottom: 8 }}
            >
              • {item}
            </Text>
          ))}
        </SectionCard>

        <SectionCard title="Recommended Actions" emoji={'\u2705'} colors={colors}>
          {cyberDefaults.actions.map((item: ActionItem) => (
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

        <SectionCard title="Threat Brief Log" emoji={'\u270D'} colors={colors}>
          <Text style={{ fontSize: 14, color: colors.subtext, lineHeight: 22, marginBottom: 12 }}>
            Save one short readout for the day so you can look back at how the threat picture shifted over time.
          </Text>
          <TextInput
            value={draftBrief}
            onChangeText={setDraftBrief}
            placeholder="Write today's cyber readout"
            placeholderTextColor={colors.subtext}
            multiline
            style={{
              backgroundColor: colors.inputBackground,
              borderWidth: 1,
              borderColor: colors.inputBorder,
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 12,
              minHeight: 96,
              color: colors.text,
              textAlignVertical: 'top',
              marginBottom: 12,
            }}
          />
          <Pressable
            onPress={() => {
              void saveBrief();
            }}
            style={{
              alignSelf: 'flex-start',
              paddingVertical: 10,
              paddingHorizontal: 14,
              borderRadius: 10,
              backgroundColor: colors.accent,
              marginBottom: 14,
            }}
          >
            <Text style={{ color: 'white', fontWeight: '800' }}>Save today&apos;s brief</Text>
          </Pressable>

          {latestBriefs.map((entry) => (
            <View
              key={entry.dateKey}
              style={{
                backgroundColor: colors.inputBackground,
                borderRadius: 12,
                padding: 12,
                marginBottom: 10,
                borderWidth: 1,
                borderColor: colors.cardBorder,
              }}
            >
              <Text style={{ color: colors.text, fontSize: 14, fontWeight: '800', marginBottom: 4 }}>{entry.label}</Text>
              <Text style={{ color: colors.subtext, fontSize: 13, lineHeight: 20 }}>{entry.note}</Text>
            </View>
          ))}
        </SectionCard>
      </ScrollView>
    </SafeAreaView>
  );
}

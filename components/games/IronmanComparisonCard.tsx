import { Text, View } from 'react-native';

import SectionCard from '../SectionCard';
import { ironmanComparisonLeads, ironmanComparisonPeriod } from '../../data/osrsIronmanComparison';
import type { TrackerIronmanComparison } from '../../data/osrsTrackerTypes';
import type { ThemeColors } from '../../data/theme';

export default function IronmanComparisonCard({ comparison, colors }: {
  comparison: TrackerIronmanComparison;
  colors: ThemeColors;
}) {
  return (
    <SectionCard title="Ironman Progress - You vs IronXDabber" emoji={'\u2692'} colors={colors}>
      <Text style={{ color: colors.subtext, fontSize: 12, marginBottom: 10 }}>
        {ironmanComparisonPeriod(comparison)}
      </Text>
      {ironmanComparisonLeads(comparison).map((line) => (
        <Text key={line} style={{ color: colors.accent, fontSize: 13, fontWeight: '700', marginBottom: 5 }}>
          {line}
        </Text>
      ))}
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
        {comparison.accounts.map((account) => (
          <View key={account.name} style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ color: colors.text, fontSize: 14, fontWeight: '800', marginBottom: 10 }}>
              {account.name}
            </Text>
            {account.available ? (
              <>
                {[
                  ['Total level', account.totalLevel.toLocaleString()],
                  ['Total XP', account.totalXp.toLocaleString()],
                  ['Levels gained', account.gainedLevels === null ? 'Pending' : `+${account.gainedLevels.toLocaleString()}`],
                  ['XP gained', account.gainedXp === null ? 'Pending' : `+${account.gainedXp.toLocaleString()}`],
                ].map(([label, value]) => (
                  <View key={label} style={{ marginBottom: 8 }}>
                    <Text style={{ color: colors.subtext, fontSize: 11 }}>{label}</Text>
                    <Text style={{ color: colors.text, fontSize: 15, fontWeight: '700' }}>{value}</Text>
                  </View>
                ))}
                <Text style={{ color: colors.subtext, fontSize: 11, fontWeight: '700', marginTop: 4, marginBottom: 6 }}>
                  Top 5 skill gains (by XP)
                </Text>
                {account.topSkills.map((skill) => (
                  <View key={skill.skill} style={{ marginBottom: 9 }}>
                    <Text style={{ color: colors.text, fontSize: 12, fontWeight: '700' }}>{skill.skill}</Text>
                    <Text style={{ color: colors.subtext, fontSize: 11 }}>
                      Lv{skill.level} (+{skill.levelsGained})
                    </Text>
                    <Text style={{ color: colors.text, fontSize: 12 }}>+{skill.xp.toLocaleString()} xp</Text>
                  </View>
                ))}
                {account.topSkills.length === 0 ? (
                  <Text style={{ color: colors.subtext, fontSize: 12 }}>
                    {comparison.status === 'comparison' ? 'No skill XP gained this period.' : 'Waiting for a comparison period.'}
                  </Text>
                ) : null}
              </>
            ) : (
              <Text style={{ color: colors.subtext, fontSize: 12 }}>HiScores data unavailable.</Text>
            )}
          </View>
        ))}
      </View>
    </SectionCard>
  );
}

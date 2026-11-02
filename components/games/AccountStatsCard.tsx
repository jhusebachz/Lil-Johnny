import { Text, View } from 'react-native';

import SectionCard from '../SectionCard';
import { formatOsrsSkillName } from '../../data/osrsEffectiveHours';
import { SKILL_ORDER } from '../../data/osrsTrackerTypes';
import type { TrackerAccountStats } from '../../data/osrsAccountStats';
import type { ThemeColors } from '../../data/theme';

export default function AccountStatsCard({ accounts, generatedAtLabel, colors }: {
  accounts: TrackerAccountStats[];
  generatedAtLabel: string;
  colors: ThemeColors;
}) {
  const format = (value: number | null) => value === null ? 'Unavailable' : value.toLocaleString();
  return (
    <SectionCard title="Current Account Stats" emoji={'\uD83D\uDCCA'} colors={colors}>
      <Text style={{ color: colors.subtext, fontSize: 12, marginBottom: 12 }}>
        Automation snapshot: {generatedAtLabel}
      </Text>
      <View style={{ flexDirection: 'row', marginBottom: 10 }}>
        <Text style={{ width: 82, color: colors.subtext, fontSize: 12 }}>Stat</Text>
        {accounts.map((account) => (
          <Text key={account.name} style={{ flex: 1, minWidth: 0, textAlign: 'right', color: colors.text, fontSize: 12, fontWeight: '800' }}>
            {account.name}
          </Text>
        ))}
      </View>
      {accounts.some((account) => !account.available) ? (
        <Text style={{ color: colors.subtext, fontSize: 12, marginBottom: 10 }}>
          {accounts.filter((account) => !account.available).map((account) => account.name).join(', ')}: no stats in this automation snapshot.
        </Text>
      ) : null}
      {(['totalLevel', 'totalXp'] as const).map((key) => (
        <View key={key} style={{ flexDirection: 'row', marginBottom: 8 }}>
          <Text style={{ width: 82, color: colors.text, fontSize: 12, fontWeight: '700' }}>{key === 'totalLevel' ? 'Total level' : 'Total XP'}</Text>
          {accounts.map((account) => (
            <Text key={account.name} style={{ flex: 1, minWidth: 0, textAlign: 'right', color: colors.text, fontSize: 12, fontWeight: '700' }}>
              {format(account[key])}
            </Text>
          ))}
        </View>
      ))}
      {SKILL_ORDER.map((skill) => (
        <View key={skill} style={{ flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderColor: colors.cardBorder, paddingVertical: 7 }}>
          <Text style={{ width: 82, color: colors.text, fontSize: 12 }}>{formatOsrsSkillName(skill)}</Text>
          {accounts.map((account) => {
            const stat = account.skills.find((entry) => entry.skill === skill);
            return (
              <View key={account.name} style={{ flex: 1, minWidth: 0, alignItems: 'flex-end' }}>
                <Text style={{ color: colors.text, fontSize: 12 }}>{stat?.level == null ? 'Unavailable' : `Lv${stat.level}`}</Text>
                <Text style={{ color: colors.subtext, fontSize: 10 }}>{stat?.xp == null ? 'XP unavailable' : `${stat.xp.toLocaleString()} xp`}</Text>
              </View>
            );
          })}
        </View>
      ))}
    </SectionCard>
  );
}

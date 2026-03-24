import { Linking, Pressable, Text, View } from 'react-native';
import { GameNewsItem } from '../../data/gamesNews';
import { ThemeColors } from '../../data/theme';

type NewsCardProps = {
  item: GameNewsItem;
  colors: ThemeColors;
};

export default function NewsCard({ item, colors }: NewsCardProps) {
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

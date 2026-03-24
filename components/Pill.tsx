import { Text, View } from 'react-native';

type PillProps = {
  text: string;
  color: string;
};

export default function Pill({ text, color }: PillProps) {
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        backgroundColor: color,
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 4,
        marginTop: 6,
        marginRight: 6,
        marginBottom: 6,
      }}
    >
      <Text
        style={{
          color: 'white',
          fontSize: 12,
          fontWeight: '700',
        }}
      >
        {text}
      </Text>
    </View>
  );
}
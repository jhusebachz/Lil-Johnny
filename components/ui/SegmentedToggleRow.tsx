import { Pressable, Text, View } from 'react-native';

import { ThemeColors } from '../../data/theme';

type SegmentedOption<T extends string> = {
  label: string;
  value: T;
};

type SegmentedToggleRowProps<T extends string> = {
  colors: ThemeColors;
  onSelect: (value: T) => void | Promise<void>;
  options: SegmentedOption<T>[];
  selectedValue: T;
};

export default function SegmentedToggleRow<T extends string>({
  colors,
  onSelect,
  options,
  selectedValue,
}: SegmentedToggleRowProps<T>) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
      {options.map((option) => {
        const selected = option.value === selectedValue;

        return (
          <Pressable
            key={option.value}
            onPress={() => {
              void onSelect(option.value);
            }}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 14,
              borderRadius: 999,
              backgroundColor: selected ? colors.accent : colors.card,
              borderWidth: 1,
              borderColor: selected ? colors.accent : colors.cardBorder,
              marginRight: 10,
              marginBottom: 10,
            }}
          >
            <Text style={{ color: selected ? 'white' : colors.text, fontSize: 14, fontWeight: '700' }}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

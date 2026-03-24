import { Pressable, View } from 'react-native';
import { ThemeColors } from '../../data/theme';

type ReminderToggleProps = {
  enabled: boolean;
  onPress: () => void;
  colors: ThemeColors;
};

export default function ReminderToggle({ enabled, onPress, colors }: ReminderToggleProps) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        width: 52,
        height: 30,
        backgroundColor: enabled ? colors.success : colors.inputBorder,
        borderRadius: 999,
        padding: 3,
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 999,
          backgroundColor: 'white',
          alignSelf: enabled ? 'flex-end' : 'flex-start',
        }}
      />
    </Pressable>
  );
}

import React from 'react';
import { RefreshControl, ScrollView, ScrollViewProps, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemeColors } from '../../data/theme';

type AppScreenShellProps = {
  children: React.ReactNode;
  colors: ThemeColors;
  contentContainerStyle?: ViewStyle;
  hero: React.ReactNode;
  keyboardShouldPersistTaps?: ScrollViewProps['keyboardShouldPersistTaps'];
  refreshing: boolean;
  onRefresh: () => void;
};

export default function AppScreenShell({
  children,
  colors,
  contentContainerStyle,
  hero,
  keyboardShouldPersistTaps,
  refreshing,
  onRefresh,
}: AppScreenShellProps) {
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
            progressBackgroundColor={colors.card}
          />
        }
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        contentContainerStyle={{ padding: 16, paddingBottom: 28, ...contentContainerStyle }}
      >
        {hero}
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

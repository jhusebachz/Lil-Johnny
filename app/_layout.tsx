import { Image } from 'expo-image';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppSettingsProvider, useAppSettings } from '../context/AppSettingsContext';
import { getThemeColors } from '../data/theme';
import { getNotificationsModule } from '../utils/notifications';

const Notifications = getNotificationsModule();

void SplashScreen.preventAutoHideAsync();

if (Notifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

function AppShell() {
  const { theme } = useAppSettings();
  const colors = getThemeColors(theme);
  const statusBarStyle = theme === 'light' ? 'dark' : 'light';
  const [showIntro, setShowIntro] = useState(true);
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const rotation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    rotation.start();

    const hideSplash = setTimeout(() => {
      void SplashScreen.hideAsync();
    }, 120);

    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 450,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          setShowIntro(false);
        }
      });
    }, 2600);

    return () => {
      clearTimeout(hideSplash);
      clearTimeout(timer);
      rotation.stop();
    };
  }, [fadeAnim, rotateAnim]);

  const introRotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  const leiColors = ['#fb7185', '#f97316', '#facc15', '#4ade80', '#38bdf8', '#a78bfa'];
  const petalCount = 18;

  return (
    <>
      <StatusBar style={statusBarStyle} backgroundColor={colors.background} translucent={false} />
      <Stack screenOptions={{ headerShown: false }} />
      {showIntro ? (
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            backgroundColor: colors.background,
            justifyContent: 'center',
            alignItems: 'center',
            opacity: fadeAnim,
            zIndex: 999,
          }}
        >
          <View style={{ width: 320, height: 320, justifyContent: 'center', alignItems: 'center' }}>
            <Animated.View
              style={{
                position: 'absolute',
                width: 240,
                height: 240,
                transform: [{ rotate: introRotate }],
              }}
            >
              {Array.from({ length: petalCount }, (_, index) => {
                const angle = (Math.PI * 2 * index) / petalCount;
                const x = Math.cos(angle) * 92;
                const y = Math.sin(angle) * 92;
                const color = leiColors[index % leiColors.length];

                return (
                  <View
                    key={`ring-${index}`}
                    style={{
                      position: 'absolute',
                      left: 120 + x - 8,
                      top: 120 + y - 8,
                      width: 16,
                      height: 16,
                      borderRadius: 999,
                      backgroundColor: color,
                      borderWidth: 2,
                      borderColor: 'rgba(255,255,255,0.65)',
                      shadowColor: color,
                      shadowOpacity: 0.18,
                      shadowRadius: 5,
                      shadowOffset: { width: 0, height: 2 },
                    }}
                  />
                );
              })}
            </Animated.View>

            <Image
              source={require('../assets/images/Huse Logo.png')}
              style={{ width: 220, height: 220 }}
              contentFit="contain"
            />
          </View>
        </Animated.View>
      ) : null}
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppSettingsProvider>
        <AppShell />
      </AppSettingsProvider>
    </SafeAreaProvider>
  );
}

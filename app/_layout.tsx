import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import '../global.css';
import { LogBox } from 'react-native';
import { useColorScheme as useNativeWindColorScheme } from 'nativewind';

LogBox.ignoreLogs([
  'AsyncStorage has been extracted from react-native core',
  'URL constructor:',
  'URL.protocol is not implemented',
  'URL.protocol is not implemented in React Native'
]);

import { AppProvider, useApp } from '../context/AppContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutNav() {
  const { activeTheme, themeMode } = useApp();
  const { setColorScheme } = useNativeWindColorScheme();

  useEffect(() => {
    setColorScheme(themeMode);
  }, [setColorScheme, themeMode]);

  return (
    <ThemeProvider value={activeTheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: activeTheme === 'dark' ? '#050505' : '#fcfaf6',
          },
        }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
      <StatusBar style={activeTheme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AppProvider>
      <RootLayoutNav />
    </AppProvider>
  );
}

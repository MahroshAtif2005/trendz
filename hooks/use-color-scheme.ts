import { useContext } from 'react';
import { useColorScheme as useDeviceColorScheme } from 'react-native';

import { AppContext } from '@/context/AppContext';

export function useColorScheme() {
  const appContext = useContext(AppContext);
  const deviceColorScheme = useDeviceColorScheme();

  return appContext?.activeTheme ?? deviceColorScheme ?? 'light';
}

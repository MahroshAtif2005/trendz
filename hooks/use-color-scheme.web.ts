import { useContext, useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

import { AppContext } from '@/context/AppContext';

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme() {
  const appContext = useContext(AppContext);
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const colorScheme = useRNColorScheme();

  if (hasHydrated) {
    return appContext?.activeTheme ?? colorScheme ?? 'light';
  }

  return 'light';
}

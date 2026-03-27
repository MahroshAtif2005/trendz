import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;

// Create a custom safe storage wrapper to ensure no promise rejections crash the app
const ExpoAsyncStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.warn('AsyncStorage Error (getItem):', error);
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.warn('AsyncStorage Error (setItem):', error);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.warn('AsyncStorage Error (removeItem):', error);
    }
  },
};

const isConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const hasSupabaseConfig = isConfigured;

// Safe fallback parsing for missing env cases (avoids raw crashes on boot)
export const supabase = createClient(
  supabaseUrl || 'https://xyziojfdsosdfp.supabase.co',
  supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy',
  {
    auth: {
      storage: ExpoAsyncStorage,
      autoRefreshToken: isConfigured, // Stop polling if dummy
      persistSession: isConfigured,   // Stop persisting if dummy
      detectSessionInUrl: false,
    },
  }
);

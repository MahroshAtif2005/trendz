import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme as useDeviceColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session } from '@supabase/supabase-js';
import { supabase, hasSupabaseConfig } from '@/lib/supabase';
import type { ExploreTag } from '@/lib/explore-feed';

export type ThemeMode = 'system' | 'light' | 'dark';
const THEME_MODE_STORAGE_KEY = 'trendz.themeMode';
const USER_EXPLORE_POSTS_STORAGE_KEY = 'trendz.userExplorePosts';
const USER_PROFILE_STORAGE_KEY = 'trendz.userProfile';

export interface InspirationItem {
  id: string;
  title: string;
  vibe: string;
  imageUrl: string;
  height?: number;
}

export interface UserProfile {
  fullName: string;
  username: string;
  email: string;
  bio: string;
  avatarUri: string | null;
}

export interface OutfitReviewScores {
  occasion_fit: number;
  trend_score: number;
  confidence_score: number;
}

export interface OutfitReviewWhatWorksItem {
  title: string;
  reason: string;
}

export interface OutfitReviewFixItem {
  title: string;
  severity: 'High' | 'Medium' | 'Low';
  problem: string;
  fix: string;
  search_keywords: string[];
  avoid: string[];
}

export interface OutfitReviewShopItem {
  item_name: string;
  category: 'Footwear' | 'Tops' | 'Bottoms' | 'Accessories' | 'Outerwear';
  search_terms: string[];
  colors: string[];
  style_tags: string[];
  avoid: string[];
}

export interface OutfitReviewResult {
  overall_score: number;
  tagline: string;
  summary: string;
  scores: OutfitReviewScores;
  feed_eligible: boolean;
  feed_reason: string;
  feed_category: string | null;
  image_quality_score: number;
  aesthetic_score: number;
  style_tags: string[];
  what_works: OutfitReviewWhatWorksItem[];
  what_to_fix: OutfitReviewFixItem[];
  styling_tips: string[];
  shop_items: OutfitReviewShopItem[];
}

export interface OutfitReviewSession {
  id: string;
  imageUri: string;
  imageWidth?: number;
  imageHeight?: number;
  occasion: string;
  eventDescription?: string;
  analyzedAt: string;
  postedToFeedAt?: string;
  postedFeedCategory?: string | null;
  result: OutfitReviewResult;
}

export interface UserExplorePost {
  id: string;
  title: string;
  vibe: string;
  imageUrl: string;
  fallbackImageUrls?: string[];
  height: number;
  categories: ExploreTag[];
  source: 'user_upload';
  postedAt: string;
  reviewSessionId: string;
  feedReason: string;
  aiTags: string[];
  scoreSnapshot: {
    overall_score: number;
    occasion_fit: number;
    trend_score: number;
    confidence_score: number;
    image_quality_score: number;
    aesthetic_score: number;
  };
}

interface AppContextType {
  session: Session | null;
  isLoading: boolean;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  activeTheme: 'light' | 'dark';
  userProfile: UserProfile;
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  savedItems: InspirationItem[];
  toggleSave: (item: InspirationItem) => void;
  isSaved: (id: string) => boolean;
  latestOutfitReview: OutfitReviewSession | null;
  setLatestOutfitReview: (review: OutfitReviewSession | null) => void;
  userExplorePosts: UserExplorePost[];
  addUserExplorePost: (post: UserExplorePost) => boolean;
  hasUserExplorePost: (reviewSessionId: string) => boolean;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

const EMPTY_USER_PROFILE: UserProfile = {
  fullName: '',
  username: '',
  email: '',
  bio: '',
  avatarUri: null,
};

const DEFAULT_USER_PROFILE: UserProfile = {
  fullName: 'Jane Doe',
  username: 'janedoe',
  email: 'jane.doe@example.com',
  bio: 'Curating polished looks, elevated neutrals, and occasion-ready outfits.',
  avatarUri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80',
};

function isThemeMode(value: string | null): value is ThemeMode {
  return value === 'system' || value === 'light' || value === 'dark';
}

function isUserProfile(value: unknown): value is UserProfile {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.fullName === 'string' &&
    typeof candidate.username === 'string' &&
    typeof candidate.email === 'string' &&
    typeof candidate.bio === 'string' &&
    (typeof candidate.avatarUri === 'string' || candidate.avatarUri === null)
  );
}

function isUserExplorePost(value: unknown): value is UserExplorePost {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.id === 'string' &&
    typeof candidate.title === 'string' &&
    typeof candidate.vibe === 'string' &&
    typeof candidate.imageUrl === 'string' &&
    typeof candidate.height === 'number' &&
    candidate.source === 'user_upload' &&
    typeof candidate.postedAt === 'string' &&
    typeof candidate.reviewSessionId === 'string' &&
    typeof candidate.feedReason === 'string' &&
    Array.isArray(candidate.categories) &&
    candidate.categories.every((category) => typeof category === 'string') &&
    Array.isArray(candidate.aiTags)
  );
}

function getUserMetadataString(session: Session | null, keys: string[]) {
  const metadata = session?.user?.user_metadata;

  if (!metadata || typeof metadata !== 'object') {
    return null;
  }

  for (const key of keys) {
    const value = metadata[key];

    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }

  return null;
}

function deriveUsernameFromEmail(email: string | null | undefined) {
  if (!email) {
    return null;
  }

  const localPart = email.split('@')[0]?.trim();

  return localPart ? localPart.replace(/\s+/g, '').toLowerCase() : null;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const deviceTheme = useDeviceColorScheme();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [userProfileState, setUserProfileState] = useState<UserProfile>(EMPTY_USER_PROFILE);
  const [savedItems, setSavedItems] = useState<InspirationItem[]>([]);
  const [latestOutfitReview, setLatestOutfitReviewState] = useState<OutfitReviewSession | null>(null);
  const [userExplorePosts, setUserExplorePosts] = useState<UserExplorePost[]>([]);
  const [hasLoadedUserProfile, setHasLoadedUserProfile] = useState(false);
  const [hasLoadedUserExplorePosts, setHasLoadedUserExplorePosts] = useState(false);

  const activeTheme = useMemo<'light' | 'dark'>(
    () => (themeMode === 'system' ? deviceTheme || 'light' : themeMode),
    [deviceTheme, themeMode]
  );

  useEffect(() => {
    let isMounted = true;

    AsyncStorage.getItem(THEME_MODE_STORAGE_KEY)
      .then((storedThemeMode) => {
        if (isMounted && isThemeMode(storedThemeMode)) {
          setThemeModeState(storedThemeMode);
        }
      })
      .catch((error) => {
        console.warn('Error loading theme mode:', error);
      });

    AsyncStorage.getItem(USER_PROFILE_STORAGE_KEY)
      .then((storedProfile) => {
        if (!isMounted || !storedProfile) {
          return;
        }

        const parsed = JSON.parse(storedProfile);

        if (isUserProfile(parsed)) {
          setUserProfileState(parsed);
        }
      })
      .catch((error) => {
        console.warn('Error loading user profile:', error);
      })
      .finally(() => {
        if (isMounted) {
          setHasLoadedUserProfile(true);
        }
      });

    AsyncStorage.getItem(USER_EXPLORE_POSTS_STORAGE_KEY)
      .then((storedPosts) => {
        if (!isMounted || !storedPosts) {
          return;
        }

        const parsed = JSON.parse(storedPosts);

        if (Array.isArray(parsed)) {
          setUserExplorePosts(parsed.filter(isUserExplorePost));
        }
      })
      .catch((error) => {
        console.warn('Error loading user Explore posts:', error);
      })
      .finally(() => {
        if (isMounted) {
          setHasLoadedUserExplorePosts(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hasLoadedUserProfile) {
      return;
    }

    AsyncStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(userProfileState)).catch((error) => {
      console.warn('Error saving user profile:', error);
    });
  }, [hasLoadedUserProfile, userProfileState]);

  useEffect(() => {
    if (!hasLoadedUserExplorePosts) {
      return;
    }

    AsyncStorage.setItem(USER_EXPLORE_POSTS_STORAGE_KEY, JSON.stringify(userExplorePosts)).catch((error) => {
      console.warn('Error saving user Explore posts:', error);
    });
  }, [hasLoadedUserExplorePosts, userExplorePosts]);

  useEffect(() => {
    if (!hasSupabaseConfig) {
      setIsLoading(false);
      return;
    }

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        setIsLoading(false);
      })
      .catch((error) => {
        console.warn('Error fetching session on mount:', error);
        setSession(null);
        setIsLoading(false); // Unblock the splash screen!
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const userProfile = useMemo<UserProfile>(() => {
    const sessionEmail = session?.user?.email?.trim() || null;
    const metadataName = getUserMetadataString(session, ['full_name', 'name']);
    const metadataUsername = getUserMetadataString(session, ['username', 'user_name', 'preferred_username']);
    const metadataAvatar = getUserMetadataString(session, ['avatar_url', 'picture']);

    return {
      fullName: userProfileState.fullName || metadataName || DEFAULT_USER_PROFILE.fullName,
      username:
        userProfileState.username ||
        metadataUsername ||
        deriveUsernameFromEmail(sessionEmail) ||
        DEFAULT_USER_PROFILE.username,
      email: sessionEmail || userProfileState.email || DEFAULT_USER_PROFILE.email,
      bio: userProfileState.bio || DEFAULT_USER_PROFILE.bio,
      avatarUri: userProfileState.avatarUri || metadataAvatar || DEFAULT_USER_PROFILE.avatarUri,
    };
  }, [session, userProfileState]);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    AsyncStorage.setItem(THEME_MODE_STORAGE_KEY, mode).catch((error) => {
      console.warn('Error saving theme mode:', error);
    });
  };

  const updateUserProfile = (updates: Partial<UserProfile>) => {
    setUserProfileState((prev) => ({
      ...prev,
      ...updates,
    }));
  };

  const toggleSave = (item: InspirationItem) => {
    setSavedItems((prev) => {
      const exists = prev.find(i => i.id === item.id);
      if (exists) {
        return prev.filter(i => i.id !== item.id);
      }
      return [item, ...prev]; // Prepend new items
    });
  };

  const isSaved = (id: string) => {
    return savedItems.some(i => i.id === id);
  };

  const setLatestOutfitReview = (review: OutfitReviewSession | null) => {
    setLatestOutfitReviewState(review);
  };

  const hasUserExplorePost = (reviewSessionId: string) => {
    return userExplorePosts.some((post) => post.reviewSessionId === reviewSessionId);
  };

  const addUserExplorePost = (post: UserExplorePost) => {
    if (hasUserExplorePost(post.reviewSessionId) || userExplorePosts.some((item) => item.id === post.id)) {
      return false;
    }

    setUserExplorePosts((prev) => [post, ...prev]);
    return true;
  };

  return (
    <AppContext.Provider value={{
      session, isLoading,
      themeMode, setThemeMode, activeTheme,
      userProfile, updateUserProfile,
      savedItems, toggleSave, isSaved,
      latestOutfitReview, setLatestOutfitReview,
      userExplorePosts, addUserExplorePost, hasUserExplorePost
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

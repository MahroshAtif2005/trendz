import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme as useDeviceColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session } from '@supabase/supabase-js';
import { supabase, hasSupabaseConfig } from '@/lib/supabase';
import type { ExploreTag } from '@/lib/explore-feed';
import {
  deleteSharedExplorePost,
  fetchSavedExplorePostIds,
  fetchSharedExplorePostById,
  fetchSharedExplorePostByImageUrl,
  fetchSharedExplorePosts,
  getExploreOwnerIdentity,
  mapExplorePostToSavedItem,
  publishSharedExplorePost,
  saveSharedExplorePost,
  unsaveSharedExplorePost,
} from '@/lib/explore-store';

export type ThemeMode = 'system' | 'light' | 'dark';
const THEME_MODE_STORAGE_KEY = 'trendz.themeMode';
const USER_PROFILE_STORAGE_KEY = 'trendz.userProfile';
const LOCAL_EXPLORE_POSTS_STORAGE_KEY = 'trendz.userExplorePosts';
const LOCAL_SAVED_ITEMS_STORAGE_KEY = 'trendz.savedItems';
const SAVED_EXPLORE_POST_IDS_STORAGE_KEY = 'trendz.savedExplorePostIds';
const LATEST_OUTFIT_REVIEW_STORAGE_KEY = 'trendz.latestOutfitReview';
const CACHED_OUTFIT_REVIEWS_STORAGE_KEY = 'trendz.cachedOutfitReviews';
const PLANNER_EVENTS_STORAGE_KEY = 'trendz.plannerEvents';
const MAX_CACHED_OUTFIT_REVIEWS = 40;

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
  imageFingerprint?: string;
  reviewCacheKey?: string;
  occasion: string;
  eventDescription?: string;
  analyzedAt: string;
  postedToFeedAt?: string;
  postedFeedCategory?: string | null;
  result: OutfitReviewResult;
}

export interface UserExplorePost {
  id: string;
  ownerUserId?: string;
  ownerDisplayName?: string;
  ownerAvatarUri?: string | null;
  title: string;
  vibe: string;
  caption?: string;
  imageUrl: string;
  fallbackImageUrls?: string[];
  height: number;
  categories: ExploreTag[];
  source: 'user_upload';
  postedAt: string;
  reviewSessionId: string;
  feedReason: string;
  aiTags: string[];
  saveCount?: number;
  savedByUserIds?: string[];
  scoreSnapshot: {
    overall_score: number;
    occasion_fit: number;
    trend_score: number;
    confidence_score: number;
    image_quality_score: number;
    aesthetic_score: number;
  };
}

export interface PlannerEvent {
  id: string;
  dateKey: string;
  title: string;
  notes: string;
  outfitSource: 'saved' | 'review' | 'none';
  outfitId?: string;
  outfitImageUrl?: string;
  outfitTitle?: string;
  reviewSessionId?: string;
  createdAt: number;
}

export type ExplorePublishResult = 'published' | 'already_published' | 'error';
export type ExploreDeleteResult = 'deleted' | 'forbidden' | 'not_found' | 'error';

interface AppContextType {
  session: Session | null;
  isLoading: boolean;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  activeTheme: 'light' | 'dark';
  userProfile: UserProfile;
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  savedItems: InspirationItem[];
  toggleSave: (item: InspirationItem) => Promise<void>;
  isSaved: (id: string) => boolean;
  latestOutfitReview: OutfitReviewSession | null;
  setLatestOutfitReview: (review: OutfitReviewSession | null) => void;
  findCachedOutfitReview: (cacheKey: string) => OutfitReviewSession | null;
  explorePosts: UserExplorePost[];
  userExplorePosts: UserExplorePost[];
  addUserExplorePost: (post: UserExplorePost) => Promise<ExplorePublishResult>;
  removeUserExplorePost: (postId: string) => Promise<ExploreDeleteResult>;
  hasUserExplorePost: (reviewSessionId: string) => boolean;
  refreshExplorePosts: () => Promise<void>;
  plannerEvents: PlannerEvent[];
  addPlannerEvent: (event: Omit<PlannerEvent, 'id' | 'createdAt'>) => PlannerEvent;
  removePlannerEvent: (eventId: string) => void;
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
  avatarUri: null,
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
    Array.isArray(candidate.aiTags) &&
    (candidate.saveCount === undefined || typeof candidate.saveCount === 'number') &&
    (candidate.savedByUserIds === undefined ||
      (Array.isArray(candidate.savedByUserIds) &&
        candidate.savedByUserIds.every((value) => typeof value === 'string')))
  );
}

function isInspirationItem(value: unknown): value is InspirationItem {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.id === 'string' &&
    typeof candidate.title === 'string' &&
    typeof candidate.imageUrl === 'string' &&
    (candidate.vibe === undefined || typeof candidate.vibe === 'string') &&
    (candidate.height === undefined || typeof candidate.height === 'number')
  );
}

function isPlannerEvent(value: unknown): value is PlannerEvent {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.id === 'string' &&
    typeof candidate.dateKey === 'string' &&
    typeof candidate.title === 'string' &&
    typeof candidate.notes === 'string' &&
    (candidate.outfitSource === 'saved' ||
      candidate.outfitSource === 'review' ||
      candidate.outfitSource === 'none') &&
    (candidate.outfitId === undefined || typeof candidate.outfitId === 'string') &&
    (candidate.outfitImageUrl === undefined || typeof candidate.outfitImageUrl === 'string') &&
    (candidate.outfitTitle === undefined || typeof candidate.outfitTitle === 'string') &&
    (candidate.reviewSessionId === undefined || typeof candidate.reviewSessionId === 'string') &&
    typeof candidate.createdAt === 'number'
  );
}

function isOutfitReviewScores(value: unknown): value is OutfitReviewScores {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.occasion_fit === 'number' &&
    typeof candidate.trend_score === 'number' &&
    typeof candidate.confidence_score === 'number'
  );
}

function isOutfitReviewResult(value: unknown): value is OutfitReviewResult {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.overall_score === 'number' &&
    typeof candidate.tagline === 'string' &&
    typeof candidate.summary === 'string' &&
    isOutfitReviewScores(candidate.scores) &&
    typeof candidate.feed_eligible === 'boolean' &&
    typeof candidate.feed_reason === 'string' &&
    (typeof candidate.feed_category === 'string' || candidate.feed_category === null) &&
    typeof candidate.image_quality_score === 'number' &&
    typeof candidate.aesthetic_score === 'number' &&
    Array.isArray(candidate.style_tags) &&
    Array.isArray(candidate.what_works) &&
    Array.isArray(candidate.what_to_fix) &&
    Array.isArray(candidate.styling_tips) &&
    Array.isArray(candidate.shop_items)
  );
}

function isOutfitReviewSession(value: unknown): value is OutfitReviewSession {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.id === 'string' &&
    typeof candidate.imageUri === 'string' &&
    typeof candidate.occasion === 'string' &&
    typeof candidate.analyzedAt === 'string' &&
    (candidate.imageWidth === undefined || typeof candidate.imageWidth === 'number') &&
    (candidate.imageHeight === undefined || typeof candidate.imageHeight === 'number') &&
    (candidate.imageFingerprint === undefined || typeof candidate.imageFingerprint === 'string') &&
    (candidate.reviewCacheKey === undefined || typeof candidate.reviewCacheKey === 'string') &&
    (candidate.eventDescription === undefined || typeof candidate.eventDescription === 'string') &&
    (candidate.postedToFeedAt === undefined || typeof candidate.postedToFeedAt === 'string') &&
    (candidate.postedFeedCategory === undefined ||
      typeof candidate.postedFeedCategory === 'string' ||
      candidate.postedFeedCategory === null) &&
    isOutfitReviewResult(candidate.result)
  );
}

function getFallbackProfileOwnerId(email: string, username: string) {
  const normalizedEmail = email.trim().toLowerCase();

  if (normalizedEmail) {
    return `profile:${normalizedEmail}`;
  }

  const normalizedUsername = username.trim().toLowerCase();

  if (normalizedUsername) {
    return `profile:${normalizedUsername}`;
  }

  return 'profile:anonymous';
}

function normalizeStoredExplorePost(
  value: unknown,
  fallbackOwnerId: string,
  fallbackOwnerDisplayName: string,
  fallbackOwnerAvatarUri: string | null
): UserExplorePost | null {
  if (!isUserExplorePost(value)) {
    return null;
  }

  return {
    ...value,
    ownerUserId:
      typeof value.ownerUserId === 'string' && value.ownerUserId.trim().length > 0
        ? value.ownerUserId
        : fallbackOwnerId,
    ownerDisplayName:
      typeof value.ownerDisplayName === 'string' && value.ownerDisplayName.trim().length > 0
        ? value.ownerDisplayName
        : fallbackOwnerDisplayName,
    ownerAvatarUri:
      value.ownerAvatarUri === undefined ? fallbackOwnerAvatarUri : value.ownerAvatarUri,
    caption:
      typeof value.caption === 'string' && value.caption.trim().length > 0
        ? value.caption
        : value.feedReason,
    saveCount:
      typeof value.saveCount === 'number'
        ? value.saveCount
        : Array.isArray(value.savedByUserIds)
          ? value.savedByUserIds.length
          : 0,
    savedByUserIds: Array.isArray(value.savedByUserIds) ? value.savedByUserIds : [],
  };
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

function dedupeInspirationItems(items: InspirationItem[]) {
  const seen = new Set<string>();

  return items.filter((item) => {
    if (!item.id || seen.has(item.id)) {
      return false;
    }

    seen.add(item.id);
    return true;
  });
}

function debugExploreLog(message: string, payload?: unknown) {
  if (!__DEV__) {
    return;
  }

  if (payload === undefined) {
    console.log(`[explore] ${message}`);
    return;
  }

  console.log(`[explore] ${message}`, payload);
}

function isSupabaseUniqueViolation(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const candidate = error as { code?: unknown };
  return candidate.code === '23505';
}

function getSupabaseErrorDetails(error: unknown) {
  if (!error || typeof error !== 'object') {
    return { message: 'Unknown error' };
  }

  const candidate = error as {
    code?: unknown;
    message?: unknown;
    details?: unknown;
    hint?: unknown;
  };

  return {
    code: typeof candidate.code === 'string' ? candidate.code : undefined,
    message: typeof candidate.message === 'string' ? candidate.message : 'Unknown error',
    details: typeof candidate.details === 'string' ? candidate.details : undefined,
    hint: typeof candidate.hint === 'string' ? candidate.hint : undefined,
  };
}

function upsertCachedReviewList(
  currentReviews: OutfitReviewSession[],
  review: OutfitReviewSession
) {
  const cacheKey = review.reviewCacheKey?.trim();

  if (!cacheKey) {
    return currentReviews;
  }

  return [
    review,
    ...currentReviews.filter((item) => item.reviewCacheKey !== cacheKey && item.id !== review.id),
  ].slice(0, MAX_CACHED_OUTFIT_REVIEWS);
}

function stripPostedFeedState(
  review: OutfitReviewSession,
  reviewSessionId: string
): OutfitReviewSession {
  if (review.id !== reviewSessionId) {
    return review;
  }

  return {
    ...review,
    postedToFeedAt: undefined,
    postedFeedCategory: null,
  };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const deviceTheme = useDeviceColorScheme();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [userProfileState, setUserProfileState] = useState<UserProfile>(EMPTY_USER_PROFILE);
  const [localSavedItems, setLocalSavedItems] = useState<InspirationItem[]>([]);
  const [latestOutfitReview, setLatestOutfitReviewState] = useState<OutfitReviewSession | null>(null);
  const [cachedOutfitReviews, setCachedOutfitReviews] = useState<OutfitReviewSession[]>([]);
  const [explorePosts, setExplorePosts] = useState<UserExplorePost[]>([]);
  const [plannerEvents, setPlannerEvents] = useState<PlannerEvent[]>([]);
  const [savedExplorePostIds, setSavedExplorePostIds] = useState<string[]>([]);
  const [hasLoadedUserProfile, setHasLoadedUserProfile] = useState(false);
  const [hasLoadedExplorePosts, setHasLoadedExplorePosts] = useState(false);
  const [hasLoadedSavedExplorePostIds, setHasLoadedSavedExplorePostIds] = useState(false);
  const [hasLoadedLocalSavedItems, setHasLoadedLocalSavedItems] = useState(false);
  const [hasLoadedLatestOutfitReview, setHasLoadedLatestOutfitReview] = useState(false);
  const [hasLoadedCachedOutfitReviews, setHasLoadedCachedOutfitReviews] = useState(false);
  const [hasLoadedPlannerEvents, setHasLoadedPlannerEvents] = useState(false);

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

    const fallbackOwnerId = getFallbackProfileOwnerId(
      EMPTY_USER_PROFILE.email || DEFAULT_USER_PROFILE.email,
      EMPTY_USER_PROFILE.username || DEFAULT_USER_PROFILE.username
    );

    AsyncStorage.getItem(LOCAL_EXPLORE_POSTS_STORAGE_KEY)
      .then((storedPosts) => {
        if (!isMounted) {
          return;
        }

        if (hasSupabaseConfig) {
          setExplorePosts([]);
          return;
        }

        if (!storedPosts) {
          setExplorePosts([]);
          return;
        }

        const parsed = JSON.parse(storedPosts);

        if (Array.isArray(parsed)) {
          setExplorePosts(
            parsed
              .map((post) =>
                normalizeStoredExplorePost(
                  post,
                  fallbackOwnerId,
                  DEFAULT_USER_PROFILE.fullName,
                  DEFAULT_USER_PROFILE.avatarUri
                )
              )
              .filter((post): post is UserExplorePost => post !== null)
          );
        }
      })
      .catch((error) => {
        console.warn('Error loading user Explore posts:', error);
      })
      .finally(() => {
        if (isMounted) {
          setHasLoadedExplorePosts(true);
        }
      });

    AsyncStorage.getItem(SAVED_EXPLORE_POST_IDS_STORAGE_KEY)
      .then((storedIds) => {
        if (!isMounted) {
          return;
        }

        if (!storedIds) {
          setSavedExplorePostIds([]);
          return;
        }

        const parsed = JSON.parse(storedIds);

        if (Array.isArray(parsed)) {
          setSavedExplorePostIds(parsed.filter((value): value is string => typeof value === 'string'));
        }
      })
      .catch((error) => {
        console.warn('Error loading saved Explore post ids:', error);
      })
      .finally(() => {
        if (isMounted) {
          setHasLoadedSavedExplorePostIds(true);
        }
      });

    AsyncStorage.getItem(LOCAL_SAVED_ITEMS_STORAGE_KEY)
      .then((storedItems) => {
        if (!isMounted) {
          return;
        }

        if (!storedItems) {
          setLocalSavedItems([]);
          return;
        }

        const parsed = JSON.parse(storedItems);

        if (Array.isArray(parsed)) {
          setLocalSavedItems(parsed.filter(isInspirationItem));
        }
      })
      .catch((error) => {
        console.warn('Error loading saved items:', error);
      })
      .finally(() => {
        if (isMounted) {
          setHasLoadedLocalSavedItems(true);
        }
      });

    AsyncStorage.getItem(LATEST_OUTFIT_REVIEW_STORAGE_KEY)
      .then((storedReview) => {
        if (!isMounted || !storedReview) {
          return;
        }

        const parsed = JSON.parse(storedReview);

        if (isOutfitReviewSession(parsed)) {
          setLatestOutfitReviewState(parsed);
        }
      })
      .catch((error) => {
        console.warn('Error loading latest outfit review:', error);
      })
      .finally(() => {
        if (isMounted) {
          setHasLoadedLatestOutfitReview(true);
        }
      });

    AsyncStorage.getItem(CACHED_OUTFIT_REVIEWS_STORAGE_KEY)
      .then((storedReviews) => {
        if (!isMounted || !storedReviews) {
          return;
        }

        const parsed = JSON.parse(storedReviews);

        if (Array.isArray(parsed)) {
          setCachedOutfitReviews(
            parsed.filter(
              (review): review is OutfitReviewSession =>
                isOutfitReviewSession(review) && typeof review.reviewCacheKey === 'string'
            )
          );
        }
      })
      .catch((error) => {
        console.warn('Error loading cached outfit reviews:', error);
      })
      .finally(() => {
        if (isMounted) {
          setHasLoadedCachedOutfitReviews(true);
        }
      });

    AsyncStorage.getItem(PLANNER_EVENTS_STORAGE_KEY)
      .then((storedEvents) => {
        if (!isMounted || !storedEvents) {
          return;
        }

        const parsed = JSON.parse(storedEvents);

        if (Array.isArray(parsed)) {
          setPlannerEvents(parsed.filter(isPlannerEvent));
        }
      })
      .catch((error) => {
        console.warn('Error loading planner events:', error);
      })
      .finally(() => {
        if (isMounted) {
          setHasLoadedPlannerEvents(true);
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
    if (!hasLoadedExplorePosts) {
      return;
    }

    if (hasSupabaseConfig) {
      return;
    }

    AsyncStorage.setItem(LOCAL_EXPLORE_POSTS_STORAGE_KEY, JSON.stringify(explorePosts)).catch((error) => {
      console.warn('Error saving user Explore posts:', error);
    });
  }, [explorePosts, hasLoadedExplorePosts]);

  useEffect(() => {
    if (!hasLoadedSavedExplorePostIds) {
      return;
    }

    AsyncStorage.setItem(SAVED_EXPLORE_POST_IDS_STORAGE_KEY, JSON.stringify(savedExplorePostIds)).catch((error) => {
      console.warn('Error saving Explore post ids:', error);
    });
  }, [hasLoadedSavedExplorePostIds, savedExplorePostIds]);

  useEffect(() => {
    if (!hasLoadedLocalSavedItems) {
      return;
    }

    AsyncStorage.setItem(LOCAL_SAVED_ITEMS_STORAGE_KEY, JSON.stringify(localSavedItems)).catch((error) => {
      console.warn('Error saving local saved items:', error);
    });
  }, [hasLoadedLocalSavedItems, localSavedItems]);

  useEffect(() => {
    if (!hasLoadedLatestOutfitReview) {
      return;
    }

    if (!latestOutfitReview) {
      AsyncStorage.removeItem(LATEST_OUTFIT_REVIEW_STORAGE_KEY).catch((error) => {
        console.warn('Error clearing latest outfit review:', error);
      });
      return;
    }

    AsyncStorage.setItem(
      LATEST_OUTFIT_REVIEW_STORAGE_KEY,
      JSON.stringify(latestOutfitReview)
    ).catch((error) => {
      console.warn('Error saving latest outfit review:', error);
    });
  }, [hasLoadedLatestOutfitReview, latestOutfitReview]);

  useEffect(() => {
    if (!hasLoadedCachedOutfitReviews) {
      return;
    }

    AsyncStorage.setItem(
      CACHED_OUTFIT_REVIEWS_STORAGE_KEY,
      JSON.stringify(cachedOutfitReviews)
    ).catch((error) => {
      console.warn('Error saving cached outfit reviews:', error);
    });
  }, [cachedOutfitReviews, hasLoadedCachedOutfitReviews]);

  useEffect(() => {
    if (!hasLoadedPlannerEvents) {
      return;
    }

    AsyncStorage.setItem(PLANNER_EVENTS_STORAGE_KEY, JSON.stringify(plannerEvents)).catch((error) => {
      console.warn('Error saving planner events:', error);
    });
  }, [plannerEvents, hasLoadedPlannerEvents]);

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

  const exploreOwnerIdentity = useMemo(
    () => getExploreOwnerIdentity(session, userProfile),
    [session, userProfile]
  );
  const localOwnerId = useMemo(
    () => getFallbackProfileOwnerId(userProfile.email, userProfile.username),
    [userProfile.email, userProfile.username]
  );
  const ownerIds = useMemo(
    () => new Set([exploreOwnerIdentity.ownerUserId, localOwnerId].filter(Boolean)),
    [exploreOwnerIdentity.ownerUserId, localOwnerId]
  );

  const userExplorePosts = useMemo(
    () => explorePosts.filter((post) => post.ownerUserId && ownerIds.has(post.ownerUserId)),
    [explorePosts, ownerIds]
  );

  const sharedSavedItems = useMemo(
    () =>
      explorePosts
        .filter((post) => savedExplorePostIds.includes(post.id))
        .map(mapExplorePostToSavedItem),
    [explorePosts, savedExplorePostIds]
  );

  const savedItems = useMemo(
    () => dedupeInspirationItems([...sharedSavedItems, ...localSavedItems]),
    [localSavedItems, sharedSavedItems]
  );

  const refreshExplorePosts = useCallback(async () => {
    if (!hasSupabaseConfig) {
      return;
    }

    try {
      const sharedPosts = await fetchSharedExplorePosts();
      setExplorePosts(sharedPosts);
    } catch (error) {
      console.warn('Error loading shared Explore posts:', error);
    }

    if (!session?.user?.id) {
      setSavedExplorePostIds([]);
      return;
    }

    try {
      const savedIds = await fetchSavedExplorePostIds(session.user.id);
      setSavedExplorePostIds(savedIds);
    } catch (error) {
      console.warn('Error loading shared Explore saves:', error);
    }
  }, [session?.user?.id, hasSupabaseConfig]);

  useEffect(() => {
    if (!hasSupabaseConfig) {
      return;
    }

    void refreshExplorePosts();
  }, [session?.user?.id]);

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

  const toggleSave = async (item: InspirationItem) => {
    const sharedPost = explorePosts.find((post) => post.id === item.id);

    if (sharedPost && hasSupabaseConfig && session?.user?.id) {
      const alreadySaved = savedExplorePostIds.includes(item.id);

      try {
        const updatedPost = alreadySaved
          ? await unsaveSharedExplorePost(item.id, session.user.id)
          : await saveSharedExplorePost(item.id, session.user.id);

        if (updatedPost) {
          const previousCount = sharedPost.saveCount ?? 0;
          const correctedPost = {
            ...updatedPost,
            saveCount: alreadySaved ? Math.max(0, previousCount - 1) : previousCount + 1,
          };
          setExplorePosts((prev) => [correctedPost, ...prev.filter((post) => post.id !== item.id)]);
        }

        setSavedExplorePostIds((prev) =>
          alreadySaved
            ? prev.filter((savedId) => savedId !== item.id)
            : [item.id, ...prev.filter((savedId) => savedId !== item.id)]
        );

        if (!alreadySaved) {
          setLocalSavedItems((prev) => prev.filter((savedItem) => savedItem.id !== item.id));
        }
        return;
      } catch (error) {
        console.warn('Error updating Explore post save:', error);
      }
    }

    setLocalSavedItems((prev) => {
      const exists = prev.find((savedItem) => savedItem.id === item.id);

      if (exists) {
        return prev.filter((savedItem) => savedItem.id !== item.id);
      }

      return [item, ...prev];
    });
  };

  const isSaved = (id: string) => {
    return savedExplorePostIds.includes(id) || localSavedItems.some((item) => item.id === id);
  };

  const setLatestOutfitReview = (review: OutfitReviewSession | null) => {
    setLatestOutfitReviewState(review);

    if (review) {
      setCachedOutfitReviews((currentReviews) => upsertCachedReviewList(currentReviews, review));
    }
  };

  const findCachedOutfitReview = (cacheKey: string) => {
    const normalizedKey = cacheKey.trim();

    if (!normalizedKey) {
      return null;
    }

    return (
      cachedOutfitReviews.find((review) => review.reviewCacheKey === normalizedKey) ??
      (latestOutfitReview?.reviewCacheKey === normalizedKey ? latestOutfitReview : null)
    );
  };

  const hasUserExplorePost = (reviewSessionId: string) => {
    return userExplorePosts.some((post) => post.reviewSessionId === reviewSessionId);
  };

  const addPlannerEvent = (event: Omit<PlannerEvent, 'id' | 'createdAt'>) => {
    const nextEvent: PlannerEvent = {
      ...event,
      id: `${event.dateKey}-${Date.now()}`,
      createdAt: Date.now(),
    };

    setPlannerEvents((currentEvents) => [nextEvent, ...currentEvents]);
    return nextEvent;
  };

  const removePlannerEvent = (eventId: string) => {
    setPlannerEvents((currentEvents) => currentEvents.filter((event) => event.id !== eventId));
  };

  const removeUserExplorePost = async (postId: string): Promise<ExploreDeleteResult> => {
    const targetPost = explorePosts.find((post) => post.id === postId);

    if (!targetPost) {
      debugExploreLog('delete skipped: post not found', { postId });
      return 'not_found';
    }

    if (!targetPost.ownerUserId || !ownerIds.has(targetPost.ownerUserId)) {
      debugExploreLog('delete blocked: owner mismatch', {
        postId,
        ownerUserId: targetPost.ownerUserId ?? null,
      });
      return 'forbidden';
    }

    const previousExplorePosts = explorePosts;
    const previousSavedExplorePostIds = savedExplorePostIds;
    const previousLocalSavedItems = localSavedItems;
    const previousLatestOutfitReview = latestOutfitReview;
    const previousCachedOutfitReviews = cachedOutfitReviews;

    debugExploreLog('delete started', {
      postId: targetPost.id,
      reviewSessionId: targetPost.reviewSessionId,
      ownerUserId: targetPost.ownerUserId,
    });

    setExplorePosts((prev) => prev.filter((post) => post.id !== targetPost.id));
    setSavedExplorePostIds((prev) => prev.filter((savedId) => savedId !== targetPost.id));
    setLocalSavedItems((prev) => prev.filter((item) => item.id !== targetPost.id));
    setLatestOutfitReviewState((prev) =>
      prev ? stripPostedFeedState(prev, targetPost.reviewSessionId) : prev
    );
    setCachedOutfitReviews((prev) =>
      prev.map((review) => stripPostedFeedState(review, targetPost.reviewSessionId))
    );

    if (!hasSupabaseConfig) {
      debugExploreLog('delete completed in app-level fallback store', {
        postId: targetPost.id,
      });
      return 'deleted';
    }

    try {
      const sharedPost = await fetchSharedExplorePostById(targetPost.id);

      if (!sharedPost) {
        debugExploreLog('delete completed: post existed only in app fallback store', {
          postId: targetPost.id,
          reviewSessionId: targetPost.reviewSessionId,
        });
        return 'deleted';
      }

      if (!session?.user?.id) {
        const sessionErrorDetails = {
          code: 'missing_session',
          message: 'Shared Explore delete requires an authenticated Supabase session.',
          details: `Post ${targetPost.id} exists in public.explore_posts but no authenticated session is active.`,
          hint: 'Sign in with the same account that published the post before deleting.',
        };
        console.warn('[wardrobe-delete] failed', sessionErrorDetails);
        debugExploreLog('delete failed: missing authenticated session', {
          postId: targetPost.id,
          ...sessionErrorDetails,
        });
        setExplorePosts(previousExplorePosts);
        setSavedExplorePostIds(previousSavedExplorePostIds);
        setLocalSavedItems(previousLocalSavedItems);
        setLatestOutfitReviewState(previousLatestOutfitReview);
        setCachedOutfitReviews(previousCachedOutfitReviews);
        return 'error';
      }

      if (sharedPost.ownerUserId !== session.user.id) {
        debugExploreLog('delete blocked: shared owner mismatch', {
          postId: targetPost.id,
          sharedOwnerUserId: sharedPost.ownerUserId,
          sessionUserId: session.user.id,
        });
        setExplorePosts(previousExplorePosts);
        setSavedExplorePostIds(previousSavedExplorePostIds);
        setLocalSavedItems(previousLocalSavedItems);
        setLatestOutfitReviewState(previousLatestOutfitReview);
        setCachedOutfitReviews(previousCachedOutfitReviews);
        return 'forbidden';
      }

      const deletedSharedPost = await deleteSharedExplorePost(targetPost.id, session.user.id);

      if (!deletedSharedPost) {
        const deleteErrorDetails = {
          code: 'delete_no_rows',
          message: 'The shared Explore delete did not remove any rows.',
          details: `Delete matched no row for post ${targetPost.id} owned by ${session.user.id}.`,
          hint: 'Check public.explore_posts ownership values and delete RLS policy.',
        };
        console.warn('[wardrobe-delete] failed', deleteErrorDetails);
        debugExploreLog('shared delete matched no rows', deleteErrorDetails);
        setExplorePosts(previousExplorePosts);
        setSavedExplorePostIds(previousSavedExplorePostIds);
        setLocalSavedItems(previousLocalSavedItems);
        setLatestOutfitReviewState(previousLatestOutfitReview);
        setCachedOutfitReviews(previousCachedOutfitReviews);
        return 'error';
      }

      debugExploreLog('shared delete completed', {
        postId: targetPost.id,
        deletedFromSupabase: Boolean(deletedSharedPost),
      });
      await refreshExplorePosts();
      return 'deleted';
    } catch (error) {
      const errorDetails = getSupabaseErrorDetails(error);
      console.warn('[wardrobe-delete] failed', errorDetails);
      debugExploreLog('shared delete failed', {
        postId: targetPost.id,
        ...errorDetails,
      });
      setExplorePosts(previousExplorePosts);
      setSavedExplorePostIds(previousSavedExplorePostIds);
      setLocalSavedItems(previousLocalSavedItems);
      setLatestOutfitReviewState(previousLatestOutfitReview);
      setCachedOutfitReviews(previousCachedOutfitReviews);
      return 'error';
    }
  };

  const addUserExplorePost = async (post: UserExplorePost): Promise<ExplorePublishResult> => {
    const postWithOwner: UserExplorePost = {
      ...post,
      ownerUserId: post.ownerUserId || exploreOwnerIdentity.ownerUserId,
      ownerDisplayName: post.ownerDisplayName || exploreOwnerIdentity.ownerDisplayName,
      ownerAvatarUri:
        post.ownerAvatarUri === undefined ? exploreOwnerIdentity.ownerAvatarUri : post.ownerAvatarUri,
      caption: post.caption || post.feedReason,
      saveCount:
        typeof post.saveCount === 'number'
          ? post.saveCount
          : Array.isArray(post.savedByUserIds)
            ? post.savedByUserIds.length
            : 0,
      savedByUserIds: Array.isArray(post.savedByUserIds) ? post.savedByUserIds : [],
    };
    const normalizedImageUrl = postWithOwner.imageUrl.trim();
    const matchesExistingImage = (item: UserExplorePost) =>
      item.ownerUserId === postWithOwner.ownerUserId && item.imageUrl.trim() === normalizedImageUrl;

    if (normalizedImageUrl && (userExplorePosts.some(matchesExistingImage) || explorePosts.some(matchesExistingImage))) {
      debugExploreLog('publish skipped: already published', {
        id: postWithOwner.id,
        imageUrl: normalizedImageUrl,
      });
      return 'already_published';
    }

    debugExploreLog('publish payload built', {
      id: postWithOwner.id,
      reviewSessionId: postWithOwner.reviewSessionId,
      categories: postWithOwner.categories,
      ownerUserId: postWithOwner.ownerUserId,
    });
    debugExploreLog('publish auth context', {
      hasSupabaseConfig,
      sessionUserId: session?.user?.id ?? null,
      sessionUserEmail: session?.user?.email?.trim().toLowerCase() ?? null,
      ownerUserId: postWithOwner.ownerUserId,
      reviewSessionId: postWithOwner.reviewSessionId,
    });

    if (!hasSupabaseConfig) {
      setExplorePosts((prev) => [
        postWithOwner,
        ...prev.filter(
          (item) =>
            item.id !== postWithOwner.id && item.reviewSessionId !== postWithOwner.reviewSessionId
        ),
      ]);
      debugExploreLog('publish completed in app-level fallback store', {
        id: postWithOwner.id,
        reason: 'supabase_not_configured',
      });
      return 'published';
    }

    if (!session?.user?.id) {
      const errorDetails = {
        code: 'missing_session',
        message: 'Shared Explore publishing requires an authenticated Supabase session.',
        details: `No Supabase auth session was available while trying to publish review ${postWithOwner.reviewSessionId}.`,
        hint: 'Sign in before publishing to Explore.',
      };
      console.warn('[explore-publish] failed', errorDetails);
      debugExploreLog('shared publish blocked: missing authenticated session', errorDetails);
      return 'error';
    }

    try {
      const existingSharedPost = await fetchSharedExplorePostByImageUrl(
        postWithOwner.ownerUserId ?? session.user.id,
        normalizedImageUrl
      );

      if (existingSharedPost) {
        debugExploreLog('publish skipped: shared image already exists', {
          id: existingSharedPost.id,
          imageUrl: existingSharedPost.imageUrl,
        });
        setExplorePosts((prev) => [
          existingSharedPost,
          ...prev.filter(
            (item) =>
              item.id !== existingSharedPost.id &&
              item.reviewSessionId !== existingSharedPost.reviewSessionId
          ),
        ]);
        return 'already_published';
      }
    } catch (error) {
      const errorDetails = getSupabaseErrorDetails(error);
      console.warn('[explore-publish] duplicate check failed', errorDetails);
      debugExploreLog('shared duplicate lookup failed before publish', errorDetails);
    }

    try {
      debugExploreLog('shared publish started', {
        id: postWithOwner.id,
        reviewSessionId: postWithOwner.reviewSessionId,
        sessionUserId: session.user.id,
      });
      const publishedPost = await publishSharedExplorePost({
        post: postWithOwner,
        session,
        userProfile,
      });

      if (!publishedPost) {
        const errorDetails = {
          code: 'missing_insert_row',
          message: 'Shared Explore publish returned no row.',
          details: `No row was returned for review ${postWithOwner.reviewSessionId} after publish.`,
          hint: 'Inspect the Supabase insert logs for public.explore_posts.',
        };
        console.warn('[explore-publish] failed', errorDetails);
        debugExploreLog('shared publish returned no row', errorDetails);
        return 'error';
      }

      debugExploreLog('shared publish succeeded', {
        id: publishedPost.id,
        reviewSessionId: publishedPost.reviewSessionId,
        categories: publishedPost.categories,
      });
      setExplorePosts((prev) => [
        publishedPost,
        ...prev.filter(
          (item) =>
            item.id !== publishedPost.id && item.reviewSessionId !== publishedPost.reviewSessionId
        ),
      ]);
      return 'published';
    } catch (error) {
      if (isSupabaseUniqueViolation(error)) {
        try {
          const existingSharedPost = await fetchSharedExplorePostByImageUrl(
            postWithOwner.ownerUserId ?? session.user.id,
            normalizedImageUrl
          );

          if (existingSharedPost) {
            debugExploreLog('shared publish collided with existing image, reusing post', {
              id: existingSharedPost.id,
              imageUrl: existingSharedPost.imageUrl,
            });
            setExplorePosts((prev) => [
              existingSharedPost,
              ...prev.filter(
                (item) =>
                  item.id !== existingSharedPost.id &&
                  item.reviewSessionId !== existingSharedPost.reviewSessionId
              ),
            ]);
            return 'already_published';
          }
        } catch (lookupError) {
          const lookupErrorDetails = getSupabaseErrorDetails(lookupError);
          console.warn('[explore-publish] duplicate recovery failed', lookupErrorDetails);
        }
      }

      const errorDetails = getSupabaseErrorDetails(error);
      console.warn('[explore-publish] failed', {
        error,
        ...errorDetails,
      });
      debugExploreLog('shared publish failed', {
        id: postWithOwner.id,
        reviewSessionId: postWithOwner.reviewSessionId,
        ...errorDetails,
      });
      return 'error';
    }
  };

  return (
    <AppContext.Provider value={{
      session, isLoading,
      themeMode, setThemeMode, activeTheme,
      userProfile, updateUserProfile,
      savedItems, toggleSave, isSaved,
      latestOutfitReview, setLatestOutfitReview, findCachedOutfitReview,
      explorePosts,
      userExplorePosts,
      addUserExplorePost,
      removeUserExplorePost,
      hasUserExplorePost,
      refreshExplorePosts,
      plannerEvents,
      addPlannerEvent,
      removePlannerEvent
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

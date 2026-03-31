import AsyncStorage from '@react-native-async-storage/async-storage';
import { hasSupabaseConfig, supabase } from '@/lib/supabase';

const EXPLORE_INTERACTIONS_STORAGE_KEY = 'explore_interactions';
const MAX_CATEGORY_WEIGHT = 100;

export type ExplorePost = {
  id: string;
  categories?: string[] | string | null;
  created_at?: string | null;
  postedAt?: string | null;
};

function normalizeCategories(categories: string[] | string | null | undefined) {
  if (Array.isArray(categories)) {
    return categories
      .map((category) => category.trim())
      .filter((category) => category.length > 0);
  }

  if (typeof categories === 'string') {
    return categories
      .split(',')
      .map((category) => category.trim())
      .filter((category) => category.length > 0);
  }

  return [] as string[];
}

function getRecencyBoost(post: ExplorePost) {
  const timestamp = post.created_at ?? post.postedAt ?? null;

  if (!timestamp) {
    return 0;
  }

  const createdAtMs = Date.parse(timestamp);

  if (Number.isNaN(createdAtMs)) {
    return 0;
  }

  const ageMs = Date.now() - createdAtMs;
  const dayMs = 24 * 60 * 60 * 1000;
  const weekMs = 7 * dayMs;

  if (ageMs <= dayMs) {
    return 10;
  }

  if (ageMs <= weekMs) {
    return 5;
  }

  return 0;
}

function getCategoryWeight(post: ExplorePost, weights: Record<string, number>) {
  return normalizeCategories(post.categories).reduce((sum, category) => {
    return sum + (weights[category] ?? 0);
  }, 0);
}

function sanitizeWeights(value: Record<string, unknown>) {
  return Object.entries(value).reduce<Record<string, number>>((accumulator, [category, weight]) => {
    if (typeof weight === 'number' && Number.isFinite(weight)) {
      accumulator[category] = Math.max(0, Math.min(MAX_CATEGORY_WEIGHT, weight));
    }

    return accumulator;
  }, {});
}

async function getInteractionWeightsFromAsyncStorage() {
  try {
    const raw = await AsyncStorage.getItem(EXPLORE_INTERACTIONS_STORAGE_KEY);

    if (!raw) {
      return {} as Record<string, number>;
    }

    return sanitizeWeights(JSON.parse(raw) as Record<string, unknown>);
  } catch {
    return {};
  }
}

async function writeInteractionWeightsToAsyncStorage(weights: Record<string, number>) {
  try {
    await AsyncStorage.setItem(EXPLORE_INTERACTIONS_STORAGE_KEY, JSON.stringify(weights));
  } catch {
    // Silent fallback storage path should never crash the app.
  }
}

function mergeInteractionWeights(
  currentWeights: Record<string, number>,
  categories: string[],
  weight: number
) {
  const normalizedCategories = normalizeCategories(categories);

  if (!normalizedCategories.length || weight <= 0) {
    return currentWeights;
  }

  const nextWeights = { ...currentWeights };

  normalizedCategories.forEach((category) => {
    const nextWeight = (nextWeights[category] ?? 0) + weight;
    nextWeights[category] = Math.min(MAX_CATEGORY_WEIGHT, nextWeight);
  });

  return nextWeights;
}

export async function getInteractionWeights() {
  if (!hasSupabaseConfig) {
    return getInteractionWeightsFromAsyncStorage();
  }

  try {
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData.user?.id) {
      return getInteractionWeightsFromAsyncStorage();
    }

    const { data, error } = await supabase
      .from('user_feed_preferences')
      .select('category_weights')
      .eq('user_id', authData.user.id)
      .single();

    if (error) {
      const isMissingRow =
        error.code === 'PGRST116' ||
        error.message?.toLowerCase().includes('no rows') ||
        error.details?.toLowerCase().includes('0 rows');

      if (isMissingRow) {
        return {};
      }

      return getInteractionWeightsFromAsyncStorage();
    }

    const categoryWeights =
      data && typeof data.category_weights === 'object' && data.category_weights !== null
        ? (data.category_weights as Record<string, unknown>)
        : {};

    return sanitizeWeights(categoryWeights);
  } catch {
    return getInteractionWeightsFromAsyncStorage();
  }
}

export async function recordInteraction(categories: string[], weight: number) {
  const normalizedCategories = normalizeCategories(categories);

  if (!normalizedCategories.length || weight <= 0) {
    return;
  }

  if (!hasSupabaseConfig) {
    const currentWeights = await getInteractionWeightsFromAsyncStorage();
    const nextWeights = mergeInteractionWeights(currentWeights, normalizedCategories, weight);
    await writeInteractionWeightsToAsyncStorage(nextWeights);
    return;
  }

  try {
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData.user?.id) {
      const currentWeights = await getInteractionWeightsFromAsyncStorage();
      const nextWeights = mergeInteractionWeights(currentWeights, normalizedCategories, weight);
      await writeInteractionWeightsToAsyncStorage(nextWeights);
      return;
    }

    const currentWeights = await getInteractionWeights();
    const mergedWeights = mergeInteractionWeights(currentWeights, normalizedCategories, weight);

    const { error } = await supabase
      .from('user_feed_preferences')
      .upsert({ user_id: authData.user.id, category_weights: mergedWeights });

    if (error) {
      await writeInteractionWeightsToAsyncStorage(mergedWeights);
    }
  } catch {
    const currentWeights = await getInteractionWeightsFromAsyncStorage();
    const nextWeights = mergeInteractionWeights(currentWeights, normalizedCategories, weight);
    await writeInteractionWeightsToAsyncStorage(nextWeights);
  }
}

export function rankPosts<T extends ExplorePost>(posts: T[], weights: Record<string, number>) {
  return [...posts].sort((left, right) => {
    const leftScore = getCategoryWeight(left, weights) + getRecencyBoost(left);
    const rightScore = getCategoryWeight(right, weights) + getRecencyBoost(right);

    if (rightScore !== leftScore) {
      return rightScore - leftScore;
    }

    const rightTimestamp = Date.parse(right.created_at ?? right.postedAt ?? '') || 0;
    const leftTimestamp = Date.parse(left.created_at ?? left.postedAt ?? '') || 0;

    if (rightTimestamp !== leftTimestamp) {
      return rightTimestamp - leftTimestamp;
    }

    return left.id.localeCompare(right.id);
  });
}

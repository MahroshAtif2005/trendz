import type { OutfitReviewResult, OutfitReviewSession, UserExplorePost } from '@/context/AppContext';
import { EXPLORE_CATEGORIES, type ExploreTag } from '@/lib/explore-feed';

const FEED_PROMPT_MINIMUM_SCORE = 7.5;
const FEED_IMAGE_QUALITY_MINIMUM = 7.5;
const FEED_AESTHETIC_MINIMUM = 7.5;

const FEED_CATEGORY_ALIASES: Record<string, ExploreTag> = {
  streetwear: 'Streetwear',
  'baggy / oversized': 'Baggy / Oversized',
  baggy: 'Baggy / Oversized',
  oversized: 'Baggy / Oversized',
  casual: 'Casual',
  formal: 'Formal',
  wedding: 'Wedding / Festive',
  'wedding / festive': 'Wedding / Festive',
  office: 'Office',
  'date night': 'Date Night',
  party: 'Party / Evening',
  'party / evening': 'Party / Evening',
  'soft feminine': 'Soft Feminine',
  'eid / festive': 'Eid / Eastern Glam',
  'eid / eastern glam': 'Eid / Eastern Glam',
  eid: 'Eid / Eastern Glam',
  festive: 'Eid / Eastern Glam',
  modest: 'Modest / Elegant',
  'modest / elegant': 'Modest / Elegant',
  'minimal chic': 'Minimal / Clean Girl',
  'minimal / clean girl': 'Minimal / Clean Girl',
  'clean girl': 'Minimal / Clean Girl',
  'luxury / elevated': 'Old Money / Quiet Luxury',
  'old money': 'Old Money / Quiet Luxury',
  'old money / quiet luxury': 'Old Money / Quiet Luxury',
  'neutral / luxe': 'Neutral / Luxe',
  'airport style': 'Airport Style',
  travel: 'Travel',
  'layered winter': 'Winter',
  winter: 'Winter',
  'summer clean girl': 'Summer',
  summer: 'Summer',
  'sporty chic': 'Sporty Chic',
};

const VALID_FEED_CATEGORIES = new Set<ExploreTag>(
  EXPLORE_CATEGORIES.filter((category): category is ExploreTag => category !== 'All')
);
const MAX_DERIVED_FEED_CATEGORIES = 3;

export function normalizeFeedCategory(category: string | null | undefined): ExploreTag | null {
  if (!category) {
    return null;
  }

  const trimmedCategory = category.trim();

  if (!trimmedCategory) {
    return null;
  }

  if (VALID_FEED_CATEGORIES.has(trimmedCategory as ExploreTag)) {
    return trimmedCategory as ExploreTag;
  }

  return FEED_CATEGORY_ALIASES[trimmedCategory.toLowerCase()] ?? null;
}

export function getFeedPromptDecision(result: OutfitReviewResult) {
  const normalizedCategory = normalizeFeedCategory(result.feed_category);
  const categories = deriveFeedCategoriesFromResult(result);
  const shouldPrompt =
    result.overall_score >= FEED_PROMPT_MINIMUM_SCORE &&
    result.feed_eligible === true &&
    result.image_quality_score >= FEED_IMAGE_QUALITY_MINIMUM &&
    result.aesthetic_score >= FEED_AESTHETIC_MINIMUM &&
    categories.length > 0 &&
    normalizedCategory !== null;

  return {
    shouldPrompt,
    category: normalizedCategory,
    categories,
    reason: result.feed_reason.trim(),
  };
}

export function buildExplorePostFromReview(reviewSession: OutfitReviewSession): UserExplorePost | null {
  const decision = getFeedPromptDecision(reviewSession.result);

  if (!decision.shouldPrompt || !decision.category || decision.categories.length === 0) {
    return null;
  }

  const title = reviewSession.result.tagline.trim() || `${decision.category} standout`;
  const vibe = reviewSession.result.style_tags.length
    ? reviewSession.result.style_tags.slice(0, 3).join(' • ')
    : `Curated ${decision.category.toLowerCase()} look`;

  return {
    id: `user-feed-${reviewSession.id}`,
    title,
    vibe,
    caption: reviewSession.result.summary,
    imageUrl: reviewSession.imageUri,
    height: getFeedCardHeight(reviewSession.imageWidth, reviewSession.imageHeight),
    categories: decision.categories,
    source: 'user_upload',
    postedAt: new Date().toISOString(),
    reviewSessionId: reviewSession.id,
    feedReason: decision.reason,
    aiTags: reviewSession.result.style_tags,
    saveCount: 0,
    savedByUserIds: [],
    scoreSnapshot: {
      overall_score: reviewSession.result.overall_score,
      occasion_fit: reviewSession.result.scores.occasion_fit,
      trend_score: reviewSession.result.scores.trend_score,
      confidence_score: reviewSession.result.scores.confidence_score,
      image_quality_score: reviewSession.result.image_quality_score,
      aesthetic_score: reviewSession.result.aesthetic_score,
    },
  };
}

function getFeedCardHeight(imageWidth?: number, imageHeight?: number) {
  if (!imageWidth || !imageHeight || imageWidth <= 0 || imageHeight <= 0) {
    return 300;
  }

  const scaledHeight = Math.round((imageHeight / imageWidth) * 188);
  return Math.max(228, Math.min(340, scaledHeight));
}

function deriveFeedCategoriesFromResult(result: OutfitReviewResult) {
  const categories = new Set<ExploreTag>();

  const pushCategory = (value: string | null | undefined) => {
    const normalized = normalizeFeedCategory(value);

    if (!normalized) {
      return;
    }

    categories.add(normalized);
  };

  pushCategory(result.feed_category);
  result.style_tags.forEach(pushCategory);

  for (const category of findCategoriesInText([result.tagline, result.summary, result.feed_reason].join(' '))) {
    categories.add(category);
  }

  if (result.feed_category) {
    const normalizedPrimaryCategory = normalizeFeedCategory(result.feed_category);

    if (normalizedPrimaryCategory) {
      const ordered = [normalizedPrimaryCategory, ...Array.from(categories).filter((category) => category !== normalizedPrimaryCategory)];
      return ordered.slice(0, MAX_DERIVED_FEED_CATEGORIES);
    }
  }

  return Array.from(categories).slice(0, MAX_DERIVED_FEED_CATEGORIES);
}

function findCategoriesInText(text: string) {
  const normalizedText = text.trim().toLowerCase();

  if (!normalizedText) {
    return [] as ExploreTag[];
  }

  const matches = new Set<ExploreTag>();

  for (const category of VALID_FEED_CATEGORIES) {
    if (normalizedText.includes(category.toLowerCase())) {
      matches.add(category);
    }
  }

  Object.entries(FEED_CATEGORY_ALIASES).forEach(([alias, category]) => {
    if (normalizedText.includes(alias)) {
      matches.add(category);
    }
  });

  return Array.from(matches);
}

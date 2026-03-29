import { OutfitReviewResult } from '@/context/AppContext';
import { normalizeFeedCategory } from '@/lib/explore-posting';
import { EXPLORE_CATEGORIES, ExploreTag } from '@/lib/explore-feed';

export const OUTFIT_REVIEW_PROMPT = `You are a brutally honest but supportive fashion stylist with deep knowledge of current trends, cultural dress codes, and editorial fashion standards. You have access to web search — use it to look up what is currently trending for the specific occasion and region before evaluating.

You are evaluating a real person's outfit photo. Be specific, direct, and personal. Never be vague. Never say "accessory choice could be improved" — say exactly which accessory and exactly why.

CRITICAL RULES:
- Use the full scoring range. A poorly matched outfit scores 3-5. A great outfit scores 8-9. A perfect outfit scores 9.5+. Do NOT give everyone 7-9.
- Never treat a photography issue (bad lighting, item obscured, blurry) as a clothing problem to fix. If you can't see something clearly, say so and move on — do NOT suggest shopping for it.
- Recommended changes must only be for actual clothing or accessory items that are visible and clearly not working. Never recommend "fixing visibility" or "improving photo quality" as a shopping suggestion.
- Search the web for what people are actually wearing to this occasion right now before scoring trend alignment.

SCORING:
- overall_score: weighted average, be strict
- occasion_fit: does this outfit actually work for the event (cultural context matters)
- trend_score: how current is this look right now based on real trends
- confidence_score: how put-together and intentional the outfit looks

OUTPUT: Return ONLY a valid JSON object with NO markdown, no backticks, no explanation outside the JSON. Structure:

{
  "overall_score": number (0-10, one decimal),
  "tagline": "3-5 word punchy verdict e.g. 'Almost there, fix the shoes'",
  "summary": "2-3 sentences. Speak directly to the person. Be honest but kind. Mention the occasion specifically.",
  "scores": {
    "occasion_fit": number,
    "trend_score": number,
    "confidence_score": number
  },
  "feed_eligible": true | false,
  "feed_reason": "one sentence explaining whether this is strong enough for the Trendz Explore feed",
  "feed_category": "one real Trendz Explore category only, or null if it does not fit strongly enough",
  "image_quality_score": number,
  "aesthetic_score": number,
  "style_tags": ["2-4 short style descriptors"],
  "what_works": [
    { "title": "specific item or detail", "reason": "exactly why it works" }
  ],
  "what_to_fix": [
    {
      "title": "specific visible item only",
      "severity": "High | Medium | Low",
      "problem": "one sentence, direct",
      "fix": "one sentence, actionable",
      "search_keywords": ["3-4 specific product search terms for this item"],
      "avoid": ["what NOT to buy"]
    }
  ],
  "styling_tips": ["2-3 specific actionable tips, not generic advice"],
  "shop_items": [
    {
      "item_name": "actual item name e.g. 'Embellished Heels'",
      "category": "Footwear | Tops | Bottoms | Accessories | Outerwear",
      "search_terms": ["specific shoppable search query 1", "specific shoppable search query 2"],
      "colors": ["specific color suggestions"],
      "style_tags": ["2-3 style descriptors"],
      "avoid": ["what to avoid when shopping"]
    }
  ]
}

IMPORTANT: shop_items must only include items from what_to_fix. Never create a shop item for a photography or visibility issue. Search terms must be specific enough to find real products on Amazon (e.g. "embellished gold kitten heels wedding" not "elevated staple").`;

const AI_REVIEW_API_URL = process.env.EXPO_PUBLIC_AI_REVIEW_API_URL?.trim() ?? '';
const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY?.trim() ?? '';
const DEFAULT_TIMEOUT_MS = Number(process.env.EXPO_PUBLIC_AI_REVIEW_TIMEOUT_MS ?? '45000');
const DEFAULT_STYLE_REGION = process.env.EXPO_PUBLIC_STYLE_REGION?.trim() || 'Global';
const OPENAI_CHAT_COMPLETIONS_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_DEV_FALLBACK_MODEL = 'gpt-4.1-mini';
const OPENAI_DETERMINISTIC_TEMPERATURE = 0;

const CATEGORY_HINTS_BY_OCCASION: Record<string, ExploreTag[]> = {
  Date: ['Date Night', 'Soft Feminine', 'Old Money / Quiet Luxury'],
  Dinner: ['Date Night', 'Party / Evening', 'Old Money / Quiet Luxury'],
  Wedding: ['Wedding / Festive', 'Formal', 'Eid / Eastern Glam'],
  Casual: ['Casual', 'Minimal / Clean Girl', 'Sporty Chic'],
  Office: ['Office', 'Minimal / Clean Girl', 'Old Money / Quiet Luxury'],
  Party: ['Party / Evening', 'Date Night', 'Formal'],
  Brunch: ['Casual', 'Soft Feminine', 'Summer'],
  Concert: ['Streetwear', 'Baggy / Oversized', 'Party / Evening'],
  Travel: ['Travel', 'Airport Style', 'Casual'],
  Airport: ['Airport Style', 'Travel', 'Old Money / Quiet Luxury'],
  Beach: ['Summer', 'Casual', 'Travel'],
  'Formal Event': ['Formal', 'Old Money / Quiet Luxury', 'Wedding / Festive'],
  Engagement: ['Wedding / Festive', 'Eid / Eastern Glam', 'Soft Feminine'],
  Mehndi: ['Eid / Eastern Glam', 'Wedding / Festive', 'Modest / Elegant'],
  Nikkah: ['Eid / Eastern Glam', 'Wedding / Festive', 'Modest / Elegant'],
  Reception: ['Wedding / Festive', 'Eid / Eastern Glam', 'Party / Evening'],
  Birthday: ['Party / Evening', 'Date Night', 'Soft Feminine'],
  'Club / Night Out': ['Party / Evening', 'Date Night', 'Streetwear'],
  'Work Event': ['Office', 'Formal', 'Old Money / Quiet Luxury'],
  Interview: ['Office', 'Minimal / Clean Girl', 'Old Money / Quiet Luxury'],
  University: ['Casual', 'Streetwear', 'Minimal / Clean Girl'],
  'Gym / Athleisure': ['Sporty Chic', 'Casual', 'Streetwear'],
  Shopping: ['Casual', 'Streetwear', 'Baggy / Oversized'],
  Photoshoot: ['Party / Evening', 'Formal', 'Soft Feminine'],
  Festival: ['Streetwear', 'Party / Evening', 'Eid / Eastern Glam'],
  'Family Gathering': ['Modest / Elegant', 'Casual', 'Soft Feminine'],
  Coffee: ['Casual', 'Minimal / Clean Girl', 'Soft Feminine'],
  Weekend: ['Casual', 'Streetwear', 'Baggy / Oversized'],
  Vacation: ['Travel', 'Summer', 'Airport Style'],
  Streetwear: ['Streetwear', 'Baggy / Oversized', 'Sporty Chic'],
  Modest: ['Modest / Elegant', 'Minimal / Clean Girl', 'Eid / Eastern Glam'],
  'Custom / Other': ['Casual', 'Minimal / Clean Girl', 'Old Money / Quiet Luxury'],
};

const VALID_SHOP_CATEGORIES = new Set<OutfitReviewResult['shop_items'][number]['category']>([
  'Footwear',
  'Tops',
  'Bottoms',
  'Accessories',
  'Outerwear',
]);

type SelectedOutfitImage = {
  uri: string;
  base64: string;
  mimeType?: string | null;
  fileName?: string | null;
  width?: number;
  height?: number;
};

type AnalyzeOutfitImageInput = {
  image: SelectedOutfitImage;
  occasion: string;
  eventDescription?: string;
  region?: string;
};

type TrendContext = {
  region: string;
  relevantCategories: ExploreTag[];
  appStyleSignals: string[];
};

type ReviewRequestBody = {
  prompt: string;
  image: {
    base64: string;
    mime_type: string;
    filename: string;
    width?: number;
    height?: number;
  };
  occasion: string;
  event_description?: string;
  trend_context: TrendContext;
  web_search_required: boolean;
};

function debugOutfitReviewLog(message: string, payload?: unknown) {
  if (!__DEV__) {
    return;
  }

  if (payload === undefined) {
    console.log(`[outfit-review] ${message}`);
    return;
  }

  console.log(`[outfit-review] ${message}`, payload);
}

function canUseDirectOpenAiFallback() {
  return __DEV__ && Boolean(OPENAI_API_KEY);
}

export function getOutfitReviewTransportMode() {
  if (AI_REVIEW_API_URL) {
    return 'backend' as const;
  }

  if (canUseDirectOpenAiFallback()) {
    return 'openai_fallback' as const;
  }

  return 'unconfigured' as const;
}

export function getOutfitReviewConfigErrorMessage() {
  return __DEV__
    ? 'Add EXPO_PUBLIC_AI_REVIEW_API_URL or EXPO_PUBLIC_OPENAI_API_KEY to your .env file so Trendz can run outfit reviews. The direct OpenAI key fallback is for development only.'
    : 'Please add EXPO_PUBLIC_AI_REVIEW_API_URL to your .env file so the app knows where to send outfit reviews.';
}

export function hasOutfitReviewConfig() {
  return Boolean(AI_REVIEW_API_URL) || canUseDirectOpenAiFallback();
}

export async function analyzeOutfitImage({ image, occasion, eventDescription, region }: AnalyzeOutfitImageInput) {
  if (!image.base64) {
    throw new Error('Please choose the photo again so we can prepare it for AI analysis.');
  }

  const trendContext = buildTrendContext(occasion, eventDescription, region);
  const requestBody: ReviewRequestBody = {
    prompt: OUTFIT_REVIEW_PROMPT,
    image: {
      base64: image.base64,
      mime_type: image.mimeType || 'image/jpeg',
      filename: image.fileName || 'outfit-photo.jpg',
      width: image.width,
      height: image.height,
    },
    occasion,
    event_description: eventDescription,
    trend_context: trendContext,
    web_search_required: true,
  };

  let responsePayload: unknown;

  if (AI_REVIEW_API_URL) {
    debugOutfitReviewLog('using backend review endpoint', { hasApiUrl: true });
    responsePayload = await postReviewRequest(requestBody);
  } else if (canUseDirectOpenAiFallback()) {
    debugOutfitReviewLog('using direct OpenAI fallback', {
      hasApiUrl: false,
      hasApiKey: Boolean(OPENAI_API_KEY),
      model: OPENAI_DEV_FALLBACK_MODEL,
    });
    responsePayload = await postDirectOpenAiReviewRequest(requestBody);
  } else {
    throw new Error(getOutfitReviewConfigErrorMessage());
  }

  return normalizeOutfitReview(responsePayload);
}

function buildTrendContext(occasion: string, eventDescription?: string, region?: string): TrendContext {
  const matchedCategories = CATEGORY_HINTS_BY_OCCASION[occasion] ?? guessCategoriesFromText(eventDescription);

  return {
    region: region?.trim() || DEFAULT_STYLE_REGION,
    relevantCategories: matchedCategories,
    appStyleSignals: [
      'Premium styling guidance should balance trend relevance, occasion fit, cohesion, and presentation.',
      `Current in-app style boards emphasize ${EXPLORE_CATEGORIES.filter((category) => category !== 'All').join(', ')}.`,
      'Recommendations should be specific to visible items, wearable, and culturally aware.',
    ],
  };
}

async function postReviewRequest(body: ReviewRequestBody) {
  const controller = new AbortController();
  const timeoutMs = Number.isFinite(DEFAULT_TIMEOUT_MS) && DEFAULT_TIMEOUT_MS > 0 ? DEFAULT_TIMEOUT_MS : 45000;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    debugOutfitReviewLog('backend review request started');
    const response = await fetch(AI_REVIEW_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const rawText = await response.text();
    const payload = parseMaybeJson(rawText);
    debugOutfitReviewLog('backend review response received', {
      ok: response.ok,
      status: response.status,
    });

    if (!response.ok) {
      const message =
        readErrorMessage(payload) ||
        `The outfit review request failed with status ${response.status}.`;

      throw new Error(message);
    }

    return payload;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('The outfit review took too long. Please try again in a moment.');
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function postDirectOpenAiReviewRequest(body: ReviewRequestBody) {
  const controller = new AbortController();
  const timeoutMs = Number.isFinite(DEFAULT_TIMEOUT_MS) && DEFAULT_TIMEOUT_MS > 0 ? DEFAULT_TIMEOUT_MS : 45000;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    debugOutfitReviewLog('direct OpenAI review request started');

    const response = await fetch(OPENAI_CHAT_COMPLETIONS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_DEV_FALLBACK_MODEL,
        temperature: OPENAI_DETERMINISTIC_TEMPERATURE,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: body.prompt,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: buildDirectOpenAiUserMessage(body),
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${body.image.mime_type};base64,${body.image.base64}`,
                },
              },
            ],
          },
        ],
      }),
      signal: controller.signal,
    });

    const payload = await response.json();
    debugOutfitReviewLog('direct OpenAI review response received', {
      ok: response.ok,
      status: response.status,
    });

    if (!response.ok) {
      const message =
        readErrorMessage(payload) ||
        `The direct OpenAI review request failed with status ${response.status}.`;

      throw new Error(message);
    }

    return extractOpenAiChatCompletionPayload(payload);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('The outfit review took too long. Please try again in a moment.');
    }

    debugOutfitReviewLog(
      'direct OpenAI review error',
      error instanceof Error ? error.message : String(error)
    );
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function buildDirectOpenAiUserMessage(body: ReviewRequestBody) {
  return [
    'Review this uploaded outfit photo and return only JSON that matches the required schema.',
    'You are running in a temporary development fallback path because the Trendz backend review URL is not configured.',
    'If live web search is unavailable in this direct path, rely on the visible outfit, the occasion context, and your current fashion knowledge.',
    `Occasion: ${body.occasion}`,
    `Event description: ${body.event_description || 'None provided'}`,
    `Region: ${body.trend_context.region}`,
    `Relevant Trendz feed categories: ${body.trend_context.relevantCategories.join(', ')}`,
    `Trendz style signals: ${body.trend_context.appStyleSignals.join(' | ')}`,
    'The image is attached in this request.',
  ].join('\n');
}

function extractOpenAiChatCompletionPayload(payload: unknown) {
  if (!isObject(payload) || !Array.isArray(payload.choices) || !payload.choices.length) {
    return payload;
  }

  const firstChoice = payload.choices[0];

  if (!isObject(firstChoice)) {
    return payload;
  }

  const message = isObject(firstChoice.message) ? firstChoice.message : null;
  const content = message?.content;

  if (typeof content === 'string') {
    return parseMaybeJson(content);
  }

  if (Array.isArray(content)) {
    const text = content
      .map((item) => {
        if (!isObject(item)) {
          return '';
        }

        return asString(item.text) || asString(item.content);
      })
      .filter(Boolean)
      .join('\n');

    return parseMaybeJson(text);
  }

  return payload;
}

function normalizeOutfitReview(payload: unknown): OutfitReviewResult {
  const extracted = extractReviewCandidate(payload);

  if (!isObject(extracted)) {
    throw new Error('The AI review response was empty or unreadable.');
  }

  const scoresSource = isObject(extracted.scores) ? extracted.scores : {};
  const scores = {
    occasion_fit: roundScore(asNumber(scoresSource.occasion_fit)),
    trend_score: roundScore(asNumber(scoresSource.trend_score)),
    confidence_score: roundScore(asNumber(scoresSource.confidence_score)),
  };

  const overallScore = roundScore(
    asNumber(extracted.overall_score) ??
      averageDefined([scores.occasion_fit, scores.trend_score, scores.confidence_score]) ??
      0
  );

  const result: OutfitReviewResult = {
    overall_score: overallScore,
    tagline: asString(extracted.tagline) || 'Needs a sharper finish',
    summary: asString(extracted.summary) || 'The review came back without a written summary. Try again for a fuller analysis.',
    scores,
    feed_eligible: Boolean(extracted.feed_eligible),
    feed_reason: asString(extracted.feed_reason),
    feed_category: normalizeFeedCategory(asString(extracted.feed_category) || null),
    image_quality_score: roundScore(asNumber(extracted.image_quality_score)),
    aesthetic_score: roundScore(asNumber(extracted.aesthetic_score)),
    style_tags: normalizeStringList(extracted.style_tags),
    what_works: normalizeWhatWorks(extracted.what_works),
    what_to_fix: normalizeWhatToFix(extracted.what_to_fix),
    styling_tips: normalizeStringList(extracted.styling_tips),
    shop_items: normalizeShopItems(extracted.shop_items),
  };

  if (!result.what_works.length && !result.what_to_fix.length && !result.styling_tips.length) {
    throw new Error('The AI response did not include enough review detail to display.');
  }

  return result;
}

function extractReviewCandidate(payload: unknown): unknown {
  if (typeof payload === 'string') {
    return parseMaybeJson(payload);
  }

  if (!isObject(payload)) {
    return payload;
  }

  const nestedCandidate = payload.result ?? payload.review ?? payload.data ?? payload.output ?? payload.response;

  if (typeof nestedCandidate === 'string') {
    return parseMaybeJson(nestedCandidate);
  }

  if (nestedCandidate !== undefined) {
    return nestedCandidate;
  }

  if (Array.isArray(payload.output_text)) {
    return parseMaybeJson(payload.output_text.join('\n'));
  }

  return payload;
}

function normalizeWhatWorks(value: unknown): OutfitReviewResult['what_works'] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!isObject(item)) {
        return null;
      }

      const title = asString(item.title);
      const reason = asString(item.reason);

      if (!title || !reason) {
        return null;
      }

      return { title, reason };
    })
    .filter((item): item is OutfitReviewResult['what_works'][number] => Boolean(item));
}

function normalizeWhatToFix(value: unknown): OutfitReviewResult['what_to_fix'] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!isObject(item)) {
        return null;
      }

      const title = asString(item.title);
      const problem = asString(item.problem);
      const fix = asString(item.fix);

      if (!title || !problem || !fix) {
        return null;
      }

      return {
        title,
        severity: normalizeSeverity(asString(item.severity)),
        problem,
        fix,
        search_keywords: normalizeStringList(item.search_keywords),
        avoid: normalizeStringList(item.avoid),
      };
    })
    .filter((item): item is OutfitReviewResult['what_to_fix'][number] => Boolean(item));
}

function normalizeShopItems(value: unknown): OutfitReviewResult['shop_items'] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!isObject(item)) {
        return null;
      }

      const itemName = asString(item.item_name);
      const category = asString(item.category);

      if (!itemName || !category || !VALID_SHOP_CATEGORIES.has(category as OutfitReviewResult['shop_items'][number]['category'])) {
        return null;
      }

      return {
        item_name: itemName,
        category: category as OutfitReviewResult['shop_items'][number]['category'],
        search_terms: normalizeStringList(item.search_terms),
        colors: normalizeStringList(item.colors),
        style_tags: normalizeStringList(item.style_tags),
        avoid: normalizeStringList(item.avoid),
      };
    })
    .filter((item): item is OutfitReviewResult['shop_items'][number] => Boolean(item));
}

function normalizeStringList(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map(asString).filter((item): item is string => Boolean(item));
}

function normalizeSeverity(value?: string): 'High' | 'Medium' | 'Low' {
  if (value === 'High' || value === 'Medium' || value === 'Low') {
    return value;
  }

  return 'Medium';
}

function guessCategoriesFromText(eventDescription?: string): ExploreTag[] {
  const text = eventDescription?.toLowerCase() ?? '';

  if (!text) {
    return ['Casual', 'Minimal / Clean Girl', 'Old Money / Quiet Luxury'];
  }

  if (text.includes('wedding') || text.includes('nikkah') || text.includes('mehndi') || text.includes('eid')) {
    return ['Wedding / Festive', 'Eid / Eastern Glam', 'Modest / Elegant'];
  }

  if (text.includes('office') || text.includes('interview') || text.includes('work')) {
    return ['Office', 'Minimal / Clean Girl', 'Old Money / Quiet Luxury'];
  }

  if (text.includes('airport') || text.includes('travel') || text.includes('vacation')) {
    return ['Airport Style', 'Travel', 'Casual'];
  }

  if (text.includes('party') || text.includes('dinner') || text.includes('date')) {
    return ['Party / Evening', 'Date Night', 'Formal'];
  }

  if (text.includes('street') || text.includes('concert') || text.includes('oversized')) {
    return ['Streetwear', 'Baggy / Oversized', 'Sporty Chic'];
  }

  return ['Casual', 'Minimal / Clean Girl', 'Old Money / Quiet Luxury'];
}

function parseMaybeJson(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return '';
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    return trimmed;
  }
}

function readErrorMessage(payload: unknown) {
  if (typeof payload === 'string' && payload.trim()) {
    return payload.trim();
  }

  if (!isObject(payload)) {
    return null;
  }

  const nestedError = isObject(payload.error) ? payload.error : null;

  return (
    asString(nestedError?.message) ||
    asString(nestedError?.type) ||
    asString(payload.error) ||
    asString(payload.message) ||
    asString(payload.detail) ||
    null
  );
}

function roundScore(value?: number | null) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 0;
  }

  return Math.max(0, Math.min(10, Math.round(value * 10) / 10));
}

function averageDefined(values: Array<number | null | undefined>) {
  const numbers = values.filter((value): value is number => typeof value === 'number' && !Number.isNaN(value));

  if (!numbers.length) {
    return null;
  }

  return numbers.reduce((sum, value) => sum + value, 0) / numbers.length;
}

function asNumber(value: unknown) {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function asString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function isObject(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

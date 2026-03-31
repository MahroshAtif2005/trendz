import type { Session, User } from '@supabase/supabase-js';

import type { InspirationItem, UserExplorePost, UserProfile } from '@/context/AppContext';
import { hasSupabaseConfig, supabase } from '@/lib/supabase';

const EXPLORE_POSTS_TABLE = 'explore_posts';
const EXPLORE_POST_SAVES_TABLE = 'explore_post_saves';

type ExplorePostRow = {
  id: string;
  created_at: string | null;
  owner_user_id?: string | null;
  owner_display_name?: string | null;
  owner_avatar_uri?: string | null;
  user_id?: string | null;
  user_name?: string | null;
  user_avatar_uri?: string | null;
  title: string;
  vibe?: string | null;
  caption?: string | null;
  summary?: string | null;
  image_url: string;
  fallback_image_urls: string[] | null;
  height?: number | null;
  categories: string[] | null;
  source?: 'user_upload' | null;
  posted_at?: string | null;
  review_session_id?: string | null;
  source_review_id?: string | null;
  feed_reason?: string | null;
  occasion?: string | null;
  ai_tags: string[] | null;
  save_count: number | null;
  overall_score: number | null;
  occasion_fit: number | null;
  trend_score: number | null;
  confidence_score: number | null;
  image_quality_score: number | null;
  aesthetic_score: number | null;
  is_published: boolean | null;
};

type PublishExplorePostParams = {
  post: UserExplorePost;
  session: Session | null;
  userProfile: UserProfile;
};

type ExploreSchemaVariant = 'shared' | 'legacy';
type EnsureProfileResult = {
  profileId: string;
  email: string | null;
  existed: boolean;
  created: boolean;
};

type ResolvedExploreAuth = {
  user: User;
  session: Session | null;
};

function getFallbackOwnerId(profile: UserProfile, session: Session | null) {
  const email = session?.user?.email?.trim().toLowerCase() || profile.email.trim().toLowerCase();

  if (email) {
    return `profile:${email}`;
  }

  const username = profile.username.trim().toLowerCase();

  if (username) {
    return `profile:${username}`;
  }

  return 'profile:anonymous';
}

export function getExploreOwnerIdentity(session: Session | null, userProfile: UserProfile) {
  return {
    ownerUserId: session?.user?.id ?? getFallbackOwnerId(userProfile, session),
    ownerDisplayName:
      userProfile.fullName.trim() ||
      session?.user?.email?.trim() ||
      userProfile.username.trim() ||
      'Trendz Member',
    ownerAvatarUri: userProfile.avatarUri,
  };
}

function numberOrZero(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function debugExploreStoreLog(message: string, payload?: unknown) {
  if (!__DEV__) {
    return;
  }

  if (payload === undefined) {
    console.log(`[explore-store] ${message}`);
    return;
  }

  console.log(`[explore-store] ${message}`, payload);
}

function sanitizeSessionForDebug(session: Session | null | undefined) {
  return {
    userId: session?.user?.id ?? null,
    email: session?.user?.email?.trim().toLowerCase() ?? null,
    expiresAt: session?.expires_at ?? null,
    hasAccessToken: Boolean(session?.access_token),
    hasRefreshToken: Boolean(session?.refresh_token),
  };
}

function sanitizeUserForDebug(user: User | null | undefined) {
  return {
    id: user?.id ?? null,
    email: user?.email?.trim().toLowerCase() ?? null,
    role: user?.role ?? null,
    aud: user?.aud ?? null,
  };
}

async function resolveAuthenticatedExploreAuth(
  sessionHint: Session | null,
  userIdHint?: string
): Promise<ResolvedExploreAuth> {
  const { data: liveSessionData, error: liveSessionError } = await supabase.auth.getSession();
  debugExploreStoreLog('supabase.auth.getSession() result', {
    data: sanitizeSessionForDebug(liveSessionData.session),
    error: liveSessionError
      ? {
          raw: liveSessionError,
          ...getSupabaseErrorDetails(liveSessionError),
        }
      : null,
  });

  if (liveSessionError) {
    console.warn('[explore-auth] session lookup failed', {
      error: liveSessionError,
      ...getSupabaseErrorDetails(liveSessionError),
    });
  }

  const { data: liveUserData, error: liveUserError } = await supabase.auth.getUser();
  debugExploreStoreLog('supabase.auth.getUser() result', {
    data: sanitizeUserForDebug(liveUserData.user),
    error: liveUserError
      ? {
          raw: liveUserError,
          ...getSupabaseErrorDetails(liveUserError),
        }
      : null,
  });

  if (liveUserError) {
    console.warn('[explore-auth] user lookup failed', {
      error: liveUserError,
      ...getSupabaseErrorDetails(liveUserError),
    });
  }

  const resolvedSession = liveSessionData.session ?? sessionHint;
  const resolvedUser = liveUserData.user ?? resolvedSession?.user ?? sessionHint?.user ?? null;

  debugExploreStoreLog('resolved explore auth', {
    hintUserId: sessionHint?.user?.id ?? null,
    hintUserEmail: sessionHint?.user?.email?.trim().toLowerCase() ?? null,
    liveSessionUserId: liveSessionData.session?.user?.id ?? null,
    liveSessionUserEmail: liveSessionData.session?.user?.email?.trim().toLowerCase() ?? null,
    resolvedUserId: resolvedUser?.id ?? null,
    resolvedUserEmail: resolvedUser?.email?.trim().toLowerCase() ?? null,
    expectedUserId: userIdHint ?? null,
  });

  if (!resolvedUser?.id) {
    const error = Object.assign(
      new Error('Shared Explore publishing requires an authenticated Supabase user.'),
      {
        code: 'missing_session',
        details: 'Supabase auth returned no active user for the Explore write.',
        hint: 'Sign in again before publishing to Explore.',
      }
    );
    throw error;
  }

  if (userIdHint && resolvedUser.id !== userIdHint) {
    debugExploreStoreLog('resolved auth user differs from caller-provided user id', {
      resolvedUserId: resolvedUser.id,
      expectedUserId: userIdHint,
    });
  }

  return {
    user: resolvedUser,
    session: resolvedSession,
  };
}

async function runMinimalExploreInsertProbe(authUser: User) {
  if (!__DEV__) {
    return;
  }

  const payload = { user_id: authUser.id };
  debugExploreStoreLog('minimal explore insert probe payload', {
    table: EXPLORE_POSTS_TABLE,
    payload,
  });

  const { data, error } = await supabase
    .from(EXPLORE_POSTS_TABLE)
    .insert(payload)
    .select('*')
    .maybeSingle();

  if (error) {
    console.warn('[explore-publish] minimal insert probe failed', {
      error,
      ...getSupabaseErrorDetails(error),
    });
    return;
  }

  debugExploreStoreLog('minimal explore insert probe response', {
    row: data,
  });

  const probeId = typeof data?.id === 'string' ? data.id : null;

  if (!probeId) {
    return;
  }

  const { error: cleanupError } = await supabase
    .from(EXPLORE_POSTS_TABLE)
    .delete()
    .eq('id', probeId);

  if (cleanupError) {
    console.warn('[explore-publish] minimal insert probe cleanup failed', {
      probeId,
      error: cleanupError,
      ...getSupabaseErrorDetails(cleanupError),
    });
    return;
  }

  debugExploreStoreLog('minimal explore insert probe cleaned up', { probeId });
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

function shouldTryAlternateExploreSchema(error: unknown) {
  const details = getSupabaseErrorDetails(error);
  const joinedMessage = `${details.code ?? ''} ${details.message ?? ''} ${details.details ?? ''}`.toLowerCase();

  return (
    joinedMessage.includes('column') ||
    joinedMessage.includes('source_review_id') ||
    joinedMessage.includes('review_session_id') ||
    joinedMessage.includes('owner_user_id') ||
    joinedMessage.includes('user_id') ||
    joinedMessage.includes('user_name') ||
    joinedMessage.includes('summary') ||
    joinedMessage.includes('occasion') ||
    joinedMessage.includes('schema cache')
  );
}

function mapExplorePostRow(row: ExplorePostRow): UserExplorePost {
  const ownerUserId = row.owner_user_id ?? row.user_id ?? undefined;
  const ownerDisplayName = row.owner_display_name ?? row.user_name ?? undefined;
  const ownerAvatarUri = row.owner_avatar_uri ?? row.user_avatar_uri ?? null;
  const categories = Array.isArray(row.categories)
    ? (row.categories.filter((value): value is UserExplorePost['categories'][number] => typeof value === 'string') as UserExplorePost['categories'])
    : [];
  const caption = row.caption ?? row.summary ?? undefined;
  const reviewSessionId = row.review_session_id ?? row.source_review_id ?? row.id;
  const feedReason = row.feed_reason ?? row.summary ?? row.occasion ?? '';
  const derivedVibe =
    row.vibe ??
    row.occasion ??
    (categories.length ? categories.slice(0, 2).join(' • ') : 'Curated Trendz look');

  return {
    id: row.id,
    ownerUserId,
    ownerDisplayName,
    ownerAvatarUri,
    title: row.title,
    vibe: derivedVibe,
    caption,
    imageUrl: row.image_url,
    fallbackImageUrls: row.fallback_image_urls ?? undefined,
    height: numberOrZero(row.height) || 300,
    categories,
    source: row.source ?? 'user_upload',
    postedAt: row.posted_at ?? row.created_at ?? new Date().toISOString(),
    reviewSessionId,
    feedReason,
    aiTags: row.ai_tags ?? [],
    saveCount: numberOrZero(row.save_count),
    scoreSnapshot: {
      overall_score: numberOrZero(row.overall_score),
      occasion_fit: numberOrZero(row.occasion_fit),
      trend_score: numberOrZero(row.trend_score),
      confidence_score: numberOrZero(row.confidence_score),
      image_quality_score: numberOrZero(row.image_quality_score),
      aesthetic_score: numberOrZero(row.aesthetic_score),
    },
  };
}

function buildExplorePostInsert(
  post: UserExplorePost,
  authUser: User,
  userProfile: UserProfile,
  schemaVariant: ExploreSchemaVariant
) {
  const identity = {
    ownerUserId: authUser.id,
    ownerDisplayName:
      userProfile.fullName.trim() ||
      authUser.email?.trim() ||
      userProfile.username.trim() ||
      'Trendz Member',
    ownerAvatarUri: userProfile.avatarUri,
  };

  if (schemaVariant === 'shared') {
    return {
      user_id: identity.ownerUserId,
      user_name: identity.ownerDisplayName,
      image_url: post.imageUrl,
      title: post.title,
      summary: post.caption ?? post.feedReason,
      overall_score: post.scoreSnapshot.overall_score,
      occasion: post.categories[0] ?? post.vibe,
      categories: post.categories,
      save_count:
        typeof post.saveCount === 'number'
          ? post.saveCount
          : Array.isArray(post.savedByUserIds)
            ? post.savedByUserIds.length
            : 0,
      source_review_id: post.reviewSessionId,
      is_published: true,
    };
  }

  return {
    owner_user_id: identity.ownerUserId,
    owner_display_name: identity.ownerDisplayName,
    owner_avatar_uri: identity.ownerAvatarUri,
    title: post.title,
    vibe: post.vibe,
    caption: post.caption ?? null,
    image_url: post.imageUrl,
    fallback_image_urls: post.fallbackImageUrls ?? [],
    height: post.height,
    categories: post.categories,
    source: post.source,
    posted_at: post.postedAt,
    review_session_id: post.reviewSessionId,
    feed_reason: post.feedReason,
    ai_tags: post.aiTags,
    overall_score: post.scoreSnapshot.overall_score,
    occasion_fit: post.scoreSnapshot.occasion_fit,
    trend_score: post.scoreSnapshot.trend_score,
    confidence_score: post.scoreSnapshot.confidence_score,
    image_quality_score: post.scoreSnapshot.image_quality_score,
    aesthetic_score: post.scoreSnapshot.aesthetic_score,
    is_published: true,
  };
}

async function ensureExploreProfile(
  authUser: User,
  userProfile: UserProfile
): Promise<EnsureProfileResult> {
  const profileId = authUser.id;
  const email = authUser.email?.trim().toLowerCase() || null;
  const profilePayloads = [
    {
      id: profileId,
      full_name: userProfile.fullName.trim() || null,
      username: userProfile.username.trim() || null,
      avatar_url: userProfile.avatarUri,
      email,
    },
    {
      id: profileId,
      full_name: userProfile.fullName.trim() || null,
      username: userProfile.username.trim() || null,
      avatar_url: userProfile.avatarUri,
    },
    {
      id: profileId,
    },
  ];

  let profileExists = false;

  try {
    const { data: existingProfile, error: existingProfileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', profileId)
      .maybeSingle();

    if (existingProfileError) {
      const errorDetails = getSupabaseErrorDetails(existingProfileError);
      debugExploreStoreLog('profiles lookup failed before publish', {
        userId: profileId,
        email,
        ...errorDetails,
      });
    } else if (existingProfile) {
      profileExists = true;
      debugExploreStoreLog('profiles row already exists', {
        userId: profileId,
        email,
        exists: true,
      });
      return {
        profileId,
        email,
        existed: true,
        created: false,
      };
    }

    let upsertProfileError: unknown = null;

    for (const profilePayload of profilePayloads) {
      const { error } = await supabase
        .from('profiles')
        .upsert(profilePayload, { onConflict: 'id' });

      if (!error) {
        debugExploreStoreLog('profiles row ensured', {
          userId: profileId,
          email,
          existsBeforeInsert: profileExists,
          created: true,
        });
        return {
          profileId,
          email,
          existed: false,
          created: true,
        };
      }

      upsertProfileError = error;

      const errorDetails = getSupabaseErrorDetails(error);
      debugExploreStoreLog('profiles upsert attempt failed', {
        userId: profileId,
        email,
        payloadKeys: Object.keys(profilePayload),
        ...errorDetails,
      });

      if (!shouldTryAlternateExploreSchema(error)) {
        throw error;
      }
    }

    throw upsertProfileError instanceof Error
      ? upsertProfileError
      : new Error('Failed to ensure profile row.');
  } catch (error) {
    const errorDetails = getSupabaseErrorDetails(error);
    debugExploreStoreLog('profiles ensure failed', {
      userId: profileId,
      email,
      existed: profileExists,
      ...errorDetails,
    });
    throw error;
  }
}

export function mapExplorePostToSavedItem(post: UserExplorePost): InspirationItem {
  return {
    id: post.id,
    title: post.title,
    vibe: post.vibe,
    imageUrl: post.imageUrl,
    height: post.height,
  };
}

export async function fetchSharedExplorePosts() {
  if (!hasSupabaseConfig) {
    return [] as UserExplorePost[];
  }

  const { data, error } = await supabase
    .from(EXPLORE_POSTS_TABLE)
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(30);

  if (error) {
    throw error;
  }

  return ((data ?? []) as ExplorePostRow[]).map(mapExplorePostRow);
}

export async function fetchSharedExplorePostByReviewSessionId(reviewSessionId: string) {
  if (!hasSupabaseConfig || !reviewSessionId) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from(EXPLORE_POSTS_TABLE)
      .select('*')
      .eq('source_review_id', reviewSessionId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (data) {
      return mapExplorePostRow(data as ExplorePostRow);
    }
  } catch (error) {
    if (!shouldTryAlternateExploreSchema(error)) {
      throw error;
    }
  }

  const { data, error } = await supabase
    .from(EXPLORE_POSTS_TABLE)
    .select('*')
    .eq('review_session_id', reviewSessionId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return mapExplorePostRow(data as ExplorePostRow);
}

export async function fetchSharedExplorePostByImageUrl(ownerUserId: string, imageUrl: string) {
  const normalizedOwnerUserId = ownerUserId.trim();
  const normalizedImageUrl = imageUrl.trim();

  if (!hasSupabaseConfig || !normalizedOwnerUserId || !normalizedImageUrl) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from(EXPLORE_POSTS_TABLE)
      .select('*')
      .eq('is_published', true)
      .eq('user_id', normalizedOwnerUserId)
      .eq('image_url', normalizedImageUrl)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      throw error;
    }

    const row = Array.isArray(data) ? data[0] : null;

    if (row) {
      return mapExplorePostRow(row as ExplorePostRow);
    }

    return null;
  } catch (error) {
    if (!shouldTryAlternateExploreSchema(error)) {
      throw error;
    }
  }

  const { data, error } = await supabase
    .from(EXPLORE_POSTS_TABLE)
    .select('*')
    .eq('is_published', true)
    .eq('owner_user_id', normalizedOwnerUserId)
    .eq('image_url', normalizedImageUrl)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    throw error;
  }

  const row = Array.isArray(data) ? data[0] : null;

  if (!row) {
    return null;
  }

  return mapExplorePostRow(row as ExplorePostRow);
}

export async function fetchSharedExplorePostById(postId: string) {
  if (!hasSupabaseConfig || !postId) {
    return null;
  }

  const { data, error } = await supabase
    .from(EXPLORE_POSTS_TABLE)
    .select('*')
    .eq('id', postId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return mapExplorePostRow(data as ExplorePostRow);
}

export async function fetchSavedExplorePostIds(userId: string) {
  if (!hasSupabaseConfig || !userId) {
    return [] as string[];
  }

  const { data, error } = await supabase
    .from(EXPLORE_POST_SAVES_TABLE)
    .select('post_id')
    .eq('user_id', userId);

  if (error) {
    throw error;
  }

  return (data ?? [])
    .map((row) => row.post_id)
    .filter((value): value is string => typeof value === 'string');
}

export async function publishSharedExplorePost({ post, session, userProfile }: PublishExplorePostParams) {
  if (!hasSupabaseConfig) {
    return null;
  }

  const { user: authUser, session: resolvedSession } = await resolveAuthenticatedExploreAuth(
    session,
    post.ownerUserId
  );

  debugExploreStoreLog('publish session user id', {
    userId: authUser.id,
    email: authUser.email?.trim().toLowerCase() || null,
    sessionUserId: resolvedSession?.user?.id ?? null,
  });
  const profileStatus = await ensureExploreProfile(authUser, userProfile);
  debugExploreStoreLog('publish profile status', profileStatus);
  await runMinimalExploreInsertProbe(authUser);

  const variants: Array<{ schema: ExploreSchemaVariant }> = [
    { schema: 'shared' },
    { schema: 'legacy' },
  ];

  let lastError: unknown = null;

  for (const variant of variants) {
    const payload = buildExplorePostInsert(post, authUser, userProfile, variant.schema);
    debugExploreStoreLog('publish payload', {
      table: EXPLORE_POSTS_TABLE,
      schema: variant.schema,
      payloadKeys: Object.keys(payload),
      payload,
    });

    const { data, error } = await supabase
      .from(EXPLORE_POSTS_TABLE)
      .insert(payload)
      .select('*')
      .single();

    if (!error) {
      debugExploreStoreLog('publish insert response', {
        schema: variant.schema,
        row: data,
      });
      return mapExplorePostRow(data as ExplorePostRow);
    }

    const errorDetails = getSupabaseErrorDetails(error);
    console.warn('[explore-publish] failed', {
      schema: variant.schema,
      error,
      ...errorDetails,
    });
    lastError = error;

    if (!shouldTryAlternateExploreSchema(error)) {
      throw error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Explore publish failed.');
}

export async function deleteSharedExplorePost(postId: string, ownerUserId: string) {
  if (!hasSupabaseConfig) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from(EXPLORE_POSTS_TABLE)
      .delete()
      .eq('id', postId)
      .eq('user_id', ownerUserId)
      .select('*')
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (data) {
      return mapExplorePostRow(data as ExplorePostRow);
    }
  } catch (error) {
    if (!shouldTryAlternateExploreSchema(error)) {
      throw error;
    }
  }

  const { data, error } = await supabase
    .from(EXPLORE_POSTS_TABLE)
    .delete()
    .eq('id', postId)
    .eq('owner_user_id', ownerUserId)
    .select('*')
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return mapExplorePostRow(data as ExplorePostRow);
}

export async function saveSharedExplorePost(postId: string, userId: string) {
  if (!hasSupabaseConfig) {
    return null;
  }

  const { user: authUser } = await resolveAuthenticatedExploreAuth(null, userId);
  debugExploreStoreLog('save post auth', {
    postId,
    callerUserId: userId,
    resolvedUserId: authUser.id,
    resolvedUserEmail: authUser.email?.trim().toLowerCase() ?? null,
  });

  const { error: saveError } = await supabase
    .from(EXPLORE_POST_SAVES_TABLE)
    .upsert(
      { post_id: postId, user_id: authUser.id },
      { onConflict: 'post_id,user_id', ignoreDuplicates: true }
    );

  if (saveError) {
    console.warn('[explore-save] failed', {
      postId,
      userId: authUser.id,
      error: saveError,
      ...getSupabaseErrorDetails(saveError),
    });
    throw saveError;
  }

  const { count } = await supabase
    .from(EXPLORE_POST_SAVES_TABLE)
    .select('*', { count: 'exact', head: true })
    .eq('post_id', postId);

  if (typeof count === 'number') {
    await supabase
      .from(EXPLORE_POSTS_TABLE)
      .update({ save_count: count })
      .eq('id', postId);
  }

  return fetchSharedExplorePost(postId);
}

export async function unsaveSharedExplorePost(postId: string, userId: string) {
  if (!hasSupabaseConfig) {
    return null;
  }

  const { user: authUser } = await resolveAuthenticatedExploreAuth(null, userId);
  debugExploreStoreLog('unsave post auth', {
    postId,
    callerUserId: userId,
    resolvedUserId: authUser.id,
    resolvedUserEmail: authUser.email?.trim().toLowerCase() ?? null,
  });

  const { error } = await supabase
    .from(EXPLORE_POST_SAVES_TABLE)
    .delete()
    .eq('post_id', postId)
    .eq('user_id', authUser.id);

  if (error) {
    console.warn('[explore-unsave] failed', {
      postId,
      userId: authUser.id,
      error,
      ...getSupabaseErrorDetails(error),
    });
    throw error;
  }

  const { count } = await supabase
    .from(EXPLORE_POST_SAVES_TABLE)
    .select('*', { count: 'exact', head: true })
    .eq('post_id', postId);

  if (typeof count === 'number') {
    await supabase
      .from(EXPLORE_POSTS_TABLE)
      .update({ save_count: count })
      .eq('id', postId);
  }

  return fetchSharedExplorePost(postId);
}

async function fetchSharedExplorePost(postId: string) {
  const { data, error } = await supabase
    .from(EXPLORE_POSTS_TABLE)
    .select('*')
    .eq('id', postId)
    .single();

  if (error) {
    throw error;
  }

  return mapExplorePostRow(data as ExplorePostRow);
}

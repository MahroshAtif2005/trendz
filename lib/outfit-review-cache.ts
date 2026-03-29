import * as Crypto from 'expo-crypto';

type ReviewOwnerIdentityInput = {
  sessionUserId?: string | null;
  email?: string | null;
  username?: string | null;
};

type BuildReviewCacheKeyInput = {
  ownerKey: string;
  imageFingerprint: string;
  occasion: string;
  eventDescription?: string;
};

function normalizeReviewText(value?: string | null) {
  return value?.trim().toLowerCase().replace(/\s+/g, ' ') ?? '';
}

export function buildOutfitReviewOwnerKey({
  sessionUserId,
  email,
  username,
}: ReviewOwnerIdentityInput) {
  const normalizedSessionUserId = sessionUserId?.trim();

  if (normalizedSessionUserId) {
    return `user:${normalizedSessionUserId}`;
  }

  const normalizedEmail = normalizeReviewText(email);

  if (normalizedEmail) {
    return `email:${normalizedEmail}`;
  }

  const normalizedUsername = normalizeReviewText(username);

  if (normalizedUsername) {
    return `username:${normalizedUsername}`;
  }

  return 'anonymous';
}

export async function createOutfitImageFingerprint(base64: string) {
  const normalizedBase64 = base64.trim();

  if (!normalizedBase64) {
    throw new Error('Trendz could not fingerprint this image yet. Please choose the photo again.');
  }

  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, normalizedBase64);
}

export async function buildOutfitReviewCacheKey({
  ownerKey,
  imageFingerprint,
  occasion,
  eventDescription,
}: BuildReviewCacheKeyInput) {
  const normalizedPayload = JSON.stringify({
    ownerKey: normalizeReviewText(ownerKey),
    imageFingerprint: normalizeReviewText(imageFingerprint),
    occasion: normalizeReviewText(occasion),
    eventDescription: normalizeReviewText(eventDescription),
  });

  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    normalizedPayload
  );

  return `review-cache-${hash}`;
}

import { type ReactNode, useContext, useState } from 'react';
import {
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';

import {
  AppContext,
  OutfitReviewFixItem,
  OutfitReviewShopItem,
  OutfitReviewWhatWorksItem,
} from '@/context/AppContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { buildExplorePostFromReview, getFeedPromptDecision } from '@/lib/explore-posting';

const RESULTS_THEME_COLORS = {
  light: {
    pageBackground: '#f5efe7',
    headerBackground: '#f3eee7',
    headerBorder: '#dccbb7',
    headerSurface: '#fbf6ef',
    headerText: '#3a2a1d',
    headerMuted: '#6b5645',
    contentCardBackground: '#fff9f2',
    contentCardBorder: '#d8c3aa',
    imageFrame: '#e2d2bf',
    imageShadow: '#c9b8a4',
    badgeBorder: '#d6c29e',
    badgeSurface: '#fbf4ea',
    pillBackground: '#f8f2ea',
    pillBorder: '#d8c7b2',
    pillText: '#3f2d20',
    titleText: '#3a2a1d',
    bodyText: '#6e5a49',
    supportText: '#8c7662',
    eyebrow: '#a07a4a',
    inviteBackground: '#f4eee6',
    inviteBorder: '#d8c7b2',
    inviteEyebrow: '#b58d57',
    inviteTitle: '#3a2a1d',
    inviteText: '#6b5645',
    inviteMutedBackground: '#ece3d7',
    inviteMutedBorder: '#d7c3a5',
    confirmationBackground: '#f5efe6',
    confirmationBorder: '#d6bf97',
    confirmationEyebrow: '#b58d57',
    confirmationTitle: '#6f573c',
    confirmationText: '#6b5645',
    buttonBackground: '#d4af6a',
    buttonBorder: '#d9bf8b',
    buttonText: '#1a120a',
    keywordBackground: '#f1e7db',
    keywordBorder: '#d8c7b2',
    keywordText: '#6e5a49',
    tipIndexBackground: 'rgba(212, 175, 106, 0.18)',
    tipIndexText: '#9f7846',
    severityHighBackground: '#f8e3db',
    severityHighBorder: '#d8a897',
    severityHighText: '#8f4b3d',
    severityMediumBackground: '#f4e6d4',
    severityMediumBorder: '#d2b083',
    severityMediumText: '#8c6330',
    severityLowBackground: '#e3efe4',
    severityLowBorder: '#a8c0ad',
    severityLowText: '#46634c',
  },
  dark: {
    pageBackground: '#050505',
    headerBackground: '#110c09',
    headerBorder: '#3a2a1d',
    headerSurface: '#18120e',
    headerText: '#eadbc8',
    headerMuted: '#c4b09a',
    contentCardBackground: '#15100d',
    contentCardBorder: '#3a2a1d',
    imageFrame: '#231912',
    imageShadow: '#000000',
    badgeBorder: '#4d3926',
    badgeSurface: '#17120c',
    pillBackground: '#17120e',
    pillBorder: '#4a3826',
    pillText: '#eadbc8',
    titleText: '#eadbc8',
    bodyText: '#d2c2b0',
    supportText: '#cbb8a3',
    eyebrow: '#b58d57',
    inviteBackground: '#16100c',
    inviteBorder: '#3a2a1d',
    inviteEyebrow: '#d2b27a',
    inviteTitle: '#eadbc8',
    inviteText: '#cbb8a3',
    inviteMutedBackground: '#1b140f',
    inviteMutedBorder: '#4c3928',
    confirmationBackground: '#17120c',
    confirmationBorder: '#4f4429',
    confirmationEyebrow: '#d8bb84',
    confirmationTitle: '#f4e7d3',
    confirmationText: '#d4c0a4',
    buttonBackground: '#d4af6a',
    buttonBorder: '#d9bf8b',
    buttonText: '#1a120a',
    keywordBackground: '#18120d',
    keywordBorder: '#4b3927',
    keywordText: '#cbb8a3',
    tipIndexBackground: 'rgba(212, 175, 106, 0.15)',
    tipIndexText: '#c49b57',
    severityHighBackground: '#43231d',
    severityHighBorder: '#7a3b30',
    severityHighText: '#f2c1b7',
    severityMediumBackground: '#332515',
    severityMediumBorder: '#6d4c28',
    severityMediumText: '#ecd0a0',
    severityLowBackground: '#1c2a20',
    severityLowBorder: '#35593f',
    severityLowText: '#cfe4cf',
  },
} as const;

type ThemeName = 'light' | 'dark';
type ResultsThemeColors = (typeof RESULTS_THEME_COLORS)[ThemeName];

function formatScore(score: number) {
  return score.toFixed(1);
}

function formatReviewedAt(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function severityColors(colors: ResultsThemeColors, severity: OutfitReviewFixItem['severity']) {
  switch (severity) {
    case 'High':
      return {
        backgroundColor: colors.severityHighBackground,
        borderColor: colors.severityHighBorder,
        textColor: colors.severityHighText,
      };
    case 'Low':
      return {
        backgroundColor: colors.severityLowBackground,
        borderColor: colors.severityLowBorder,
        textColor: colors.severityLowText,
      };
    default:
      return {
        backgroundColor: colors.severityMediumBackground,
        borderColor: colors.severityMediumBorder,
        textColor: colors.severityMediumText,
      };
  }
}

export default function AIResults() {
  const appContext = useContext(AppContext);
  const colorScheme = useColorScheme();
  const theme: ThemeName = colorScheme === 'dark' ? 'dark' : 'light';
  const colors = RESULTS_THEME_COLORS[theme];
  const reviewSession = appContext?.latestOutfitReview ?? null;
  const [hasDismissedPostPrompt, setHasDismissedPostPrompt] = useState(false);
  const [postConfirmation, setPostConfirmation] = useState<string | null>(null);

  if (!reviewSession) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: colors.pageBackground,
          paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
        }}>
        <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <TouchableOpacity
              onPress={() => router.replace('/(tabs)/upload')}
              style={{
                height: 40,
                width: 40,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 999,
                borderWidth: 1,
                borderColor: colors.headerBorder,
                backgroundColor: colors.headerSurface,
              }}>
              <Text style={{ marginBottom: 4, marginLeft: 1, color: colors.headerText, fontSize: 20 }}>
                ‹
              </Text>
            </TouchableOpacity>
            <Text style={{ color: colors.titleText, fontSize: 20, fontWeight: '700' }}>
              Style Analysis
            </Text>
            <View style={{ height: 40, width: 40 }} />
          </View>

          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <View
              style={{
                width: '100%',
                borderRadius: 32,
                borderWidth: 1,
                borderColor: colors.contentCardBorder,
                backgroundColor: colors.contentCardBackground,
                paddingHorizontal: 24,
                paddingVertical: 32,
              }}>
              <Text
                style={{
                  color: colors.eyebrow,
                  fontSize: 11,
                  fontWeight: '700',
                  letterSpacing: 3,
                  textTransform: 'uppercase',
                }}>
                Review Queue
              </Text>
              <Text
                style={{
                  marginTop: 16,
                  color: colors.titleText,
                  fontSize: 30,
                  fontWeight: '700',
                  lineHeight: 38,
                }}>
                No outfit review yet
              </Text>
              <Text
                style={{
                  marginTop: 16,
                  color: colors.bodyText,
                  fontSize: 15,
                  lineHeight: 28,
                }}>
                Add a photo on the Upload tab and we&apos;ll bring the full AI review here with
                scores, styling fixes, and a cleaner shopping list.
              </Text>

              <TouchableOpacity
                onPress={() => router.replace('/(tabs)/upload')}
                style={{
                  marginTop: 32,
                  alignItems: 'center',
                  borderRadius: 22,
                  borderWidth: 1,
                  borderColor: colors.buttonBorder,
                  backgroundColor: colors.buttonBackground,
                  paddingVertical: 16,
                }}>
                <Text style={{ color: colors.buttonText, fontSize: 17, fontWeight: '700' }}>
                  Go To Upload
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const { result } = reviewSession;
  const feedPromptDecision = getFeedPromptDecision(result);
  const explorePostPreview = buildExplorePostFromReview(reviewSession);
  const hasAlreadyBeenPosted =
    Boolean(reviewSession.postedToFeedAt) ||
    (reviewSession.id ? appContext?.hasUserExplorePost(reviewSession.id) ?? false : false);
  const shouldShowFeedPrompt =
    result.overall_score > 8 &&
    Boolean(explorePostPreview) &&
    !hasAlreadyBeenPosted &&
    !hasDismissedPostPrompt;

  const handlePostToFeed = () => {
    if (!appContext || !explorePostPreview) {
      return;
    }

    const wasAdded = appContext.addUserExplorePost(explorePostPreview);
    const postedAt = reviewSession.postedToFeedAt ?? new Date().toISOString();
    const postedFeedCategory = explorePostPreview.categories[0] ?? null;

    appContext.setLatestOutfitReview({
      ...reviewSession,
      postedToFeedAt: postedAt,
      postedFeedCategory,
    });

    setPostConfirmation(wasAdded ? 'Added to Trendz Explore' : 'Already in Trendz Explore');
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: colors.pageBackground,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
      }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 24,
          paddingTop: 16,
          paddingBottom: 12,
          backgroundColor: colors.headerBackground,
          borderBottomWidth: 1,
          borderBottomColor: colors.headerBorder,
        }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            height: 40,
            width: 40,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 999,
            borderWidth: 1,
            borderColor: colors.headerBorder,
            backgroundColor: colors.headerSurface,
          }}>
          <Text style={{ marginBottom: 4, marginLeft: 1, color: colors.headerText, fontSize: 20 }}>
            ‹
          </Text>
        </TouchableOpacity>

        <Text style={{ color: colors.headerText, fontSize: 20, fontWeight: '700' }}>
          Style Analysis
        </Text>

        <TouchableOpacity
          onPress={() => router.replace('/(tabs)/upload')}
          style={{
            borderRadius: 999,
            borderWidth: 1,
            borderColor: colors.headerBorder,
            backgroundColor: colors.headerSurface,
            paddingHorizontal: 16,
            paddingVertical: 8,
          }}>
          <Text
            style={{
              color: colors.eyebrow,
              fontSize: 12,
              fontWeight: '700',
              letterSpacing: 1.6,
              textTransform: 'uppercase',
            }}>
            New
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 10, paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}>
        <View style={{ marginTop: 24, alignItems: 'center' }}>
          <View style={{ position: 'relative' }}>
            <Image
              source={{ uri: reviewSession.imageUri }}
              style={{
                height: 288,
                width: 224,
                resizeMode: 'cover',
                borderRadius: 32,
                borderWidth: 4,
                borderColor: colors.imageFrame,
                shadowColor: colors.imageShadow,
                shadowOpacity: theme === 'dark' ? 0.28 : 0.12,
                shadowOffset: { width: 0, height: 12 },
                shadowRadius: 28,
              }}
            />
            <View
              style={{
                position: 'absolute',
                right: -20,
                bottom: -20,
                height: 86,
                width: 86,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 999,
                borderWidth: 1,
                borderColor: colors.badgeBorder,
                backgroundColor: colors.badgeSurface,
              }}>
              <View
                style={{
                  height: 72,
                  width: 72,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 999,
                  backgroundColor: colors.buttonBackground,
                }}>
                <Text style={{ color: colors.buttonText, fontSize: 28, fontWeight: '800' }}>
                  {formatScore(result.overall_score)}
                </Text>
              </View>
            </View>
          </View>

          <View style={{ marginTop: 48, flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            <View
              style={{
                borderRadius: 999,
                borderWidth: 1,
                borderColor: colors.pillBorder,
                backgroundColor: colors.pillBackground,
                paddingHorizontal: 20,
                paddingVertical: 10,
              }}>
              <Text
                style={{
                  color: colors.pillText,
                  fontSize: 12,
                  fontWeight: '700',
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                }}>
                {reviewSession.occasion}
              </Text>
            </View>

            <View
              style={{
                borderRadius: 999,
                borderWidth: 1,
                borderColor: colors.pillBorder,
                backgroundColor: colors.pillBackground,
                paddingHorizontal: 20,
                paddingVertical: 10,
              }}>
              <Text
                style={{
                  color: colors.headerMuted,
                  fontSize: 12,
                  fontWeight: '600',
                  letterSpacing: 1.4,
                  textTransform: 'uppercase',
                }}>
                {formatReviewedAt(reviewSession.analyzedAt)}
              </Text>
            </View>
          </View>
        </View>

        <View style={{ marginTop: 48 }}>
          <Text
            style={{
              color: colors.titleText,
              fontSize: 31,
              fontWeight: '700',
              lineHeight: 38,
              letterSpacing: -0.4,
            }}>
            {result.tagline}
          </Text>
          <Text
            style={{
              marginTop: 16,
              color: colors.bodyText,
              fontSize: 16,
              lineHeight: 30,
            }}>
            {result.summary}
          </Text>
        </View>

        {reviewSession.eventDescription ? (
          <View
            style={{
              marginTop: 28,
              borderRadius: 24,
              borderWidth: 1,
              borderColor: colors.contentCardBorder,
              backgroundColor: colors.contentCardBackground,
              paddingHorizontal: 20,
              paddingVertical: 20,
            }}>
            <Text
              style={{
                color: colors.eyebrow,
                fontSize: 11,
                fontWeight: '700',
                letterSpacing: 2.6,
                textTransform: 'uppercase',
              }}>
              Event Note
            </Text>
            <Text
              style={{
                marginTop: 12,
                color: colors.bodyText,
                fontSize: 15,
                lineHeight: 28,
              }}>
              {reviewSession.eventDescription}
            </Text>
          </View>
        ) : null}

        {shouldShowFeedPrompt ? (
          <View
            style={{
              marginTop: 32,
              borderRadius: 28,
              borderWidth: 1,
              borderColor: colors.inviteBorder,
              backgroundColor: colors.inviteBackground,
              paddingHorizontal: 24,
              paddingVertical: 24,
            }}>
            <Text
              style={{
                color: colors.inviteEyebrow,
                fontSize: 11,
                fontWeight: '700',
                letterSpacing: 3,
                textTransform: 'uppercase',
              }}>
              Curated Feed Invite
            </Text>
            <Text
              style={{
                marginTop: 16,
                color: colors.inviteTitle,
                fontSize: 24,
                fontWeight: '700',
                lineHeight: 31,
              }}>
              This look scored high enough for Trendz Explore. Want to add it?
            </Text>
            <Text
              style={{
                marginTop: 16,
                color: colors.inviteText,
                fontSize: 15,
                lineHeight: 27,
              }}>
              {feedPromptDecision.reason ||
                'It clears the score, image quality, and category checks for the curated feed.'}
            </Text>

            {feedPromptDecision.category ? (
              <View
                style={{
                  alignSelf: 'flex-start',
                  marginTop: 20,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: colors.inviteMutedBorder,
                  backgroundColor: colors.inviteMutedBackground,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                }}>
                <Text
                  style={{
                    color: colors.inviteTitle,
                    fontSize: 12,
                    fontWeight: '700',
                    letterSpacing: 1.5,
                    textTransform: 'uppercase',
                  }}>
                  Best fit: {feedPromptDecision.category}
                </Text>
              </View>
            ) : null}

            <View style={{ marginTop: 24, flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={handlePostToFeed}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: colors.buttonBorder,
                  backgroundColor: colors.buttonBackground,
                  paddingVertical: 16,
                }}>
                <Text style={{ color: colors.buttonText, fontSize: 16, fontWeight: '700' }}>
                  Add to Explore Feed
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setHasDismissedPostPrompt(true)}
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: colors.inviteMutedBorder,
                  backgroundColor: colors.inviteMutedBackground,
                  paddingHorizontal: 20,
                  paddingVertical: 16,
                }}>
                <Text style={{ color: colors.inviteTitle, fontSize: 15, fontWeight: '700' }}>
                  Not Now
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {hasAlreadyBeenPosted || postConfirmation ? (
          <View
            style={{
              marginTop: 24,
              borderRadius: 24,
              borderWidth: 1,
              borderColor: colors.confirmationBorder,
              backgroundColor: colors.confirmationBackground,
              paddingHorizontal: 20,
              paddingVertical: 18,
            }}>
            <Text
              style={{
                color: colors.confirmationEyebrow,
                fontSize: 11,
                fontWeight: '700',
                letterSpacing: 2.6,
                textTransform: 'uppercase',
              }}>
              Posted To Feed
            </Text>
            <Text
              style={{
                marginTop: 12,
                color: colors.confirmationTitle,
                fontSize: 18,
                fontWeight: '700',
                lineHeight: 24,
              }}>
              {postConfirmation || 'Added to Trendz Explore'}
            </Text>
            {reviewSession.postedFeedCategory ? (
              <Text
                style={{
                  marginTop: 8,
                  color: colors.confirmationText,
                  fontSize: 14,
                  lineHeight: 24,
                }}>
                Showing under {reviewSession.postedFeedCategory}.
              </Text>
            ) : null}
          </View>
        ) : null}

        <View
          style={{
            marginTop: 32,
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            rowGap: 12,
          }}>
          <ScoreCard label="Occasion Fit" score={result.scores.occasion_fit} colors={colors} />
          <ScoreCard label="Trend Score" score={result.scores.trend_score} colors={colors} />
          <ScoreCard label="Confidence" score={result.scores.confidence_score} colors={colors} />
        </View>

        {result.what_works.length ? (
          <Section title="What Works" eyebrow="Strengths" colors={colors}>
            {result.what_works.map((item, index) => (
              <WhatWorksRow key={`${item.title}-${index}`} item={item} colors={colors} />
            ))}
          </Section>
        ) : null}

        {result.what_to_fix.length ? (
          <Section title="What To Fix" eyebrow="Adjustments" colors={colors}>
            {result.what_to_fix.map((item, index) => (
              <WhatToFixRow key={`${item.title}-${index}`} item={item} colors={colors} />
            ))}
          </Section>
        ) : null}

        {result.styling_tips.length ? (
          <Section title="Styling Tips" eyebrow="Try Next" colors={colors}>
            {result.styling_tips.map((tip, index) => (
              <TipRow key={`${tip}-${index}`} index={index + 1} tip={tip} colors={colors} />
            ))}
          </Section>
        ) : null}

        {result.shop_items.length ? (
          <Section title="Shopping List" eyebrow="Only If You Need It" colors={colors}>
            {result.shop_items.map((item, index) => (
              <ShopItemRow key={`${item.item_name}-${index}`} item={item} colors={colors} />
            ))}
          </Section>
        ) : null}

        <TouchableOpacity
          onPress={() => router.replace('/(tabs)/upload')}
          style={{
            marginTop: 40,
            alignItems: 'center',
            borderRadius: 22,
            borderWidth: 1,
            borderColor: colors.buttonBorder,
            backgroundColor: colors.buttonBackground,
            paddingVertical: 20,
          }}>
          <Text style={{ color: colors.buttonText, fontSize: 18, fontWeight: '700' }}>
            Try Another Look
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function ScoreCard({
  label,
  score,
  colors,
}: {
  label: string;
  score: number;
  colors: ResultsThemeColors;
}) {
  return (
    <View
      style={{
        width: '31.5%',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: colors.contentCardBorder,
        backgroundColor: colors.contentCardBackground,
        paddingHorizontal: 12,
        paddingVertical: 16,
      }}>
      <Text
        style={{
          color: colors.supportText,
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 1.4,
          textTransform: 'uppercase',
        }}>
        {label}
      </Text>
      <Text
        style={{
          marginTop: 12,
          color: colors.titleText,
          fontSize: 24,
          fontWeight: '700',
        }}>
        {formatScore(score)}
      </Text>
    </View>
  );
}

function Section({
  eyebrow,
  title,
  children,
  colors,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
  colors: ResultsThemeColors;
}) {
  return (
    <View style={{ marginTop: 32 }}>
      <Text
        style={{
          color: colors.eyebrow,
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 2.6,
          textTransform: 'uppercase',
        }}>
        {eyebrow}
      </Text>
      <Text
        style={{
          marginTop: 12,
          color: colors.titleText,
          fontSize: 24,
          fontWeight: '700',
        }}>
        {title}
      </Text>
      <View style={{ marginTop: 20, gap: 12 }}>{children}</View>
    </View>
  );
}

function WhatWorksRow({
  item,
  colors,
}: {
  item: OutfitReviewWhatWorksItem;
  colors: ResultsThemeColors;
}) {
  return (
    <View
      style={{
        borderRadius: 24,
        borderWidth: 1,
        borderColor: colors.contentCardBorder,
        backgroundColor: colors.contentCardBackground,
        paddingHorizontal: 20,
        paddingVertical: 20,
      }}>
      <Text style={{ color: colors.titleText, fontSize: 17, fontWeight: '700' }}>{item.title}</Text>
      <Text
        style={{
          marginTop: 12,
          color: colors.bodyText,
          fontSize: 15,
          lineHeight: 27,
        }}>
        {item.reason}
      </Text>
    </View>
  );
}

function WhatToFixRow({
  item,
  colors,
}: {
  item: OutfitReviewFixItem;
  colors: ResultsThemeColors;
}) {
  const severity = severityColors(colors, item.severity);

  return (
    <View
      style={{
        borderRadius: 24,
        borderWidth: 1,
        borderColor: colors.contentCardBorder,
        backgroundColor: colors.contentCardBackground,
        paddingHorizontal: 20,
        paddingVertical: 20,
      }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Text
          style={{
            flex: 1,
            paddingRight: 12,
            color: colors.titleText,
            fontSize: 17,
            fontWeight: '700',
          }}>
          {item.title}
        </Text>
        <View
          style={{
            borderRadius: 999,
            borderWidth: 1,
            borderColor: severity.borderColor,
            backgroundColor: severity.backgroundColor,
            paddingHorizontal: 12,
            paddingVertical: 4,
          }}>
          <Text
            style={{
              color: severity.textColor,
              fontSize: 11,
              fontWeight: '700',
              letterSpacing: 1.2,
              textTransform: 'uppercase',
            }}>
            {item.severity}
          </Text>
        </View>
      </View>

      <Text
        style={{
          marginTop: 16,
          color: colors.bodyText,
          fontSize: 15,
          lineHeight: 27,
        }}>
        {item.problem}
      </Text>
      <Text
        style={{
          marginTop: 12,
          color: colors.titleText,
          fontSize: 15,
          lineHeight: 27,
        }}>
        {item.fix}
      </Text>

      {item.search_keywords.length ? (
        <View style={{ marginTop: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {item.search_keywords.map((keyword, index) => (
            <View
              key={`${keyword}-${index}`}
              style={{
                borderRadius: 999,
                borderWidth: 1,
                borderColor: colors.keywordBorder,
                backgroundColor: colors.keywordBackground,
                paddingHorizontal: 12,
                paddingVertical: 6,
              }}>
              <Text style={{ color: colors.keywordText, fontSize: 12 }}>{keyword}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function TipRow({
  index,
  tip,
  colors,
}: {
  index: number;
  tip: string;
  colors: ResultsThemeColors;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: colors.contentCardBorder,
        backgroundColor: colors.contentCardBackground,
        paddingHorizontal: 20,
        paddingVertical: 20,
      }}>
      <View
        style={{
          marginRight: 16,
          height: 32,
          width: 32,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 999,
          backgroundColor: colors.tipIndexBackground,
        }}>
        <Text style={{ color: colors.tipIndexText, fontSize: 12, fontWeight: '700' }}>{index}</Text>
      </View>
      <Text
        style={{
          flex: 1,
          color: colors.bodyText,
          fontSize: 15,
          lineHeight: 27,
        }}>
        {tip}
      </Text>
    </View>
  );
}

function ShopItemRow({
  item,
  colors,
}: {
  item: OutfitReviewShopItem;
  colors: ResultsThemeColors;
}) {
  return (
    <View
      style={{
        borderRadius: 24,
        borderWidth: 1,
        borderColor: colors.contentCardBorder,
        backgroundColor: colors.contentCardBackground,
        paddingHorizontal: 20,
        paddingVertical: 20,
      }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Text
          style={{
            flex: 1,
            paddingRight: 12,
            color: colors.titleText,
            fontSize: 17,
            fontWeight: '700',
          }}>
          {item.item_name}
        </Text>
        <View
          style={{
            borderRadius: 999,
            borderWidth: 1,
            borderColor: colors.keywordBorder,
            backgroundColor: colors.keywordBackground,
            paddingHorizontal: 12,
            paddingVertical: 4,
          }}>
          <Text
            style={{
              color: colors.keywordText,
              fontSize: 11,
              fontWeight: '700',
              letterSpacing: 1.2,
              textTransform: 'uppercase',
            }}>
            {item.category}
          </Text>
        </View>
      </View>

      {item.search_terms.length ? (
        <Text
          style={{
            marginTop: 16,
            color: colors.bodyText,
            fontSize: 15,
            lineHeight: 27,
          }}>
          Search: {item.search_terms.join(' • ')}
        </Text>
      ) : null}

      {item.colors.length ? (
        <Text
          style={{
            marginTop: 12,
            color: colors.titleText,
            fontSize: 14,
            lineHeight: 25,
          }}>
          Colors: {item.colors.join(', ')}
        </Text>
      ) : null}

      {item.avoid.length ? (
        <Text
          style={{
            marginTop: 12,
            color: colors.supportText,
            fontSize: 14,
            lineHeight: 25,
          }}>
          Avoid: {item.avoid.join(', ')}
        </Text>
      ) : null}
    </View>
  );
}

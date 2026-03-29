import { useState } from 'react';
import { View, Text, ScrollView, SafeAreaView, Platform, StatusBar, Image, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Link, router } from 'expo-router';
import { type UserExplorePost, useApp } from '@/context/AppContext';

export default function Profile() {
  const { activeTheme, savedItems, userProfile, userExplorePosts, removeUserExplorePost } = useApp();
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const isDark = activeTheme === 'dark';
  const primaryTextStyle = { color: isDark ? '#f6ead8' : '#34281c' };
  const secondaryTextStyle = { color: isDark ? '#dfccb0' : '#6f5b46' };
  const mutedTextStyle = { color: isDark ? '#c8b597' : '#8b7761' };
  const eyebrowTextStyle = { color: isDark ? '#d8bb84' : '#b98c49' };
  const cardStyle = isDark ? { backgroundColor: '#120f0c', borderColor: '#403022' } : undefined;
  const elevatedSurfaceStyle = isDark ? { backgroundColor: '#171310', borderColor: '#4a3828' } : undefined;
  const mutedSurfaceStyle = isDark ? { backgroundColor: '#1d1713', borderColor: '#4b3827' } : undefined;
  const wardrobeItemStyle = isDark ? { backgroundColor: '#16120f', borderColor: '#4a3828' } : { backgroundColor: '#fff9f2', borderColor: '#dcc8ae' };
  const wardrobeMediaBorderStyle = isDark ? { borderColor: '#3f2e22' } : { borderColor: '#dcc8ae' };
  const wardrobeCategoryPillStyle = isDark ? { backgroundColor: 'rgba(10, 7, 5, 0.84)', borderColor: '#5a4330' } : { backgroundColor: 'rgba(255, 249, 242, 0.94)', borderColor: '#d7bea1' };
  const wardrobeScorePillStyle = isDark ? { backgroundColor: '#d4af6a', borderColor: '#e0c58d' } : { backgroundColor: '#d4af6a', borderColor: '#d1b57b' };
  const wardrobeSaveSurfaceStyle = isDark ? { backgroundColor: '#1b140f', borderColor: '#4c3928' } : { backgroundColor: '#f4ebe0', borderColor: '#d6c1a8' };
  const wardrobeTagSurfaceStyle = isDark ? { backgroundColor: '#211915', borderColor: '#4b3826' } : { backgroundColor: '#f5ece2', borderColor: '#d8c3aa' };
  const wardrobeContainerStyle = isDark ? { backgroundColor: '#100c09', borderColor: '#403022' } : cardStyle;
  const outfitsRatedValue = String(userExplorePosts.length);
  const savedItemsValue = String(savedItems.length);
  const averageScoreValue = userExplorePosts.length
    ? (userExplorePosts.reduce((sum, post) => sum + post.scoreSnapshot.overall_score, 0) / userExplorePosts.length).toFixed(1)
    : '—';
  const initials = userProfile.fullName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const emailLocalPart = userProfile.email.split('@')[0]?.trim().toLowerCase();
  const username = userProfile.username.trim().toLowerCase();
  const hasDistinctHandle = Boolean(username) && Boolean(emailLocalPart) && username !== emailLocalPart;
  const secondaryIdentity = hasDistinctHandle ? `@${userProfile.username}` : userProfile.email;
  const showBio = userProfile.bio.trim().length > 0;
  const wardrobeMenuSurfaceStyle = isDark ? { backgroundColor: '#19130f', borderColor: '#4a3828' } : { backgroundColor: '#fbf4ea', borderColor: '#dcc8ae' };
  const wardrobeMenuIconColor = isDark ? '#d7c09b' : '#7f6855';

  const handleDeletePost = (post: UserExplorePost) => {
    Alert.alert(
      'Delete this look from Explore?',
      'This will remove it from your wardrobe and from Explore for all users.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void confirmDeletePost(post);
          },
        },
      ]
    );
  };

  const confirmDeletePost = async (post: UserExplorePost) => {
    if (deletingPostId) {
      return;
    }

    setDeletingPostId(post.id);
    const result = await removeUserExplorePost(post.id);
    setDeletingPostId(null);

    if (result === 'deleted') {
      return;
    }

    const message =
      result === 'forbidden'
        ? 'Only the owner of this look can remove it from Explore.'
        : 'Trendz could not delete this look right now. Please try again.';

    Alert.alert('Delete failed', message);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" style={{ paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <View className="px-2 pt-4 pb-2">
          <View
            className="relative rounded-[30px] border border-border-strong px-5 pt-5 pb-5 shadow-sm shadow-black/10 dark:shadow-black/30"
            style={cardStyle}
          >
            <View className="absolute right-4 top-4 h-20 w-20 rounded-full bg-primary/10" />

            <View className="flex-row items-start">
              <View className="flex-1 pr-20">
                <Text className="mb-3 text-[11px] font-sans font-semibold uppercase tracking-[0.32em]" style={eyebrowTextStyle}>
                  Your Style Space
                </Text>
                <Text className="text-[42px] leading-[44px] font-sans font-semibold tracking-tight" style={primaryTextStyle}>
                  Profile
                </Text>
                <Text className="mt-3 max-w-[280px] text-[15px] leading-6 font-sans" style={secondaryTextStyle}>
                  Keep your wardrobe stats, saved looks, and account details polished in one place.
                </Text>
              </View>
            </View>

            <Link href="/settings" asChild>
              <TouchableOpacity
                className="absolute right-4 top-4 h-12 w-12 items-center justify-center rounded-full border border-border-strong bg-surface-elevated shadow-sm shadow-black/5 dark:shadow-black/25"
                style={elevatedSurfaceStyle}
              >
                <IconSymbol name="gearshape.fill" size={20} color={isDark ? '#d9c2a0' : '#8b7761'} />
              </TouchableOpacity>
            </Link>
          </View>
        </View>

        <View
          className="mt-5 items-center rounded-[32px] border border-border-strong px-6 pt-7 pb-6 shadow-sm shadow-black/5 dark:shadow-black/25"
          style={cardStyle}
        >
          <View className="relative">
            <View className="absolute -inset-1 rounded-full border border-primary/20" />
            {userProfile.avatarUri ? (
              <Image
                source={{ uri: userProfile.avatarUri }}
                className="h-28 w-28 rounded-full border-4 border-surface-elevated shadow-sm shadow-black/10 dark:shadow-black/30"
                style={elevatedSurfaceStyle}
              />
            ) : (
              <View
                className="h-28 w-28 items-center justify-center rounded-full border-4 border-surface-elevated shadow-sm shadow-black/10 dark:shadow-black/30"
                style={elevatedSurfaceStyle}
              >
                <Text className="text-[32px] font-sans font-semibold tracking-[0.08em]" style={primaryTextStyle}>
                  {initials}
                </Text>
              </View>
            )}
          </View>

          <Text className="mt-5 text-center text-[30px] font-sans font-semibold tracking-tight" style={primaryTextStyle}>
            {userProfile.fullName}
          </Text>
          <Text className="mt-2 text-[15px] font-sans" style={secondaryTextStyle}>
            {secondaryIdentity}
          </Text>
          {showBio ? (
            <Text className="mt-4 text-center text-[14px] leading-6 font-sans" style={mutedTextStyle}>
              {userProfile.bio}
            </Text>
          ) : null}

          <Link href="/edit-profile" asChild>
            <TouchableOpacity
              className="mt-6 rounded-full border border-border-strong px-7 py-3.5 shadow-sm shadow-black/5 dark:shadow-black/25"
              style={elevatedSurfaceStyle}
            >
              <Text className="font-sans text-[14px] font-semibold tracking-[0.08em]" style={primaryTextStyle}>
                Edit Profile
              </Text>
            </TouchableOpacity>
          </Link>
        </View>

        <View className="mt-6 flex-row justify-between gap-x-3">
          <StatCard
            value={outfitsRatedValue}
            label="Outfits Rated"
            valueColor={isDark ? '#d8bb84' : '#b98c49'}
            cardStyle={cardStyle}
            labelStyle={mutedTextStyle}
          />
          <StatCard
            value={savedItemsValue}
            label="Saved Items"
            valueColor={isDark ? '#f4e7d3' : '#34281c'}
            cardStyle={cardStyle}
            labelStyle={mutedTextStyle}
          />
          <StatCard
            value={averageScoreValue}
            label="Avg Score"
            valueColor={isDark ? '#f4e7d3' : '#34281c'}
            cardStyle={cardStyle}
            labelStyle={mutedTextStyle}
          />
        </View>

        <View className="mt-8 px-1">
          <Text className="mb-3 text-[11px] font-sans font-semibold uppercase tracking-[0.3em]" style={eyebrowTextStyle}>
            Wardrobe
          </Text>
          <View className="rounded-[28px] border border-border-strong px-4 py-4 shadow-sm shadow-black/5 dark:shadow-black/25" style={wardrobeContainerStyle}>
            {userExplorePosts.length ? (
              <View className="flex-row flex-wrap justify-between gap-y-4">
                {userExplorePosts.map((post) => (
                  <WardrobePostCard
                    key={post.id}
                    post={post}
                    isDark={isDark}
                    isSingle={userExplorePosts.length === 1}
                    primaryTextStyle={primaryTextStyle}
                    secondaryTextStyle={secondaryTextStyle}
                    eyebrowTextStyle={eyebrowTextStyle}
                    itemStyle={wardrobeItemStyle}
                    mediaBorderStyle={wardrobeMediaBorderStyle}
                    categoryPillStyle={wardrobeCategoryPillStyle}
                    scorePillStyle={wardrobeScorePillStyle}
                    saveSurfaceStyle={wardrobeSaveSurfaceStyle}
                    tagSurfaceStyle={wardrobeTagSurfaceStyle}
                    menuSurfaceStyle={wardrobeMenuSurfaceStyle}
                    menuIconColor={wardrobeMenuIconColor}
                    isDeleting={deletingPostId === post.id}
                    onOpen={() => router.push('/(tabs)/explore')}
                    onDelete={() => handleDeletePost(post)}
                  />
                ))}
              </View>
            ) : (
              <View className="rounded-[24px] border border-border-strong px-5 py-6" style={mutedSurfaceStyle}>
                <Text className="text-[18px] font-sans font-semibold tracking-tight" style={primaryTextStyle}>
                  Your posted looks will appear here.
                </Text>
                <Text className="mt-3 text-[14px] font-sans leading-6" style={secondaryTextStyle}>
                  High-scoring looks you add to Explore become part of your wardrobe with their image, category, score, and save count.
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({
  value,
  label,
  valueColor,
  cardStyle,
  labelStyle,
}: {
  value: string;
  label: string;
  valueColor: string;
  cardStyle?: object;
  labelStyle: object;
}) {
  return (
    <View
      className="flex-1 rounded-[24px] border border-border-strong px-3 py-5 items-center shadow-sm shadow-black/5 dark:shadow-black/25"
      style={cardStyle}
    >
      <Text className="text-[34px] font-sans font-semibold tracking-tight" style={{ color: valueColor }}>
        {value}
      </Text>
      <Text className="mt-2 text-center text-[11px] font-sans font-semibold uppercase tracking-[0.18em]" style={labelStyle}>
        {label}
      </Text>
    </View>
  );
}

function WardrobePostCard({
  post,
  isDark,
  isSingle,
  primaryTextStyle,
  secondaryTextStyle,
  eyebrowTextStyle,
  itemStyle,
  mediaBorderStyle,
  categoryPillStyle,
  scorePillStyle,
  saveSurfaceStyle,
  tagSurfaceStyle,
  menuSurfaceStyle,
  menuIconColor,
  isDeleting,
  onOpen,
  onDelete,
}: {
  post: UserExplorePost;
  isDark: boolean;
  isSingle: boolean;
  primaryTextStyle: object;
  secondaryTextStyle: object;
  eyebrowTextStyle: object;
  itemStyle: object;
  mediaBorderStyle: object;
  categoryPillStyle: object;
  scorePillStyle: object;
  saveSurfaceStyle: object;
  tagSurfaceStyle: object;
  menuSurfaceStyle: object;
  menuIconColor: string;
  isDeleting: boolean;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const primaryCategory = post.categories[0] ?? 'Explore';
  const secondaryCategories = post.categories.slice(1, 3);
  const saveCount = getWardrobeSaveCount(post);
  const metadataIconColor = isDark ? '#d9c2a0' : '#8b7761';
  const scoreIconColor = '#1a120a';
  const bodyCopy = (post.caption || post.vibe).trim();

  return (
    <View
      className="overflow-hidden rounded-[26px] border p-3"
      style={[itemStyle, { width: isSingle ? '100%' : '48.4%' }]}
    >
      <TouchableOpacity activeOpacity={0.9} onPress={onOpen}>
        <View className="relative">
          <Image
            source={{ uri: post.imageUrl }}
            className="w-full rounded-[22px] border"
            style={[mediaBorderStyle, { height: isSingle ? 260 : 188 }]}
            resizeMode="cover"
          />

          <View
            className="absolute left-3 top-3 rounded-full border px-3 py-2"
            style={categoryPillStyle}
          >
            <Text
              className="text-[10px] font-sans font-semibold uppercase tracking-[0.18em]"
              style={eyebrowTextStyle}
              numberOfLines={1}
            >
              {primaryCategory}
            </Text>
          </View>

          <View
            className="absolute right-3 top-3 flex-row items-center rounded-full border px-3 py-2"
            style={scorePillStyle}
          >
            <IconSymbol name="sparkles" size={12} color={scoreIconColor} />
            <Text className="ml-1.5 text-[12px] font-sans font-semibold" style={{ color: scoreIconColor }}>
              {formatWardrobeScore(post.scoreSnapshot.overall_score)}
            </Text>
          </View>
        </View>

        <View className="px-1 pt-4 pb-1">
          <View className="flex-row items-start justify-between">
            <Text
              className="flex-1 pr-3 text-[18px] font-sans font-semibold leading-6 tracking-tight"
              style={primaryTextStyle}
              numberOfLines={2}
            >
              {post.title}
            </Text>

            <TouchableOpacity
              activeOpacity={0.82}
              disabled={isDeleting}
              onPress={(event) => {
                event.stopPropagation?.();
                onDelete();
              }}
              className="h-9 w-9 items-center justify-center rounded-full border"
              style={menuSurfaceStyle}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color={menuIconColor} />
              ) : (
                <MaterialCommunityIcons name="dots-horizontal" size={18} color={menuIconColor} />
              )}
            </TouchableOpacity>
          </View>

          <Text
            className="mt-2 text-[13px] font-sans leading-5"
            style={secondaryTextStyle}
            numberOfLines={isSingle ? 3 : 2}
          >
            {bodyCopy}
          </Text>

          <View className="mt-4 flex-row items-center justify-between">
            <View className="flex-row items-center rounded-full border px-3 py-2" style={saveSurfaceStyle}>
              <IconSymbol name="bookmark.fill" size={13} color={metadataIconColor} />
              <Text className="ml-2 text-[12px] font-sans font-semibold" style={secondaryTextStyle}>
                {formatSaveCount(saveCount)}
              </Text>
            </View>

            <View className="flex-row items-center rounded-full border px-3 py-2" style={tagSurfaceStyle}>
              <Text className="text-[11px] font-sans font-semibold uppercase tracking-[0.12em]" style={eyebrowTextStyle}>
                Post
              </Text>
            </View>
          </View>

          {secondaryCategories.length ? (
            <View className="mt-3 flex-row flex-wrap gap-2">
              {secondaryCategories.map((category) => (
                <View
                  key={`${post.id}-${category}`}
                  className="rounded-full border px-3 py-2"
                  style={tagSurfaceStyle}
                >
                  <Text className="text-[11px] font-sans font-medium" style={secondaryTextStyle}>
                    {category}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </TouchableOpacity>
    </View>
  );
}

function MenuItem({
  icon,
  label,
  href,
  detail,
  hideBorder = false,
  isDestructive = false,
  surfaceStyle,
  primaryTextStyle,
  secondaryTextStyle,
  iconColor,
  chevronColor,
}: any) {
  return (
    <Link href={href} asChild>
      <TouchableOpacity
        className={`flex-row items-center justify-between px-5 py-5 ${!hideBorder ? 'border-b border-border' : ''}`}
        activeOpacity={0.86}
      >
        <View className="flex-row items-center">
          <View
            className="mr-4 h-11 w-11 rounded-full items-center justify-center border border-border-strong bg-surface-muted"
            style={surfaceStyle}
          >
            <IconSymbol name={icon} size={18} color={isDestructive ? '#ff8f82' : iconColor} />
          </View>
          <View>
            <Text className="font-sans text-[17px] font-semibold tracking-tight" style={isDestructive ? { color: '#ff8f82' } : primaryTextStyle}>
              {label}
            </Text>
            {detail ? (
              <Text className="mt-1 font-sans text-[13px]" style={secondaryTextStyle}>
                {detail}
              </Text>
            ) : null}
          </View>
        </View>
        <IconSymbol name="chevron.right" size={16} color={chevronColor} />
      </TouchableOpacity>
    </Link>
  );
}

function getWardrobeSaveCount(post: UserExplorePost) {
  if (Array.isArray(post.savedByUserIds)) {
    return post.savedByUserIds.length;
  }

  if (typeof post.saveCount === 'number' && Number.isFinite(post.saveCount)) {
    return Math.max(0, post.saveCount);
  }

  return 0;
}

function formatSaveCount(count: number) {
  return `${count} ${count === 1 ? 'save' : 'saves'}`;
}

function formatWardrobeScore(score: number) {
  return score.toFixed(1);
}

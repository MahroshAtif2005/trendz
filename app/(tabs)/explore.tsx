import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useFocusEffect } from '@react-navigation/native';
import CategoryChip from '@/components/CategoryChip';
import InspirationCard from '@/components/InspirationCard';
import { useApp } from '@/context/AppContext';
import {
  buildBalancedColumns,
  EXPLORE_CATEGORIES,
  EXPLORE_FEED_ITEMS,
  ExploreCategory,
  ExploreInspirationItem,
  getExploreItemsByCategory,
  mergeExploreFeedItems,
} from '@/lib/explore-feed';
import {
  getInteractionWeights,
  rankPosts,
  recordInteraction,
} from '@/lib/explorePersonalisation';

function normalizeFeedImageUrl(url: string) {
  return url
    .trim()
    .toLowerCase()
    .split('#')[0]
    .split('?')[0]
    .replace(/\/+$/, '');
}

function dedupeFeedItemsForRender(items: ExploreInspirationItem[]) {
  const seenIds = new Set<string>();
  const seenImages = new Set<string>();

  return items.filter((item) => {
    const normalizedImageUrl = normalizeFeedImageUrl(item.imageUrl);

    if (!item.id || seenIds.has(item.id)) {
      return false;
    }

    if (normalizedImageUrl && seenImages.has(normalizedImageUrl)) {
      return false;
    }

    seenIds.add(item.id);

    if (normalizedImageUrl) {
      seenImages.add(normalizedImageUrl);
    }

    return true;
  });
}

export default function Explore() {
  const [activeCategory, setActiveCategory] = useState<ExploreCategory>('All');
  const [previewItem, setPreviewItem] = useState<ExploreInspirationItem | null>(null);
  const [interactionWeights, setInteractionWeights] = useState<Record<string, number>>({});
  const [refreshKey, setRefreshKey] = useState(0);
  const [feedPosts, setFeedPosts] = useState<ExploreInspirationItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { activeTheme, isSaved, toggleSave, explorePosts, refreshExplorePosts } = useApp();

  const reloadInteractionWeights = useCallback(async () => {
    const weights = await getInteractionWeights();
    setInteractionWeights(weights);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refreshExplorePosts();
      void reloadInteractionWeights();
    }, [refreshExplorePosts, reloadInteractionWeights])
  );

  const buildRankedFeed = useCallback(
    (posts: ExploreInspirationItem[], weights: Record<string, number>) =>
      dedupeFeedItemsForRender(rankPosts(mergeExploreFeedItems(posts, EXPLORE_FEED_ITEMS), weights)),
    []
  );

  const mergedFeedItems = useMemo(
    () =>
      buildRankedFeed(explorePosts, interactionWeights),
    [buildRankedFeed, explorePosts, interactionWeights, refreshKey]
  );

  useEffect(() => {
    setFeedPosts(mergedFeedItems);
  }, [mergedFeedItems]);

  const totalLooks = feedPosts.length;
  const totalCuratedCategories = EXPLORE_CATEGORIES.length - 1;

  const filteredData = useMemo(
    () => getExploreItemsByCategory(activeCategory, feedPosts),
    [activeCategory, feedPosts]
  );

  const [leftColumnItems, rightColumnItems] = useMemo(
    () => buildBalancedColumns(filteredData),
    [filteredData]
  );
  const isDark = activeTheme === 'dark';
  const previewIsSaved = previewItem ? isSaved(previewItem.id) : false;

  const closePreview = () => {
    setPreviewItem(null);
  };

  const handleCategoryPress = async (category: ExploreCategory) => {
    setActiveCategory(category);

    if (category === 'All') {
      return;
    }

    await recordInteraction([category], 2);
    await reloadInteractionWeights();
  };

  const handleOpenPreview = (item: ExploreInspirationItem) => {
    setPreviewItem(item);

    void recordInteraction(item.categories, 1).then(() => reloadInteractionWeights());
  };

  const handleToggleSave = async (item: ExploreInspirationItem) => {
    await toggleSave(item);
    await recordInteraction(item.categories, 3);
    await reloadInteractionWeights();
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);

    try {
      await refreshExplorePosts();
      const weights = await getInteractionWeights();
      setInteractionWeights(weights);
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshExplorePosts]);

  return (
    <SafeAreaView className="flex-1 bg-background" style={{ paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 28 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void handleRefresh()}
            tintColor="#C9A84C"
            colors={['#C9A84C']}
          />
        }
        showsVerticalScrollIndicator={false}>
        <View className="px-4 pt-4 pb-2">
          <View className="overflow-hidden rounded-[30px] border border-border-strong bg-surface-elevated px-5 pt-5 pb-4 shadow-sm shadow-black/10 dark:bg-[#110e0b] dark:shadow-black/30">
            <View className="absolute -right-4 -top-2 h-24 w-24 rounded-full bg-primary/10" />

            <Text className="mb-3 text-[11px] font-sans font-semibold uppercase tracking-[0.34em] text-[#b98c49] dark:text-[#d8bb84]">
              Curated Inspiration
            </Text>

            <Text className="text-[44px] leading-[46px] font-sans font-semibold tracking-tight text-[#34281c] dark:text-[#f6ead8]">
              Explore
            </Text>

            <Text className="mt-3 max-w-[330px] text-[15px] leading-6 font-sans text-[#6f5b46] dark:text-[#e2d0b7]">
              Discover trend-right silhouettes, polished textures, quiet-luxury layers, and occasion dressing arranged like a live fashion moodboard.
            </Text>

            <View className="mt-4 flex-row items-center">
              <View className="mr-3 h-px flex-1 bg-border-strong" />
              <Text className="text-[11px] font-sans font-medium uppercase tracking-[0.18em] text-text-muted">
                {totalLooks} looks across {totalCuratedCategories} curated edits
              </Text>
            </View>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12, paddingTop: 8 }}>
          {EXPLORE_CATEGORIES.map((category) => (
            <CategoryChip
              key={category}
              label={category}
              isActive={activeCategory === category}
              onPress={() => void handleCategoryPress(category)}
            />
          ))}
        </ScrollView>

        <View className="px-1 pt-1">
          <View className="flex-row justify-between">
            <View className="w-[49.4%]">
              {leftColumnItems.map((item) => (
                <InspirationCard
                  key={item.id}
                  item={item}
                  isSaved={isSaved(item.id)}
                  onToggleSave={() => void handleToggleSave(item)}
                  onPress={() => handleOpenPreview(item)}
                  variant="feed"
                />
              ))}
            </View>

            <View className="w-[49.4%]" style={{ marginTop: 18 }}>
              {rightColumnItems.map((item) => (
                <InspirationCard
                  key={item.id}
                  item={item}
                  isSaved={isSaved(item.id)}
                  onToggleSave={() => void handleToggleSave(item)}
                  onPress={() => handleOpenPreview(item)}
                  variant="feed"
                />
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      <Modal
        transparent
        animationType="fade"
        visible={Boolean(previewItem)}
        onRequestClose={closePreview}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={closePreview}
          style={{
            flex: 1,
            justifyContent: 'center',
            backgroundColor: 'rgba(5, 5, 5, 0.84)',
            paddingHorizontal: 18,
            paddingVertical: 28,
          }}>
          {previewItem ? (
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => {}}
              style={{
                borderRadius: 30,
                borderWidth: 1,
                borderColor: isDark ? '#3f2f22' : '#dbc8af',
                backgroundColor: isDark ? '#120f0c' : '#f9f3ea',
                padding: 14,
                shadowColor: '#000',
                shadowOpacity: isDark ? 0.3 : 0.14,
                shadowOffset: { width: 0, height: 12 },
                shadowRadius: 28,
              }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text
                    style={{
                      color: isDark ? '#eadbc8' : '#34281c',
                      fontSize: 20,
                      fontWeight: '700',
                    }}
                    numberOfLines={2}>
                    {previewItem.title}
                  </Text>
                  {previewItem.vibe ? (
                    <Text
                      style={{
                        marginTop: 6,
                        color: isDark ? '#d6c2a5' : '#725d47',
                        fontSize: 13,
                        letterSpacing: 1.2,
                        textTransform: 'uppercase',
                      }}
                      numberOfLines={1}>
                      {previewItem.vibe}
                    </Text>
                  ) : null}
                </View>

                <TouchableOpacity
                  onPress={closePreview}
                  style={{
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: isDark ? '#4a3826' : '#d6c3aa',
                    backgroundColor: isDark ? '#19130f' : '#f5ede2',
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                  }}>
                  <Text
                    style={{
                      color: isDark ? '#eadbc8' : '#3a2a1d',
                      fontSize: 13,
                      fontWeight: '700',
                    }}>
                    Close
                  </Text>
                </TouchableOpacity>
              </View>

              <Image
                source={{ uri: previewItem.imageUrl }}
                style={{
                  width: '100%',
                  aspectRatio: 0.74,
                  borderRadius: 24,
                  backgroundColor: isDark ? '#17120e' : '#efe6da',
                }}
                contentFit="cover"
                cachePolicy="memory-disk"
              />

              <View style={{ marginTop: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text
                  style={{
                    flex: 1,
                    color: isDark ? '#cbb8a3' : '#6f5b46',
                    fontSize: 14,
                    lineHeight: 22,
                  }}
                  numberOfLines={2}>
                  Tap outside or use close to return to Explore.
                </Text>

                <TouchableOpacity
                  onPress={() => void handleToggleSave(previewItem)}
                  style={{
                    marginLeft: 14,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: previewIsSaved ? '#d4af6a' : isDark ? '#4a3826' : '#d6c3aa',
                    backgroundColor: previewIsSaved ? '#d4af6a' : isDark ? '#19130f' : '#f5ede2',
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                  }}>
                  <Text
                    style={{
                      color: previewIsSaved ? '#1a120a' : isDark ? '#eadbc8' : '#3a2a1d',
                      fontSize: 13,
                      fontWeight: '700',
                    }}>
                    {previewIsSaved ? 'Saved' : 'Save'}
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ) : null}
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

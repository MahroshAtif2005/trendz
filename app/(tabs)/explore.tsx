import { useMemo, useState } from 'react';
import { View, Text, ScrollView, SafeAreaView, Platform, StatusBar } from 'react-native';
import CategoryChip from '@/components/CategoryChip';
import InspirationCard from '@/components/InspirationCard';
import { useApp } from '@/context/AppContext';
import {
  buildBalancedColumns,
  EXPLORE_CATEGORIES,
  EXPLORE_FEED_ITEMS,
  ExploreCategory,
  getExploreItemsByCategory,
  mergeExploreFeedItems,
} from '@/lib/explore-feed';

export default function Explore() {
  const [activeCategory, setActiveCategory] = useState<ExploreCategory>('All');
  const { isSaved, toggleSave, userExplorePosts } = useApp();
  const mergedFeedItems = useMemo(
    () => mergeExploreFeedItems(userExplorePosts, EXPLORE_FEED_ITEMS),
    [userExplorePosts]
  );
  const totalLooks = mergedFeedItems.length;
  const totalCuratedCategories = EXPLORE_CATEGORIES.length - 1;

  const filteredData = useMemo(
    () => getExploreItemsByCategory(activeCategory, mergedFeedItems),
    [activeCategory, mergedFeedItems]
  );

  const [leftColumnItems, rightColumnItems] = useMemo(
    () => buildBalancedColumns(filteredData),
    [filteredData]
  );

  return (
    <SafeAreaView className="flex-1 bg-background" style={{ paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 28 }}
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
              onPress={() => setActiveCategory(category)}
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
                  onToggleSave={() => toggleSave(item)}
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
                  onToggleSave={() => toggleSave(item)}
                  variant="feed"
                />
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

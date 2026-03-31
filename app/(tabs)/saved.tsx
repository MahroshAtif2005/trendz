import { useState } from 'react';
import {
  FlatList,
  Image,
  Modal,
  Platform,
  SafeAreaView,
  StatusBar,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import InspirationCard from '@/components/InspirationCard';
import type { InspirationItem } from '@/context/AppContext';
import { useApp } from '@/context/AppContext';

export default function Saved() {
  const [previewItem, setPreviewItem] = useState<InspirationItem | null>(null);
  const { savedItems, isSaved, toggleSave, activeTheme } = useApp();
  const { width } = useWindowDimensions();
  const isDark = activeTheme === 'dark';
  const previewIsSaved = previewItem ? isSaved(previewItem.id) : false;
  const GRID_GAP = 8;
  const GRID_SIDE_PADDING = 12;
  const cardWidth = Math.floor((width - GRID_SIDE_PADDING * 2 - GRID_GAP) / 2);

  const screenStyle = { backgroundColor: isDark ? '#050505' : '#fcfaf6' };
  const titleStyle = { color: isDark ? '#eadbc8' : '#34281c' };
  const subtitleStyle = { color: isDark ? '#c9b8a6' : '#6f5b46' };
  const emptyCardStyle = {
    backgroundColor: isDark ? '#120d0a' : '#f7efe5',
    borderColor: isDark ? '#3a2a1d' : '#dbc9b2',
  };
  const emptyTitleStyle = { color: isDark ? '#e8dccd' : '#34281c' };
  const emptyDescriptionStyle = { color: isDark ? '#bdaa96' : '#7d6854' };

  const closePreview = () => {
    setPreviewItem(null);
  };

  const handleToggleSave = async (item: InspirationItem) => {
    await toggleSave(item);
  };

  return (
    <SafeAreaView
      className="flex-1 bg-background"
      style={[screenStyle, { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }]}
    >
      {/* Header */}
      <View className="px-6 pt-6 pb-2">
        <Text className="mb-2 text-4xl font-sans font-semibold tracking-tight" style={titleStyle}>
          Saved
        </Text>
        <Text className="mt-0.5 text-[16px] font-sans" style={subtitleStyle}>
          Your personal style archive.
        </Text>
      </View>

      <FlatList
        data={savedItems}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={{
          paddingHorizontal: GRID_SIDE_PADDING,
          paddingTop: GRID_GAP,
          paddingBottom: 120,
          flexGrow: 1,
        }}
        columnWrapperStyle={{ gap: GRID_GAP }}
        ItemSeparatorComponent={() => <View style={{ height: GRID_GAP }} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View
            className="mx-2 mt-20 flex-1 items-center justify-center rounded-[28px] border px-8 py-12 shadow-sm shadow-black/5 dark:shadow-black/25"
            style={emptyCardStyle}
          >
            <Text className="font-sans text-lg font-semibold" style={emptyTitleStyle}>
              No saved styles yet.
            </Text>
            <Text className="mt-2 px-10 text-center font-sans text-sm leading-6" style={emptyDescriptionStyle}>
              Tap the heart icon on any inspiration look to save it here.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={{ width: cardWidth }}>
            <InspirationCard
              item={item}
              isSaved={isSaved(item.id)}
              onToggleSave={() => void handleToggleSave(item)}
              onPress={() => setPreviewItem(item)}
              variant="feed"
              disableOuterSpacing
            />
          </View>
        )}
      />

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
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 12,
                }}>
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
                resizeMode="cover"
              />

              <View
                style={{
                  marginTop: 14,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                <Text
                  style={{
                    flex: 1,
                    color: isDark ? '#cbb8a3' : '#6f5b46',
                    fontSize: 14,
                    lineHeight: 22,
                  }}
                  numberOfLines={2}>
                  Tap outside or use close to return to Saved.
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

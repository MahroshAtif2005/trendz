import { useState } from 'react';
import { View, Text, FlatList, SafeAreaView, Platform, StatusBar, TouchableOpacity } from 'react-native';
import InspirationCard from '@/components/InspirationCard';
import { useApp } from '@/context/AppContext';

const SAVED_TABS = ["All Saves", "AI Results", "Inspiration"];

export default function Saved() {
  const [activeTab, setActiveTab] = useState("All Saves");
  const { savedItems, isSaved, toggleSave, activeTheme } = useApp();
  const isDark = activeTheme === 'dark';

  const screenStyle = { backgroundColor: isDark ? '#050505' : '#fcfaf6' };
  const titleStyle = { color: isDark ? '#eadbc8' : '#34281c' };
  const subtitleStyle = { color: isDark ? '#c9b8a6' : '#6f5b46' };
  const inactivePillStyle = {
    backgroundColor: isDark ? '#181411' : '#f3ede4',
    borderColor: isDark ? '#3a2c20' : '#d8c6ae',
  };
  const inactivePillTextStyle = { color: isDark ? '#e4d5c3' : '#6f5b46' };
  const activePillStyle = {
    backgroundColor: '#d4af6a',
    borderColor: '#d4af6a',
  };
  const activePillTextStyle = { color: '#1a120a' };
  const emptyCardStyle = {
    backgroundColor: isDark ? '#120d0a' : '#f7efe5',
    borderColor: isDark ? '#3a2a1d' : '#dbc9b2',
  };
  const emptyTitleStyle = { color: isDark ? '#e8dccd' : '#34281c' };
  const emptyDescriptionStyle = { color: isDark ? '#bdaa96' : '#7d6854' };

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
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View className="mb-6 mt-6 ml-2">
            <FlatList 
              horizontal
              showsHorizontalScrollIndicator={false}
              data={SAVED_TABS}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => setActiveTab(item)}
                  activeOpacity={0.88}
                  className="mr-2.5 rounded-full border px-5 py-3 shadow-sm shadow-black/5 dark:shadow-black/25"
                  style={activeTab === item ? activePillStyle : inactivePillStyle}
                >
                  <Text
                    className="font-sans text-[13px] font-semibold tracking-[0.01em]"
                    style={activeTab === item ? activePillTextStyle : inactivePillTextStyle}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={{ paddingRight: 24 }}
            />
          </View>
        }
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
          <View style={{ flex: 1 }}>
            <InspirationCard 
              item={item} 
              isSaved={isSaved(item.id)}
              onToggleSave={() => toggleSave(item)}
            />
          </View>
        )}
      />
    </SafeAreaView>
  );
}

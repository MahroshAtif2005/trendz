import { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useApp } from '@/context/AppContext';

type PlannerEvent = {
  id: string;
  dateKey: string;
  title: string;
  notes: string;
  outfitSource: 'saved' | 'none';
  outfitId?: string;
  outfitImageUrl?: string;
  outfitTitle?: string;
  createdAt: number;
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

function createMonthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function fromDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function isSameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function formatMonthLabel(date: Date) {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

function formatSelectedDate(date: Date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function formatEventDate(dateKey: string) {
  return fromDateKey(dateKey).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function buildCalendarDays(month: Date) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstDayOfMonth = new Date(year, monthIndex, 1);
  const leadingEmptyCells = firstDayOfMonth.getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const totalCells = Math.ceil((leadingEmptyCells + daysInMonth) / 7) * 7;

  return Array.from({ length: totalCells }, (_, index) => {
    const dayNumber = index - leadingEmptyCells + 1;

    if (dayNumber < 1 || dayNumber > daysInMonth) {
      return null;
    }

    return new Date(year, monthIndex, dayNumber);
  });
}

export default function Events() {
  const { activeTheme, savedItems } = useApp();
  const today = useMemo(() => new Date(), []);
  const [visibleMonth, setVisibleMonth] = useState(() => createMonthStart(today));
  const [selectedDate, setSelectedDate] = useState(today);
  const [events, setEvents] = useState<PlannerEvent[]>([]);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftNotes, setDraftNotes] = useState('');
  const [selectedOutfitId, setSelectedOutfitId] = useState<string | null>(null);

  const isDark = activeTheme === 'dark';
  const pageTitleTextStyle = { color: isDark ? '#f6ead8' : '#34281c' };
  const primaryTextStyle = { color: isDark ? '#f4e7d3' : '#34281c' };
  const secondaryTextStyle = { color: isDark ? '#deccb0' : '#6f5b46' };
  const tertiaryTextStyle = { color: isDark ? '#cab899' : '#8b7761' };
  const eyebrowTextStyle = { color: isDark ? '#dbbd84' : '#b98c49' };
  const cardStyle = isDark ? { backgroundColor: '#120f0c', borderColor: '#403022' } : undefined;
  const selectedDayCardStyle = isDark ? { backgroundColor: '#15110d', borderColor: '#4a3827' } : undefined;
  const surfaceStyle = isDark ? { backgroundColor: '#1a1511', borderColor: '#4a3828' } : undefined;
  const subtleSurfaceStyle = isDark ? { backgroundColor: '#1d1713', borderColor: '#433120' } : undefined;
  const arrowButtonStyle = isDark ? { backgroundColor: '#1c1612', borderColor: '#4f3b28' } : undefined;
  const unselectedDateCellStyle = isDark ? { backgroundColor: '#1a1511', borderColor: '#3a2c20' } : undefined;
  const weekdayLabelStyle = { color: isDark ? '#cfbc9d' : '#8c7863' };
  const unselectedDateTextStyle = { color: isDark ? '#eee0ca' : '#443426' };
  const arrowTextStyle = { color: isDark ? '#e0c99f' : '#87653b' };
  const selectedDateKey = toDateKey(selectedDate);
  const todayKey = toDateKey(today);
  const calendarDays = useMemo(() => buildCalendarDays(visibleMonth), [visibleMonth]);
  const eventDateKeys = useMemo(() => new Set(events.map((event) => event.dateKey)), [events]);

  const selectedDateEvents = useMemo(
    () =>
      events
        .filter((event) => event.dateKey === selectedDateKey)
        .sort((left, right) => right.createdAt - left.createdAt),
    [events, selectedDateKey]
  );

  const upcomingEvents = useMemo(
    () =>
      events
        .filter((event) => event.dateKey >= todayKey)
        .sort((left, right) => {
          if (left.dateKey === right.dateKey) {
            return left.createdAt - right.createdAt;
          }

          return left.dateKey.localeCompare(right.dateKey);
        })
        .slice(0, 4),
    [events, todayKey]
  );

  const resetComposer = () => {
    setDraftTitle('');
    setDraftNotes('');
    setSelectedOutfitId(null);
  };

  const openComposer = () => {
    setIsComposerOpen(true);
  };

  const closeComposer = () => {
    setIsComposerOpen(false);
    resetComposer();
  };

  const changeMonth = (offset: number) => {
    const nextMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + offset, 1);

    setVisibleMonth(nextMonth);
    setSelectedDate(new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 1));
    setIsComposerOpen(false);
  };

  const handleDatePress = (date: Date) => {
    setSelectedDate(date);
    setIsComposerOpen(false);
  };

  const handleSaveEvent = () => {
    if (!draftTitle.trim()) {
      Alert.alert('Add an event title', 'Give this plan a title or occasion before saving it.');
      return;
    }

    const selectedOutfit = savedItems.find((item) => item.id === selectedOutfitId);

    setEvents((currentEvents) => [
      {
        id: `${selectedDateKey}-${Date.now()}`,
        dateKey: selectedDateKey,
        title: draftTitle.trim(),
        notes: draftNotes.trim(),
        outfitSource: selectedOutfit ? 'saved' : 'none',
        outfitId: selectedOutfit?.id,
        outfitImageUrl: selectedOutfit?.imageUrl,
        outfitTitle: selectedOutfit?.title,
        createdAt: Date.now(),
      },
      ...currentEvents,
    ]);

    closeComposer();
  };

  return (
    <SafeAreaView
      className="flex-1 bg-background"
      style={{ paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}
    >
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 44 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-2 pt-6 pb-2">
          <Text className="mb-2 text-4xl font-sans font-semibold tracking-tight" style={pageTitleTextStyle}>
            Events
          </Text>
          <Text className="text-[16px] leading-7 font-sans" style={secondaryTextStyle}>
            Plan your calendar, attach looks, and keep every outfit tied to the right day.
          </Text>
        </View>

        <View
          className="mt-5 rounded-[32px] border border-border-strong bg-surface-elevated p-5 shadow-sm shadow-black/5 dark:shadow-black/30"
          style={cardStyle}
        >
          <View className="flex-row items-center justify-between">
            <TouchableOpacity
              onPress={() => changeMonth(-1)}
              className="h-11 w-11 items-center justify-center rounded-full border border-border-strong bg-surface"
              style={arrowButtonStyle}
              activeOpacity={0.86}
            >
              <Text className="text-[20px] font-sans font-semibold" style={arrowTextStyle}>{'<'}</Text>
            </TouchableOpacity>

            <View className="items-center">
              <Text className="text-[12px] font-sans uppercase tracking-[0.26em]" style={eyebrowTextStyle}>
                Planner
              </Text>
              <Text className="mt-1 text-[24px] font-sans font-semibold tracking-tight" style={primaryTextStyle}>
                {formatMonthLabel(visibleMonth)}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => changeMonth(1)}
              className="h-11 w-11 items-center justify-center rounded-full border border-border-strong bg-surface"
              style={arrowButtonStyle}
              activeOpacity={0.86}
            >
              <Text className="text-[20px] font-sans font-semibold" style={arrowTextStyle}>{'>'}</Text>
            </TouchableOpacity>
          </View>

          <View className="mt-5 flex-row justify-between">
            {WEEKDAYS.map((weekday) => (
              <Text
                key={weekday}
                className="w-[13.4%] text-center text-[11px] font-sans font-semibold uppercase tracking-[0.18em]"
                style={weekdayLabelStyle}
              >
                {weekday}
              </Text>
            ))}
          </View>

          <View className="mt-4 flex-row flex-wrap justify-between">
            {calendarDays.map((date, index) => {
              if (!date) {
                return <View key={`empty-${index}`} className="mb-3 h-[52px] w-[13.4%]" />;
              }

              const dateKey = toDateKey(date);
              const isSelected = isSameDay(date, selectedDate);
              const isToday = dateKey === todayKey;
              const hasEvents = eventDateKeys.has(dateKey);

              return (
                <TouchableOpacity
                  key={dateKey}
                  onPress={() => handleDatePress(date)}
                  activeOpacity={0.88}
                  className={`mb-3 h-[52px] w-[13.4%] items-center justify-center rounded-[18px] border ${
                    isSelected
                      ? 'border-primary bg-primary'
                      : `${isDark ? 'border-[#1e1812] bg-[#17120f]' : 'border-border bg-surface'}`
                  }`}
                  style={isSelected ? undefined : unselectedDateCellStyle}
                >
                  <Text
                    className={`font-sans text-[15px] font-semibold ${
                      isSelected ? 'text-primary-foreground' : 'text-text'
                    }`}
                    style={isSelected ? undefined : unselectedDateTextStyle}
                  >
                    {date.getDate()}
                  </Text>
                  <View
                    className={`mt-1 h-1.5 w-1.5 rounded-full ${
                      hasEvents
                        ? isSelected
                          ? 'bg-primary-foreground'
                          : 'bg-primary'
                        : isToday
                          ? 'bg-text-soft'
                          : 'bg-transparent'
                    }`}
                  />
                  {!isSelected && isToday ? (
                    <View className="absolute inset-0 rounded-[18px] border border-primary/45" />
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View
          className="mt-5 rounded-[30px] border border-border-strong bg-surface-elevated p-5 shadow-sm shadow-black/5 dark:shadow-black/25"
          style={selectedDayCardStyle}
        >
          <Text className="text-[11px] font-sans uppercase tracking-[0.24em]" style={eyebrowTextStyle}>
            Selected Day
          </Text>
          <Text className="mt-2 text-[28px] font-sans font-semibold tracking-tight" style={primaryTextStyle}>
            {formatSelectedDate(selectedDate)}
          </Text>
          <Text className="mt-2 text-[15px] leading-6 font-sans" style={secondaryTextStyle}>
            Add a plan for this date, attach a saved look if you have one, and keep your wardrobe calendar organized.
          </Text>
        </View>

        {selectedDateEvents.length === 0 && !isComposerOpen ? (
          <View
            className="mt-5 items-center rounded-[30px] border border-border-strong bg-surface-elevated px-6 py-10 shadow-sm shadow-black/5 dark:shadow-black/25"
            style={cardStyle}
          >
            <Text className="text-[23px] font-sans font-semibold tracking-tight" style={primaryTextStyle}>
              No event planned yet
            </Text>
            <Text className="mt-3 max-w-[280px] text-center text-[15px] leading-6 font-sans" style={secondaryTextStyle}>
              Start with a title, add a note if you want, and link a saved outfit whenever you&apos;re ready.
            </Text>
            <TouchableOpacity
              onPress={openComposer}
              activeOpacity={0.88}
              className="mt-6 rounded-full border border-primary bg-primary px-7 py-3.5 shadow-sm shadow-primary/20"
            >
              <Text className="font-sans text-[14px] font-semibold tracking-[0.06em] text-primary-foreground">
                Add Event
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {selectedDateEvents.length > 0 ? (
          <View className="mt-5">
            <View className="flex-row items-center justify-between px-1">
              <Text className="text-[21px] font-sans font-semibold tracking-tight" style={primaryTextStyle}>
                Planned For This Day
              </Text>
              <TouchableOpacity onPress={openComposer} activeOpacity={0.86}>
                <Text className="font-sans text-[14px] font-semibold text-primary">
                  Add Event
                </Text>
              </TouchableOpacity>
            </View>

            {selectedDateEvents.map((event) => (
              <View
                key={event.id}
                className="mt-3 rounded-[28px] border border-border-strong bg-surface-elevated p-4 shadow-sm shadow-black/5 dark:bg-[#110e0b] dark:shadow-black/25"
                style={cardStyle}
              >
                <View className="flex-row">
                  <View className="flex-1 pr-4">
                    <Text className="text-[19px] font-sans font-semibold tracking-tight" style={primaryTextStyle}>
                      {event.title}
                    </Text>
                    <Text className="mt-1 text-[12px] font-sans uppercase tracking-[0.18em]" style={eyebrowTextStyle}>
                      {formatEventDate(event.dateKey)}
                    </Text>
                    {event.notes ? (
                      <Text className="mt-3 text-[14px] leading-6 font-sans" style={secondaryTextStyle}>
                        {event.notes}
                      </Text>
                    ) : null}
                    <Text className="mt-3 text-[13px] font-sans font-medium" style={tertiaryTextStyle}>
                      {event.outfitTitle ? `Attached look: ${event.outfitTitle}` : 'No outfit attached yet'}
                    </Text>
                  </View>

                  {event.outfitImageUrl ? (
                    <Image
                      source={{ uri: event.outfitImageUrl }}
                      className="h-[94px] w-[74px] rounded-[20px]"
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      className="h-[94px] w-[74px] items-center justify-center rounded-[20px] border border-dashed border-border-strong bg-surface"
                      style={surfaceStyle}
                    >
                      <Text className="px-2 text-center text-[11px] font-sans font-medium uppercase tracking-[0.14em]" style={weekdayLabelStyle}>
                        Open Look
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {isComposerOpen ? (
          <View
            className="mt-5 rounded-[30px] border border-border-strong bg-surface-elevated p-5 shadow-sm shadow-black/5 dark:bg-[#110e0b] dark:shadow-black/25"
            style={cardStyle}
          >
            <View className="flex-row items-center justify-between">
              <Text className="text-[22px] font-sans font-semibold tracking-tight" style={primaryTextStyle}>
                Add Event
              </Text>
              <TouchableOpacity onPress={closeComposer} activeOpacity={0.86}>
                <Text className="font-sans text-[14px] font-semibold" style={tertiaryTextStyle}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              value={draftTitle}
              onChangeText={setDraftTitle}
              placeholder="Event title or occasion"
              placeholderTextColor={isDark ? '#bda98b' : '#8b7761'}
              className={`mt-4 rounded-[24px] border border-border-strong px-5 py-4 font-sans text-base text-text ${
                isDark ? 'bg-[#18120f]' : 'bg-surface'
              }`}
              style={surfaceStyle}
            />

            <TextInput
              value={draftNotes}
              onChangeText={setDraftNotes}
              placeholder="Notes for this day"
              placeholderTextColor={isDark ? '#bda98b' : '#8b7761'}
              multiline
              textAlignVertical="top"
              className={`mt-3 min-h-[116px] rounded-[24px] border border-border-strong px-5 py-4 font-sans text-base text-text ${
                isDark ? 'bg-[#18120f]' : 'bg-surface'
              }`}
              style={surfaceStyle}
            />

            <View className="mt-5">
              <Text className="text-[16px] font-sans font-semibold" style={primaryTextStyle}>
                Attach Outfit
              </Text>
              <Text className="mt-1 text-[14px] leading-6 font-sans" style={secondaryTextStyle}>
                Choose a saved look now, or leave the event open and attach one later.
              </Text>
            </View>

            {savedItems.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingTop: 14, paddingRight: 12 }}
              >
                <TouchableOpacity
                  onPress={() => setSelectedOutfitId(null)}
                  activeOpacity={0.88}
                  className={`mr-3 h-[154px] w-[116px] rounded-[24px] border p-3 ${
                    selectedOutfitId === null
                      ? 'border-primary bg-primary/10'
                      : `${isDark ? 'border-[#1e1812] bg-[#18120f]' : 'border-border-strong bg-surface'}`
                  }`}
                  style={selectedOutfitId === null ? undefined : subtleSurfaceStyle}
                >
                  <View className="flex-1 items-center justify-center rounded-[18px] border border-dashed border-border-strong bg-surface-muted">
                    <Text className="px-3 text-center text-[11px] font-sans font-semibold uppercase tracking-[0.16em]" style={weekdayLabelStyle}>
                      Leave Open
                    </Text>
                  </View>
                </TouchableOpacity>

                {savedItems.map((item) => {
                  const isSelected = selectedOutfitId === item.id;

                  return (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => setSelectedOutfitId(item.id)}
                      activeOpacity={0.88}
                      className={`mr-3 h-[154px] w-[116px] rounded-[24px] border p-3 ${
                        isSelected
                          ? 'border-primary bg-primary/10'
                          : `${isDark ? 'border-[#1e1812] bg-[#18120f]' : 'border-border-strong bg-surface'}`
                      }`}
                      style={isSelected ? undefined : subtleSurfaceStyle}
                    >
                      <Image
                        source={{ uri: item.imageUrl }}
                        className="h-[96px] w-full rounded-[18px]"
                        resizeMode="cover"
                      />
                      <Text
                        className="mt-3 text-[12px] font-sans font-semibold leading-4 text-text"
                        numberOfLines={2}
                      >
                        {item.title}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            ) : (
              <View className="mt-4 rounded-[24px] border border-dashed border-border-strong bg-surface p-5" style={surfaceStyle}>
                <Text className="text-[15px] font-sans font-semibold" style={primaryTextStyle}>
                  No saved outfits yet
                </Text>
                <Text className="mt-2 text-[14px] leading-6 font-sans" style={secondaryTextStyle}>
                  Save looks from Explore and they&apos;ll appear here for quick attachment. The event can still be saved without an outfit.
                </Text>
              </View>
            )}

            <TouchableOpacity
              onPress={handleSaveEvent}
              activeOpacity={0.88}
              className="mt-6 rounded-[22px] border border-primary bg-primary py-4 shadow-sm shadow-primary/20"
            >
              <Text className="text-center font-sans text-[15px] font-semibold tracking-[0.06em] text-primary-foreground">
                Save Event
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {upcomingEvents.length > 0 ? (
          <View className="mt-6">
            <Text className="px-1 text-[21px] font-sans font-semibold tracking-tight" style={primaryTextStyle}>
              Coming Up
            </Text>

            {upcomingEvents.map((event) => (
              <View
                key={`upcoming-${event.id}`}
                className="mt-3 rounded-[26px] border border-border-strong bg-surface-elevated px-4 py-4 shadow-sm shadow-black/5 dark:bg-[#110e0b] dark:shadow-black/25"
                style={cardStyle}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 pr-4">
                    <Text className="text-[17px] font-sans font-semibold tracking-tight" style={primaryTextStyle}>
                      {event.title}
                    </Text>
                    <Text className="mt-1 text-[13px] font-sans" style={secondaryTextStyle}>
                      {formatEventDate(event.dateKey)}
                    </Text>
                  </View>

                  {event.outfitImageUrl ? (
                    <Image
                      source={{ uri: event.outfitImageUrl }}
                      className="h-[56px] w-[56px] rounded-[16px]"
                      resizeMode="cover"
                    />
                  ) : (
                    <View className="h-[56px] w-[56px] rounded-[16px] border border-dashed border-border-strong bg-surface" style={surfaceStyle} />
                  )}
                </View>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

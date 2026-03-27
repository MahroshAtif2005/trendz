import { View, Text, ScrollView, SafeAreaView, Platform, StatusBar, Image, TouchableOpacity } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Link } from 'expo-router';
import { useApp } from '@/context/AppContext';

export default function Profile() {
  const { activeTheme, savedItems, userProfile } = useApp();
  const isDark = activeTheme === 'dark';
  const primaryTextStyle = { color: isDark ? '#f6ead8' : '#34281c' };
  const secondaryTextStyle = { color: isDark ? '#dfccb0' : '#6f5b46' };
  const mutedTextStyle = { color: isDark ? '#c8b597' : '#8b7761' };
  const eyebrowTextStyle = { color: isDark ? '#d8bb84' : '#b98c49' };
  const cardStyle = isDark ? { backgroundColor: '#120f0c', borderColor: '#403022' } : undefined;
  const elevatedSurfaceStyle = isDark ? { backgroundColor: '#171310', borderColor: '#4a3828' } : undefined;
  const mutedSurfaceStyle = isDark ? { backgroundColor: '#1d1713', borderColor: '#4b3827' } : undefined;
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
            value="12"
            label="Outfits Rated"
            valueColor={isDark ? '#d8bb84' : '#b98c49'}
            cardStyle={cardStyle}
            labelStyle={mutedTextStyle}
          />
          <StatCard
            value={String(savedItems.length || 45)}
            label="Saved Items"
            valueColor={isDark ? '#f4e7d3' : '#34281c'}
            cardStyle={cardStyle}
            labelStyle={mutedTextStyle}
          />
          <StatCard
            value="8.5"
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
          <View className="rounded-[28px] border border-border-strong overflow-hidden shadow-sm shadow-black/5 dark:shadow-black/25" style={cardStyle}>
            <MenuItem
              icon="bookmark.fill"
              label="Saved Looks"
              detail={`${savedItems.length || 45} looks`}
              href="/(tabs)/saved"
              hideBorder
              surfaceStyle={mutedSurfaceStyle}
              primaryTextStyle={primaryTextStyle}
              secondaryTextStyle={secondaryTextStyle}
              iconColor={isDark ? '#d8bb84' : '#b98c49'}
              chevronColor={isDark ? '#cbb89c' : '#9a856e'}
            />
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

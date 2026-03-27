import { View, Text, ScrollView, SafeAreaView, Platform, StatusBar, TouchableOpacity, Switch } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { router } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';

export default function Settings() {
  const { themeMode, setThemeMode, activeTheme } = useApp();
  const isDark = activeTheme === 'dark';
  const primaryTextStyle = { color: isDark ? '#f6ead8' : '#34281c' };
  const secondaryTextStyle = { color: isDark ? '#dfccb0' : '#6f5b46' };
  const mutedTextStyle = { color: isDark ? '#c8b597' : '#8b7761' };
  const eyebrowTextStyle = { color: isDark ? '#d8bb84' : '#b98c49' };
  const groupCardStyle = isDark ? { backgroundColor: '#120f0c', borderColor: '#403022' } : undefined;
  const iconBadgeStyle = isDark ? { backgroundColor: '#1d1713', borderColor: '#4b3827' } : undefined;
  const backButtonStyle = isDark ? { backgroundColor: '#171310', borderColor: '#4a3828' } : undefined;
  const signOutStyle = isDark ? { backgroundColor: '#17110e', borderColor: '#5e342d' } : undefined;
  const switchProps = {
    trackColor: { false: isDark ? '#3c2d22' : '#ddd3c8', true: '#c7a45e' },
    thumbColor: isDark ? '#f5ead9' : '#fffaf2',
    ios_backgroundColor: isDark ? '#2d2119' : '#ddd3c8',
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      router.replace('/(auth)/welcome');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" style={{ paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
      <View className="px-4 pt-4 pb-2">
        <View className="relative rounded-[30px] border border-border-strong px-5 pt-5 pb-5 shadow-sm shadow-black/10 dark:shadow-black/30" style={groupCardStyle}>
          <View className="absolute right-4 top-4 h-20 w-20 rounded-full bg-primary/10" />
          <View className="flex-row items-start">
            <TouchableOpacity
              className="mr-4 h-11 w-11 items-center justify-center rounded-full border border-border-strong bg-surface-elevated shadow-sm shadow-black/5 dark:shadow-black/25"
              style={backButtonStyle}
              onPress={() => router.back()}
            >
              <Text className="text-xl mb-1 ml-0.5" style={primaryTextStyle}>‹</Text>
            </TouchableOpacity>

            <View className="flex-1 pr-2">
              <Text className="mb-3 text-[11px] font-sans font-semibold uppercase tracking-[0.32em]" style={eyebrowTextStyle}>
                Control Center
              </Text>
              <Text className="text-[38px] leading-[40px] font-sans font-semibold tracking-tight" style={primaryTextStyle}>
                Settings
              </Text>
              <Text className="mt-3 text-[15px] leading-6 font-sans" style={secondaryTextStyle}>
                Refine your account, appearance, and app preferences without losing the Trendz feel.
              </Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60, paddingTop: 10 }} showsVerticalScrollIndicator={false}>
        
        <SettingsGroup title="Account" titleStyle={eyebrowTextStyle} cardStyle={groupCardStyle}>
          <SettingsRow icon="person.fill" label="Edit Profile" onPress={() => router.push('/edit-profile')} primaryTextStyle={primaryTextStyle} secondaryTextStyle={secondaryTextStyle} mutedTextStyle={mutedTextStyle} iconBadgeStyle={iconBadgeStyle} chevronColor={isDark ? '#cbb89c' : '#9a856e'} iconColor={isDark ? '#d8bb84' : '#b98c49'} />
          <SettingsRow icon="lock.fill" label="Change Password" primaryTextStyle={primaryTextStyle} secondaryTextStyle={secondaryTextStyle} mutedTextStyle={mutedTextStyle} iconBadgeStyle={iconBadgeStyle} chevronColor={isDark ? '#cbb89c' : '#9a856e'} iconColor={isDark ? '#d2be9f' : '#8b7761'} />
          <SettingsRow icon="envelope.fill" label="Email Preferences" isLast primaryTextStyle={primaryTextStyle} secondaryTextStyle={secondaryTextStyle} mutedTextStyle={mutedTextStyle} iconBadgeStyle={iconBadgeStyle} chevronColor={isDark ? '#cbb89c' : '#9a856e'} iconColor={isDark ? '#d2be9f' : '#8b7761'} />
        </SettingsGroup>

        <SettingsGroup title="Appearance" titleStyle={eyebrowTextStyle} cardStyle={groupCardStyle}>
          <SettingsRow 
            icon="sun.max.fill" 
            label="Light Mode" 
            onPress={() => setThemeMode('light')}
            isSelected={themeMode === 'light'}
            rightElement={
              <SelectionIndicator isSelected={themeMode === 'light'} />
            }
            primaryTextStyle={primaryTextStyle}
            secondaryTextStyle={secondaryTextStyle}
            mutedTextStyle={mutedTextStyle}
            iconBadgeStyle={iconBadgeStyle}
            chevronColor={isDark ? '#cbb89c' : '#9a856e'}
            iconColor={isDark ? '#d8bb84' : '#b98c49'}
          />
          <SettingsRow 
            icon="moon.fill" 
            label="Dark Mode" 
            onPress={() => setThemeMode('dark')}
            isSelected={themeMode === 'dark'}
            rightElement={
              <SelectionIndicator isSelected={themeMode === 'dark'} />
            }
            primaryTextStyle={primaryTextStyle}
            secondaryTextStyle={secondaryTextStyle}
            mutedTextStyle={mutedTextStyle}
            iconBadgeStyle={iconBadgeStyle}
            chevronColor={isDark ? '#cbb89c' : '#9a856e'}
            iconColor={isDark ? '#d8bb84' : '#b98c49'}
          />
          <SettingsRow 
            icon="iphone" 
            label="System Default" 
            onPress={() => setThemeMode('system')}
            isSelected={themeMode === 'system'}
            rightElement={
              <SelectionIndicator isSelected={themeMode === 'system'} />
            }
            primaryTextStyle={primaryTextStyle}
            secondaryTextStyle={secondaryTextStyle}
            mutedTextStyle={mutedTextStyle}
            iconBadgeStyle={iconBadgeStyle}
            chevronColor={isDark ? '#cbb89c' : '#9a856e'}
            iconColor={isDark ? '#d8bb84' : '#b98c49'}
            isLast 
          />
        </SettingsGroup>

        <SettingsGroup title="Notifications" titleStyle={eyebrowTextStyle} cardStyle={groupCardStyle}>
          <SettingsRow icon="bell.fill" label="Push Notifications" rightElement={<Switch value={true} {...switchProps} />} primaryTextStyle={primaryTextStyle} secondaryTextStyle={secondaryTextStyle} mutedTextStyle={mutedTextStyle} iconBadgeStyle={iconBadgeStyle} chevronColor={isDark ? '#cbb89c' : '#9a856e'} iconColor={isDark ? '#d8bb84' : '#b98c49'} />
          <SettingsRow icon="sparkles" label="AI Result Alerts" rightElement={<Switch value={true} {...switchProps} />} primaryTextStyle={primaryTextStyle} secondaryTextStyle={secondaryTextStyle} mutedTextStyle={mutedTextStyle} iconBadgeStyle={iconBadgeStyle} chevronColor={isDark ? '#cbb89c' : '#9a856e'} iconColor={isDark ? '#d8bb84' : '#b98c49'} />
          <SettingsRow icon="bookmark.fill" label="Saved Reminders" rightElement={<Switch value={false} {...switchProps} />} isLast primaryTextStyle={primaryTextStyle} secondaryTextStyle={secondaryTextStyle} mutedTextStyle={mutedTextStyle} iconBadgeStyle={iconBadgeStyle} chevronColor={isDark ? '#cbb89c' : '#9a856e'} iconColor={isDark ? '#d8bb84' : '#b98c49'} />
        </SettingsGroup>

        <SettingsGroup title="Privacy" titleStyle={eyebrowTextStyle} cardStyle={groupCardStyle}>
          <SettingsRow icon="shield.fill" label="Manage Uploads" primaryTextStyle={primaryTextStyle} secondaryTextStyle={secondaryTextStyle} mutedTextStyle={mutedTextStyle} iconBadgeStyle={iconBadgeStyle} chevronColor={isDark ? '#cbb89c' : '#9a856e'} iconColor={isDark ? '#d8bb84' : '#b98c49'} />
          <SettingsRow icon="hand.raised.fill" label="Permissions" primaryTextStyle={primaryTextStyle} secondaryTextStyle={secondaryTextStyle} mutedTextStyle={mutedTextStyle} iconBadgeStyle={iconBadgeStyle} chevronColor={isDark ? '#cbb89c' : '#9a856e'} iconColor={isDark ? '#d8bb84' : '#b98c49'} />
          <SettingsRow icon="trash.fill" label="Delete Account" textClass="text-red-500" isLast primaryTextStyle={primaryTextStyle} secondaryTextStyle={secondaryTextStyle} mutedTextStyle={mutedTextStyle} iconBadgeStyle={iconBadgeStyle} chevronColor={isDark ? '#cbb89c' : '#9a856e'} iconColor="#ff9a8f" />
        </SettingsGroup>

        <SettingsGroup title="Support" titleStyle={eyebrowTextStyle} cardStyle={groupCardStyle}>
          <SettingsRow icon="questionmark.circle.fill" label="Help Center" primaryTextStyle={primaryTextStyle} secondaryTextStyle={secondaryTextStyle} mutedTextStyle={mutedTextStyle} iconBadgeStyle={iconBadgeStyle} chevronColor={isDark ? '#cbb89c' : '#9a856e'} iconColor={isDark ? '#d8bb84' : '#b98c49'} />
          <SettingsRow icon="envelope.fill" label="Contact Us" primaryTextStyle={primaryTextStyle} secondaryTextStyle={secondaryTextStyle} mutedTextStyle={mutedTextStyle} iconBadgeStyle={iconBadgeStyle} chevronColor={isDark ? '#cbb89c' : '#9a856e'} iconColor={isDark ? '#d8bb84' : '#b98c49'} />
          <SettingsRow icon="info.circle.fill" label="About Trendz" isLast primaryTextStyle={primaryTextStyle} secondaryTextStyle={secondaryTextStyle} mutedTextStyle={mutedTextStyle} iconBadgeStyle={iconBadgeStyle} chevronColor={isDark ? '#cbb89c' : '#9a856e'} iconColor={isDark ? '#d8bb84' : '#b98c49'} />
        </SettingsGroup>

        <TouchableOpacity onPress={handleLogout} className="w-full bg-surface-elevated border border-red-200 dark:border-red-950 rounded-[22px] py-4 items-center justify-center mt-6 mb-8 shadow-sm shadow-black/5 dark:shadow-black/25" style={signOutStyle}>
          <Text className="text-red-500 font-sans font-semibold text-lg tracking-wide">Sign Out</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

function SelectionIndicator({ isSelected }: { isSelected: boolean }) {
  return (
    <View className={`h-6 w-6 rounded-full border items-center justify-center ${isSelected ? 'border-primary bg-primary/15' : 'border-border-strong bg-surface-muted'}`}>
      {isSelected ? <View className="h-2.5 w-2.5 rounded-full bg-primary" /> : null}
    </View>
  );
}

function SettingsGroup({
  title,
  children,
  titleStyle,
  cardStyle,
}: {
  title: string,
  children: React.ReactNode,
  titleStyle: object,
  cardStyle?: object,
}) {
  return (
    <View className="mb-7 px-1">
      <Text className="mb-3 ml-1 font-sans font-semibold text-[11px] uppercase tracking-[0.28em]" style={titleStyle}>{title}</Text>
      <View className="bg-surface-elevated border border-border-strong rounded-[28px] overflow-hidden shadow-sm shadow-black/5 dark:shadow-black/25" style={cardStyle}>
        {children}
      </View>
    </View>
  );
}

function SettingsRow({
  icon,
  label,
  onPress,
  rightElement,
  isLast = false,
  textClass = "text-text",
  isSelected = false,
  primaryTextStyle,
  secondaryTextStyle,
  mutedTextStyle,
  iconBadgeStyle,
  chevronColor,
  iconColor,
}: any) {
  return (
    <TouchableOpacity 
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.86}
      className={`flex-row items-center justify-between px-5 py-4 ${!isLast ? 'border-b border-border' : ''} ${isSelected ? 'bg-primary/5' : ''}`}
    >
      <View className="flex-row items-center">
        <View className="w-10 h-10 rounded-full bg-surface-muted border border-border-strong items-center justify-center mr-4" style={iconBadgeStyle}>
          <IconSymbol name={icon} size={16} color={iconColor} />
        </View>
        <View>
          <Text className={`font-sans text-[16px] font-semibold tracking-tight ${textClass}`} style={textClass === 'text-red-500' ? undefined : primaryTextStyle}>{label}</Text>
          {isSelected ? (
            <Text className="mt-1 font-sans text-[12px]" style={secondaryTextStyle}>
              Currently active
            </Text>
          ) : null}
        </View>
      </View>
      {rightElement || <IconSymbol name="chevron.right" size={15} color={chevronColor} />}
    </TouchableOpacity>
  );
}

import { ComponentProps, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { useApp } from '@/context/AppContext';

function normalizeUsername(value: string) {
  return value.trim().replace(/^@+/, '').replace(/\s+/g, '').toLowerCase();
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function EditProfile() {
  const { activeTheme, session, userProfile, updateUserProfile } = useApp();
  const [fullName, setFullName] = useState(userProfile.fullName);
  const [username, setUsername] = useState(userProfile.username);
  const [email, setEmail] = useState(userProfile.email);
  const [bio, setBio] = useState(userProfile.bio);
  const [avatarUri, setAvatarUri] = useState<string | null>(userProfile.avatarUri);
  const [isPhotoPickerVisible, setIsPhotoPickerVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const isDark = activeTheme === 'dark';
  const emailIsEditable = !session?.user?.email;

  useEffect(() => {
    setFullName(userProfile.fullName);
    setUsername(userProfile.username);
    setEmail(userProfile.email);
    setBio(userProfile.bio);
    setAvatarUri(userProfile.avatarUri);
  }, [userProfile]);

  const pageBackgroundStyle = { backgroundColor: isDark ? '#050505' : '#fcfaf6' };
  const heroStyle = {
    backgroundColor: isDark ? '#120f0c' : '#f6efe5',
    borderColor: isDark ? '#413123' : '#ddceb8',
  };
  const cardStyle = {
    backgroundColor: isDark ? '#15110e' : '#fbf6ef',
    borderColor: isDark ? '#4a3828' : '#e2d5c3',
  };
  const inputStyle = {
    backgroundColor: isDark ? '#1a1511' : '#fffdfa',
    borderColor: isDark ? '#4d3928' : '#ddcfbc',
  };
  const readOnlyInputStyle = {
    backgroundColor: isDark ? '#120f0c' : '#f4ede4',
    borderColor: isDark ? '#3d2d20' : '#dccbb3',
  };
  const primaryTextStyle = { color: isDark ? '#f6ead8' : '#34281c' };
  const secondaryTextStyle = { color: isDark ? '#dfccb0' : '#6f5b46' };
  const eyebrowTextStyle = { color: isDark ? '#d8bb84' : '#b98c49' };
  const placeholderTextColor = isDark ? '#bca78a' : '#8b7761';
  const initials = useMemo(
    () =>
      (fullName || userProfile.fullName)
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'T',
    [fullName, userProfile.fullName]
  );
  const normalizedUsername = normalizeUsername(username);
  const hasChanges =
    fullName.trim() !== userProfile.fullName ||
    normalizedUsername !== userProfile.username ||
    bio.trim() !== userProfile.bio ||
    avatarUri !== userProfile.avatarUri ||
    (emailIsEditable && email.trim().toLowerCase() !== userProfile.email.toLowerCase());

  const handleImageResult = async (resultPromise: Promise<ImagePicker.ImagePickerResult>) => {
    try {
      const result = await resultPromise;
      const asset = result.canceled ? null : result.assets[0];

      if (asset?.uri) {
        setAvatarUri(asset.uri);
        setFormError(null);
      }
    } catch (error) {
      console.warn('Error choosing profile image:', error);
      Alert.alert('Unable to update photo', 'Please try again.');
    } finally {
      setIsPhotoPickerVisible(false);
    }
  };

  const openCamera = async () => {
    setIsPhotoPickerVisible(false);
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Camera access needed', 'Allow camera access to take a new profile photo.');
      return;
    }

    await handleImageResult(
      ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
        cameraType: ImagePicker.CameraType.front,
      })
    );
  };

  const openGallery = async () => {
    setIsPhotoPickerVisible(false);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Photo access needed', 'Allow photo library access to choose a profile image.');
      return;
    }

    await handleImageResult(
      ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      })
    );
  };

  const handleSave = async () => {
    const trimmedFullName = fullName.trim();
    const trimmedBio = bio.trim();
    const sanitizedEmail = email.trim().toLowerCase();

    if (!trimmedFullName) {
      setFormError('Add your full name so your profile feels complete.');
      return;
    }

    if (!normalizedUsername) {
      setFormError('Choose a username to personalize your profile.');
      return;
    }

    if (emailIsEditable && !isValidEmail(sanitizedEmail)) {
      setFormError('Enter a valid email address.');
      return;
    }

    setIsSaving(true);
    setFormError(null);

    updateUserProfile({
      fullName: trimmedFullName,
      username: normalizedUsername,
      bio: trimmedBio,
      avatarUri,
      ...(emailIsEditable ? { email: sanitizedEmail } : {}),
    });

    setIsSaving(false);
    router.back();
  };

  return (
    <SafeAreaView
      className="flex-1 bg-background"
      style={[
        pageBackgroundStyle,
        { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
      ]}
    >
      <View className="flex-1">
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120, paddingTop: 12 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="pb-4">
            <View className="flex-row items-center justify-between">
              <TouchableOpacity
                activeOpacity={0.86}
                className="flex-row items-center rounded-full border border-border-strong px-4 py-3 bg-surface-elevated"
                style={cardStyle}
                onPress={() => router.back()}
              >
                <MaterialCommunityIcons name="arrow-left" size={18} color={isDark ? '#e4d3b6' : '#6f5b46'} />
                <Text className="ml-2 font-sans text-[14px] font-semibold tracking-[0.08em]" style={primaryTextStyle}>
                  Back
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.86}
                disabled={!hasChanges || isSaving}
                className={`rounded-full border px-5 py-3 ${!hasChanges || isSaving ? 'opacity-60' : ''}`}
                style={hasChanges ? { backgroundColor: '#d7bb85', borderColor: '#d7bb85' } : cardStyle}
                onPress={handleSave}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#1a130d" />
                ) : (
                  <Text
                    className="font-sans text-[14px] font-semibold tracking-[0.08em]"
                    style={{ color: hasChanges ? '#1a130d' : isDark ? '#e4d3b6' : '#6f5b46' }}
                  >
                    Save
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View
            className="rounded-[30px] border border-border-strong px-6 pb-6 pt-6 shadow-sm shadow-black/10 dark:shadow-black/30"
            style={heroStyle}
          >
            <View className="absolute -right-5 -top-3 h-24 w-24 rounded-full bg-primary/10" />

            <Text className="text-[11px] font-sans font-semibold uppercase tracking-[0.3em]" style={eyebrowTextStyle}>
              Edit Your Identity
            </Text>
            <Text className="mt-3 text-[34px] font-sans font-semibold tracking-tight" style={primaryTextStyle}>
              Edit Profile
            </Text>
            <Text className="mt-3 text-[15px] leading-6 font-sans" style={secondaryTextStyle}>
              Update the details that appear across Trendz and keep your profile looking polished.
            </Text>

            <View className="mt-7 items-center">
              <TouchableOpacity activeOpacity={0.9} className="items-center" onPress={() => setIsPhotoPickerVisible(true)}>
                <View className="relative">
                  <View className="absolute -inset-1 rounded-full border border-primary/20" />
                  {avatarUri ? (
                    <Image
                      source={{ uri: avatarUri }}
                      className="h-32 w-32 rounded-full border-4 border-surface-elevated"
                      style={{ backgroundColor: isDark ? '#15110e' : '#f8f2e8' }}
                    />
                  ) : (
                    <View
                      className="h-32 w-32 items-center justify-center rounded-full border-4 border-surface-elevated"
                      style={cardStyle}
                    >
                      <Text className="text-[36px] font-sans font-semibold tracking-[0.08em]" style={primaryTextStyle}>
                        {initials}
                      </Text>
                    </View>
                  )}

                  <View className="absolute bottom-1 right-1 h-11 w-11 items-center justify-center rounded-full border-4 border-background bg-primary">
                    <MaterialCommunityIcons name="camera-outline" size={19} color="#1a130d" />
                  </View>
                </View>

                <Text className="mt-4 text-[13px] font-sans font-semibold uppercase tracking-[0.18em]" style={eyebrowTextStyle}>
                  Change Photo
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {formError ? (
            <View className="mt-5 rounded-[22px] border border-[#7a433d] bg-[#251311] px-4 py-4">
              <Text className="font-sans text-[14px] leading-6 text-[#ffb6aa]">{formError}</Text>
            </View>
          ) : null}

          <View
            className="mt-6 rounded-[30px] border border-border-strong px-5 pb-6 pt-5 shadow-sm shadow-black/5 dark:shadow-black/25"
            style={cardStyle}
          >
            <Text className="text-[11px] font-sans font-semibold uppercase tracking-[0.3em]" style={eyebrowTextStyle}>
              Personal Details
            </Text>

            <ProfileField
              label="Full Name"
              value={fullName}
              onChangeText={setFullName}
              placeholder="Enter your full name"
              placeholderTextColor={placeholderTextColor}
              primaryTextStyle={primaryTextStyle}
              secondaryTextStyle={secondaryTextStyle}
              inputStyle={inputStyle}
            />

            <ProfileField
              label="Username"
              value={username}
              onChangeText={(value) => setUsername(value.replace(/^@+/, ''))}
              placeholder="@trendzuser"
              autoCapitalize="none"
              autoCorrect={false}
              placeholderTextColor={placeholderTextColor}
              primaryTextStyle={primaryTextStyle}
              secondaryTextStyle={secondaryTextStyle}
              inputStyle={inputStyle}
              prefix="@"
            />

            <ProfileField
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="Email address"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              editable={emailIsEditable}
              placeholderTextColor={placeholderTextColor}
              primaryTextStyle={primaryTextStyle}
              secondaryTextStyle={secondaryTextStyle}
              inputStyle={emailIsEditable ? inputStyle : readOnlyInputStyle}
              helperText={emailIsEditable ? undefined : 'Your sign-in email is managed through your account auth.'}
            />

            <ProfileField
              label="Bio"
              value={bio}
              onChangeText={setBio}
              placeholder="A short line about your style."
              placeholderTextColor={placeholderTextColor}
              primaryTextStyle={primaryTextStyle}
              secondaryTextStyle={secondaryTextStyle}
              inputStyle={inputStyle}
              multiline
            />
          </View>

          <TouchableOpacity
            activeOpacity={0.9}
            disabled={!hasChanges || isSaving}
            className={`mt-6 rounded-[22px] px-6 py-4 shadow-sm shadow-black/5 dark:shadow-black/25 ${!hasChanges || isSaving ? 'opacity-60' : ''}`}
            style={{ backgroundColor: '#d7bb85' }}
            onPress={handleSave}
          >
            <Text className="text-center font-sans text-[15px] font-semibold tracking-[0.08em]" style={{ color: '#1a130d' }}>
              {isSaving ? 'Saving Changes...' : 'Save Changes'}
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {isPhotoPickerVisible ? (
          <View className="absolute inset-0 justify-end">
            <Pressable className="absolute inset-0 bg-black/65" onPress={() => setIsPhotoPickerVisible(false)} />
            <View
              className="mx-4 mb-4 rounded-[28px] border border-border-strong px-5 pb-5 pt-5 shadow-lg shadow-black/30"
              style={heroStyle}
            >
              <Text className="text-[22px] font-sans font-semibold tracking-tight" style={primaryTextStyle}>
                Update profile photo
              </Text>
              <Text className="mt-2 text-[14px] leading-6 font-sans" style={secondaryTextStyle}>
                Choose a clean portrait or outfit-led image that fits your Trendz profile.
              </Text>

              <PhotoActionRow
                icon="camera-outline"
                label="Take Photo"
                iconTint={isDark ? '#e4c98f' : '#b98c49'}
                iconSurface={isDark ? '#241b12' : '#f6eddf'}
                surfaceStyle={cardStyle}
                textStyle={primaryTextStyle}
                onPress={openCamera}
              />
              <PhotoActionRow
                icon="image-outline"
                label="Choose from Gallery"
                iconTint={isDark ? '#d8c3a4' : '#8b7761'}
                iconSurface={isDark ? '#1e1814' : '#efe5da'}
                surfaceStyle={cardStyle}
                textStyle={primaryTextStyle}
                onPress={openGallery}
              />
            </View>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

function ProfileField({
  label,
  helperText,
  inputStyle,
  primaryTextStyle,
  secondaryTextStyle,
  prefix,
  multiline = false,
  ...inputProps
}: {
  label: string;
  helperText?: string;
  inputStyle?: object;
  primaryTextStyle: object;
  secondaryTextStyle: object;
  prefix?: string;
  multiline?: boolean;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  placeholderTextColor: string;
  editable?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  keyboardType?: 'default' | 'email-address';
}) {
  return (
    <View className="mt-5">
      <Text className="mb-2 ml-1 text-[12px] font-sans font-semibold uppercase tracking-[0.16em]" style={secondaryTextStyle}>
        {label}
      </Text>

      <View
        className={`flex-row rounded-[22px] border border-border-strong px-5 ${multiline ? 'items-start py-4' : 'items-center py-1'}`}
        style={inputStyle}
      >
        {prefix ? (
          <View className="mr-2 mt-3">
            <Text className="font-sans text-[16px] font-semibold" style={secondaryTextStyle}>
              {prefix}
            </Text>
          </View>
        ) : null}

        <TextInput
          className={`font-sans text-[16px] ${multiline ? 'min-h-[110px] py-0' : 'h-14 flex-1'} ${prefix ? '' : 'px-0'}`}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          style={[primaryTextStyle, prefix ? { flex: 1 } : null, !prefix && !multiline ? { width: '100%' } : null]}
          {...inputProps}
        />
      </View>

      {helperText ? (
        <Text className="mt-2 ml-1 text-[13px] leading-5 font-sans" style={secondaryTextStyle}>
          {helperText}
        </Text>
      ) : null}
    </View>
  );
}

function PhotoActionRow({
  icon,
  label,
  iconTint,
  iconSurface,
  surfaceStyle,
  textStyle,
  onPress,
}: {
  icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
  label: string;
  iconTint: string;
  iconSurface: string;
  surfaceStyle?: object;
  textStyle: object;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.88}
      className="mt-4 flex-row items-center rounded-[22px] border border-border-strong px-4 py-4"
      style={surfaceStyle}
      onPress={onPress}
    >
      <View className="mr-4 h-12 w-12 items-center justify-center rounded-full border border-border-strong" style={{ backgroundColor: iconSurface }}>
        <MaterialCommunityIcons name={icon} size={22} color={iconTint} />
      </View>
      <Text className="font-sans text-[16px] font-semibold tracking-tight" style={textStyle}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

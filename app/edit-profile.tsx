import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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

type EditProfileFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  placeholderTextColor: string;
  primaryTextStyle: { color: string };
  secondaryTextStyle: { color: string };
  inputSurfaceStyle: {
    backgroundColor: string;
    borderColor: string;
  };
  helperText?: string;
  prefix?: string;
  editable?: boolean;
  multiline?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  keyboardType?: 'default' | 'email-address';
};

function EditProfileField({
  label,
  value,
  onChangeText,
  placeholder,
  placeholderTextColor,
  primaryTextStyle,
  secondaryTextStyle,
  inputSurfaceStyle,
  helperText,
  prefix,
  editable = true,
  multiline = false,
  autoCapitalize = 'sentences',
  autoCorrect = true,
  keyboardType = 'default',
}: EditProfileFieldProps) {
  return (
    <View style={{ marginTop: 20 }}>
      <Text
        style={[
          secondaryTextStyle,
          {
            marginBottom: 8,
            marginLeft: 4,
            fontSize: 12,
            fontWeight: '700',
            letterSpacing: 1.4,
            textTransform: 'uppercase',
          },
        ]}>
        {label}
      </Text>

      <View
        style={[
          inputSurfaceStyle,
          {
            flexDirection: 'row',
            alignItems: multiline ? 'flex-start' : 'center',
            borderWidth: 1,
            borderRadius: 22,
            paddingHorizontal: 18,
            paddingVertical: multiline ? 16 : 0,
            minHeight: multiline ? 120 : 58,
            opacity: editable ? 1 : 0.82,
          },
        ]}>
        {prefix ? (
          <Text
            style={[
              secondaryTextStyle,
              {
                marginRight: 8,
                marginTop: multiline ? 2 : 0,
                fontSize: 16,
                fontWeight: '700',
              },
            ]}>
            {prefix}
          </Text>
        ) : null}

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={placeholderTextColor}
          editable={editable}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          keyboardType={keyboardType}
          style={[
            primaryTextStyle,
            {
              flex: 1,
              fontSize: 16,
              minHeight: multiline ? 88 : 56,
              paddingVertical: multiline ? 0 : 0,
            },
          ]}
        />
      </View>

      {helperText ? (
        <Text
          style={[
            secondaryTextStyle,
            {
              marginTop: 8,
              marginLeft: 4,
              fontSize: 13,
              lineHeight: 20,
            },
          ]}>
          {helperText}
        </Text>
      ) : null}
    </View>
  );
}

export default function EditProfile() {
  const { activeTheme, session, userProfile, updateUserProfile } = useApp();
  const safeProfile = useMemo(
    () => ({
      fullName: userProfile?.fullName ?? '',
      username: userProfile?.username ?? '',
      email: userProfile?.email ?? '',
      bio: userProfile?.bio ?? '',
      avatarUri: userProfile?.avatarUri ?? null,
    }),
    [userProfile]
  );

  const [fullName, setFullName] = useState(safeProfile.fullName);
  const [username, setUsername] = useState(safeProfile.username);
  const [email, setEmail] = useState(safeProfile.email);
  const [bio, setBio] = useState(safeProfile.bio);
  const [avatarUri, setAvatarUri] = useState<string | null>(safeProfile.avatarUri);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setFullName(safeProfile.fullName);
    setUsername(safeProfile.username);
    setEmail(safeProfile.email);
    setBio(safeProfile.bio);
    setAvatarUri(safeProfile.avatarUri);
  }, [safeProfile]);

  const isDark = activeTheme === 'dark';
  const emailIsEditable = !session?.user?.email;
  const normalizedUsername = normalizeUsername(username);
  const initials = useMemo(() => {
    const source = (fullName || safeProfile.fullName || 'Trendz Member').trim();
    const letters = source
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');

    return letters.slice(0, 2) || 'T';
  }, [fullName, safeProfile.fullName]);

  const hasChanges =
    fullName.trim() !== safeProfile.fullName ||
    normalizedUsername !== safeProfile.username ||
    bio.trim() !== safeProfile.bio ||
    avatarUri !== safeProfile.avatarUri ||
    (emailIsEditable && email.trim().toLowerCase() !== safeProfile.email.toLowerCase());

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

  const handleChooseCamera = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        Alert.alert('Camera access needed', 'Allow camera access to take a new profile photo.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });

      const asset = result.canceled ? null : result.assets?.[0];

      if (asset?.uri) {
        setAvatarUri(asset.uri);
        setFormError(null);
      }
    } catch (error) {
      console.warn('Error capturing profile image:', error);
      Alert.alert('Unable to update photo', 'Please try again.');
    }
  };

  const handleChooseGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert('Photo access needed', 'Allow photo library access to choose a profile image.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });

      const asset = result.canceled ? null : result.assets?.[0];

      if (asset?.uri) {
        setAvatarUri(asset.uri);
        setFormError(null);
      }
    } catch (error) {
      console.warn('Error choosing profile image:', error);
      Alert.alert('Unable to update photo', 'Please try again.');
    }
  };

  const openPhotoOptions = () => {
    Alert.alert('Update profile photo', 'Choose where to pick your new profile image from.', [
      { text: 'Camera', onPress: () => void handleChooseCamera() },
      { text: 'Photo Library', onPress: () => void handleChooseGallery() },
      { text: 'Cancel', style: 'cancel' },
    ]);
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

    try {
      updateUserProfile({
        fullName: trimmedFullName,
        username: normalizedUsername,
        bio: trimmedBio,
        avatarUri,
        ...(emailIsEditable ? { email: sanitizedEmail } : {}),
      });

      router.back();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView
      style={[
        pageBackgroundStyle,
        {
          flex: 1,
          paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
        },
      ]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={{ paddingBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <TouchableOpacity
              activeOpacity={0.86}
              onPress={() => router.back()}
              style={[
                cardStyle,
                {
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderWidth: 1,
                  borderRadius: 999,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                },
              ]}>
              <MaterialCommunityIcons
                name="arrow-left"
                size={18}
                color={isDark ? '#e4d3b6' : '#6f5b46'}
              />
              <Text
                style={[
                  primaryTextStyle,
                  {
                    marginLeft: 8,
                    fontSize: 14,
                    fontWeight: '700',
                    letterSpacing: 1,
                  },
                ]}>
                Back
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.86}
              disabled={!hasChanges || isSaving}
              onPress={handleSave}
              style={[
                hasChanges
                  ? { backgroundColor: '#d7bb85', borderColor: '#d7bb85' }
                  : cardStyle,
                {
                  borderWidth: 1,
                  borderRadius: 999,
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                  opacity: !hasChanges || isSaving ? 0.6 : 1,
                },
              ]}>
              {isSaving ? (
                <ActivityIndicator size="small" color="#1a130d" />
              ) : (
                <Text
                  style={{
                    color: hasChanges ? '#1a130d' : isDark ? '#e4d3b6' : '#6f5b46',
                    fontSize: 14,
                    fontWeight: '700',
                    letterSpacing: 1,
                  }}>
                  Save
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View
          style={[
            heroStyle,
            {
              overflow: 'hidden',
              borderWidth: 1,
              borderRadius: 30,
              paddingHorizontal: 24,
              paddingTop: 24,
              paddingBottom: 24,
            },
          ]}>
          <View
            style={{
              position: 'absolute',
              right: -20,
              top: -10,
              height: 96,
              width: 96,
              borderRadius: 999,
              backgroundColor: 'rgba(212, 175, 106, 0.1)',
            }}
          />

          <Text
            style={[
              eyebrowTextStyle,
              { fontSize: 11, fontWeight: '700', letterSpacing: 3.2, textTransform: 'uppercase' },
            ]}>
            Edit Your Identity
          </Text>
          <Text
            style={[
              primaryTextStyle,
              { marginTop: 12, fontSize: 34, fontWeight: '700', letterSpacing: -0.6 },
            ]}>
            Edit Profile
          </Text>
          <Text
            style={[
              secondaryTextStyle,
              { marginTop: 12, fontSize: 15, lineHeight: 24 },
            ]}>
            Update the details that appear across Trendz and keep your profile looking polished.
          </Text>

          <View style={{ marginTop: 28, alignItems: 'center' }}>
            <TouchableOpacity activeOpacity={0.9} onPress={openPhotoOptions} style={{ alignItems: 'center' }}>
              <View style={{ position: 'relative' }}>
                <View
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    bottom: -4,
                    left: -4,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: 'rgba(212, 175, 106, 0.2)',
                  }}
                />

                {avatarUri ? (
                  <Image
                    source={{ uri: avatarUri }}
                    style={{
                      height: 128,
                      width: 128,
                      borderRadius: 999,
                      borderWidth: 4,
                      borderColor: isDark ? '#15110e' : '#fbf6ef',
                      backgroundColor: isDark ? '#15110e' : '#f8f2e8',
                    }}
                  />
                ) : (
                  <View
                    style={[
                      cardStyle,
                      {
                        height: 128,
                        width: 128,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 999,
                        borderWidth: 4,
                        borderColor: isDark ? '#15110e' : '#fbf6ef',
                      },
                    ]}>
                    <Text style={[primaryTextStyle, { fontSize: 36, fontWeight: '700', letterSpacing: 3 }]}>
                      {initials}
                    </Text>
                  </View>
                )}

                <View
                  style={{
                    position: 'absolute',
                    right: 4,
                    bottom: 4,
                    height: 42,
                    width: 42,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 999,
                    borderWidth: 3,
                    borderColor: isDark ? '#120f0c' : '#f6efe5',
                    backgroundColor: '#d7bb85',
                  }}>
                  <MaterialCommunityIcons name="camera-outline" size={18} color="#1a130d" />
                </View>
              </View>

              <Text
                style={[
                  eyebrowTextStyle,
                  {
                    marginTop: 16,
                    fontSize: 13,
                    fontWeight: '700',
                    letterSpacing: 2,
                    textTransform: 'uppercase',
                  },
                ]}>
                Change Photo
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {formError ? (
          <View
            style={{
              marginTop: 20,
              borderRadius: 22,
              borderWidth: 1,
              borderColor: '#7a433d',
              backgroundColor: '#251311',
              paddingHorizontal: 16,
              paddingVertical: 16,
            }}>
            <Text style={{ color: '#ffb6aa', fontSize: 14, lineHeight: 22 }}>{formError}</Text>
          </View>
        ) : null}

        <View
          style={[
            cardStyle,
            {
              marginTop: 24,
              borderWidth: 1,
              borderRadius: 30,
              paddingHorizontal: 20,
              paddingTop: 20,
              paddingBottom: 24,
            },
          ]}>
          <Text
            style={[
              eyebrowTextStyle,
              { fontSize: 11, fontWeight: '700', letterSpacing: 3.2, textTransform: 'uppercase' },
            ]}>
            Personal Details
          </Text>

          <EditProfileField
            label="Full Name"
            value={fullName}
            onChangeText={setFullName}
            placeholder="Enter your full name"
            placeholderTextColor={placeholderTextColor}
            primaryTextStyle={primaryTextStyle}
            secondaryTextStyle={secondaryTextStyle}
            inputSurfaceStyle={inputStyle}
          />

          <EditProfileField
            label="Username"
            value={username}
            onChangeText={(value) => setUsername(value.replace(/^@+/, ''))}
            placeholder="trendzuser"
            placeholderTextColor={placeholderTextColor}
            primaryTextStyle={primaryTextStyle}
            secondaryTextStyle={secondaryTextStyle}
            inputSurfaceStyle={inputStyle}
            prefix="@"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <EditProfileField
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="Email address"
            placeholderTextColor={placeholderTextColor}
            primaryTextStyle={primaryTextStyle}
            secondaryTextStyle={secondaryTextStyle}
            inputSurfaceStyle={emailIsEditable ? inputStyle : readOnlyInputStyle}
            editable={emailIsEditable}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            helperText={
              emailIsEditable
                ? undefined
                : 'Your sign-in email is managed through your account auth.'
            }
          />

          <EditProfileField
            label="Bio"
            value={bio}
            onChangeText={setBio}
            placeholder="A short line about your style."
            placeholderTextColor={placeholderTextColor}
            primaryTextStyle={primaryTextStyle}
            secondaryTextStyle={secondaryTextStyle}
            inputSurfaceStyle={inputStyle}
            multiline
          />
        </View>

        <TouchableOpacity
          activeOpacity={0.9}
          disabled={!hasChanges || isSaving}
          onPress={handleSave}
          style={{
            marginTop: 24,
            borderRadius: 22,
            backgroundColor: '#d7bb85',
            paddingHorizontal: 24,
            paddingVertical: 16,
            opacity: !hasChanges || isSaving ? 0.6 : 1,
          }}>
          <Text
            style={{
              textAlign: 'center',
              color: '#1a130d',
              fontSize: 15,
              fontWeight: '700',
              letterSpacing: 1,
            }}>
            {isSaving ? 'Saving Changes...' : 'Save Changes'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

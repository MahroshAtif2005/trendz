import { type ComponentProps, useContext, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
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
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';

import { AppContext } from '@/context/AppContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  buildOutfitReviewCacheKey,
  buildOutfitReviewOwnerKey,
  createOutfitImageFingerprint,
} from '@/lib/outfit-review-cache';
import {
  analyzeOutfitImage,
  getOutfitReviewConfigErrorMessage,
  getOutfitReviewTransportMode,
} from '@/lib/outfit-review';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

type ThemeName = 'light' | 'dark';
type OccasionIconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

type OccasionOption = {
  id: string;
  icon: OccasionIconName;
  iconColors: Record<ThemeName, string>;
  badgeColors: Record<ThemeName, string>;
  shortLabel?: string;
};

const OCCASIONS: readonly OccasionOption[] = [
  {
    id: 'Date',
    icon: 'heart-outline',
    iconColors: { light: '#b65d6a', dark: '#d28f97' },
    badgeColors: { light: '#f3dede', dark: '#221214' },
  },
  {
    id: 'Dinner',
    icon: 'silverware-fork-knife',
    iconColors: { light: '#b88d4c', dark: '#d8b06e' },
    badgeColors: { light: '#f3e6d4', dark: '#24180f' },
  },
  {
    id: 'Wedding',
    icon: 'ring',
    iconColors: { light: '#b89358', dark: '#e0c38d' },
    badgeColors: { light: '#f4ead9', dark: '#23180f' },
  },
  {
    id: 'Casual',
    icon: 'coffee-outline',
    iconColors: { light: '#967960', dark: '#c1a78d' },
    badgeColors: { light: '#f1e7de', dark: '#1d1713' },
  },
  {
    id: 'Office',
    icon: 'briefcase-outline',
    iconColors: { light: '#6d7c92', dark: '#97a2b2' },
    badgeColors: { light: '#e8edf2', dark: '#15181d' },
  },
  {
    id: 'More',
    icon: 'plus',
    iconColors: { light: '#b88d4c', dark: '#d4af6a' },
    badgeColors: { light: '#f3e6d4', dark: '#21170e' },
  },
];

const EXTRA_OCCASIONS: readonly OccasionOption[] = [
  {
    id: 'Brunch',
    icon: 'coffee-outline',
    iconColors: { light: '#a07a4a', dark: '#d1b082' },
    badgeColors: { light: '#f2e7d9', dark: '#21170f' },
  },
  {
    id: 'Eid',
    icon: 'star-crescent',
    iconColors: { light: '#658459', dark: '#9fc28f' },
    badgeColors: { light: '#e7efe2', dark: '#182015' },
  },
  {
    id: 'Mehndi',
    icon: 'flower-outline',
    iconColors: { light: '#7d8b4a', dark: '#a7bc6e' },
    badgeColors: { light: '#edf0de', dark: '#1d1f13' },
  },
  {
    id: 'Nikkah',
    icon: 'ring',
    iconColors: { light: '#b89358', dark: '#e0c38d' },
    badgeColors: { light: '#f4ead9', dark: '#23180f' },
  },
  {
    id: 'Walima',
    icon: 'ring',
    iconColors: { light: '#b89358', dark: '#e0c38d' },
    badgeColors: { light: '#f4ead9', dark: '#23180f' },
  },
  {
    id: 'Birthday',
    icon: 'cake-variant-outline',
    iconColors: { light: '#b46a7b', dark: '#d69aac' },
    badgeColors: { light: '#f3e0e6', dark: '#231418' },
  },
  {
    id: 'Formal',
    icon: 'hanger',
    iconColors: { light: '#7e6a5b', dark: '#c1aa92' },
    badgeColors: { light: '#ede3d8', dark: '#1e1712' },
  },
  {
    id: 'Concert',
    icon: 'music-note-outline',
    iconColors: { light: '#7d6aa6', dark: '#b7a0ea' },
    badgeColors: { light: '#eae4f6', dark: '#191521' },
  },
  {
    id: 'Beach',
    icon: 'beach',
    iconColors: { light: '#8d814d', dark: '#cfbf75' },
    badgeColors: { light: '#f1edd7', dark: '#1e1b11' },
  },
  {
    id: 'Travel',
    icon: 'airplane',
    iconColors: { light: '#6d7c92', dark: '#97a2b2' },
    badgeColors: { light: '#e8edf2', dark: '#15181d' },
  },
  {
    id: 'University',
    icon: 'school-outline',
    iconColors: { light: '#6f7e8d', dark: '#9fb0c0' },
    badgeColors: { light: '#e9edf1', dark: '#171b1f' },
    shortLabel: 'Campus',
  },
  {
    id: 'Shopping',
    icon: 'shopping-outline',
    iconColors: { light: '#a07a4a', dark: '#d1b082' },
    badgeColors: { light: '#f2e7d9', dark: '#21170f' },
  },
  {
    id: 'Family Gathering',
    icon: 'account-group-outline',
    iconColors: { light: '#8b7564', dark: '#c3ad96' },
    badgeColors: { light: '#eee2d5', dark: '#1e1713' },
    shortLabel: 'Family',
  },
  {
    id: 'Photoshoot',
    icon: 'camera-outline',
    iconColors: { light: '#7b6b8e', dark: '#ae9cc8' },
    badgeColors: { light: '#ece6f4', dark: '#1a1520' },
    shortLabel: 'Shoot',
  },
  {
    id: 'Festival',
    icon: 'party-popper',
    iconColors: { light: '#b07f4f', dark: '#dcb17d' },
    badgeColors: { light: '#f3e7d8', dark: '#21180f' },
  },
];

const UPLOAD_THEME_COLORS = {
  light: {
    pageBackground: '#f5efe7',
    cardBackground: '#fff9f2',
    cardBorder: '#d8c3aa',
    heroAccent: 'rgba(180, 146, 97, 0.16)',
    eyebrow: '#a07a4a',
    title: '#3a2a1d',
    body: '#6e5a49',
    sectionTitle: '#3a2a1d',
    tileBackground: '#f7efe5',
    tileBorder: '#d7c3a5',
    tileText: '#3a2a1d',
    tileSelectedBackground: '#d4af6a',
    tileSelectedBorder: '#d4af6a',
    tileSelectedText: '#1a120a',
    tileSelectedBadge: '#c79f5e',
    inputBackground: '#fff9f2',
    inputBorder: '#d8c3aa',
    inputText: '#3a2a1d',
    placeholder: '#9c8572',
    uploadZoneBackground: '#fbf5ee',
    uploadZoneBorder: '#cfb495',
    uploadBadgeBackground: '#efe2d2',
    uploadBadgeBorder: '#d7bea1',
    uploadBadgeIcon: '#b88d4c',
    uploadTitle: '#3a2a1d',
    uploadText: '#6e5a49',
    previewActionBackground: 'rgba(255, 249, 242, 0.92)',
    previewActionBorder: '#d8c3aa',
    previewActionText: '#3a2a1d',
    previewFooterBackground: 'rgba(248, 242, 234, 0.92)',
    previewFooterTitle: '#3a2a1d',
    previewFooterText: '#6e5a49',
    buttonBackground: '#d4af6a',
    buttonBorder: '#caa45f',
    buttonText: '#1a120a',
    helperBackground: '#fff3e7',
    helperBorder: '#d8c3aa',
    helperText: '#6e5a49',
    errorBackground: '#f9ebe3',
    errorBorder: '#d8b197',
    errorText: '#7a4a35',
    sheetOverlay: 'rgba(0, 0, 0, 0.28)',
    sheetBackground: '#fff9f2',
    sheetBorder: '#d8c3aa',
    sheetHeading: '#3a2a1d',
    sheetText: '#6e5a49',
    sheetRowBackground: '#f5ece2',
    sheetRowBorder: '#d8c3aa',
    sheetIconBadgeBackground: '#efe2d2',
    sheetIconBadgeBorder: '#d7bea1',
    sheetIconColor: '#b88d4c',
    cancelBackground: '#f1e7db',
    cancelBorder: '#d8c3aa',
    cancelText: '#6e5a49',
    sheetChipBackground: '#f5ece2',
    sheetChipBorder: '#d8c3aa',
    sheetChipText: '#3a2a1d',
    sheetChipSelectedBackground: '#d4af6a',
    sheetChipSelectedBorder: '#caa45f',
    sheetChipSelectedText: '#1a120a',
  },
  dark: {
    pageBackground: '#050505',
    cardBackground: '#0d0907',
    cardBorder: '#3a2a1d',
    heroAccent: 'rgba(55, 34, 20, 0.55)',
    eyebrow: '#b99663',
    title: '#eadbc8',
    body: '#c9b8a6',
    sectionTitle: '#eadbc8',
    tileBackground: '#15110d',
    tileBorder: '#3a2c20',
    tileText: '#eadbc8',
    tileSelectedBackground: '#d4af6a',
    tileSelectedBorder: '#d4af6a',
    tileSelectedText: '#1a120a',
    tileSelectedBadge: 'rgba(26, 18, 10, 0.14)',
    inputBackground: '#15110d',
    inputBorder: '#3a2c20',
    inputText: '#eadbc8',
    placeholder: '#a8927d',
    uploadZoneBackground: '#15110d',
    uploadZoneBorder: '#4a3421',
    uploadBadgeBackground: '#22180f',
    uploadBadgeBorder: '#4a3421',
    uploadBadgeIcon: '#d4af37',
    uploadTitle: '#eadbc8',
    uploadText: '#bdaa96',
    previewActionBackground: 'rgba(5, 5, 5, 0.82)',
    previewActionBorder: '#5a432a',
    previewActionText: '#eadbc8',
    previewFooterBackground: 'rgba(8, 6, 5, 0.84)',
    previewFooterTitle: '#eadbc8',
    previewFooterText: '#c9b8a6',
    buttonBackground: '#d4af6a',
    buttonBorder: '#d9bf8b',
    buttonText: '#1a120a',
    helperBackground: '#120d0a',
    helperBorder: '#4a3421',
    helperText: '#d9c6ad',
    errorBackground: '#1a110d',
    errorBorder: '#6a4633',
    errorText: '#efcfb4',
    sheetOverlay: 'rgba(0, 0, 0, 0.62)',
    sheetBackground: '#17110d',
    sheetBorder: '#3a2a1d',
    sheetHeading: '#f6ead7',
    sheetText: '#ddc9ab',
    sheetRowBackground: '#211915',
    sheetRowBorder: '#4b3826',
    sheetIconBadgeBackground: '#2b2018',
    sheetIconBadgeBorder: '#5e472d',
    sheetIconColor: '#e1be82',
    cancelBackground: '#140f0c',
    cancelBorder: '#3b2b1f',
    cancelText: '#d8c2a0',
    sheetChipBackground: '#211915',
    sheetChipBorder: '#4b3826',
    sheetChipText: '#eadbc8',
    sheetChipSelectedBackground: '#d4af6a',
    sheetChipSelectedBorder: '#d9bf8b',
    sheetChipSelectedText: '#1a120a',
  },
} as const;

type SelectedImage = {
  uri: string;
  base64: string | null;
  mimeType?: string | null;
  width?: number;
  height?: number;
  fileName?: string | null;
};

const IMAGE_PICKER_OPTIONS = {
  mediaTypes: ImagePicker.MediaTypeOptions.Images,
  allowsEditing: false,
  base64: true,
  quality: 0.9,
} as const;

const SUPPORTED_IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp']);
const SUPPORTED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
]);
const IOS_HEIC_EXTENSIONS = new Set(['heic', 'heif']);
const IOS_HEIC_MIME_TYPES = new Set(['image/heic', 'image/heif']);

const REVIEW_STATUS_STEPS = [
  { agent: 'Occasion Agent', message: 'Reviewing silhouette and occasion fit...' },
  { agent: 'Trend Agent', message: 'Comparing against current Trendz picks...' },
  {
    agent: 'Editorial Agent',
    message: 'Checking editorial and magazine-inspired styling cues...',
  },
  { agent: 'Color Agent', message: 'Evaluating color harmony and outfit balance...' },
  { agent: 'Style Archive Agent', message: 'Matching against iconic fashion references...' },
  {
    agent: 'Confidence Agent',
    message: 'Scoring confidence, polish, and trend relevance...',
  },
  {
    agent: 'Explore Curator',
    message: 'Deciding if this look is strong enough for Explore...',
  },
  { agent: 'Verdict Agent', message: 'Building your final fashion verdict...' },
] as const;

function logDev(message: string, details?: unknown) {
  if (!__DEV__) {
    return;
  }

  if (details === undefined) {
    console.log(`[upload] ${message}`);
    return;
  }

  console.log(`[upload] ${message}`, details);
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getFileExtension(value?: string | null) {
  if (!value) {
    return null;
  }

  const withoutQuery = value.split('?')[0]?.split('#')[0] ?? value;
  const fileName = withoutQuery.split('/').pop() ?? withoutQuery;
  const dotIndex = fileName.lastIndexOf('.');

  if (dotIndex === -1) {
    return null;
  }

  return fileName.slice(dotIndex + 1).toLowerCase();
}

function normalizeMimeType(value?: string | null) {
  return value?.trim().toLowerCase() ?? null;
}

function inferMimeTypeFromExtension(extension?: string | null) {
  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    case 'heic':
      return 'image/heic';
    case 'heif':
      return 'image/heif';
    default:
      return null;
  }
}

function buildJpegFileName(fileName?: string | null) {
  const sourceName = fileName?.trim() || 'outfit-photo';
  const cleanName = sourceName.replace(/\.[^/.]+$/, '');
  return `${cleanName || 'outfit-photo'}.jpg`;
}

function formatLatestReviewTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatScore(score: number) {
  return score.toFixed(1);
}

function shouldNormalizePickedImage({
  mimeType,
  extension,
}: {
  mimeType?: string | null;
  extension?: string | null;
}) {
  const normalizedMimeType = normalizeMimeType(mimeType);
  const normalizedExtension = extension?.toLowerCase() ?? null;

  if (
    IOS_HEIC_MIME_TYPES.has(normalizedMimeType ?? '') ||
    IOS_HEIC_EXTENSIONS.has(normalizedExtension ?? '')
  ) {
    return true;
  }

  if (normalizedMimeType && !SUPPORTED_IMAGE_MIME_TYPES.has(normalizedMimeType)) {
    return true;
  }

  if (normalizedExtension && !SUPPORTED_IMAGE_EXTENSIONS.has(normalizedExtension)) {
    return true;
  }

  if (Platform.OS === 'ios' && !normalizedMimeType && !normalizedExtension) {
    return true;
  }

  return false;
}

async function normalizePickedImageAsset(asset: ImagePicker.ImagePickerAsset): Promise<SelectedImage> {
  const fileExtension = getFileExtension(asset.fileName) ?? getFileExtension(asset.uri);
  const inferredMimeType = normalizeMimeType(asset.mimeType) ?? inferMimeTypeFromExtension(fileExtension);
  const shouldNormalize = shouldNormalizePickedImage({
    mimeType: inferredMimeType,
    extension: fileExtension,
  });

  logDev('picked image metadata', {
    originalMimeType: inferredMimeType,
    originalExtension: fileExtension,
    originalFileName: asset.fileName ?? null,
    shouldNormalize,
  });

  if (!shouldNormalize) {
    const finalMimeType = inferredMimeType ?? 'image/jpeg';
    const finalExtension = getFileExtension(asset.fileName) ?? getFileExtension(asset.uri) ?? 'jpg';

    logDev('image normalization not needed', {
      finalMimeType,
      finalExtension,
    });

    return {
      uri: asset.uri,
      base64: asset.base64 ?? null,
      mimeType: finalMimeType,
      width: asset.width,
      height: asset.height,
      fileName: asset.fileName ?? null,
    };
  }

  const targetWidth = asset.width && asset.width > 1800 ? 1800 : asset.width;
  const actions = targetWidth ? [{ resize: { width: targetWidth } }] : [];

  logDev('normalizing picked image to jpeg', {
    sourceMimeType: inferredMimeType,
    sourceExtension: fileExtension,
    resizeWidth: targetWidth ?? null,
  });

  const normalizedImage = await manipulateAsync(asset.uri, actions, {
    compress: 0.86,
    format: SaveFormat.JPEG,
    base64: true,
  });

  logDev('image normalization applied', {
    finalMimeType: 'image/jpeg',
    finalExtension: 'jpg',
    width: normalizedImage.width,
    height: normalizedImage.height,
  });

  return {
    uri: normalizedImage.uri,
    base64: normalizedImage.base64 ?? null,
    mimeType: 'image/jpeg',
    width: normalizedImage.width,
    height: normalizedImage.height,
    fileName: buildJpegFileName(asset.fileName),
  };
}

export default function UploadScreen() {
  const appContext = useContext(AppContext);
  const colorScheme = useColorScheme();
  const theme: ThemeName = colorScheme === 'dark' ? 'dark' : 'light';
  const colors = UPLOAD_THEME_COLORS[theme];
  const [selectedOccasion, setSelectedOccasion] = useState('Dinner');
  const [eventDescription, setEventDescription] = useState('');
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null);
  const [isUploadSheetVisible, setIsUploadSheetVisible] = useState(false);
  const [isOccasionPickerVisible, setIsOccasionPickerVisible] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewStatusIndex, setReviewStatusIndex] = useState(0);
  const heroFontFamily = Platform.select({ ios: 'Georgia', android: 'serif', default: undefined });
  const reviewStatusOpacity = useRef(new Animated.Value(1)).current;
  const latestReview = appContext?.latestOutfitReview ?? null;
  const selectedExtraOccasion = EXTRA_OCCASIONS.find((occasion) => occasion.id === selectedOccasion) ?? null;
  const primaryOccasions = OCCASIONS.slice(0, -1);
  const moreTileOccasion = selectedExtraOccasion ?? OCCASIONS[OCCASIONS.length - 1];
  const visibleOccasions = [
    ...primaryOccasions.map((occasion) => ({
      ...occasion,
      label: occasion.id,
      value: occasion.id,
      opensPicker: false,
    })),
    {
      ...moreTileOccasion,
      label: selectedExtraOccasion?.shortLabel ?? selectedExtraOccasion?.id ?? 'More',
      value: selectedExtraOccasion?.id ?? 'More',
      opensPicker: true,
    },
  ];
  const activeReviewStatus = REVIEW_STATUS_STEPS[reviewStatusIndex] ?? REVIEW_STATUS_STEPS[0];

  useEffect(() => {
    if (!isReviewing) {
      setReviewStatusIndex(0);
      reviewStatusOpacity.stopAnimation();
      reviewStatusOpacity.setValue(1);
      return;
    }

    const intervalId = setInterval(() => {
      Animated.timing(reviewStatusOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        setReviewStatusIndex((currentIndex) => (currentIndex + 1) % REVIEW_STATUS_STEPS.length);
        Animated.timing(reviewStatusOpacity, {
          toValue: 1,
          duration: 190,
          useNativeDriver: true,
        }).start();
      });
    }, 1500);

    return () => {
      clearInterval(intervalId);
      reviewStatusOpacity.stopAnimation();
      reviewStatusOpacity.setValue(1);
    };
  }, [isReviewing, reviewStatusOpacity]);

  const closeUploadSheet = () => {
    setIsUploadSheetVisible(false);
  };

  const closeOccasionPicker = () => {
    setIsOccasionPickerVisible(false);
  };

  const openUploadSheet = () => {
    logDev('upload card tapped');
    setIsUploadSheetVisible(true);
  };

  const openOccasionPicker = () => {
    logDev('more occasion tile tapped');
    setIsOccasionPickerVisible(true);
  };

  const handleOccasionTilePress = (occasion: (typeof visibleOccasions)[number]) => {
    if (occasion.opensPicker) {
      openOccasionPicker();
      return;
    }

    setSelectedOccasion(occasion.value);
  };

  const handleExtraOccasionSelect = (occasionId: string) => {
    logDev('extra occasion selected', occasionId);
    setSelectedOccasion(occasionId);
    closeOccasionPicker();
  };

  const handlePickerResult = async (
    source: 'camera' | 'gallery',
    result: ImagePicker.ImagePickerResult
  ) => {
    logDev(`${source} picker result received`, {
      canceled: result.canceled,
      assetCount: result.assets?.length ?? 0,
    });

    if (result.canceled) {
      return;
    }

    const asset = result.assets?.[0];
    const uri = asset?.uri;

    if (!uri) {
      if (__DEV__) {
        console.warn(`[upload] ${source} picker returned no URI`, result);
      }

      Alert.alert('Couldn’t use that photo', 'Please try again with a different image.');
      return;
    }

    try {
      const normalizedImage = await normalizePickedImageAsset(asset);

      logDev('selected URI', normalizedImage.uri);
      setSelectedImage(normalizedImage);
      setReviewError(null);
    } catch (error) {
      logDev('image normalization failed', error);
      Alert.alert(
        'Couldn’t use that photo',
        'Trendz could not prepare this image for review. Please try a different photo.'
      );
    }
  };

  const handleTakePhoto = async () => {
    logDev('take photo tapped');
    closeUploadSheet();
    await wait(140);

    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      logDev('camera permission result', {
        status: permission.status,
        granted: permission.granted,
        canAskAgain: permission.canAskAgain,
      });

      if (!permission.granted) {
        Alert.alert(
          'Camera access needed',
          'Allow Trendz to use your camera so you can take an outfit photo.'
        );
        return;
      }

      logDev('launching camera');
      const result = await ImagePicker.launchCameraAsync(IMAGE_PICKER_OPTIONS);
      await handlePickerResult('camera', result);
    } catch (error) {
      logDev('camera error caught', error);
      Alert.alert(
        'Camera unavailable',
        Platform.OS === 'ios'
          ? 'Camera may be unavailable on the simulator. Please try Take Photo on a real iPhone, or choose from the gallery instead.'
          : 'Trendz could not open the camera right now. Please try again.'
      );
    }
  };

  const handleChooseFromGallery = async () => {
    logDev('choose from gallery tapped');
    closeUploadSheet();
    await wait(140);

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      logDev('gallery permission result', {
        status: permission.status,
        granted: permission.granted,
        canAskAgain: permission.canAskAgain,
      });

      if (!permission.granted) {
        Alert.alert(
          'Photos access needed',
          'Allow Trendz to access your photo library so you can choose an outfit picture.'
        );
        return;
      }

      logDev('launching gallery picker');
      const result = await ImagePicker.launchImageLibraryAsync(IMAGE_PICKER_OPTIONS);
      await handlePickerResult('gallery', result);
    } catch (error) {
      logDev('gallery error caught', error);
      Alert.alert(
        'Couldn’t open your photos',
        'Trendz could not open your photo library right now. Please try again.'
      );
    }
  };

  const handleRateMyOutfit = async () => {
    logDev('rate my outfit tapped');

    if (isReviewing) {
      return;
    }

    if (!selectedImage) {
      logDev('validation failed: no image selected');
      const message = 'Please upload an outfit photo first.';
      setReviewError(message);
      Alert.alert('Photo needed', message);
      return;
    }

    const customEvent = eventDescription.trim();
    const occasionForReview = customEvent || selectedOccasion;
    const transportMode = getOutfitReviewTransportMode();

    logDev('validation passed', {
      occasionForReview,
      hasCustomEvent: Boolean(customEvent),
      transportMode,
    });

    if (!appContext) {
      setReviewError('Trendz could not prepare the review screen right now. Please try again.');
      return;
    }

    setIsReviewing(true);
    setReviewError(null);

    try {
      const reviewOwnerKey = buildOutfitReviewOwnerKey({
        sessionUserId: appContext.session?.user?.id,
        email: appContext.userProfile.email,
        username: appContext.userProfile.username,
      });
      const imageFingerprint = await createOutfitImageFingerprint(selectedImage.base64 ?? '');
      const reviewCacheKey = await buildOutfitReviewCacheKey({
        ownerKey: reviewOwnerKey,
        imageFingerprint,
        occasion: occasionForReview,
        eventDescription: customEvent || undefined,
      });

      logDev('review cache prepared', {
        reviewOwnerKey,
        imageFingerprint,
        reviewCacheKey,
        occasionForReview,
      });

      const cachedReview = appContext.findCachedOutfitReview(reviewCacheKey);

      if (cachedReview) {
        logDev('cached review hit', {
          reviewId: cachedReview.id,
          reviewCacheKey,
          overallScore: cachedReview.result.overall_score,
          postedToFeedAt: cachedReview.postedToFeedAt ?? null,
        });

        appContext.setLatestOutfitReview({
          ...cachedReview,
          imageUri: selectedImage.uri,
          imageWidth: selectedImage.width,
          imageHeight: selectedImage.height,
          imageFingerprint,
          reviewCacheKey,
          occasion: occasionForReview,
          eventDescription: customEvent || undefined,
        });
        router.push('/ai-results');
        return;
      }

      logDev('cached review miss', { reviewCacheKey });

      if (transportMode === 'unconfigured') {
        const message = getOutfitReviewConfigErrorMessage();
        setReviewError(message);
        return;
      }

      logDev('payload prepared', {
        imageUri: selectedImage.uri,
        occasion: occasionForReview,
        eventDescription: customEvent || null,
        using: transportMode,
      });
      logDev('request started');

      const result = await analyzeOutfitImage({
        image: {
          uri: selectedImage.uri,
          base64: selectedImage.base64 ?? '',
          mimeType: selectedImage.mimeType,
          fileName: selectedImage.fileName,
          width: selectedImage.width,
          height: selectedImage.height,
        },
        occasion: occasionForReview,
        eventDescription: customEvent || undefined,
      });

      logDev('response received', {
        overallScore: result.overall_score,
        tagline: result.tagline,
      });

      const reviewSession = {
        id: reviewCacheKey,
        imageUri: selectedImage.uri,
        imageWidth: selectedImage.width,
        imageHeight: selectedImage.height,
        imageFingerprint,
        reviewCacheKey,
        occasion: occasionForReview,
        eventDescription: customEvent || undefined,
        analyzedAt: new Date().toISOString(),
        result,
      };

      appContext.setLatestOutfitReview(reviewSession);
      router.push('/ai-results');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Trendz could not review this outfit right now.';
      logDev('error caught', message);
      setReviewError(message);
    } finally {
      setIsReviewing(false);
    }
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: colors.pageBackground,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
        position: 'relative',
      }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 144 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <View
          style={{
            marginBottom: 28,
            overflow: 'hidden',
            borderRadius: 30,
            borderWidth: 1,
            borderColor: colors.cardBorder,
            backgroundColor: colors.cardBackground,
            paddingHorizontal: 22,
            paddingVertical: 22,
          }}>
          <View
            style={{
              position: 'absolute',
              right: 18,
              top: 16,
              height: 64,
              width: 64,
              borderRadius: 999,
              backgroundColor: colors.heroAccent,
            }}
          />
          <Text
            style={{
              marginBottom: 12,
              color: colors.eyebrow,
              fontSize: 12,
              fontWeight: '700',
              letterSpacing: 1.8,
              fontFamily: heroFontFamily,
            }}>
            AI STYLE REVIEW
          </Text>
          <Text
            style={{
              marginBottom: 10,
              color: colors.title,
              fontSize: 36,
              fontWeight: '700',
              letterSpacing: -0.6,
              fontFamily: heroFontFamily,
            }}>
            Rate My Outfit
          </Text>
          <Text style={{ maxWidth: '90%', color: colors.body, fontSize: 16, lineHeight: 24 }}>
            Get instant AI feedback on your outfit.
          </Text>
        </View>

        {latestReview ? (
          <View
            style={{
              marginBottom: 28,
              borderRadius: 26,
              borderWidth: 1,
              borderColor: colors.helperBorder,
              backgroundColor: colors.helperBackground,
              paddingHorizontal: 20,
              paddingVertical: 18,
            }}>
            <Text
              style={{
                color: colors.eyebrow,
                fontSize: 11,
                fontWeight: '700',
                letterSpacing: 2.4,
                textTransform: 'uppercase',
              }}>
              Latest Analysis
            </Text>
            <Text
              style={{
                marginTop: 10,
                color: colors.title,
                fontSize: 18,
                fontWeight: '700',
                lineHeight: 24,
              }}>
              {latestReview.result.tagline}
            </Text>
            <Text
              style={{
                marginTop: 8,
                color: colors.helperText,
                fontSize: 14,
                lineHeight: 22,
              }}>
              {latestReview.occasion} • {formatScore(latestReview.result.overall_score)} •{' '}
              {formatLatestReviewTime(latestReview.analyzedAt)}
            </Text>
            <Text
              style={{
                marginTop: 10,
                color: colors.body,
                fontSize: 14,
                lineHeight: 22,
              }}>
              Your last analysis is still saved. Reopen it anytime or start a fresh review below.
            </Text>

            <TouchableOpacity
              onPress={() => router.push('/ai-results')}
              style={{
                marginTop: 16,
                alignSelf: 'flex-start',
                borderRadius: 18,
                borderWidth: 1,
                borderColor: colors.buttonBorder,
                backgroundColor: colors.buttonBackground,
                paddingHorizontal: 18,
                paddingVertical: 12,
              }}>
              <Text style={{ color: colors.buttonText, fontSize: 15, fontWeight: '700' }}>
                View Latest Analysis
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View
          style={{
            marginBottom: 28,
            borderRadius: 30,
            borderWidth: 1,
            borderColor: colors.cardBorder,
            backgroundColor: colors.cardBackground,
            paddingHorizontal: 20,
            paddingTop: 22,
            paddingBottom: 22,
          }}>
          <Text
            style={{
              marginBottom: 18,
              color: colors.sectionTitle,
              fontSize: 20,
              fontWeight: '600',
              letterSpacing: 0.2,
            }}>
            Select Occasion
          </Text>

          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              rowGap: 12,
            }}>
            {visibleOccasions.map((occasion) => {
              const isActive = occasion.opensPicker
                ? Boolean(selectedExtraOccasion)
                : selectedOccasion === occasion.value;

              return (
                <TouchableOpacity
                  key={occasion.opensPicker ? 'more-occasion-tile' : occasion.value}
                  onPress={() => handleOccasionTilePress(occasion)}
                  style={{
                    width: '31%',
                    minHeight: 108,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 22,
                    borderWidth: 1,
                    paddingHorizontal: 8,
                    paddingVertical: 14,
                    backgroundColor: isActive
                      ? colors.tileSelectedBackground
                      : colors.tileBackground,
                    borderColor: isActive ? colors.tileSelectedBorder : colors.tileBorder,
                  }}>
                  <View
                    style={{
                      marginBottom: 10,
                      height: 38,
                      width: 38,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 999,
                      backgroundColor: isActive
                        ? colors.tileSelectedBadge
                        : occasion.badgeColors[theme],
                    }}>
                    <MaterialCommunityIcons
                      name={occasion.icon}
                      size={18}
                      color={isActive ? colors.tileSelectedText : occasion.iconColors[theme]}
                    />
                  </View>
                  <Text
                    style={{
                      textAlign: 'center',
                      color: isActive ? colors.tileSelectedText : colors.tileText,
                      fontSize: 13,
                      fontWeight: '600',
                      lineHeight: 16,
                    }}
                    numberOfLines={2}>
                    {occasion.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text
            style={{
              marginLeft: 4,
              marginTop: 24,
              marginBottom: 12,
              color: colors.sectionTitle,
              fontSize: 15,
              fontWeight: '500',
            }}>
            Or describe your event
          </Text>

          <TextInput
            value={eventDescription}
            onChangeText={setEventDescription}
            style={{
              width: '100%',
              borderRadius: 18,
              borderWidth: 1,
              borderColor: colors.inputBorder,
              backgroundColor: colors.inputBackground,
              paddingHorizontal: 20,
              paddingVertical: 16,
              color: colors.inputText,
              fontSize: 16,
            }}
            placeholder="Example: I'm going to my friend's wedding"
            placeholderTextColor={colors.placeholder}
          />
        </View>

        <View
          style={{
            marginBottom: 28,
            borderRadius: 30,
            borderWidth: 1,
            borderColor: colors.cardBorder,
            backgroundColor: colors.cardBackground,
            paddingHorizontal: 20,
            paddingTop: 22,
            paddingBottom: 22,
          }}>
          <Text
            style={{
              marginBottom: 18,
              color: colors.sectionTitle,
              fontSize: 20,
              fontWeight: '600',
              letterSpacing: 0.2,
            }}>
            Upload Photo
          </Text>

          <TouchableOpacity
            activeOpacity={0.92}
            onPress={openUploadSheet}
            style={{
              minHeight: 260,
              width: '100%',
              borderRadius: 28,
              borderWidth: 1.5,
              borderStyle: 'dashed',
              borderColor: colors.uploadZoneBorder,
              backgroundColor: colors.uploadZoneBackground,
              paddingHorizontal: 20,
              paddingVertical: 24,
              justifyContent: 'center',
              overflow: 'hidden',
            }}>
            {selectedImage ? (
              <View style={{ width: '100%', overflow: 'hidden', borderRadius: 24 }}>
                <Image
                  source={{ uri: selectedImage.uri }}
                  resizeMode="cover"
                  style={{
                    width: '100%',
                    height: 310,
                    borderRadius: 24,
                    backgroundColor: colors.uploadZoneBackground,
                  }}
                />
                <View
                  style={{
                    position: 'absolute',
                    right: 14,
                    top: 14,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: colors.previewActionBorder,
                    backgroundColor: colors.previewActionBackground,
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                  }}>
                  <Text
                    style={{ color: colors.previewActionText, fontSize: 13, fontWeight: '600' }}>
                    Change photo
                  </Text>
                </View>
                <View
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    backgroundColor: colors.previewFooterBackground,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                  }}>
                  <Text
                    style={{ color: colors.previewFooterTitle, fontSize: 16, fontWeight: '600' }}>
                    Outfit photo selected
                  </Text>
                  <Text
                    style={{
                      marginTop: 4,
                      color: colors.previewFooterText,
                      fontSize: 13,
                      lineHeight: 19,
                    }}>
                    Tap to replace this photo with another look.
                  </Text>
                </View>
              </View>
            ) : (
              <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                <View
                  style={{
                    marginBottom: 18,
                    height: 62,
                    width: 62,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 999,
                    backgroundColor: colors.uploadBadgeBackground,
                    borderWidth: 1,
                    borderColor: colors.uploadBadgeBorder,
                  }}>
                  <MaterialCommunityIcons
                    name="camera-plus-outline"
                    size={25}
                    color={colors.uploadBadgeIcon}
                  />
                </View>
                <Text
                  style={{
                    marginBottom: 8,
                    color: colors.uploadTitle,
                    fontSize: 20,
                    fontWeight: '500',
                  }}>
                  Tap to upload outfit
                </Text>
                <Text
                  style={{
                    color: colors.uploadText,
                    fontSize: 15,
                    textAlign: 'center',
                    lineHeight: 22,
                  }}>
                  JPEG or PNG. Max 5MB.
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          activeOpacity={0.92}
          disabled={isReviewing}
          onPress={() => void handleRateMyOutfit()}
          style={{
            width: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 18,
            backgroundColor: colors.buttonBackground,
            paddingVertical: 22,
            borderWidth: 1,
            borderColor: colors.buttonBorder,
            shadowColor: colors.buttonBackground,
            shadowOpacity: 0.16,
            shadowOffset: { width: 0, height: 10 },
            shadowRadius: 18,
            opacity: isReviewing ? 0.78 : 1,
          }}>
          {isReviewing ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <ActivityIndicator color={colors.buttonText} />
              <Text
                style={{
                  marginLeft: 10,
                  color: colors.buttonText,
                  fontSize: 20,
                  fontWeight: '700',
                  letterSpacing: 0.2,
                }}>
                Reviewing...
              </Text>
            </View>
          ) : (
            <Text
              style={{
                color: colors.buttonText,
                fontSize: 20,
                fontWeight: '700',
                letterSpacing: 0.2,
              }}>
              Rate My Outfit
            </Text>
          )}
        </TouchableOpacity>

        {isReviewing ? (
          <View
            style={{
              marginTop: 16,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: colors.helperBorder,
              backgroundColor: colors.helperBackground,
              paddingHorizontal: 16,
              paddingVertical: 12,
            }}>
            <Animated.View style={{ opacity: reviewStatusOpacity }}>
              <Text
                style={{
                  color: colors.eyebrow,
                  fontSize: 11,
                  fontWeight: '700',
                  letterSpacing: 1.8,
                  textTransform: 'uppercase',
                }}>
                {activeReviewStatus.agent}
              </Text>
              <Text
                style={{
                  marginTop: 8,
                  color: colors.helperText,
                  fontSize: 14,
                  lineHeight: 21,
                }}>
                {activeReviewStatus.message}
              </Text>
            </Animated.View>
          </View>
        ) : null}

        {reviewError ? (
          <View
            style={{
              marginTop: 18,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: colors.errorBorder,
              backgroundColor: colors.errorBackground,
              paddingHorizontal: 16,
              paddingVertical: 14,
            }}>
            <Text
              style={{
                color: colors.errorText,
                fontSize: 14,
                lineHeight: 21,
              }}>
              {reviewError}
            </Text>
          </View>
        ) : null}
      </ScrollView>

      {isUploadSheetVisible ? (
        <View
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            justifyContent: 'flex-end',
          }}>
          <Pressable
            onPress={closeUploadSheet}
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              backgroundColor: colors.sheetOverlay,
            }}
          />
          <View
            style={{
              marginHorizontal: 16,
              marginBottom: 16,
              borderRadius: 28,
              borderWidth: 1,
              borderColor: colors.sheetBorder,
              backgroundColor: colors.sheetBackground,
              paddingHorizontal: 18,
              paddingTop: 18,
              paddingBottom: 18,
            }}>
            <Text
              style={{
                color: colors.sheetHeading,
                fontSize: 20,
                fontWeight: '700',
                letterSpacing: 0.2,
              }}>
              Add outfit photo
            </Text>
            <Text
              style={{
                marginTop: 6,
                marginBottom: 18,
                color: colors.sheetText,
                fontSize: 14,
                lineHeight: 21,
              }}>
              Choose how you want to add your look.
            </Text>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => void handleTakePhoto()}
              style={{
                marginBottom: 12,
                flexDirection: 'row',
                alignItems: 'center',
                borderRadius: 20,
                borderWidth: 1,
                borderColor: colors.sheetRowBorder,
                backgroundColor: colors.sheetRowBackground,
                paddingHorizontal: 16,
                paddingVertical: 15,
              }}>
              <View
                style={{
                  marginRight: 14,
                  height: 44,
                  width: 44,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: colors.sheetIconBadgeBorder,
                  backgroundColor: colors.sheetIconBadgeBackground,
                }}>
                <MaterialCommunityIcons
                  name="camera-outline"
                  size={21}
                  color={colors.sheetIconColor}
                />
              </View>
              <Text style={{ color: colors.sheetHeading, fontSize: 16, fontWeight: '600' }}>
                Take Photo
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => void handleChooseFromGallery()}
              style={{
                marginBottom: 12,
                flexDirection: 'row',
                alignItems: 'center',
                borderRadius: 20,
                borderWidth: 1,
                borderColor: colors.sheetRowBorder,
                backgroundColor: colors.sheetRowBackground,
                paddingHorizontal: 16,
                paddingVertical: 15,
              }}>
              <View
                style={{
                  marginRight: 14,
                  height: 44,
                  width: 44,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: colors.sheetIconBadgeBorder,
                  backgroundColor: colors.sheetIconBadgeBackground,
                }}>
                <MaterialCommunityIcons
                  name="image-outline"
                  size={21}
                  color={colors.sheetIconColor}
                />
              </View>
              <Text style={{ color: colors.sheetHeading, fontSize: 16, fontWeight: '600' }}>
                Choose from Gallery
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={closeUploadSheet}
              style={{
                marginTop: 4,
                alignItems: 'center',
                borderRadius: 18,
                borderWidth: 1,
                borderColor: colors.cancelBorder,
                backgroundColor: colors.cancelBackground,
                paddingVertical: 14,
              }}>
              <Text style={{ color: colors.cancelText, fontSize: 15, fontWeight: '600' }}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {isOccasionPickerVisible ? (
        <View
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            justifyContent: 'flex-end',
          }}>
          <Pressable
            onPress={closeOccasionPicker}
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              backgroundColor: colors.sheetOverlay,
            }}
          />
          <View
            style={{
              marginHorizontal: 16,
              marginBottom: 16,
              maxHeight: '72%',
              borderRadius: 28,
              borderWidth: 1,
              borderColor: colors.sheetBorder,
              backgroundColor: colors.sheetBackground,
              paddingHorizontal: 18,
              paddingTop: 18,
              paddingBottom: 18,
            }}>
            <Text
              style={{
                color: colors.sheetHeading,
                fontSize: 20,
                fontWeight: '700',
                letterSpacing: 0.2,
              }}>
              Choose Occasion
            </Text>
            <Text
              style={{
                marginTop: 6,
                marginBottom: 18,
                color: colors.sheetText,
                fontSize: 14,
                lineHeight: 21,
              }}>
              Select the vibe for your look.
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                  rowGap: 10,
                }}>
                {EXTRA_OCCASIONS.map((occasion) => {
                  const isSelected = selectedOccasion === occasion.id;

                  return (
                    <TouchableOpacity
                      key={occasion.id}
                      activeOpacity={0.9}
                      onPress={() => handleExtraOccasionSelect(occasion.id)}
                      style={{
                        width: '48%',
                        flexDirection: 'row',
                        alignItems: 'center',
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: isSelected
                          ? colors.sheetChipSelectedBorder
                          : colors.sheetChipBorder,
                        backgroundColor: isSelected
                          ? colors.sheetChipSelectedBackground
                          : colors.sheetChipBackground,
                        paddingHorizontal: 14,
                        paddingVertical: 14,
                      }}>
                      <View
                        style={{
                          marginRight: 12,
                          height: 36,
                          width: 36,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 999,
                          backgroundColor: isSelected
                            ? colors.tileSelectedBadge
                            : occasion.badgeColors[theme],
                        }}>
                        <MaterialCommunityIcons
                          name={occasion.icon}
                          size={18}
                          color={isSelected ? colors.sheetChipSelectedText : occasion.iconColors[theme]}
                        />
                      </View>
                      <Text
                        style={{
                          flex: 1,
                          color: isSelected ? colors.sheetChipSelectedText : colors.sheetChipText,
                          fontSize: 14,
                          fontWeight: '600',
                          lineHeight: 19,
                        }}
                        numberOfLines={2}>
                        {occasion.id}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={closeOccasionPicker}
              style={{
                marginTop: 14,
                alignItems: 'center',
                borderRadius: 18,
                borderWidth: 1,
                borderColor: colors.cancelBorder,
                backgroundColor: colors.cancelBackground,
                paddingVertical: 14,
              }}>
              <Text style={{ color: colors.cancelText, fontSize: 15, fontWeight: '600' }}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

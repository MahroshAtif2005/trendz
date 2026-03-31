import { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface InspirationCardProps {
  item: {
    id: string;
    imageUrl: string;
    fallbackImageUrls?: string[];
    title: string;
    vibe?: string;
    height?: number;
  };
  isSaved?: boolean;
  onToggleSave?: () => void;
  onPress?: () => void;
  variant?: 'default' | 'feed';
  disableOuterSpacing?: boolean;
}

export default function InspirationCard({
  item,
  isSaved = false,
  onToggleSave,
  onPress,
  variant = 'default',
  disableOuterSpacing = false,
}: InspirationCardProps) {
  const isFeedVariant = variant === 'feed';
  const imageCandidateKey = item.fallbackImageUrls?.join('|') ?? '';
  const imageCandidates = useMemo(() => {
    const seen = new Set<string>();

    return [item.imageUrl, ...(item.fallbackImageUrls ?? [])].filter((url): url is string => {
      if (!url) {
        return false;
      }

      const normalizedUrl = url.trim().toLowerCase();

      if (seen.has(normalizedUrl)) {
        return false;
      }

      seen.add(normalizedUrl);
      return true;
    });
  }, [item.imageUrl, imageCandidateKey]);
  const [imageIndex, setImageIndex] = useState(0);
  const [hasExhaustedSources, setHasExhaustedSources] = useState(imageCandidates.length === 0);
  const activeImageUrl = imageCandidates[imageIndex];

  useEffect(() => {
    setImageIndex(0);
    setHasExhaustedSources(imageCandidates.length === 0);
  }, [item.id, item.imageUrl, imageCandidateKey, imageCandidates.length]);

  const handleImageError = () => {
    setImageIndex((currentIndex) => {
      const nextIndex = currentIndex + 1;

      if (nextIndex >= imageCandidates.length) {
        setHasExhaustedSources(true);
        return currentIndex;
      }

      return nextIndex;
    });
  };

  return (
    <TouchableOpacity 
      onPress={onPress}
      activeOpacity={0.9}
      className={
        isFeedVariant
          ? `${disableOuterSpacing ? '' : 'mb-1 '}bg-surface-elevated rounded-[22px] overflow-hidden shadow-sm shadow-black/10 dark:shadow-black/30 border border-border`
          : 'flex-1 m-2 mb-4 bg-surface-elevated rounded-[24px] overflow-hidden shadow-sm shadow-black/5 dark:shadow-black/30 border border-border pb-3'
      }
    >
      <View className="relative w-full bg-surface-muted" style={{ height: item.height || 220 }}>
        {!hasExhaustedSources && activeImageUrl ? (
          <Image
            source={{ uri: activeImageUrl }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            cachePolicy="memory-disk"
            onError={handleImageError}
          />
        ) : (
          <View className="absolute inset-0 bg-surface-muted dark:bg-secondary" />
        )}
        <TouchableOpacity 
          onPress={onToggleSave}
          className={`absolute rounded-full bg-black/45 border border-white/10 items-center justify-center backdrop-blur-md z-10 ${
            isFeedVariant ? 'top-2.5 right-2.5 w-9 h-9' : 'top-3 right-3 w-[34px] h-[34px]'
          }`}
        >
          <IconSymbol
            name={isSaved ? "heart.fill" : "heart"}
            size={17}
            color={isSaved ? "#ff3b30" : "#efe4d3"}
          />
        </TouchableOpacity>
      </View>
      
      {!isFeedVariant && (
        <View className="px-3.5 pt-3.5">
          <Text className="font-sans font-semibold text-text text-[14px] leading-tight" numberOfLines={2}>
            {item.title}
          </Text>
          {item.vibe && (
            <Text className="font-sans text-text-muted text-[11px] mt-1.5 uppercase tracking-widest font-medium">
              {item.vibe}
            </Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

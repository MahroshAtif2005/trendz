import { Text, TouchableOpacity } from 'react-native';

interface CategoryChipProps {
  label: string;
  isActive?: boolean;
  onPress: () => void;
}

export default function CategoryChip({ label, isActive, onPress }: CategoryChipProps) {
  return (
    <TouchableOpacity 
      onPress={onPress}
      className={`px-5 py-3 rounded-full mr-2.5 border ${
        isActive 
          ? 'bg-primary border-primary shadow-sm shadow-primary/20'
          : 'bg-surface-elevated border-border-strong shadow-sm shadow-black/5 dark:shadow-black/25'
      }`}
    >
      <Text 
        className={`font-sans font-semibold text-[13px] tracking-[0.01em] ${
          isActive ? 'text-primary-foreground' : 'text-text'
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

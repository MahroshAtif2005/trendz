import { View, Text, TouchableOpacity, SafeAreaView, StyleSheet, ImageBackground } from 'react-native';
import { router } from 'expo-router';

export default function Welcome() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ImageBackground 
        source={{ uri: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80' }} 
        style={styles.background}
        imageStyle={{ opacity: 0.15 }}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.logoText}>Trendz</Text>
            <Text style={styles.subtitle}>Style, refined by AI.</Text>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.primaryButton}
              activeOpacity={0.8}
              onPress={() => router.navigate('/(auth)/sign-up')}
            >
              <Text style={styles.primaryButtonText}>Get Started</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.secondaryButton}
              activeOpacity={0.8}
              onPress={() => router.navigate('/(auth)/sign-in')}
            >
              <Text style={styles.secondaryButtonText}>Already have an account? Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#121212' },
  background: { flex: 1, width: '100%', height: '100%', backgroundColor: '#121212' },
  container: { flex: 1, paddingHorizontal: 32, justifyContent: 'space-between', paddingVertical: 40 },
  header: { alignItems: 'center', marginTop: '30%' },
  logoText: { fontSize: 48, fontWeight: '700', color: '#ffffff', letterSpacing: -1, marginBottom: 8 },
  subtitle: { fontSize: 18, color: '#d4af37', fontWeight: '500', letterSpacing: 0.5 },
  footer: { width: '100%', paddingBottom: 20 },
  primaryButton: {
    backgroundColor: '#d4af37',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 5,
    elevation: 5,
  },
  primaryButtonText: { color: '#000000', fontSize: 16, fontWeight: '600', letterSpacing: 0.3 },
  secondaryButton: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '600' },
});

import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, StyleSheet, Alert } from 'react-native';
import { Link, router } from 'expo-router';
import { supabase, hasSupabaseConfig } from '@/lib/supabase';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');

  const handleReset = async () => {
    if (!hasSupabaseConfig) {
      Alert.alert("Missing Configuration", "Please properly configure Supabase ENV variables.");
      return;
    }
    if (!email) {
      Alert.alert("Error", "Please enter your email address.");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      Alert.alert("Reset Failed", error.message);
    } else {
      Alert.alert("Success", "Password reset link sent to your email.");
      router.replace('/(auth)/sign-in');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={styles.keyboardView}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>

        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Forgot Password</Text>
            <Text style={styles.subtitle}>Enter your email and we'll send you a link to reset your password.</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput 
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#666666"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <TouchableOpacity onPress={handleReset} style={styles.primaryButton} activeOpacity={0.8}>
              <Text style={styles.primaryButtonText}>Send Reset Link</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Link href="/(auth)/sign-in" asChild>
              <TouchableOpacity style={styles.footerButton}>
                <Text style={styles.footerLink}>Wait, I remember my password</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#121212' },
  keyboardView: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 32, justifyContent: 'center' },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1e1e1e',
    borderWidth: 1,
    borderColor: '#333333',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  backButtonText: { fontSize: 26, color: '#ffffff', paddingBottom: 4 },
  header: { marginBottom: 40, marginTop: 40 },
  title: { fontSize: 32, fontWeight: '700', color: '#ffffff', letterSpacing: -0.5, marginBottom: 12 },
  subtitle: { fontSize: 16, color: '#8e8e93', lineHeight: 24 },
  form: { width: '100%' },
  inputGroup: { marginBottom: 32 },
  label: { fontSize: 14, fontWeight: '500', color: '#ffffff', marginBottom: 8, marginLeft: 4 },
  input: {
    backgroundColor: '#1e1e1e',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 18,
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'left',
    writingDirection: 'ltr',
  },
  primaryButton: {
    backgroundColor: '#d4af37',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { color: '#000000', fontSize: 16, fontWeight: '600', letterSpacing: 0.3 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 40 },
  footerButton: { padding: 10 },
  footerLink: { color: '#8e8e93', fontSize: 15, fontWeight: '500' },
});

import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, StyleSheet, Alert } from 'react-native';
import { Link, router } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { supabase, hasSupabaseConfig } from '@/lib/supabase';
import {
  getGoogleConfigErrorMessage,
  googleAuthRequestConfig,
} from '@/lib/google-auth';
import { IconSymbol } from '@/components/ui/icon-symbol';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest(
    googleAuthRequestConfig
  );

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      if (id_token) {
        console.log('Google ID token received, signing in with Supabase...');
        supabase.auth.signInWithIdToken({
          provider: 'google',
          token: id_token,
        }).then(({ data, error }) => {
          if (error) {
            Alert.alert('Google Sign In Failed', error.message);
          } else if (data.session) {
            console.log('Google sign-in successful!');
            router.replace('/(tabs)/explore');
          }
        });
      }
    }
  }, [response]);
  
  const handleGoogleSignIn = async () => {
    if (!hasSupabaseConfig) {
      Alert.alert("Missing Configuration", "Please add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to your .env file.");
      return;
    }
    const googleConfigError = getGoogleConfigErrorMessage();
    if (googleConfigError) {
      Alert.alert(
        "Google Not Configured", 
        googleConfigError
      );
      return;
    }
    try {
      await promptAsync();
    } catch (error: any) {
      Alert.alert("Google Sign In Error", error.message || "Failed to initiate Google Login.");
    }
  };

  const handleAuth = async () => {
    if (!hasSupabaseConfig) {
      Alert.alert("Missing Configuration", "Please add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to your .env file.");
      return;
    }
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password.");
      return;
    }
    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      Alert.alert("Sign In Failed", error.message);
    } else if (data.session) {
      router.replace('/(tabs)/explore');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={styles.keyboardView}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.logoText}>Trendz</Text>
            <Text style={styles.subtitle}>Welcome back to your style space</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput 
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#666666"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="username"
                autoComplete="email"
                returnKeyType="next"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput 
                  style={styles.passwordInput}
                  placeholder="Enter your password"
                  placeholderTextColor="#666666"
                  autoCapitalize="none"
                  autoCorrect={false}
                  secureTextEntry={!showPassword}
                  textContentType="password"
                  autoComplete="password"
                  returnKeyType="done"
                  onSubmitEditing={handleAuth}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  <IconSymbol name={showPassword ? "eye.slash.fill" : "eye.fill"} size={18} color="#8e8e93" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.optionsRow}>
              <TouchableOpacity style={styles.checkboxRow} onPress={() => setRememberMe(!rememberMe)} activeOpacity={0.8}>
                <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
                  {rememberMe && <IconSymbol name="checkmark" size={12} color="#000000" />}
                </View>
                <Text style={styles.checkboxLabel}>Remember me</Text>
              </TouchableOpacity>
              
              <Link href="/(auth)/forgot-password" asChild>
                <TouchableOpacity>
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>
              </Link>
            </View>

            <TouchableOpacity onPress={handleAuth} style={styles.primaryButton} activeOpacity={0.8}>
              <Text style={styles.primaryButtonText}>Sign In</Text>
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity onPress={handleGoogleSignIn} style={styles.secondaryButton} activeOpacity={0.8}>
              <Text style={styles.secondaryButtonText}>Continue with Google</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <Link href="/(auth)/sign-up" asChild>
              <TouchableOpacity>
                <Text style={styles.footerLink}>Sign Up</Text>
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
  header: { alignItems: 'center', marginBottom: 40 },
  logoText: { fontSize: 36, fontWeight: '700', color: '#ffffff', letterSpacing: -0.5, marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#8e8e93', textAlign: 'center' },
  form: { width: '100%' },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '500', color: '#ffffff', marginBottom: 8, marginLeft: 4 },
  input: {
    backgroundColor: '#1e1e1e',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 15,
    color: '#ffffff',
    textAlign: 'left',
    writingDirection: 'ltr',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 16,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 15,
    color: '#ffffff',
    textAlign: 'left',
    writingDirection: 'ltr',
  },
  eyeIcon: { padding: 16 },
  optionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, paddingHorizontal: 4 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center' },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#555555',
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  checkboxActive: { backgroundColor: '#d4af37', borderColor: '#d4af37' },
  checkboxLabel: { fontSize: 14, color: '#e0e0e0' },
  forgotPasswordText: { fontSize: 14, color: '#d4af37', fontWeight: '500' },
  primaryButton: {
    backgroundColor: '#d4af37',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  primaryButtonText: { color: '#000000', fontSize: 16, fontWeight: '600', letterSpacing: 0.3 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#333333' },
  dividerText: { marginHorizontal: 16, color: '#666666', fontSize: 12, fontWeight: '600', letterSpacing: 1 },
  secondaryButton: {
    backgroundColor: '#1e1e1e',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '500' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 40 },
  footerText: { color: '#8e8e93', fontSize: 14 },
  footerLink: { color: '#d4af37', fontSize: 14, fontWeight: '600' },
});

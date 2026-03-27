import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, StyleSheet, ScrollView, Alert } from 'react-native';
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

export default function SignUp() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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
      Alert.alert("Google Sign Up Error", error.message || "Failed to initiate Google Login.");
    }
  };

  const handleAuth = async () => {
    if (!hasSupabaseConfig) {
      Alert.alert("Missing Configuration", "Please configure Supabase ENV variables.");
      return;
    }
    if (!email || !password || !fullName) {
      Alert.alert("Error", "Please fill out all required fields.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: { data: { full_name: fullName } }
    });
    
    if (error) {
      Alert.alert("Sign Up Failed", error.message);
    } else {
      if (!data.session) {
        Alert.alert("Check your inbox", "We sent you a confirmation email. Please verify it to sign in.");
      } else {
        router.replace('/(tabs)/explore');
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Start building your personal style profile</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput 
                style={styles.input}
                placeholder="Enter your full name"
                placeholderTextColor="#666666"
                value={fullName}
                onChangeText={setFullName}
              />
            </View>

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

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput 
                  style={styles.passwordInput}
                  placeholder="Create a password"
                  placeholderTextColor="#666666"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  <IconSymbol name={showPassword ? "eye.slash.fill" : "eye.fill"} size={18} color="#8e8e93" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput 
                style={styles.input}
                placeholder="Confirm your password"
                placeholderTextColor="#666666"
                secureTextEntry={!showPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>

            <TouchableOpacity onPress={handleAuth} style={styles.primaryButton} activeOpacity={0.8}>
              <Text style={styles.primaryButtonText}>Create Account</Text>
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
            <Text style={styles.footerText}>Already have an account? </Text>
            <Link href="/(auth)/sign-in" asChild>
              <TouchableOpacity>
                <Text style={styles.footerLink}>Sign In</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#121212' },
  keyboardView: { flex: 1 },
  scrollContent: { paddingHorizontal: 32, paddingVertical: 40, flexGrow: 1, justifyContent: 'center' },
  header: { marginBottom: 32 },
  title: { fontSize: 32, fontWeight: '700', color: '#ffffff', letterSpacing: -0.5, marginBottom: 10 },
  subtitle: { fontSize: 15, color: '#8e8e93', lineHeight: 22 },
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
  primaryButton: {
    backgroundColor: '#d4af37',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
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
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 32, marginBottom: 20 },
  footerText: { color: '#8e8e93', fontSize: 14 },
  footerLink: { color: '#d4af37', fontSize: 14, fontWeight: '600' },
});

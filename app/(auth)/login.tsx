import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ImageBackground, KeyboardAvoidingView, Platform, StatusBar, ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { Colors } from '../../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

const BANNER = 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?q=80&w=1200';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  const validate = () => {
    if (!email.trim()) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email';
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters';
    return null;
  };

  const handleLogin = async () => {
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    setError('');
    try {
      await signIn(email.trim().toLowerCase(), password);
    } catch (e: any) {
      setError(e.message || 'Login failed. Check your credentials.');
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <ImageBackground source={{ uri: BANNER }} style={styles.bg}>
        <LinearGradient
          colors={['rgba(15,23,42,0.55)', 'rgba(15,23,42,0.9)']}
          style={StyleSheet.absoluteFill}
        />
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
            <SafeAreaView style={styles.inner}>
              {/* Logo */}
              <View style={styles.logoWrap}>
                <View style={styles.logoIcon}>
                  <Ionicons name="airplane" size={32} color="#FFF" />
                </View>
                <Text style={styles.logoText}>Traveloop</Text>
                <Text style={styles.logoSub}>Plan. Explore. Experience.</Text>
              </View>

              {/* Form Card */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Welcome back</Text>
                <Text style={styles.cardSub}>Sign in to continue</Text>

                {error ? (
                  <View style={styles.errorBox}>
                    <Ionicons name="alert-circle" size={16} color={Colors.error} />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                <View style={styles.inputWrap}>
                  <Ionicons name="mail-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Email address"
                    placeholderTextColor={Colors.textMuted}
                    value={email}
                    onChangeText={v => { setEmail(v); setError(''); }}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    textContentType="emailAddress"
                  />
                </View>

                <View style={styles.inputWrap}>
                  <Ionicons name="lock-closed-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Password"
                    placeholderTextColor={Colors.textMuted}
                    value={password}
                    onChangeText={v => { setPassword(v); setError(''); }}
                    secureTextEntry={!showPass}
                    textContentType="password"
                  />
                  <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                    <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textMuted} />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[styles.loginBtn, isLoading && { opacity: 0.7 }]}
                  onPress={handleLogin}
                  disabled={isLoading}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={[Colors.primary, Colors.primaryDark]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={styles.loginGradient}
                  >
                    {isLoading ? (
                      <Text style={styles.loginText}>Signing in…</Text>
                    ) : (
                      <>
                        <Text style={styles.loginText}>Sign In</Text>
                        <Ionicons name="arrow-forward" size={20} color="#FFF" />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.registerLink}
                  onPress={() => router.push('/(auth)/signup')}
                >
                  <Text style={styles.registerLinkText}>
                    Don't have an account?{' '}
                    <Text style={{ color: Colors.primary, fontFamily: 'Nunito_700Bold' }}>Register</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </ScrollView>
        </KeyboardAvoidingView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  bg: { flex: 1 },
  inner: { flex: 1, justifyContent: 'center', padding: 24 },
  logoWrap: { alignItems: 'center', marginBottom: 32 },
  logoIcon: { width: 72, height: 72, borderRadius: 22, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 14, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 12 },
  logoText: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 36, color: '#FFF', marginBottom: 6 },
  logoSub: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: 'rgba(255,255,255,0.7)' },
  card: { backgroundColor: '#FFF', borderRadius: 28, padding: 28, shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.2, shadowRadius: 40, elevation: 20 },
  cardTitle: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 26, color: Colors.text, marginBottom: 4 },
  cardSub: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.textSecondary, marginBottom: 24 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEE2E2', borderRadius: 12, padding: 12, marginBottom: 16 },
  errorText: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: Colors.error, flex: 1 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.border, marginBottom: 14, paddingHorizontal: 14 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontFamily: 'Nunito_400Regular', fontSize: 15, color: Colors.text, paddingVertical: 14 },
  eyeBtn: { padding: 4 },
  loginBtn: { borderRadius: 16, overflow: 'hidden', marginTop: 8, marginBottom: 20 },
  loginGradient: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 17, gap: 10 },
  loginText: { fontFamily: 'Nunito_700Bold', fontSize: 17, color: '#FFF' },
  registerLink: { alignItems: 'center' },
  registerLinkText: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.textSecondary },
});

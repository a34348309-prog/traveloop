import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, StatusBar, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { Colors } from '../../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';

const FIELDS = [
  { key: 'firstName', label: 'First Name', icon: 'person-outline', required: true },
  { key: 'lastName', label: 'Last Name', icon: 'person-outline', required: true },
  { key: 'email', label: 'Email Address', icon: 'mail-outline', required: true, keyboard: 'email-address' as const },
  { key: 'password', label: 'Password', icon: 'lock-closed-outline', required: true, secure: true },
  { key: 'phone', label: 'Phone Number', icon: 'call-outline', keyboard: 'phone-pad' as const },
  { key: 'city', label: 'City', icon: 'location-outline' },
  { key: 'country', label: 'Country', icon: 'flag-outline' },
  { key: 'additionalInfo', label: 'Additional Information', icon: 'information-circle-outline', multiline: true },
];

export default function SignupScreen() {
  const router = useRouter();
  const { signUp, isLoading } = useAuthStore();
  const [form, setForm] = useState<Record<string, string>>({ country: 'India' });
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  const setField = (key: string, val: string) => {
    setForm(f => ({ ...f, [key]: val }));
    setError('');
  };

  const pickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Please allow photo access to upload a profile picture.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (!result.canceled) setAvatarUri(result.assets[0].uri);
  };

  const validate = () => {
    if (!form.firstName?.trim()) return 'First name is required';
    if (!form.lastName?.trim()) return 'Last name is required';
    if (!form.email?.trim()) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Invalid email format';
    if (!form.password) return 'Password is required';
    if (form.password.length < 6) return 'Password must be at least 6 characters';
    return null;
  };

  const handleRegister = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    try {
      await signUp({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        name: `${form.firstName.trim()} ${form.lastName.trim()}`,
        phone: form.phone,
        city: form.city,
        country: form.country || 'India',
        additional_info: form.additionalInfo,
      });
      // Avatar upload logic using local backend can be added here
    } catch (e: any) {
      setError(e.message || 'Registration failed');
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.header}>
        <SafeAreaView style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Account</Text>
          <Text style={styles.headerSub}>Join the Traveloop community</Text>
        </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Profile photo upload */}
          <TouchableOpacity style={styles.avatarPicker} onPress={pickAvatar}>
            {avatarUri ? (
              <View style={styles.avatarPreview}>
                <Ionicons name="person-circle" size={80} color={Colors.primary} />
                <View style={styles.avatarCheck}><Ionicons name="checkmark" size={14} color="#FFF" /></View>
              </View>
            ) : (
              <>
                <Ionicons name="camera-outline" size={36} color={Colors.primary} />
                <Text style={styles.avatarPickerText}>Upload Profile Photo</Text>
              </>
            )}
          </TouchableOpacity>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={Colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Form fields */}
          <View style={styles.row}>
            {FIELDS.filter(f => f.key === 'firstName' || f.key === 'lastName').map(field => (
              <View key={field.key} style={[styles.inputWrap, { flex: 1 }]}>
                <Ionicons name={field.icon as any} size={18} color={Colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={field.label}
                  placeholderTextColor={Colors.textMuted}
                  value={form[field.key] || ''}
                  onChangeText={v => setField(field.key, v)}
                />
              </View>
            ))}
          </View>

          {FIELDS.filter(f => f.key !== 'firstName' && f.key !== 'lastName').map(field => (
            <View key={field.key} style={styles.inputWrap}>
              <Ionicons name={field.icon as any} size={18} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, field.multiline && { height: 80 }]}
                placeholder={field.label}
                placeholderTextColor={Colors.textMuted}
                value={form[field.key] || ''}
                onChangeText={v => setField(field.key, v)}
                secureTextEntry={field.secure && !showPass}
                keyboardType={field.keyboard}
                autoCapitalize={field.key === 'email' ? 'none' : 'words'}
                multiline={field.multiline}
                textAlignVertical={field.multiline ? 'top' : 'center'}
              />
              {field.secure && (
                <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                  <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.textMuted} />
                </TouchableOpacity>
              )}
              {field.required && <Text style={styles.required}>*</Text>}
            </View>
          ))}

          <TouchableOpacity
            style={[styles.registerBtn, isLoading && { opacity: 0.7 }]}
            onPress={handleRegister}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.primaryDark]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.registerGradient}
            >
              <Text style={styles.registerText}>{isLoading ? 'Creating Account…' : 'Register Now'}</Text>
              {!isLoading && <Ionicons name="arrow-forward" size={20} color="#FFF" />}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginLink} onPress={() => router.back()}>
            <Text style={styles.loginLinkText}>
              Already have an account?{' '}
              <Text style={{ color: Colors.primary, fontFamily: 'Nunito_700Bold' }}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: { paddingBottom: 28 },
  headerContent: { paddingHorizontal: 24, paddingTop: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  headerTitle: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 30, color: '#FFF', marginBottom: 4 },
  headerSub: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  content: { padding: 24, paddingBottom: 60 },
  avatarPicker: { alignSelf: 'center', width: 110, height: 110, borderRadius: 55, backgroundColor: Colors.primaryMuted, justifyContent: 'center', alignItems: 'center', marginBottom: 24, borderWidth: 2, borderColor: Colors.primary, borderStyle: 'dashed' },
  avatarPreview: { position: 'relative' },
  avatarCheck: { position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.accent, justifyContent: 'center', alignItems: 'center' },
  avatarPickerText: { fontFamily: 'Nunito_700Bold', fontSize: 12, color: Colors.primary, marginTop: 6, textAlign: 'center' },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEE2E2', borderRadius: 12, padding: 12, marginBottom: 16 },
  errorText: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: Colors.error, flex: 1 },
  row: { flexDirection: 'row', gap: 10 },
  inputWrap: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: Colors.surface, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.border, paddingHorizontal: 14, marginBottom: 12, minHeight: 52 },
  inputIcon: { marginRight: 10, marginTop: 16 },
  input: { flex: 1, fontFamily: 'Nunito_400Regular', fontSize: 15, color: Colors.text, paddingVertical: 14 },
  required: { color: Colors.error, fontSize: 16, marginTop: 14, marginLeft: 2 },
  registerBtn: { borderRadius: 16, overflow: 'hidden', marginTop: 8, marginBottom: 20 },
  registerGradient: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 17, gap: 10 },
  registerText: { fontFamily: 'Nunito_700Bold', fontSize: 17, color: '#FFF' },
  loginLink: { alignItems: 'center' },
  loginLinkText: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.textSecondary },
});

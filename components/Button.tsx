import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/colors';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export default function Button({ label, onPress, variant = 'primary', size = 'md', loading = false, disabled = false, icon, style }: ButtonProps) {
  const sizeStyles = {
    sm: { paddingHorizontal: 16, paddingVertical: 10, fontSize: 13 },
    md: { paddingHorizontal: 24, paddingVertical: 16, fontSize: 15 },
    lg: { paddingHorizontal: 32, paddingVertical: 20, fontSize: 17 },
  };

  const s = sizeStyles[size];

  if (variant === 'primary') {
    return (
      <TouchableOpacity onPress={onPress} disabled={disabled || loading} style={[styles.base, style]} activeOpacity={0.85}>
        <LinearGradient
          colors={disabled ? ['#CBD5E1', '#CBD5E1'] : [Colors.primary, Colors.primaryDark]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={[styles.gradient, { paddingHorizontal: s.paddingHorizontal, paddingVertical: s.paddingVertical }]}
        >
          {icon && !loading && icon}
          {loading ? <ActivityIndicator color="#FFF" size="small" /> : (
            <Text style={[styles.primaryLabel, { fontSize: s.fontSize, marginLeft: icon ? 8 : 0 }]}>{label}</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  if (variant === 'secondary') {
    return (
      <TouchableOpacity onPress={onPress} disabled={disabled || loading} activeOpacity={0.85}
        style={[styles.base, { backgroundColor: Colors.secondary, shadowColor: Colors.secondary }, style]}>
        <LinearGradient
          colors={[Colors.secondary, Colors.secondaryDark]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={[styles.gradient, { paddingHorizontal: s.paddingHorizontal, paddingVertical: s.paddingVertical }]}
        >
          {loading ? <ActivityIndicator color="#FFF" size="small" /> : (
            <Text style={[styles.primaryLabel, { fontSize: s.fontSize }]}>{label}</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  if (variant === 'outline') {
    return (
      <TouchableOpacity onPress={onPress} disabled={disabled || loading} activeOpacity={0.7}
        style={[styles.base, styles.outline, { paddingHorizontal: s.paddingHorizontal, paddingVertical: s.paddingVertical }, style]}>
        {loading ? <ActivityIndicator color={Colors.primary} size="small" /> : (
          <Text style={[styles.outlineLabel, { fontSize: s.fontSize }]}>{label}</Text>
        )}
      </TouchableOpacity>
    );
  }

  if (variant === 'ghost') {
    return (
      <TouchableOpacity onPress={onPress} disabled={disabled || loading} activeOpacity={0.7}
        style={[styles.base, { paddingHorizontal: s.paddingHorizontal, paddingVertical: s.paddingVertical }, style]}>
        <Text style={[styles.ghostLabel, { fontSize: s.fontSize }]}>{label}</Text>
      </TouchableOpacity>
    );
  }

  if (variant === 'danger') {
    return (
      <TouchableOpacity onPress={onPress} disabled={disabled || loading} activeOpacity={0.85}
        style={[styles.base, styles.danger, { paddingHorizontal: s.paddingHorizontal, paddingVertical: s.paddingVertical }, style]}>
        {loading ? <ActivityIndicator color="#FFF" size="small" /> : (
          <Text style={[styles.primaryLabel, { fontSize: s.fontSize }]}>{label}</Text>
        )}
      </TouchableOpacity>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  base: { borderRadius: 16, overflow: 'hidden', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 6, alignSelf: 'stretch' },
  gradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  primaryLabel: { fontFamily: 'Nunito_700Bold', color: '#FFFFFF', letterSpacing: 0.3 },
  outline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: Colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', shadowOpacity: 0 },
  outlineLabel: { fontFamily: 'Nunito_700Bold', color: Colors.primary },
  ghostLabel: { fontFamily: 'Nunito_700Bold', color: Colors.textSecondary },
  danger: { backgroundColor: Colors.error, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', shadowColor: Colors.error },
});

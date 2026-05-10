import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

export default function SharedTripScreen() {
  const { shareToken } = useLocalSearchParams();
  const router = useRouter();

  const handleCopyTrip = () => {
    Toast.show({ type: 'success', text1: 'Trip Copied', text2: 'Added to your account!' });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={28} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shared Itinerary</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroBanner}>
          <Text style={styles.tripName}>Amazing Euro Trip</Text>
          <Text style={styles.tripMeta}>Token: {shareToken}</Text>
        </View>

        <View style={styles.stopCard}>
          <Text style={styles.stopCity}>Paris, France</Text>
          <Text style={styles.stopDates}>2026-06-01 to 2026-06-05</Text>
          <View style={styles.activityItem}>
            <View style={styles.activityDot} />
            <Text style={styles.actName}>Eiffel Tower Visit</Text>
          </View>
        </View>

        <View style={styles.summaryBanner}>
          <Text style={styles.summaryLabel}>Total Estimated Cost</Text>
          <Text style={styles.summaryValue}>₹1,250</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.copyBtn} onPress={handleCopyTrip}>
          <Ionicons name="copy-outline" size={20} color="#FFF" />
          <Text style={styles.copyBtnText}>Copy Trip</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 60, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle: { fontFamily: 'Nunito_700Bold', fontSize: 18, color: Colors.text },
  content: { padding: 16 },
  heroBanner: { backgroundColor: Colors.primary + '20', padding: 24, borderRadius: 16, marginBottom: 24, alignItems: 'center' },
  tripName: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 28, color: Colors.primary, marginBottom: 8, textAlign: 'center' },
  tripMeta: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.textSecondary },
  stopCard: { backgroundColor: Colors.card, padding: 16, borderRadius: 12, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  stopCity: { fontFamily: 'Nunito_700Bold', fontSize: 18, color: Colors.text, marginBottom: 4 },
  stopDates: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.textSecondary, marginBottom: 12 },
  activityItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  activityDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary, marginRight: 8 },
  actName: { fontFamily: 'Nunito_400Regular', fontSize: 16, color: Colors.text },
  summaryBanner: { backgroundColor: Colors.accent, padding: 20, borderRadius: 16, alignItems: 'center', marginTop: 16 },
  summaryLabel: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: '#FFF', marginBottom: 4 },
  summaryValue: { fontFamily: 'Nunito_700Bold', fontSize: 24, color: Colors.primary },
  footer: { padding: 16, backgroundColor: Colors.card, borderTopWidth: 1, borderTopColor: Colors.border },
  copyBtn: { backgroundColor: Colors.primary, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 16, borderRadius: 12 },
  copyBtnText: { fontFamily: 'Nunito_700Bold', color: '#FFF', fontSize: 18, marginLeft: 8 },
});

import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ImageBackground } from 'react-native';
import { Colors } from '../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface TripCardProps {
  trip: any;
  onPress: () => void;
  onLongPress?: () => void;
  style?: any;
}

const TRIP_IMAGES = [
  'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=800',
  'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=800',
  'https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=800',
  'https://images.unsplash.com/photo-1552832230-c0197dd311b5?q=80&w=800',
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=800',
  'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=800',
];

export default function TripCard({ trip, onPress, onLongPress, style }: TripCardProps) {
  const imageUri = trip.cover_photo_uri || TRIP_IMAGES[trip.id % TRIP_IMAGES.length];

  return (
    <TouchableOpacity onPress={onPress} onLongPress={onLongPress} activeOpacity={0.92} style={[styles.card, style]}>
      <ImageBackground source={{ uri: imageUri }} style={styles.image} imageStyle={{ borderRadius: 20 }}>
        <LinearGradient colors={['rgba(15,23,42,0)', 'rgba(15,23,42,0.88)']} style={styles.gradient}>
          <View style={styles.topRow}>
            {trip.is_public ? (
              <View style={styles.publicBadge}>
                <Ionicons name="globe-outline" size={12} color={Colors.accent} />
                <Text style={styles.publicBadgeText}>Public</Text>
              </View>
            ) : <View />}
            <View style={styles.menuBtn}>
              <Ionicons name="ellipsis-horizontal" size={18} color="#FFF" />
            </View>
          </View>
          <View style={styles.bottomContent}>
            <Text style={styles.tripName} numberOfLines={1}>{trip.name}</Text>
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="calendar-outline" size={13} color="rgba(255,255,255,0.8)" />
                <Text style={styles.metaText}>{trip.start_date} - {trip.end_date}</Text>
              </View>
            </View>
            {trip.description ? (
              <Text style={styles.desc} numberOfLines={2}>{trip.description}</Text>
            ) : null}
            <View style={styles.footer}>
              <View style={styles.footerLeft}>
                <Ionicons name="location-outline" size={14} color={Colors.secondaryLight} />
                <Text style={styles.footerText}>View Itinerary</Text>
              </View>
              <View style={styles.arrowBtn}>
                <Ionicons name="arrow-forward" size={16} color="#FFF" />
              </View>
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 20, overflow: 'hidden', height: 240, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.18, shadowRadius: 20, elevation: 10 },
  image: { flex: 1 },
  gradient: { flex: 1, padding: 16, justifyContent: 'space-between' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  publicBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16,185,129,0.15)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)' },
  publicBadgeText: { fontFamily: 'Nunito_700Bold', fontSize: 11, color: Colors.accent, marginLeft: 4 },
  menuBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  bottomContent: { },
  tripName: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 22, color: '#FFF', marginBottom: 8 },
  metaRow: { flexDirection: 'row', marginBottom: 8 },
  metaItem: { flexDirection: 'row', alignItems: 'center', marginRight: 16 },
  metaText: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.8)', marginLeft: 4 },
  desc: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.65)', marginBottom: 12 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerLeft: { flexDirection: 'row', alignItems: 'center' },
  footerText: { fontFamily: 'Nunito_700Bold', fontSize: 13, color: Colors.secondaryLight, marginLeft: 4 },
  arrowBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
});

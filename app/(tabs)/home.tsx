import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ImageBackground, StatusBar, ActivityIndicator, FlatList
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { useQuery } from '@tanstack/react-query';
import { getPlacesNearby, formatKinds } from '../../lib/api/opentripmap';
import { INDIA_FALLBACK_IMAGES } from '../../lib/api/unsplash';
import { API_BASE_URL } from '../../lib/apiConfig';
import { Colors } from '../../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

// Popular Indian destinations with coords for OpenTripMap
const REGIONAL_SPOTS = [
  { name: 'Jaipur', lat: 26.9124, lng: 75.7873 },
  { name: 'Goa', lat: 15.2993, lng: 74.1240 },
  { name: 'Munnar', lat: 10.0889, lng: 77.0595 },
  { name: 'Varanasi', lat: 25.3176, lng: 82.9739 },
  { name: 'Leh', lat: 34.1526, lng: 77.5771 },
  { name: 'Udaipur', lat: 24.5854, lng: 73.7125 },
];

function TripStatusBadge({ trip }: { trip: any }) {
  const today = new Date().toISOString().split('T')[0];
  let label = 'Upcoming', color = Colors.primary;
  if (trip.end_date && trip.end_date < today) { label = 'Completed'; color = Colors.textMuted; }
  else if (trip.start_date && trip.start_date <= today && (!trip.end_date || trip.end_date >= today)) { label = 'Ongoing'; color = Colors.accent; }
  return (
    <View style={[styles.badge, { backgroundColor: color + '20' }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

export default function HomeScreen() {
  const { profile } = useAuthStore();
  const router = useRouter();
  const [search, setSearch] = useState('');

  const { data: trips = [], isLoading: tripsLoading } = useQuery({
    queryKey: ['local-trips', profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/trips/${profile!.id}`);
        if (!res.ok) return [];
        return await res.json();
      } catch (e) {
        return []; // Return empty trips if network fails
      }
    }
  });

  // Pull top regional selections from OpenTripMap
  const { data: regionalPlaces = [], isLoading: placesLoading } = useQuery({
    queryKey: ['regional-places'],
    queryFn: () => getPlacesNearby(20.5937, 78.9629, 500000, 'interesting_places', 12),
    staleTime: 1000 * 60 * 30,
  });

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const bannerImg = INDIA_FALLBACK_IMAGES[new Date().getDate() % INDIA_FALLBACK_IMAGES.length];
  const initials = profile?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'T';

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Banner */}
        <ImageBackground source={{ uri: bannerImg }} style={styles.banner}>
          <LinearGradient colors={['rgba(15,23,42,0.45)', 'rgba(15,23,42,0.85)']} style={styles.bannerGradient}>
            <SafeAreaView style={styles.bannerContent}>
              <View style={styles.bannerTop}>
                <View>
                  <Text style={styles.greeting}>{greeting()},</Text>
                  <Text style={styles.userName}>{profile?.name?.split(' ')[0] || 'Traveler'} 👋</Text>
                </View>
                <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </TouchableOpacity>
              </View>

              {/* Search Bar */}
              <TouchableOpacity style={styles.searchBar} onPress={() => router.push('/(tabs)/explore')}>
                <Ionicons name="search" size={20} color={Colors.textMuted} />
                <Text style={styles.searchPlaceholder}>Search destinations, activities…</Text>
              </TouchableOpacity>

              <Text style={styles.bannerTag}>Where do you want to go next?</Text>

              <TouchableOpacity
                style={styles.planCTA}
                onPress={() => router.push('/(tabs)/trips/create')}
                activeOpacity={0.9}
              >
                <LinearGradient colors={[Colors.secondary, '#EA580C']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.planCTAGradient}>
                  <Ionicons name="add-circle" size={22} color="#FFF" />
                  <Text style={styles.planCTAText}>Plan a Trip</Text>
                </LinearGradient>
              </TouchableOpacity>
            </SafeAreaView>
          </LinearGradient>
        </ImageBackground>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{trips.length}</Text>
            <Text style={styles.statLabel}>Trips</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{trips.filter((t: any) => t.status === 'completed' || (t.end_date && t.end_date < new Date().toISOString().split('T')[0])).length}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{REGIONAL_SPOTS.length}</Text>
            <Text style={styles.statLabel}>Destinations</Text>
          </View>
        </View>

        {/* Top Regional Selections */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Top Regional Selections</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/explore')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          {placesLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={Colors.primary} />
              <Text style={styles.loadingText}>Loading places…</Text>
            </View>
          ) : (
            <FlatList
              data={regionalPlaces.slice(0, 10)}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={item => item.xid}
              contentContainerStyle={styles.placesRow}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  style={styles.placeCard}
                  activeOpacity={0.9}
                  onPress={() => router.push({ pathname: '/(tabs)/explore', params: { xid: item.xid, name: item.name } })}
                >
                  <ImageBackground
                    source={{ uri: INDIA_FALLBACK_IMAGES[index % INDIA_FALLBACK_IMAGES.length] }}
                    style={styles.placeCardImg}
                    imageStyle={{ borderRadius: 16 }}
                  >
                    <LinearGradient colors={['transparent', 'rgba(15,23,42,0.8)']} style={styles.placeCardGradient}>
                      <Text style={styles.placeCardName} numberOfLines={1}>{item.name || 'Unnamed'}</Text>
                      <Text style={styles.placeCardKind}>{formatKinds(item.kinds)}</Text>
                    </LinearGradient>
                  </ImageBackground>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyPlaces}>
                  {REGIONAL_SPOTS.map(spot => (
                    <TouchableOpacity key={spot.name} style={styles.spotChip} onPress={() => router.push('/(tabs)/explore')}>
                      <Text style={styles.spotChipText}>{spot.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              }
            />
          )}
        </View>

        {/* Previous Trips */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Trips</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/trips')}>
              <Text style={styles.seeAll}>Manage All</Text>
            </TouchableOpacity>
          </View>

          {tripsLoading ? (
            <ActivityIndicator color={Colors.primary} style={{ marginTop: 16 }} />
          ) : trips.length === 0 ? (
            <View style={styles.noTrips}>
              <Ionicons name="map-outline" size={40} color={Colors.border} />
              <Text style={styles.noTripsText}>No trips yet. Start planning!</Text>
              <TouchableOpacity style={styles.noTripsBtn} onPress={() => router.push('/(tabs)/trips/create')}>
                <Text style={styles.noTripsBtnText}>+ Create First Trip</Text>
              </TouchableOpacity>
            </View>
          ) : (
            trips.slice(0, 5).map((trip: any) => (
              <TouchableOpacity
                key={trip.id}
                style={styles.tripRow}
                onPress={() => router.push(`/(tabs)/trips/${trip.id}/itinerary` as any)}
                activeOpacity={0.8}
              >
                <View style={styles.tripIcon}>
                  <Ionicons name="airplane" size={22} color={Colors.primary} />
                </View>
                <View style={styles.tripInfo}>
                  <Text style={styles.tripName}>{trip.name}</Text>
                  <Text style={styles.tripPlace}>{trip.place || 'No destination set'}</Text>
                  <Text style={styles.tripDate}>{trip.start_date || 'Dates TBD'}{trip.end_date ? ` → ${trip.end_date}` : ''}</Text>
                </View>
                <TripStatusBadge trip={trip} />
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  banner: { height: 320 },
  bannerGradient: { flex: 1 },
  bannerContent: { flex: 1, padding: 24, justifyContent: 'space-between' },
  bannerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 8 },
  greeting: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  userName: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 26, color: '#FFF' },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)' },
  avatarText: { fontFamily: 'Nunito_700Bold', fontSize: 17, color: '#FFF' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13, gap: 10 },
  searchPlaceholder: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.textMuted },
  bannerTag: { fontFamily: 'Nunito_400Regular', fontSize: 15, color: 'rgba(255,255,255,0.85)' },
  planCTA: { borderRadius: 16, overflow: 'hidden', alignSelf: 'flex-start' },
  planCTAGradient: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 22, paddingVertical: 13, gap: 8 },
  planCTAText: { fontFamily: 'Nunito_700Bold', fontSize: 16, color: '#FFF' },
  statsRow: { flexDirection: 'row', backgroundColor: Colors.surface, marginHorizontal: 20, marginTop: -24, borderRadius: 18, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 6 },
  statCard: { flex: 1, alignItems: 'center' },
  statNum: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 24, color: Colors.primary },
  statLabel: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: Colors.border },
  section: { paddingHorizontal: 20, marginTop: 28 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 20, color: Colors.text },
  seeAll: { fontFamily: 'Nunito_700Bold', fontSize: 14, color: Colors.primary },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16 },
  loadingText: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.textMuted },
  placesRow: { paddingRight: 20 },
  placeCard: { width: 150, height: 190, borderRadius: 16, marginRight: 12, overflow: 'hidden' },
  placeCardImg: { flex: 1 },
  placeCardGradient: { flex: 1, padding: 12, justifyContent: 'flex-end' },
  placeCardName: { fontFamily: 'Nunito_700Bold', fontSize: 14, color: '#FFF', marginBottom: 3 },
  placeCardKind: { fontFamily: 'Nunito_400Regular', fontSize: 11, color: 'rgba(255,255,255,0.75)' },
  emptyPlaces: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  spotChip: { backgroundColor: Colors.primaryMuted, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  spotChipText: { fontFamily: 'Nunito_700Bold', fontSize: 13, color: Colors.primary },
  noTrips: { alignItems: 'center', padding: 32, backgroundColor: Colors.surface, borderRadius: 18, borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed' },
  noTripsText: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.textSecondary, marginTop: 12, marginBottom: 16 },
  noTripsBtn: { backgroundColor: Colors.primaryMuted, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  noTripsBtnText: { fontFamily: 'Nunito_700Bold', fontSize: 14, color: Colors.primary },
  tripRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 },
  tripIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.primaryMuted, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  tripInfo: { flex: 1 },
  tripName: { fontFamily: 'Nunito_700Bold', fontSize: 15, color: Colors.text, marginBottom: 2 },
  tripPlace: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: Colors.textSecondary, marginBottom: 2 },
  tripDate: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: Colors.textMuted },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  badgeText: { fontFamily: 'Nunito_700Bold', fontSize: 11 },
});

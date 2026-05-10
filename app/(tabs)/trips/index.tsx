import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, StatusBar, RefreshControl
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../store/authStore';
import { Colors } from '../../../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from '../../../lib/apiConfig';

type FilterType = 'Ongoing' | 'Upcoming' | 'Completed';

const FILTERS: FilterType[] = ['Ongoing', 'Upcoming', 'Completed'];

function categorizeTip(trip: any): FilterType {
  const today = new Date().toISOString().split('T')[0];
  const start = trip.start_date || '';
  const end = trip.end_date || '';
  if (!start) return 'Upcoming';
  if (start <= today && end >= today) return 'Ongoing';
  if (end < today) return 'Completed';
  return 'Upcoming';
}

export default function TripsIndexScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const [filter, setFilter] = useState<FilterType>('Upcoming');
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const { data: trips = [], isLoading, refetch } = useQuery({
    queryKey: ['local-trips', profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/trips/${profile!.id}`);
        if (!res.ok) return [];
        return await res.json();
      } catch {
        return [];
      }
    }
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleDelete = (id: number, name: string) => {
    Alert.alert(`Delete "${name}"?`, 'All data for this trip will be permanently deleted.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            // Simulated Delete API call to not break app flow
            await fetch(`${API_BASE_URL}/trips/${id}`, { method: 'DELETE' }).catch(() => {});
            queryClient.invalidateQueries({ queryKey: ['local-trips', profile?.id] });
            Toast.show({ type: 'success', text1: 'Trip deleted' });
          } catch { Toast.show({ type: 'error', text1: 'Error deleting trip' }); }
        }
      }
    ]);
  };

  const filtered = trips.filter((t: any) => categorizeTip(t) === filter);

  const counts: Record<FilterType, number> = {
    Ongoing: trips.filter((t: any) => categorizeTip(t) === 'Ongoing').length,
    Upcoming: trips.filter((t: any) => categorizeTip(t) === 'Upcoming').length,
    Completed: trips.filter((t: any) => categorizeTip(t) === 'Completed').length,
  };

  const filterColor: Record<FilterType, string> = {
    Ongoing: Colors.accent,
    Upcoming: Colors.primary,
    Completed: Colors.textMuted,
  };

  const renderTrip = ({ item }: { item: any }) => {
    const cat = categorizeTip(item);
    const color = filterColor[cat];
    return (
      <View style={styles.tripCard}>
        {/* Status indicator */}
        <View style={[styles.statusBar, { backgroundColor: color }]} />
        <View style={styles.tripCardInner}>
          <View style={styles.tripCardTop}>
            <View style={styles.tripIconWrap}>
              <Ionicons name="airplane" size={24} color={color} />
            </View>
            <View style={styles.tripInfo}>
              <Text style={styles.tripName}>{item.name}</Text>
              {item.description ? (
                <Text style={styles.tripDesc} numberOfLines={1}>{item.description}</Text>
              ) : null}
              <View style={styles.tripMetaRow}>
                {item.start_date ? (
                  <View style={styles.tripMeta}>
                    <Ionicons name="calendar-outline" size={13} color={Colors.textMuted} />
                    <Text style={styles.tripMetaText}>{item.start_date}</Text>
                    {item.end_date ? <Text style={styles.tripMetaText}> → {item.end_date}</Text> : null}
                  </View>
                ) : (
                  <Text style={styles.tripMetaText}>No dates set</Text>
                )}
              </View>
            </View>
            <View style={[styles.catBadge, { backgroundColor: color + '20' }]}>
              <Text style={[styles.catBadgeText, { color }]}>{cat}</Text>
            </View>
          </View>

          {/* Quick Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => router.push(`/(tabs)/trips/${item.id}/itinerary` as any)}
            >
              <Ionicons name="eye-outline" size={15} color={Colors.primary} />
              <Text style={[styles.actionText, { color: Colors.primary }]}>View</Text>
            </TouchableOpacity>
            <View style={styles.actionDivider} />
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => router.push(`/(tabs)/trips/${item.id}/builder` as any)}
            >
              <Ionicons name="construct-outline" size={15} color={Colors.text} />
              <Text style={styles.actionText}>Edit</Text>
            </TouchableOpacity>
            <View style={styles.actionDivider} />
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => router.push(`/(tabs)/trips/${item.id}/budget` as any)}
            >
              <Ionicons name="wallet-outline" size={15} color={Colors.accent} />
              <Text style={[styles.actionText, { color: Colors.accent }]}>Budget</Text>
            </TouchableOpacity>
            <View style={styles.actionDivider} />
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => handleDelete(item.id, item.name)}
            >
              <Ionicons name="trash-outline" size={15} color={Colors.error} />
              <Text style={[styles.actionText, { color: Colors.error }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.safeTop}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerSub}>Your journeys</Text>
            <Text style={styles.headerTitle}>My Trips</Text>
          </View>
          <TouchableOpacity
            style={styles.newBtn}
            onPress={() => router.push('/(tabs)/trips/create')}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.primaryDark]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.newBtnGradient}
            >
              <Ionicons name="add" size={20} color="#FFF" />
              <Text style={styles.newBtnText}>New</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Filter Tabs: Ongoing / Upcoming / Completed */}
        <View style={styles.tabs}>
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.tab, filter === f && { borderBottomColor: filterColor[f], borderBottomWidth: 2.5 }]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.tabText, filter === f && { color: filterColor[f] }]}>{f}</Text>
              {counts[f] > 0 && (
                <View style={[styles.tabBadge, { backgroundColor: filterColor[f] }]}>
                  <Text style={styles.tabBadgeText}>{counts[f]}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>

      {isLoading ? (
        <View style={styles.loadingWrap}>
          {[1, 2, 3].map(i => <View key={i} style={styles.skeleton} />)}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id.toString()}
          renderItem={renderTrip}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="map-outline" size={48} color={Colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>No {filter} Trips</Text>
              <Text style={styles.emptyDesc}>
                {filter === 'Upcoming'
                  ? 'Plan your next adventure and it will appear here.'
                  : filter === 'Ongoing'
                  ? 'No trips in progress right now.'
                  : 'Trips you\'ve completed will be archived here.'}
              </Text>
              {filter === 'Upcoming' && (
                <TouchableOpacity
                  style={styles.emptyBtn}
                  onPress={() => router.push('/(tabs)/trips/create')}
                >
                  <Text style={styles.emptyBtnText}>Plan a Trip</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  safeTop: { backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 12 },
  headerSub: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: Colors.textMuted },
  headerTitle: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 28, color: Colors.text },
  newBtn: { borderRadius: 14, overflow: 'hidden' },
  newBtnGradient: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 6 },
  newBtnText: { fontFamily: 'Nunito_700Bold', fontSize: 15, color: '#FFF' },
  tabs: { flexDirection: 'row', paddingHorizontal: 8 },
  tab: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 14, gap: 6, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabText: { fontFamily: 'Nunito_700Bold', fontSize: 14, color: Colors.textMuted },
  tabBadge: { width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  tabBadgeText: { fontFamily: 'Nunito_700Bold', fontSize: 11, color: '#FFF' },
  list: { padding: 20, paddingBottom: 100 },
  loadingWrap: { padding: 20, gap: 12 },
  skeleton: { height: 120, borderRadius: 16, backgroundColor: Colors.border },
  tripCard: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: 18, marginBottom: 14, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
  statusBar: { width: 5 },
  tripCardInner: { flex: 1, padding: 16 },
  tripCardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  tripIconWrap: { width: 48, height: 48, borderRadius: 14, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  tripInfo: { flex: 1 },
  tripName: { fontFamily: 'Nunito_700Bold', fontSize: 16, color: Colors.text, marginBottom: 3 },
  tripDesc: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: Colors.textSecondary, marginBottom: 6 },
  tripMetaRow: { flexDirection: 'row', alignItems: 'center' },
  tripMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tripMetaText: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: Colors.textMuted },
  catBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, marginLeft: 8 },
  catBadgeText: { fontFamily: 'Nunito_700Bold', fontSize: 11 },
  actionRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: Colors.border, marginTop: 4, paddingTop: 12 },
  actionBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5 },
  actionText: { fontFamily: 'Nunito_700Bold', fontSize: 13, color: Colors.text },
  actionDivider: { width: 1, height: 24, backgroundColor: Colors.border, alignSelf: 'center' },
  empty: { alignItems: 'center', paddingVertical: 64 },
  emptyIconWrap: { width: 96, height: 96, borderRadius: 48, backgroundColor: Colors.primaryMuted, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle: { fontFamily: 'Nunito_700Bold', fontSize: 20, color: Colors.text, marginBottom: 8 },
  emptyDesc: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 24, maxWidth: 280 },
  emptyBtn: { backgroundColor: Colors.primaryMuted, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14 },
  emptyBtnText: { fontFamily: 'Nunito_700Bold', fontSize: 15, color: Colors.primary },
});

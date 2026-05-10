import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, StatusBar, ImageBackground
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getDB } from '../../../../db/schema';
import { Colors } from '../../../../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import Toast from 'react-native-toast-message';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

const CITY_IMAGES: Record<string, string> = {
  'Paris': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=600',
  'Tokyo': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=600',
  'Bali': 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=600',
  'Rome': 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?q=80&w=600',
  'Bangkok': 'https://images.unsplash.com/photo-1555921015-5532091f6026?q=80&w=600',
  'Barcelona': 'https://images.unsplash.com/photo-1583422409516-2895a77efded?q=80&w=600',
  'New York': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?q=80&w=600',
  'Dubai': 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=600',
  'Singapore': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?q=80&w=600',
  'Prague': 'https://images.unsplash.com/photo-1519677100203-a0e668c92439?q=80&w=600',
};
const DEFAULT_IMG = 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=600';

export default function ItineraryBuilderScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [stops, setStops] = useState<any[]>([]);
  const [trip, setTrip] = useState<any>(null);

  const loadStops = async () => {
    try {
      const db = getDB();
      const loadedStops = await db.getAllAsync('SELECT * FROM stops WHERE trip_id = ? ORDER BY order_index ASC', [Number(id)]);
      setStops(loadedStops);
      const t = await db.getFirstAsync('SELECT * FROM trips WHERE id = ?', [Number(id)]);
      setTrip(t);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { loadStops(); }, [id]);

  const handleDelete = (stopId: number, cityName: string) => {
    Alert.alert(`Remove ${cityName}?`, 'All activities for this stop will also be removed.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            const db = getDB();
            await db.runAsync('DELETE FROM stops WHERE id = ?', [stopId]);
            loadStops();
            Toast.show({ type: 'success', text1: `${cityName} removed` });
          } catch { Toast.show({ type: 'error', text1: 'Error removing stop' }); }
        }
      }
    ]);
  };

  const handleDragEnd = async ({ data }: { data: any[] }) => {
    setStops(data);
    try {
      const db = getDB();
      for (let i = 0; i < data.length; i++) {
        await db.runAsync('UPDATE stops SET order_index = ? WHERE id = ?', [i + 1, data[i].id]);
      }
    } catch (e) { console.error('Failed to save order:', e); }
  };

  const renderItem = ({ item, drag, isActive }: RenderItemParams<any>) => {
    const img = CITY_IMAGES[item.city_name] || DEFAULT_IMG;
    return (
      <TouchableOpacity
        onLongPress={drag}
        activeOpacity={0.9}
        style={[styles.stopCard, isActive && styles.stopCardActive]}
        onPress={() => router.push(`/(tabs)/trips/${id}/stops/${item.id}/activities` as any)}
      >
        <ImageBackground source={{ uri: img }} style={styles.cardImage} imageStyle={{ borderRadius: 18 }}>
          <LinearGradient colors={['rgba(15,23,42,0.15)', 'rgba(15,23,42,0.85)']} style={styles.cardGradient}>
            <View style={styles.cardTop}>
              <View style={styles.dragHandle}>
                <Ionicons name="reorder-three" size={22} color="rgba(255,255,255,0.7)" />
              </View>
              <TouchableOpacity onPress={() => handleDelete(item.id, item.city_name)} style={styles.deleteBtn}>
                <Ionicons name="trash-outline" size={18} color="#FFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.cardBottom}>
              <Text style={styles.cityName}>{item.city_name}</Text>
              <Text style={styles.countryName}>{item.country}</Text>
              <View style={styles.datesRow}>
                <Ionicons name="calendar-outline" size={13} color="rgba(255,255,255,0.8)" />
                <Text style={styles.dates}>{item.start_date}  →  {item.end_date}</Text>
              </View>
              <TouchableOpacity
                style={styles.addActBtn}
                onPress={() => router.push(`/(tabs)/trips/${id}/stops/${item.id}/activities` as any)}
              >
                <Ionicons name="add-circle-outline" size={16} color={Colors.primary} />
                <Text style={styles.addActText}>Manage Activities</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </ImageBackground>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerSub}>Building</Text>
            <Text style={styles.headerTitle}>{trip?.name || 'Your Trip'}</Text>
          </View>
          <TouchableOpacity
            style={styles.viewBtn}
            onPress={() => router.push(`/(tabs)/trips/${id}/itinerary` as any)}
          >
            <Text style={styles.viewBtnText}>View Plan</Text>
            <Ionicons name="arrow-forward" size={16} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {stops.length > 0 && (
          <View style={styles.tipBar}>
            <Ionicons name="information-circle-outline" size={16} color={Colors.primary} />
            <Text style={styles.tipText}>Long-press a card to drag and reorder stops</Text>
          </View>
        )}
      </SafeAreaView>

      <DraggableFlatList
        data={stops}
        onDragEnd={handleDragEnd}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="map-outline" size={56} color={Colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No stops yet</Text>
            <Text style={styles.emptyDesc}>Add cities to build your itinerary. Long-press cards to reorder them.</Text>
          </View>
        }
      />

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.addStopBtn}
          onPress={() => router.push(`/(tabs)/trips/${id}/city-search` as any)}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[Colors.primary, Colors.primaryDark]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.addStopGradient}
          >
            <Ionicons name="add" size={22} color="#FFF" />
            <Text style={styles.addStopText}>Add Stop</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 12 },
  headerSub: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: Colors.textMuted, marginBottom: 2 },
  headerTitle: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 26, color: Colors.text },
  viewBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.primaryMuted, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14 },
  viewBtnText: { fontFamily: 'Nunito_700Bold', fontSize: 14, color: Colors.primary },
  tipBar: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 24, backgroundColor: Colors.primaryMuted, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 8 },
  tipText: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: Colors.primary },
  listContent: { paddingHorizontal: 24, paddingBottom: 120 },
  stopCard: { height: 210, borderRadius: 20, marginBottom: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 8 },
  stopCardActive: { shadowOpacity: 0.3, transform: [{ scale: 1.02 }] },
  cardImage: { flex: 1 },
  cardGradient: { flex: 1, padding: 16, justifyContent: 'space-between' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between' },
  dragHandle: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  deleteBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(239,68,68,0.3)', justifyContent: 'center', alignItems: 'center' },
  cardBottom: {},
  cityName: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 24, color: '#FFF', marginBottom: 2 },
  countryName: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 8 },
  datesRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  dates: { fontFamily: 'Nunito_700Bold', fontSize: 13, color: 'rgba(255,255,255,0.9)' },
  addActBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFF', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8, alignSelf: 'flex-start' },
  addActText: { fontFamily: 'Nunito_700Bold', fontSize: 13, color: Colors.primary },
  empty: { alignItems: 'center', paddingVertical: 80, paddingHorizontal: 32 },
  emptyIcon: { width: 110, height: 110, borderRadius: 55, backgroundColor: Colors.primaryMuted, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  emptyTitle: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 26, color: Colors.text, marginBottom: 10 },
  emptyDesc: { fontFamily: 'Nunito_400Regular', fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: 36, backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border },
  addStopBtn: { borderRadius: 18, overflow: 'hidden', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 14, elevation: 8 },
  addStopGradient: { paddingVertical: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  addStopText: { fontFamily: 'Nunito_700Bold', fontSize: 17, color: '#FFF' },
});

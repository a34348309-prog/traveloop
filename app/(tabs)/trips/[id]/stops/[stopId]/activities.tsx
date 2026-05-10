import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { getDB } from '../../../../../../db/schema';
import { Colors } from '../../../../../../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

const CATEGORIES = ['All', 'Sightseeing', 'Food', 'Culture', 'Adventure', 'Shopping'];

const CAT_CONFIG: Record<string, { icon: string; color: string }> = {
  Sightseeing: { icon: 'binoculars-outline', color: Colors.primary },
  Food: { icon: 'restaurant-outline', color: Colors.secondary },
  Culture: { icon: 'library-outline', color: '#8B5CF6' },
  Adventure: { icon: 'bicycle-outline', color: Colors.accent },
  Shopping: { icon: 'bag-outline', color: '#EC4899' },
};

export default function ActivitiesScreen() {
  const { id, stopId } = useLocalSearchParams();
  const [activities, setActivities] = useState<any[]>([]);
  const [filter, setFilter] = useState('All');
  const [cityName, setCityName] = useState('');

  const loadActivities = async () => {
    try {
      const db = getDB();
      const stop = await db.getFirstAsync('SELECT * FROM stops WHERE id = ?', [Number(stopId)]);
      if (!stop) return;
      setCityName((stop as any).city_name);

      const city = await db.getFirstAsync('SELECT id FROM seed_cities WHERE name = ?', [(stop as any).city_name]);
      if (!city) return;

      const seedActs = await db.getAllAsync('SELECT * FROM seed_activities WHERE city_id = ?', [(city as any).id]);
      const selectedActs = await db.getAllAsync('SELECT name FROM activities WHERE stop_id = ? AND is_selected = 1', [Number(stopId)]);
      const selectedNames = new Set(selectedActs.map((a: any) => a.name));

      setActivities(seedActs.map((a: any) => ({ ...a, is_selected: selectedNames.has(a.name) })));
    } catch (e) { console.error(e); }
  };

  useEffect(() => { loadActivities(); }, [stopId]);

  const toggleActivity = async (activity: any) => {
    try {
      const db = getDB();
      if (activity.is_selected) {
        await db.runAsync('DELETE FROM activities WHERE stop_id = ? AND name = ?', [Number(stopId), activity.name]);
        Toast.show({ type: 'info', text1: 'Activity removed' });
      } else {
        await db.runAsync(
          'INSERT INTO activities (stop_id, name, type, cost, duration_mins, description) VALUES (?, ?, ?, ?, ?, ?)',
          [Number(stopId), activity.name, activity.type, activity.cost, activity.duration_mins, activity.description]
        );
        Toast.show({ type: 'success', text1: '✅ Activity added!' });
      }
      loadActivities();
    } catch { Toast.show({ type: 'error', text1: 'Error' }); }
  };

  const filtered = filter === 'All' ? activities : activities.filter(a => a.type === filter);
  const selectedCount = activities.filter(a => a.is_selected).length;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{cityName}</Text>
          <View style={styles.selectedBadge}>
            <Text style={styles.selectedBadgeText}>{selectedCount} selected</Text>
          </View>
        </View>

        <FlatList
          data={CATEGORIES}
          horizontal
          keyExtractor={c => c}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catList}
          renderItem={({ item: cat }) => {
            const cfg = CAT_CONFIG[cat];
            const isActive = filter === cat;
            return (
              <TouchableOpacity
                style={[styles.catChip, isActive && { backgroundColor: cfg?.color || Colors.primary, borderColor: cfg?.color || Colors.primary }]}
                onPress={() => setFilter(cat)}
              >
                {cfg && <Ionicons name={cfg.icon as any} size={15} color={isActive ? '#FFF' : Colors.textMuted} />}
                <Text style={[styles.catChipText, isActive && { color: '#FFF' }]}>{cat}</Text>
              </TouchableOpacity>
            );
          }}
        />
      </SafeAreaView>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const cfg = CAT_CONFIG[item.type] || { icon: 'star-outline', color: Colors.primary };
          return (
            <View style={styles.actCard}>
              <View style={[styles.actIcon, { backgroundColor: cfg.color + '15' }]}>
                <Ionicons name={cfg.icon as any} size={24} color={cfg.color} />
              </View>
              <View style={styles.actInfo}>
                <Text style={styles.actName}>{item.name}</Text>
                <View style={styles.actMetaRow}>
                  <View style={[styles.typeBadge, { backgroundColor: cfg.color + '20' }]}>
                    <Text style={[styles.typeText, { color: cfg.color }]}>{item.type}</Text>
                  </View>
                  <Text style={styles.actMeta}>{item.duration_mins}m</Text>
                  <Text style={[styles.actCost, { color: Colors.accent }]}>₹{item.cost}</Text>
                </View>
                <Text style={styles.actDesc} numberOfLines={2}>{item.description}</Text>
              </View>
              <TouchableOpacity
                style={[styles.toggleBtn, item.is_selected && { backgroundColor: Colors.accent, borderColor: Colors.accent }]}
                onPress={() => toggleActivity(item)}
                activeOpacity={0.8}
              >
                {item.is_selected ? (
                  <Ionicons name="checkmark" size={20} color="#FFF" />
                ) : (
                  <Ionicons name="add" size={20} color={Colors.primary} />
                )}
              </TouchableOpacity>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16 },
  headerTitle: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 28, color: Colors.text },
  selectedBadge: { backgroundColor: Colors.accentMuted, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  selectedBadgeText: { fontFamily: 'Nunito_700Bold', fontSize: 13, color: Colors.accent },
  catList: { paddingHorizontal: 24, paddingBottom: 16, gap: 8 },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface },
  catChipText: { fontFamily: 'Nunito_700Bold', fontSize: 13, color: Colors.textSecondary },
  list: { paddingHorizontal: 20, paddingBottom: 100 },
  actCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: Colors.surface, borderRadius: 18, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  actIcon: { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  actInfo: { flex: 1, paddingRight: 12 },
  actName: { fontFamily: 'Nunito_700Bold', fontSize: 15, color: Colors.text, marginBottom: 6 },
  actMetaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 10 },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  typeText: { fontFamily: 'Nunito_700Bold', fontSize: 11 },
  actMeta: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: Colors.textMuted },
  actCost: { fontFamily: 'Nunito_700Bold', fontSize: 13 },
  actDesc: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  toggleBtn: { width: 44, height: 44, borderRadius: 14, borderWidth: 2, borderColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginTop: 4 },
});

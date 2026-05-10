import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, StatusBar } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { getDB } from '../../../../db/schema';
import { Colors } from '../../../../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

const CATEGORIES = [
  { key: 'All', icon: 'apps', color: Colors.primary },
  { key: 'clothing', icon: 'shirt', color: '#8B5CF6' },
  { key: 'documents', icon: 'document-text', color: Colors.primary },
  { key: 'electronics', icon: 'phone-portrait', color: Colors.secondary },
  { key: 'other', icon: 'ellipsis-horizontal-circle', color: Colors.textMuted },
];

const SUGGESTIONS: Record<string, string[]> = {
  clothing: ['T-shirts', 'Jeans', 'Jacket', 'Underwear', 'Socks', 'Swimsuit', 'Sunglasses'],
  documents: ['Passport', 'Visa', 'Travel Insurance', 'Hotel Confirmation', 'Flight Tickets', 'ID Card'],
  electronics: ['Phone Charger', 'Adapter', 'Power Bank', 'Laptop', 'Camera', 'Earphones'],
  other: ['Sunscreen', 'First Aid Kit', 'Medications', 'Water Bottle', 'Snacks', 'Travel Pillow'],
};

export default function ChecklistScreen() {
  const { id } = useLocalSearchParams();
  const [items, setItems] = useState<any[]>([]);
  const [filter, setFilter] = useState('All');
  const [newItem, setNewItem] = useState('');
  const [category, setCategory] = useState('other');
  const [inputFocused, setInputFocused] = useState(false);

  const loadItems = async () => {
    const db = getDB();
    const loaded = await db.getAllAsync('SELECT * FROM checklist_items WHERE trip_id = ?', [Number(id)]);
    setItems(loaded);
  };

  useEffect(() => { loadItems(); }, [id]);

  const handleAdd = async (label?: string) => {
    const itemLabel = label || newItem;
    if (!itemLabel.trim()) return;
    const db = getDB();
    await db.runAsync('INSERT INTO checklist_items (trip_id, label, category, is_packed) VALUES (?, ?, ?, 0)', [Number(id), itemLabel, category]);
    setNewItem('');
    loadItems();
  };

  const toggleItem = async (item: any) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const db = getDB();
    await db.runAsync('UPDATE checklist_items SET is_packed = ? WHERE id = ?', [item.is_packed ? 0 : 1, item.id]);
    loadItems();
  };

  const deleteItem = async (itemId: number) => {
    const db = getDB();
    await db.runAsync('DELETE FROM checklist_items WHERE id = ?', [itemId]);
    loadItems();
  };

  const filtered = filter === 'All' ? items : items.filter(i => i.category === filter);
  const packed = items.filter(i => i.is_packed).length;
  const progress = items.length > 0 ? packed / items.length : 0;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />

      <SafeAreaView style={styles.safeTop}>
        {/* Header with progress */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerSub}>Packing</Text>
            <Text style={styles.headerTitle}>Checklist</Text>
          </View>
          <View style={styles.progressCircle}>
            <Text style={styles.progressNumber}>{Math.round(progress * 100)}%</Text>
            <Text style={styles.progressLabel}>packed</Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.progressBarWrap}>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={styles.progressCount}>{packed}/{items.length} items</Text>
        </View>

        {/* Category tabs */}
        <View style={styles.tabs}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat.key}
              style={[styles.tab, filter === cat.key && { borderBottomColor: cat.color, borderBottomWidth: 2 }]}
              onPress={() => { setFilter(cat.key); if (cat.key !== 'All') setCategory(cat.key); }}
            >
              <Ionicons name={cat.icon as any} size={18} color={filter === cat.key ? cat.color : Colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const cat = CATEGORIES.find(c => c.key === item.category);
          return (
            <View style={styles.checkItem}>
              <TouchableOpacity onPress={() => toggleItem(item)} style={styles.checkBtn} activeOpacity={0.7}>
                <View style={[styles.checkbox, item.is_packed && { backgroundColor: Colors.accent, borderColor: Colors.accent }]}>
                  {item.is_packed && <Ionicons name="checkmark" size={14} color="#FFF" />}
                </View>
              </TouchableOpacity>
              <View style={styles.checkContent}>
                <Text style={[styles.checkLabel, item.is_packed && styles.checkLabelDone]}>{item.label}</Text>
                <View style={[styles.checkCatBadge, { backgroundColor: (cat?.color || Colors.primary) + '15' }]}>
                  <Text style={[styles.checkCatText, { color: cat?.color || Colors.primary }]}>{item.category}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => deleteItem(item.id)} style={styles.deleteBtn}>
                <Ionicons name="close" size={16} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
          );
        }}
        ListFooterComponent={
          filter !== 'All' && SUGGESTIONS[filter] ? (
            <View style={styles.suggestionsBlock}>
              <Text style={styles.suggestionsTitle}>Quick Add</Text>
              <View style={styles.suggestionsRow}>
                {SUGGESTIONS[filter].map(s => (
                  <TouchableOpacity key={s} style={styles.suggestionChip} onPress={() => handleAdd(s)}>
                    <Ionicons name="add" size={14} color={Colors.primary} />
                    <Text style={styles.suggestionText}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="bag-outline" size={48} color={Colors.border} />
            <Text style={styles.emptyText}>Nothing to pack yet!</Text>
            <Text style={styles.emptySubText}>Add items below or use Quick Add suggestions.</Text>
          </View>
        }
      />

      {/* Input */}
      <View style={[styles.inputBar, inputFocused && styles.inputBarFocused]}>
        <TextInput
          style={styles.inputField}
          placeholder="Add item to packing list..."
          placeholderTextColor={Colors.textMuted}
          value={newItem}
          onChangeText={setNewItem}
          onFocus={() => setInputFocused(true)}
          onBlur={() => setInputFocused(false)}
          onSubmitEditing={() => handleAdd()}
        />
        <TouchableOpacity onPress={() => handleAdd()} style={styles.addBtn} activeOpacity={0.85}>
          <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.addBtnGradient}>
            <Ionicons name="add" size={22} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  safeTop: { backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16 },
  headerSub: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: Colors.textMuted },
  headerTitle: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 28, color: Colors.text },
  progressCircle: { backgroundColor: Colors.accentMuted, borderRadius: 16, padding: 14, alignItems: 'center', minWidth: 70 },
  progressNumber: { fontFamily: 'Nunito_700Bold', fontSize: 20, color: Colors.accent },
  progressLabel: { fontFamily: 'Nunito_400Regular', fontSize: 11, color: Colors.accent },
  progressBarWrap: { paddingHorizontal: 24, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12 },
  progressBarBg: { flex: 1, height: 8, borderRadius: 4, backgroundColor: Colors.border, overflow: 'hidden' },
  progressBarFill: { height: 8, backgroundColor: Colors.accent, borderRadius: 4 },
  progressCount: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: Colors.textMuted, minWidth: 64 },
  tabs: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: Colors.border },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  list: { padding: 20, paddingBottom: 120 },
  checkItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 },
  checkBtn: { marginRight: 14 },
  checkbox: { width: 24, height: 24, borderRadius: 8, borderWidth: 2, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
  checkContent: { flex: 1 },
  checkLabel: { fontFamily: 'Nunito_400Regular', fontSize: 15, color: Colors.text, marginBottom: 4 },
  checkLabelDone: { textDecorationLine: 'line-through', color: Colors.textMuted },
  checkCatBadge: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  checkCatText: { fontFamily: 'Nunito_700Bold', fontSize: 11, textTransform: 'capitalize' },
  deleteBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' },
  suggestionsBlock: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginTop: 8 },
  suggestionsTitle: { fontFamily: 'Nunito_700Bold', fontSize: 13, color: Colors.textSecondary, marginBottom: 12 },
  suggestionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  suggestionChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: Colors.primary + '50', backgroundColor: Colors.primaryMuted },
  suggestionText: { fontFamily: 'Nunito_700Bold', fontSize: 12, color: Colors.primary },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontFamily: 'Nunito_700Bold', fontSize: 16, color: Colors.textSecondary, marginTop: 12 },
  emptySubText: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: Colors.textMuted, textAlign: 'center', marginTop: 4 },
  inputBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border, paddingHorizontal: 20, paddingVertical: 12, paddingBottom: 28, gap: 12 },
  inputBarFocused: { borderTopColor: Colors.primary },
  inputField: { flex: 1, fontFamily: 'Nunito_400Regular', fontSize: 15, color: Colors.text, backgroundColor: Colors.background, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13, borderWidth: 1.5, borderColor: Colors.border },
  addBtn: { borderRadius: 12, overflow: 'hidden' },
  addBtnGradient: { width: 48, height: 48, justifyContent: 'center', alignItems: 'center' },
});

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, StatusBar
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { getDB } from '../../../../db/schema';
import { Colors } from '../../../../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

const CATEGORY_CONFIG: Record<string, { color: string; icon: string }> = {
  transport: { color: Colors.transport, icon: 'airplane' },
  stay: { color: Colors.stay, icon: 'bed' },
  meals: { color: Colors.meals, icon: 'restaurant' },
  activities: { color: Colors.activities, icon: 'ticket' },
};

export default function BudgetScreen() {
  const { id } = useLocalSearchParams();
  const [budgetItems, setBudgetItems] = useState<any[]>([]);
  const [activitiesCost, setActivitiesCost] = useState(0);
  const [isModalVisible, setModalVisible] = useState(false);
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('stay');
  const [focus, setFocus] = useState('');

  const loadBudget = async () => {
    try {
      const db = getDB();
      const items = await db.getAllAsync('SELECT * FROM budget_items WHERE trip_id = ?', [Number(id)]);
      setBudgetItems(items);
      const acts = await db.getAllAsync('SELECT a.cost FROM activities a JOIN stops s ON a.stop_id = s.id WHERE s.trip_id = ?', [Number(id)]);
      let cost = 0;
      acts.forEach((a: any) => cost += a.cost || 0);
      setActivitiesCost(cost);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { loadBudget(); }, [id]);

  const handleAdd = async () => {
    if (!label || !amount) { Toast.show({ type: 'error', text1: 'Please fill all fields' }); return; }
    try {
      const db = getDB();
      await db.runAsync('INSERT INTO budget_items (trip_id, category, amount, label) VALUES (?, ?, ?, ?)', [Number(id), category, parseFloat(amount), label]);
      setModalVisible(false);
      setLabel(''); setAmount('');
      loadBudget();
      Toast.show({ type: 'success', text1: 'Expense added' });
    } catch { Toast.show({ type: 'error', text1: 'Error' }); }
  };

  const handleDelete = async (itemId: number) => {
    const db = getDB();
    await db.runAsync('DELETE FROM budget_items WHERE id = ?', [itemId]);
    loadBudget();
  };

  let totals: Record<string, number> = { transport: 0, stay: 0, meals: 0, activities: activitiesCost };
  budgetItems.forEach(b => { totals[b.category] = (totals[b.category] || 0) + b.amount; });
  const grandTotal = Object.values(totals).reduce((a, b) => a + b, 0);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.header}>
        <SafeAreaView>
          <Text style={styles.headerSub}>Trip Budget</Text>
          <Text style={styles.headerTotal}>₹{grandTotal.toFixed(0)}</Text>
          <Text style={styles.headerLabel}>Estimated total cost</Text>

          {/* Category breakdown */}
          <View style={styles.breakdown}>
            {Object.entries(totals).map(([cat, val]) => {
              const cfg = CATEGORY_CONFIG[cat];
              const pct = grandTotal > 0 ? (val / grandTotal) * 100 : 0;
              return (
                <View key={cat} style={styles.breakdownItem}>
                  <View style={[styles.breakdownDot, { backgroundColor: cfg.color }]} />
                  <Text style={styles.breakdownCat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</Text>
                  <Text style={styles.breakdownVal}>₹{val.toFixed(0)}</Text>
                  <Text style={styles.breakdownPct}>{pct.toFixed(0)}%</Text>
                </View>
              );
            })}
          </View>

          {/* Progress bar */}
          <View style={styles.progressBar}>
            {Object.entries(totals).map(([cat, val]) => {
              const cfg = CATEGORY_CONFIG[cat];
              const pct = grandTotal > 0 ? (val / grandTotal) * 100 : 0;
              return pct > 0 ? (
                <View key={cat} style={[styles.progressSegment, { width: `${pct}%`, backgroundColor: cfg.color }]} />
              ) : null;
            })}
          </View>
        </SafeAreaView>
      </LinearGradient>

      <FlatList
        data={budgetItems}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.list}
        ListHeaderComponent={<Text style={styles.sectionTitle}>Manual Expenses</Text>}
        renderItem={({ item }) => {
          const cfg = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG['stay'];
          return (
            <View style={styles.expenseItem}>
              <View style={[styles.expenseIcon, { backgroundColor: cfg.color + '15' }]}>
                <Ionicons name={cfg.icon as any} size={22} color={cfg.color} />
              </View>
              <View style={styles.expenseInfo}>
                <Text style={styles.expenseLabel}>{item.label}</Text>
                <Text style={styles.expenseCat}>{item.category}</Text>
              </View>
              <Text style={styles.expenseAmount}>₹{item.amount.toFixed(0)}</Text>
              <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
                <Ionicons name="trash-outline" size={18} color={Colors.error} />
              </TouchableOpacity>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyExpenses}>
            <Ionicons name="receipt-outline" size={40} color={Colors.border} />
            <Text style={styles.emptyExpensesText}>No manual expenses yet</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)} activeOpacity={0.85}>
        <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.fabGradient}>
          <Ionicons name="add" size={28} color="#FFF" />
        </LinearGradient>
      </TouchableOpacity>

      <Modal visible={isModalVisible} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Add Expense</Text>

            <View style={[styles.inputWrap, focus === 'label' && styles.inputFocused]}>
              <TextInput
                style={styles.input}
                placeholder="Expense label (e.g. Flight to Paris)"
                placeholderTextColor={Colors.textMuted}
                value={label} onChangeText={setLabel}
                onFocus={() => setFocus('label')} onBlur={() => setFocus('')}
              />
            </View>
            <View style={[styles.inputWrap, focus === 'amount' && styles.inputFocused]}>
              <Ionicons name="logo-usd" size={18} color={Colors.textMuted} style={{ marginRight: 10 }} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Amount"
                placeholderTextColor={Colors.textMuted}
                value={amount} onChangeText={setAmount}
                keyboardType="numeric"
                onFocus={() => setFocus('amount')} onBlur={() => setFocus('')}
              />
            </View>

            <Text style={styles.catLabel}>Category</Text>
            <View style={styles.catRow}>
              {Object.entries(CATEGORY_CONFIG).map(([cat, cfg]) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.catChip, category === cat && { borderColor: cfg.color, backgroundColor: cfg.color + '15' }]}
                  onPress={() => setCategory(cat)}
                >
                  <Ionicons name={cfg.icon as any} size={16} color={category === cat ? cfg.color : Colors.textMuted} />
                  <Text style={[styles.catChipText, category === cat && { color: cfg.color }]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleAdd} activeOpacity={0.85}>
                <LinearGradient colors={[Colors.primary, Colors.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.modalSaveGradient}>
                  <Text style={styles.modalSaveText}>Add Expense</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 24, paddingBottom: 32 },
  headerSub: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: 'rgba(255,255,255,0.75)', marginTop: 16, marginBottom: 4 },
  headerTotal: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 48, color: '#FFF', lineHeight: 56 },
  headerLabel: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: 'rgba(255,255,255,0.65)', marginBottom: 24 },
  breakdown: { marginBottom: 16 },
  breakdownItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  breakdownDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  breakdownCat: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.8)', flex: 1 },
  breakdownVal: { fontFamily: 'Nunito_700Bold', fontSize: 13, color: '#FFF', marginRight: 12 },
  breakdownPct: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.5)', width: 36, textAlign: 'right' },
  progressBar: { flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.2)' },
  progressSegment: { height: 8 },
  list: { padding: 24, paddingBottom: 120 },
  sectionTitle: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 20, color: Colors.text, marginBottom: 16 },
  expenseItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, padding: 16, borderRadius: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  expenseIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  expenseInfo: { flex: 1 },
  expenseLabel: { fontFamily: 'Nunito_700Bold', fontSize: 15, color: Colors.text, marginBottom: 3 },
  expenseCat: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: Colors.textMuted, textTransform: 'capitalize' },
  expenseAmount: { fontFamily: 'Nunito_700Bold', fontSize: 16, color: Colors.text, marginRight: 12 },
  deleteBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.errorMuted, justifyContent: 'center', alignItems: 'center' },
  emptyExpenses: { alignItems: 'center', padding: 40 },
  emptyExpensesText: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.textMuted, marginTop: 12 },
  fab: { position: 'absolute', bottom: 28, right: 24, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 8 },
  fabGradient: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  modalBg: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: Colors.background, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40 },
  modalHandle: { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 24 },
  modalTitle: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 24, color: Colors.text, marginBottom: 20 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.border, paddingHorizontal: 16, marginBottom: 14 },
  inputFocused: { borderColor: Colors.primary, backgroundColor: Colors.primaryMuted },
  input: { flex: 1, fontFamily: 'Nunito_400Regular', fontSize: 15, color: Colors.text, paddingVertical: 14 },
  catLabel: { fontFamily: 'Nunito_700Bold', fontSize: 13, color: Colors.text, marginBottom: 10 },
  catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface },
  catChipText: { fontFamily: 'Nunito_700Bold', fontSize: 12, color: Colors.textMuted, textTransform: 'capitalize' },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalCancelBtn: { flex: 1, paddingVertical: 16, alignItems: 'center', borderRadius: 14, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  modalCancelText: { fontFamily: 'Nunito_700Bold', fontSize: 15, color: Colors.textSecondary },
  modalSaveBtn: { flex: 2, borderRadius: 14, overflow: 'hidden' },
  modalSaveGradient: { paddingVertical: 16, alignItems: 'center' },
  modalSaveText: { fontFamily: 'Nunito_700Bold', fontSize: 15, color: '#FFF' },
});

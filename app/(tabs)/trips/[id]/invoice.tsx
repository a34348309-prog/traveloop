import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Share
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { getDB } from '../../../../db/schema';
import { Colors } from '../../../../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import dayjs from 'dayjs';

const CAT_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  transport: { icon: 'airplane', color: Colors.primary, label: 'Transport' },
  stay: { icon: 'bed', color: '#8B5CF6', label: 'Accommodation' },
  meals: { icon: 'restaurant', color: Colors.secondary, label: 'Food & Dining' },
  activities: { icon: 'ticket', color: Colors.accent, label: 'Activities' },
};

export default function InvoiceScreen() {
  const { id } = useLocalSearchParams();
  const [trip, setTrip] = useState<any>(null);
  const [stops, setStops] = useState<any[]>([]);
  const [budgetItems, setBudgetItems] = useState<any[]>([]);
  const [activitiesCost, setActivitiesCost] = useState(0);
  const [travelerCount, setTravelerCount] = useState(1);

  useEffect(() => {
    const load = async () => {
      try {
        const db = getDB();
        const t = await db.getFirstAsync('SELECT * FROM trips WHERE id = ?', [Number(id)]);
        setTrip(t);
        const s = await db.getAllAsync('SELECT * FROM stops WHERE trip_id = ?', [Number(id)]);
        setStops(s);
        const items = await db.getAllAsync('SELECT * FROM budget_items WHERE trip_id = ?', [Number(id)]);
        setBudgetItems(items);
        const acts = await db.getAllAsync(
          'SELECT a.cost FROM activities a JOIN stops s ON a.stop_id = s.id WHERE s.trip_id = ?',
          [Number(id)]
        );
        let cost = 0;
        acts.forEach((a: any) => (cost += a.cost || 0));
        setActivitiesCost(cost);
      } catch (e) { console.error(e); }
    };
    load();
  }, [id]);

  // Compute totals by category
  const totals: Record<string, number> = { transport: 0, stay: 0, meals: 0, activities: activitiesCost };
  budgetItems.forEach(b => { totals[b.category] = (totals[b.category] || 0) + b.amount; });
  const grandTotal = Object.values(totals).reduce((a, b) => a + b, 0);
  const perPerson = grandTotal / travelerCount;

  const handleShare = async () => {
    try {
      await Share.share({
        message:
          `📄 Traveloop Trip Invoice\n\nTrip: ${trip?.name}\nDates: ${trip?.start_date} → ${trip?.end_date}\nStops: ${stops.length} cities\n\nTotal Budget: ₹${grandTotal.toFixed(0)}\nPer Person (${travelerCount}): ₹${perPerson.toFixed(0)}\n\nPowered by Traveloop ✈️`,
      });
    } catch { }
  };

  const tripDays =
    trip?.start_date && trip?.end_date
      ? dayjs(trip.end_date).diff(dayjs(trip.start_date), 'day')
      : 0;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.invoiceHeader}>
        <SafeAreaView>
          <View style={styles.invoiceTopRow}>
            <View>
              <Text style={styles.invoiceLabel}>TRIP INVOICE</Text>
              <Text style={styles.invoiceTripName}>{trip?.name || 'My Trip'}</Text>
            </View>
            <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
              <Ionicons name="share-outline" size={20} color="#FFF" />
              <Text style={styles.shareBtnText}>Share</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.invoiceMeta}>
            <View style={styles.invoiceMetaItem}>
              <Ionicons name="calendar-outline" size={15} color="rgba(255,255,255,0.7)" />
              <Text style={styles.invoiceMetaText}>{trip?.start_date} → {trip?.end_date}</Text>
            </View>
            <View style={styles.invoiceMetaItem}>
              <Ionicons name="location-outline" size={15} color="rgba(255,255,255,0.7)" />
              <Text style={styles.invoiceMetaText}>{stops.length} cities</Text>
            </View>
            <View style={styles.invoiceMetaItem}>
              <Ionicons name="time-outline" size={15} color="rgba(255,255,255,0.7)" />
              <Text style={styles.invoiceMetaText}>{tripDays} days</Text>
            </View>
          </View>

          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>Total Estimated Budget</Text>
            <Text style={styles.totalAmount}>₹{grandTotal.toFixed(0)}</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Progress bar */}
        <View style={styles.progressWrap}>
          <View style={styles.progressTrack}>
            {Object.entries(totals).map(([cat, val]) => {
              const pct = grandTotal > 0 ? (val / grandTotal) * 100 : 0;
              const cfg = CAT_CONFIG[cat];
              return pct > 0 ? (
                <View key={cat} style={[styles.progressSegment, { width: `${pct}%`, backgroundColor: cfg.color }]} />
              ) : null;
            })}
          </View>
          <View style={styles.legend}>
            {Object.entries(CAT_CONFIG).map(([cat, cfg]) => (
              <View key={cat} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: cfg.color }]} />
                <Text style={styles.legendText}>{cfg.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Category breakdown */}
        <Text style={styles.sectionTitle}>Cost Breakdown</Text>
        {Object.entries(totals).map(([cat, val]) => {
          const cfg = CAT_CONFIG[cat];
          const pct = grandTotal > 0 ? (val / grandTotal) * 100 : 0;
          return (
            <View key={cat} style={styles.catRow}>
              <View style={[styles.catIcon, { backgroundColor: cfg.color + '15' }]}>
                <Ionicons name={cfg.icon as any} size={20} color={cfg.color} />
              </View>
              <View style={styles.catInfo}>
                <View style={styles.catTopRow}>
                  <Text style={styles.catLabel}>{cfg.label}</Text>
                  <Text style={styles.catAmount}>₹{val.toFixed(0)}</Text>
                </View>
                <View style={styles.catBar}>
                  <View style={[styles.catBarFill, { width: `${pct}%`, backgroundColor: cfg.color }]} />
                </View>
                <Text style={styles.catPct}>{pct.toFixed(1)}% of total</Text>
              </View>
            </View>
          );
        })}

        {/* Expense table */}
        {budgetItems.length > 0 && (
          <View style={styles.tableCard}>
            <Text style={styles.sectionTitle}>Manual Expenses</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHead, { flex: 2 }]}>Item</Text>
              <Text style={[styles.tableHead, { flex: 1 }]}>Category</Text>
              <Text style={[styles.tableHead, { flex: 1, textAlign: 'right' }]}>Amount</Text>
            </View>
            {budgetItems.map((item, idx) => (
              <View key={item.id} style={[styles.tableRow, idx % 2 === 0 && styles.tableRowAlt]}>
                <Text style={[styles.tableCell, { flex: 2 }]} numberOfLines={1}>{item.label}</Text>
                <Text style={[styles.tableCell, { flex: 1, color: CAT_CONFIG[item.category]?.color || Colors.text }]}>
                  {CAT_CONFIG[item.category]?.label || item.category}
                </Text>
                <Text style={[styles.tableCell, { flex: 1, textAlign: 'right', fontFamily: 'Nunito_700Bold' }]}>
                  ₹{item.amount.toFixed(0)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Per traveler */}
        <Text style={styles.sectionTitle}>Per Traveler</Text>
        <View style={styles.travelerCard}>
          <View style={styles.travelerRow}>
            <Text style={styles.travelerLabel}>Number of Travelers</Text>
            <View style={styles.travelerStepper}>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => setTravelerCount(Math.max(1, travelerCount - 1))}
              >
                <Ionicons name="remove" size={18} color={Colors.primary} />
              </TouchableOpacity>
              <Text style={styles.stepCount}>{travelerCount}</Text>
              <TouchableOpacity style={styles.stepBtn} onPress={() => setTravelerCount(travelerCount + 1)}>
                <Ionicons name="add" size={18} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.perPersonRow}>
            <Text style={styles.perPersonLabel}>Cost per person</Text>
            <Text style={styles.perPersonAmount}>₹{perPerson.toFixed(0)}</Text>
          </View>
          <View style={styles.perPersonRow}>
            <Text style={styles.perPersonLabel}>Daily cost per person</Text>
            <Text style={styles.perPersonAmount}>₹{tripDays > 0 ? (perPerson / tripDays).toFixed(0) : '0'}</Text>
          </View>
        </View>

        {/* Stops list */}
        <Text style={styles.sectionTitle}>Trip Stops</Text>
        {stops.map((stop, idx) => (
          <View key={stop.id} style={styles.stopRow}>
            <View style={[styles.stopNum, { backgroundColor: Colors.primary }]}>
              <Text style={styles.stopNumText}>{idx + 1}</Text>
            </View>
            <View style={styles.stopInfo}>
              <Text style={styles.stopCity}>{stop.city_name}</Text>
              <Text style={styles.stopDates}>{stop.start_date} → {stop.end_date}</Text>
            </View>
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Generated by Traveloop · {dayjs().format('MMM D, YYYY')}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  invoiceHeader: { paddingBottom: 28, paddingHorizontal: 24 },
  invoiceTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: 16, marginBottom: 20 },
  invoiceLabel: { fontFamily: 'Nunito_700Bold', fontSize: 11, color: 'rgba(255,255,255,0.7)', letterSpacing: 2, marginBottom: 4 },
  invoiceTripName: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 26, color: '#FFF' },
  shareBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 16, paddingVertical: 9, borderRadius: 14 },
  shareBtnText: { fontFamily: 'Nunito_700Bold', fontSize: 14, color: '#FFF' },
  invoiceMeta: { flexDirection: 'row', gap: 20, marginBottom: 20 },
  invoiceMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  invoiceMetaText: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.85)' },
  totalBox: { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 18, padding: 18 },
  totalLabel: { fontFamily: 'Nunito_700Bold', fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 6 },
  totalAmount: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 42, color: '#FFF' },
  content: { padding: 20, paddingBottom: 60 },
  progressWrap: { backgroundColor: Colors.surface, borderRadius: 18, padding: 18, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  progressTrack: { flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden', backgroundColor: Colors.border, marginBottom: 16 },
  progressSegment: { height: 12 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: Colors.textSecondary },
  sectionTitle: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 20, color: Colors.text, marginBottom: 14, marginTop: 4 },
  catRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 16, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 },
  catIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  catInfo: { flex: 1 },
  catTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  catLabel: { fontFamily: 'Nunito_700Bold', fontSize: 15, color: Colors.text },
  catAmount: { fontFamily: 'Nunito_700Bold', fontSize: 15, color: Colors.text },
  catBar: { height: 6, backgroundColor: Colors.border, borderRadius: 3, overflow: 'hidden', marginBottom: 4 },
  catBarFill: { height: 6, borderRadius: 3 },
  catPct: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: Colors.textMuted },
  tableCard: { backgroundColor: Colors.surface, borderRadius: 16, overflow: 'hidden', marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1, padding: 16 },
  tableHeader: { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: Colors.border, marginBottom: 4 },
  tableHead: { fontFamily: 'Nunito_700Bold', fontSize: 12, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  tableRow: { flexDirection: 'row', paddingVertical: 10 },
  tableRowAlt: { backgroundColor: Colors.background, borderRadius: 8, paddingHorizontal: 4 },
  tableCell: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.text },
  travelerCard: { backgroundColor: Colors.surface, borderRadius: 18, padding: 18, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 },
  travelerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  travelerLabel: { fontFamily: 'Nunito_700Bold', fontSize: 15, color: Colors.text },
  travelerStepper: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  stepBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  stepCount: { fontFamily: 'Nunito_700Bold', fontSize: 18, color: Colors.text, paddingHorizontal: 12 },
  perPersonRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderTopWidth: 1, borderTopColor: Colors.border },
  perPersonLabel: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.textSecondary },
  perPersonAmount: { fontFamily: 'Nunito_700Bold', fontSize: 16, color: Colors.primary },
  stopRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 14, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 6 },
  stopNum: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  stopNumText: { fontFamily: 'Nunito_700Bold', fontSize: 14, color: '#FFF' },
  stopInfo: {},
  stopCity: { fontFamily: 'Nunito_700Bold', fontSize: 15, color: Colors.text, marginBottom: 2 },
  stopDates: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: Colors.textMuted },
  footer: { paddingVertical: 24, alignItems: 'center' },
  footerText: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: Colors.textMuted },
});

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  StatusBar, ActivityIndicator, Alert
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '../../../../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTrip, useItineraryItems, useAddItineraryItem, useUpdateItineraryItem, useDeleteItineraryItem } from '../../../../hooks/useSupabase';
import { useQuery } from '@tanstack/react-query';
import { getWeather } from '../../../../services/api';
import dayjs from 'dayjs';

export default function ItineraryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: trip, isLoading: tripLoading } = useTrip(id);
  const { data: items = [], isLoading: itemsLoading } = useItineraryItems(id);
  const { mutateAsync: addItem, isPending: adding } = useAddItineraryItem();
  const { mutateAsync: updateItem } = useUpdateItineraryItem();
  const { mutateAsync: deleteItem } = useDeleteItineraryItem();

  const [addingDay, setAddingDay] = useState<number | null>(null);
  const [newActivity, setNewActivity] = useState('');
  const [newCategory, setNewCategory] = useState('sightseeing');
  const [newBudget, setNewBudget] = useState('');

  // Fetch weather for trip dates
  const { data: weather = [], isLoading: weatherLoading } = useQuery({
    queryKey: ['weather', id, trip?.lat, trip?.lng, trip?.start_date, trip?.end_date],
    enabled: !!(trip?.lat && trip?.lng && trip?.start_date && trip?.end_date),
    queryFn: () => getWeather(trip!.lat!, trip!.lng!, trip!.start_date!, trip!.end_date!),
    staleTime: 1000 * 60 * 30,
  });

  // Group items by day
  const tripDays = trip?.start_date && trip?.end_date
    ? dayjs(trip.end_date).diff(dayjs(trip.start_date), 'day') + 1
    : 0;

  const days = Array.from({ length: Math.max(tripDays, 1) }, (_, i) => i + 1);

  const itemsForDay = (day: number) => items.filter((item: any) => item.day_number === day);
  const dayTotal = (day: number) => itemsForDay(day).reduce((s: number, i: any) => s + (i.expense || 0), 0);
  const grandTotal = items.reduce((s: number, i: any) => s + (i.expense || 0), 0);
  const weatherForDay = (day: number) => weather[day - 1];

  const handleAddItem = async (day: number) => {
    if (!newActivity.trim()) return;
    try {
      await addItem({
        trip_id: id,
        day_number: day,
        activity_name: newActivity.trim(),
        category: newCategory,
        budget: parseFloat(newBudget) || 0,
        expense: 0,
        notes: '',
      });
      setNewActivity('');
      setNewBudget('');
      setAddingDay(null);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleUpdateExpense = async (itemId: string, expense: string) => {
    await updateItem({ id: itemId, tripId: id, expense: parseFloat(expense) || 0 });
  };

  const handleDelete = async (itemId: string) => {
    Alert.alert('Delete Activity?', 'This will remove this activity from the itinerary.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteItem({ id: itemId, tripId: id }); } },
    ]);
  };

  if (tripLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  if (!trip) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>Trip not found</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => router.back()}>
          <Text style={styles.retryText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerTopRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color="#FFF" />
            </TouchableOpacity>
            <View style={styles.quickNav}>
              {[
                { icon: 'construct-outline', label: 'Edit', route: `/(tabs)/trips/${id}/builder` },
                { icon: 'wallet-outline', label: 'Budget', route: `/(tabs)/trips/${id}/budget` },
                { icon: 'checkbox-outline', label: 'Pack', route: `/(tabs)/trips/${id}/checklist` },
                { icon: 'journal-outline', label: 'Notes', route: `/(tabs)/trips/${id}/notes` },
                { icon: 'receipt-outline', label: 'Invoice', route: `/(tabs)/trips/${id}/invoice` },
              ].map(nav => (
                <TouchableOpacity key={nav.label} style={styles.quickNavBtn} onPress={() => router.push(nav.route as any)}>
                  <Ionicons name={nav.icon as any} size={18} color="rgba(255,255,255,0.85)" />
                  <Text style={styles.quickNavLabel}>{nav.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Text style={styles.tripName}>{trip.name}</Text>
          <Text style={styles.tripPlace}>📍 {trip.place || 'Unknown destination'}</Text>
          <View style={styles.tripDates}>
            <Ionicons name="calendar-outline" size={14} color="rgba(255,255,255,0.75)" />
            <Text style={styles.tripDateText}>{trip.start_date} → {trip.end_date}</Text>
            <Text style={styles.tripDays}>({tripDays} days)</Text>
          </View>

          <View style={styles.totalExpense}>
            <Text style={styles.totalLabel}>Total Expenses</Text>
            <Text style={styles.totalAmount}>₹{grandTotal.toFixed(0)}</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {days.map(day => {
          const w = weatherForDay(day);
          const dayItems = itemsForDay(day);
          const date = trip.start_date ? dayjs(trip.start_date).add(day - 1, 'day').format('ddd, DD MMM') : `Day ${day}`;

          return (
            <View key={day} style={styles.daySection}>
              {/* Day header */}
              <View style={styles.dayHeader}>
                <View style={styles.dayBadge}>
                  <Text style={styles.dayBadgeText}>Day {day}</Text>
                </View>
                <Text style={styles.dayDate}>{date}</Text>

                {/* Weather for this day */}
                {weatherLoading ? (
                  <ActivityIndicator size="small" color={Colors.primary} style={{ marginLeft: 'auto' }} />
                ) : w ? (
                  <View style={styles.weather}>
                    <Text style={styles.weatherIcon}>{w.icon}</Text>
                    <Text style={styles.weatherTemp}>{w.tempMax}°/{w.tempMin}°</Text>
                    <Text style={styles.weatherLabel}>{w.weatherLabel}</Text>
                  </View>
                ) : null}
              </View>

              {/* Day expense total */}
              {dayItems.length > 0 && (
                <Text style={styles.dayExpense}>Day total: ₹{dayTotal(day).toFixed(0)}</Text>
              )}

              {/* Activities */}
              {dayItems.map((item: any) => (
                <View key={item.id} style={styles.activityCard}>
                  <View style={styles.activityLeft}>
                    <View style={styles.activityDot} />
                  </View>
                  <View style={styles.activityInfo}>
                    <Text style={styles.activityName}>{item.activity_name}</Text>
                    <Text style={styles.activityCat}>{item.category}</Text>
                    <View style={styles.expenseRow}>
                      <Text style={styles.expenseLabel}>₹ Expense:</Text>
                      <TextInput
                        style={styles.expenseInput}
                        keyboardType="numeric"
                        defaultValue={item.expense?.toString() || '0'}
                        onEndEditing={e => handleUpdateExpense(item.id, e.nativeEvent.text)}
                        placeholder="0"
                        placeholderTextColor={Colors.textMuted}
                      />
                      <Text style={styles.budgetNote}>Budget: ₹{item.budget || 0}</Text>
                    </View>
                    {item.notes ? <Text style={styles.activityNotes}>{item.notes}</Text> : null}
                  </View>
                  <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
                    <Ionicons name="trash-outline" size={16} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              ))}

              {/* Add activity inline */}
              {addingDay === day ? (
                <View style={styles.addForm}>
                  <TextInput
                    style={styles.addInput}
                    placeholder="Activity name"
                    placeholderTextColor={Colors.textMuted}
                    value={newActivity}
                    onChangeText={setNewActivity}
                    autoFocus
                  />
                  <TextInput
                    style={styles.addInput}
                    placeholder="Budget (₹)"
                    placeholderTextColor={Colors.textMuted}
                    value={newBudget}
                    onChangeText={setNewBudget}
                    keyboardType="numeric"
                  />
                  <View style={styles.addFormBtns}>
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => setAddingDay(null)}>
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.saveBtn, adding && { opacity: 0.7 }]}
                      onPress={() => handleAddItem(day)}
                      disabled={adding}
                    >
                      <Text style={styles.saveBtnText}>{adding ? 'Adding…' : 'Add'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity style={styles.addActivityBtn} onPress={() => setAddingDay(day)}>
                  <Ionicons name="add-circle-outline" size={18} color={Colors.primary} />
                  <Text style={styles.addActivityText}>Add Activity</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}

        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  notFound: { fontFamily: 'Nunito_700Bold', fontSize: 18, color: Colors.text, marginBottom: 16 },
  retryBtn: { backgroundColor: Colors.primaryMuted, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  retryText: { fontFamily: 'Nunito_700Bold', fontSize: 14, color: Colors.primary },
  header: { paddingBottom: 24, paddingHorizontal: 20 },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, marginBottom: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  quickNav: { flexDirection: 'row', gap: 8 },
  quickNavBtn: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 6 },
  quickNavLabel: { fontFamily: 'Nunito_400Regular', fontSize: 9, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  tripName: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 26, color: '#FFF', marginBottom: 4 },
  tripPlace: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: 'rgba(255,255,255,0.85)', marginBottom: 6 },
  tripDates: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  tripDateText: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.85)' },
  tripDays: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.65)' },
  totalExpense: { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 14, padding: 14 },
  totalLabel: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 4 },
  totalAmount: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 32, color: '#FFF' },
  content: { flex: 1, padding: 20 },
  daySection: { marginBottom: 28 },
  dayHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
  dayBadge: { backgroundColor: Colors.primary, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12 },
  dayBadgeText: { fontFamily: 'Nunito_700Bold', fontSize: 13, color: '#FFF' },
  dayDate: { fontFamily: 'Nunito_700Bold', fontSize: 14, color: Colors.text, flex: 1 },
  weather: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.surface, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  weatherIcon: { fontSize: 16 },
  weatherTemp: { fontFamily: 'Nunito_700Bold', fontSize: 12, color: Colors.text },
  weatherLabel: { fontFamily: 'Nunito_400Regular', fontSize: 10, color: Colors.textMuted },
  dayExpense: { fontFamily: 'Nunito_700Bold', fontSize: 12, color: Colors.accent, marginBottom: 8, paddingLeft: 16 },
  activityCard: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: 14, padding: 14, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6 },
  activityLeft: { width: 24, alignItems: 'center', paddingTop: 4 },
  activityDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
  activityInfo: { flex: 1, marginLeft: 10 },
  activityName: { fontFamily: 'Nunito_700Bold', fontSize: 15, color: Colors.text, marginBottom: 3 },
  activityCat: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: Colors.textSecondary, marginBottom: 8, textTransform: 'capitalize' },
  expenseRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  expenseLabel: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: Colors.textMuted },
  expenseInput: { width: 70, borderBottomWidth: 1.5, borderBottomColor: Colors.primary, fontFamily: 'Nunito_700Bold', fontSize: 14, color: Colors.primary, paddingBottom: 2, textAlign: 'center' },
  budgetNote: { fontFamily: 'Nunito_400Regular', fontSize: 11, color: Colors.textMuted },
  activityNotes: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: Colors.textMuted, marginTop: 6 },
  deleteBtn: { padding: 6 },
  addActivityBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingLeft: 4 },
  addActivityText: { fontFamily: 'Nunito_700Bold', fontSize: 14, color: Colors.primary },
  addForm: { backgroundColor: Colors.surface, borderRadius: 14, padding: 14, gap: 10 },
  addInput: { backgroundColor: Colors.background, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 12, paddingVertical: 10, fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.text },
  addFormBtns: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end' },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: Colors.border },
  cancelBtnText: { fontFamily: 'Nunito_700Bold', fontSize: 13, color: Colors.textSecondary },
  saveBtn: { backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  saveBtnText: { fontFamily: 'Nunito_700Bold', fontSize: 13, color: '#FFF' },
});

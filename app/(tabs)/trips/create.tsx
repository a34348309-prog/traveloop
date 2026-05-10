import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
  StatusBar, ActivityIndicator, FlatList, Platform, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors } from '../../../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { searchPlaces } from '../../../services/api';
import { NominatimResult } from '../../../lib/api/nominatim'; // Still using the interface
import { getPlacesNearby, OTMPlace, formatKinds } from '../../../lib/api/opentripmap';
import { useCreateTrip } from '../../../hooks/useSupabase';
import dayjs from 'dayjs';

export default function CreateTripScreen() {
  const router = useRouter();
  const { mutateAsync: createTrip, isPending } = useCreateTrip();

  const [tripName, setTripName] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<NominatimResult | null>(null);
  const [searching, setSearching] = useState(false);

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const [nearbyPlaces, setNearbyPlaces] = useState<OTMPlace[]>([]);
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  const [selectedActivities, setSelectedActivities] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');

  // Nominatim autocomplete
  useEffect(() => {
    if (!locationQuery.trim() || locationQuery.length < 3 || selectedLocation) { setSuggestions([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try { setSuggestions(await searchPlaces(locationQuery)); }
      catch { setSuggestions([]); }
      finally { setSearching(false); }
    }, 500);
    return () => clearTimeout(t);
  }, [locationQuery, selectedLocation]);

  // Load nearby places from OpenTripMap when location selected
  useEffect(() => {
    if (!selectedLocation) return;
    setLoadingPlaces(true);
    getPlacesNearby(parseFloat(selectedLocation.lat), parseFloat(selectedLocation.lon), 10000, 'interesting_places', 12)
      .then(setNearbyPlaces)
      .catch(() => setNearbyPlaces([]))
      .finally(() => setLoadingPlaces(false));
  }, [selectedLocation]);

  const toggleActivity = (xid: string) => {
    setSelectedActivities(prev => {
      const next = new Set(prev);
      next.has(xid) ? next.delete(xid) : next.add(xid);
      return next;
    });
  };

  const validate = () => {
    if (!tripName.trim()) return 'Trip name is required';
    if (!selectedLocation) return 'Please select a destination';
    if (!startDate) return 'Start date is required';
    if (!endDate) return 'End date is required';
    if (endDate < startDate) return 'End date must be after start date';
    return null;
  };

  const handleCreate = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    try {
      const addr = selectedLocation!.address;
      const trip = await createTrip({
        name: tripName.trim(),
        place: selectedLocation!.display_name.split(',')[0],
        lat: parseFloat(selectedLocation!.lat),
        lng: parseFloat(selectedLocation!.lon),
        start_date: dayjs(startDate!).format('YYYY-MM-DD'),
        end_date: dayjs(endDate!).format('YYYY-MM-DD'),
        status: 'upcoming',
      });
      router.replace(`/(tabs)/trips/${trip.id}/builder` as any);
    } catch (e: any) {
      setError(e.message || 'Failed to create trip');
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.header}>
        <SafeAreaView>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Plan a New Trip</Text>
          <Text style={styles.headerSub}>Tell us where you're headed</Text>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color={Colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Trip Name */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Trip Name *</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="bookmark-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="e.g. Rajasthan Road Trip 2025"
              placeholderTextColor={Colors.textMuted}
              value={tripName}
              onChangeText={v => { setTripName(v); setError(''); }}
            />
          </View>
        </View>

        {/* Destination (Nominatim autocomplete) */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Select a Place *</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="location-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Search city or destination…"
              placeholderTextColor={Colors.textMuted}
              value={selectedLocation ? selectedLocation.display_name.split(',').slice(0, 2).join(',') : locationQuery}
              onChangeText={v => { setLocationQuery(v); setSelectedLocation(null); setError(''); }}
            />
            {searching && <ActivityIndicator size="small" color={Colors.primary} />}
            {selectedLocation && (
              <TouchableOpacity onPress={() => { setSelectedLocation(null); setLocationQuery(''); }}>
                <Ionicons name="close-circle" size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Autocomplete dropdown */}
          {suggestions.length > 0 && !selectedLocation && (
            <View style={styles.dropdown}>
              {suggestions.map(s => (
                <TouchableOpacity
                  key={s.place_id}
                  style={styles.dropdownItem}
                  onPress={() => { setSelectedLocation(s); setLocationQuery(''); setSuggestions([]); }}
                >
                  <Ionicons name="location" size={14} color={Colors.primary} />
                  <Text style={styles.dropdownText} numberOfLines={2}>{s.display_name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Date pickers */}
        <View style={styles.dateRow}>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.fieldLabel}>Start Date *</Text>
            <TouchableOpacity style={styles.datePicker} onPress={() => setShowStartPicker(true)}>
              <Ionicons name="calendar-outline" size={18} color={Colors.primary} />
              <Text style={[styles.dateText, !startDate && { color: Colors.textMuted }]}>
                {startDate ? dayjs(startDate).format('DD MMM YYYY') : 'Pick date'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.fieldLabel}>End Date *</Text>
            <TouchableOpacity style={styles.datePicker} onPress={() => setShowEndPicker(true)}>
              <Ionicons name="calendar" size={18} color={Colors.secondary} />
              <Text style={[styles.dateText, !endDate && { color: Colors.textMuted }]}>
                {endDate ? dayjs(endDate).format('DD MMM YYYY') : 'Pick date'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {showStartPicker && (
          <DateTimePicker
            value={startDate || new Date()}
            mode="date"
            minimumDate={new Date()}
            onChange={(_, d) => { setShowStartPicker(false); if (d) setStartDate(d); }}
          />
        )}
        {showEndPicker && (
          <DateTimePicker
            value={endDate || startDate || new Date()}
            mode="date"
            minimumDate={startDate || new Date()}
            onChange={(_, d) => { setShowEndPicker(false); if (d) setEndDate(d); }}
          />
        )}

        {/* Suggested places/activities from OpenTripMap */}
        {selectedLocation && (
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>
              Suggested Places &amp; Activities
              {loadingPlaces ? ' (loading…)' : ` (${nearbyPlaces.length} found)`}
            </Text>
            {loadingPlaces ? (
              <ActivityIndicator color={Colors.primary} style={{ marginTop: 12 }} />
            ) : nearbyPlaces.length === 0 ? (
              <Text style={styles.noPlacesText}>No places found near this location.</Text>
            ) : (
              <View style={styles.placesGrid}>
                {nearbyPlaces.map(place => {
                  const selected = selectedActivities.has(place.xid);
                  return (
                    <TouchableOpacity
                      key={place.xid}
                      style={[styles.placeChip, selected && styles.placeChipSelected]}
                      onPress={() => toggleActivity(place.xid)}
                    >
                      <Ionicons
                        name={selected ? 'checkmark-circle' : 'add-circle-outline'}
                        size={16}
                        color={selected ? '#FFF' : Colors.primary}
                      />
                      <Text style={[styles.placeChipText, selected && { color: '#FFF' }]} numberOfLines={1}>
                        {place.name || formatKinds(place.kinds)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* Build Itinerary button */}
        <TouchableOpacity
          style={[styles.createBtn, isPending && { opacity: 0.7 }]}
          onPress={handleCreate}
          disabled={isPending}
          activeOpacity={0.85}
        >
          <LinearGradient colors={[Colors.primary, Colors.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.createGradient}>
            <Ionicons name={isPending ? 'hourglass-outline' : 'map'} size={22} color="#FFF" />
            <Text style={styles.createText}>{isPending ? 'Creating…' : 'Build Itinerary'}</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: { paddingBottom: 28, paddingHorizontal: 24, paddingTop: 0 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 16, marginTop: 12 },
  headerTitle: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 28, color: '#FFF', marginBottom: 4 },
  headerSub: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  content: { flex: 1, padding: 20 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEE2E2', borderRadius: 12, padding: 12, marginBottom: 16 },
  errorText: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: Colors.error, flex: 1 },
  field: { marginBottom: 18 },
  fieldLabel: { fontFamily: 'Nunito_700Bold', fontSize: 13, color: Colors.text, marginBottom: 8 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.border, paddingHorizontal: 14 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontFamily: 'Nunito_400Regular', fontSize: 15, color: Colors.text, paddingVertical: 14 },
  dropdown: { backgroundColor: Colors.surface, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, marginTop: 4, overflow: 'hidden' },
  dropdownItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  dropdownText: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: Colors.text, flex: 1 },
  dateRow: { flexDirection: 'row', gap: 12 },
  datePicker: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.surface, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.border, paddingHorizontal: 14, paddingVertical: 14 },
  dateText: { fontFamily: 'Nunito_700Bold', fontSize: 14, color: Colors.text },
  noPlacesText: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: Colors.textMuted, marginTop: 8 },
  placesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  placeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.primaryMuted, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: Colors.primary },
  placeChipSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  placeChipText: { fontFamily: 'Nunito_700Bold', fontSize: 12, color: Colors.primary, maxWidth: 120 },
  createBtn: { borderRadius: 18, overflow: 'hidden', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 14, elevation: 8, marginTop: 8 },
  createGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18 },
  createText: { fontFamily: 'Nunito_700Bold', fontSize: 17, color: '#FFF' },
});

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  StatusBar, ImageBackground
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getDB } from '../../../../db/schema';
import { Colors } from '../../../../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

const INDIA_CITY_IMAGES: Record<string, string> = {
  'Mumbai': 'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?q=80&w=400',
  'Delhi': 'https://images.unsplash.com/photo-1587474260584-136574528ed5?q=80&w=400',
  'Jaipur': 'https://images.unsplash.com/photo-1599661046289-e31897846e41?q=80&w=400',
  'Goa': 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?q=80&w=400',
  'Kochi': 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?q=80&w=400',
  'Agra': 'https://images.unsplash.com/photo-1564507592333-c60657eea523?q=80&w=400',
  'Varanasi': 'https://images.unsplash.com/photo-1561361058-c24cecae35ca?q=80&w=400',
  'Shimla': 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=400',
  'Manali': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=400',
  'Leh': 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?q=80&w=400',
  'Darjeeling': 'https://images.unsplash.com/photo-1575913561099-22c2bee14db7?q=80&w=400',
  'Udaipur': 'https://images.unsplash.com/photo-1581797900520-8a94ff4d2dfa?q=80&w=400',
  'Mysuru': 'https://images.unsplash.com/photo-1615380547900-55e4a804e497?q=80&w=400',
  'Rishikesh': 'https://images.unsplash.com/photo-1600100397608-658af24e5ba8?q=80&w=400',
  'Hampi': 'https://images.unsplash.com/photo-1600100397706-bd14f44ddb3c?q=80&w=400',
  'Amritsar': 'https://images.unsplash.com/photo-1597226051193-2c2e0668d52e?q=80&w=400',
  'Hyderabad': 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?q=80&w=400',
  'Kolkata': 'https://images.unsplash.com/photo-1558431382-27e303142255?q=80&w=400',
  'Bangalore': 'https://images.unsplash.com/photo-1596440257090-af44f8e0a6c6?q=80&w=400',
  'Ooty': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=400',
};
const DEFAULT_IMG = 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?q=80&w=400';

type Step = 'city' | 'dates';

export default function CitySearchScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [step, setStep] = useState<Step>('city');
  const [search, setSearch] = useState('');
  const [cities, setCities] = useState<any[]>([]);
  const [selectedCity, setSelectedCity] = useState<any>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const db = getDB();
        const all = await db.getAllAsync('SELECT * FROM seed_cities ORDER BY name ASC');
        setCities(all);
      } catch (e) { console.error(e); }
    };
    load();
  }, []);

  const filtered = cities.filter(c => {
    const q = search.toLowerCase();
    return !search || c.name.toLowerCase().includes(q) || (c.state || '').toLowerCase().includes(q);
  });

  const handleSelectCity = (city: any) => {
    setSelectedCity(city);
    setStep('dates');
  };

  const handleAddStop = async () => {
    if (!startDate || !endDate) {
      Toast.show({ type: 'error', text1: 'Please enter start and end dates' });
      return;
    }
    setSaving(true);
    try {
      const db = getDB();
      const count = await db.getFirstAsync('SELECT COUNT(*) as c FROM stops WHERE trip_id = ?', [Number(id)]);
      const orderIndex = ((count as any)?.c || 0) + 1;
      await db.runAsync(
        'INSERT INTO stops (trip_id, city_name, country, state, lat, lng, start_date, end_date, order_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [Number(id), selectedCity.name, selectedCity.country, selectedCity.state || '', selectedCity.lat || 0, selectedCity.lng || 0, startDate, endDate, orderIndex]
      );
      Toast.show({ type: 'success', text1: `${selectedCity.name} added!` });
      router.back();
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Error adding stop' });
    } finally {
      setSaving(false);
    }
  };

  if (step === 'dates' && selectedCity) {
    const img = INDIA_CITY_IMAGES[selectedCity.name] || DEFAULT_IMG;
    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" />
        <ImageBackground source={{ uri: img }} style={styles.datesHero}>
          <LinearGradient colors={['rgba(15,23,42,0.3)', 'rgba(15,23,42,0.85)']} style={styles.datesHeroGradient}>
            <SafeAreaView style={styles.datesHeroContent}>
              <TouchableOpacity onPress={() => setStep('city')} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={22} color="#FFF" />
              </TouchableOpacity>
              <View>
                <Text style={styles.datesCity}>{selectedCity.name}</Text>
                <Text style={styles.datesState}>{selectedCity.state}, {selectedCity.country}</Text>
              </View>
            </SafeAreaView>
          </LinearGradient>
        </ImageBackground>

        <View style={styles.datesSheet}>
          <Text style={styles.datesTitle}>Set Dates for {selectedCity.name}</Text>
          <Text style={styles.datesSubtitle}>When are you visiting this city?</Text>

          <View style={styles.inputGroup}>
            <View style={styles.inputLabel}>
              <Ionicons name="calendar-outline" size={16} color={Colors.primary} />
              <Text style={styles.inputLabelText}>Start Date</Text>
            </View>
            <TextInput
              style={styles.dateInput}
              placeholder="YYYY-MM-DD  (e.g. 2025-12-20)"
              placeholderTextColor={Colors.textMuted}
              value={startDate}
              onChangeText={setStartDate}
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputLabel}>
              <Ionicons name="calendar" size={16} color={Colors.secondary} />
              <Text style={styles.inputLabelText}>End Date</Text>
            </View>
            <TextInput
              style={styles.dateInput}
              placeholder="YYYY-MM-DD  (e.g. 2025-12-25)"
              placeholderTextColor={Colors.textMuted}
              value={endDate}
              onChangeText={setEndDate}
            />
          </View>

          <TouchableOpacity
            style={[styles.addBtn, saving && { opacity: 0.6 }]}
            onPress={handleAddStop}
            disabled={saving}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.primaryDark]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.addBtnGradient}
            >
              <Ionicons name="add-circle" size={22} color="#FFF" />
              <Text style={styles.addBtnText}>{saving ? 'Adding...' : `Add ${selectedCity.name} to Trip`}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.safeTop}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtnDark}>
            <Ionicons name="arrow-back" size={22} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select a City</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={20} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search Indian cities..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
            autoFocus
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.cityList}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const img = INDIA_CITY_IMAGES[item.name] || DEFAULT_IMG;
          return (
            <TouchableOpacity style={styles.cityRow} onPress={() => handleSelectCity(item)} activeOpacity={0.8}>
              <ImageBackground source={{ uri: img }} style={styles.cityRowImg} imageStyle={{ borderRadius: 14 }}>
                <LinearGradient colors={['transparent', 'rgba(15,23,42,0.7)']} style={styles.cityRowGradient}>
                  <View style={styles.cityRowContent}>
                    <View>
                      <Text style={styles.cityRowName}>{item.name}</Text>
                      <Text style={styles.cityRowState}>{item.state || item.country}</Text>
                    </View>
                    <View style={[styles.costTag, { backgroundColor: item.cost_index === 'Budget' ? Colors.accent : item.cost_index === 'Luxury' ? Colors.secondary : Colors.primary }]}>
                      <Text style={styles.costTagText}>{item.cost_index}</Text>
                    </View>
                  </View>
                </LinearGradient>
              </ImageBackground>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="search" size={40} color={Colors.border} />
            <Text style={styles.emptyText}>No cities match your search</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  safeTop: { backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  backBtnDark: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 20, color: Colors.text },
  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background, borderRadius: 14, marginHorizontal: 20, marginBottom: 14, paddingHorizontal: 14, borderWidth: 1.5, borderColor: Colors.border, gap: 10 },
  searchInput: { flex: 1, fontFamily: 'Nunito_400Regular', fontSize: 15, color: Colors.text, paddingVertical: 13 },
  cityList: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 100 },
  cityRow: { height: 90, borderRadius: 14, marginBottom: 10, overflow: 'hidden' },
  cityRowImg: { flex: 1 },
  cityRowGradient: { flex: 1, justifyContent: 'flex-end', padding: 12 },
  cityRowContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  cityRowName: { fontFamily: 'Nunito_700Bold', fontSize: 17, color: '#FFF' },
  cityRowState: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  costTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  costTagText: { fontFamily: 'Nunito_700Bold', fontSize: 11, color: '#FFF' },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.textSecondary, marginTop: 12 },
  // Dates step
  datesHero: { height: 220 },
  datesHeroGradient: { flex: 1 },
  datesHeroContent: { flex: 1, padding: 20, justifyContent: 'space-between' },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  datesCity: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 32, color: '#FFF' },
  datesState: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  datesSheet: { flex: 1, backgroundColor: Colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: -28, padding: 28 },
  datesTitle: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 22, color: Colors.text, marginBottom: 6 },
  datesSubtitle: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.textSecondary, marginBottom: 28 },
  inputGroup: { marginBottom: 18 },
  inputLabel: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  inputLabelText: { fontFamily: 'Nunito_700Bold', fontSize: 14, color: Colors.text },
  dateInput: { backgroundColor: Colors.background, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.border, paddingHorizontal: 16, paddingVertical: 14, fontFamily: 'Nunito_400Regular', fontSize: 15, color: Colors.text },
  addBtn: { borderRadius: 18, overflow: 'hidden', marginTop: 8 },
  addBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18 },
  addBtnText: { fontFamily: 'Nunito_700Bold', fontSize: 17, color: '#FFF' },
});

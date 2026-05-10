import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  StatusBar, ActivityIndicator, FlatList, Modal, Image
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { getPlacesNearby, getPlaceDetail, searchPlaces, formatKinds, OTMPlace } from '../../lib/api/opentripmap';
import { geocodeSearch } from '../../lib/api/nominatim';
import { getWikiSummary } from '../../lib/api/wikipedia';
import { INDIA_FALLBACK_IMAGES } from '../../lib/api/unsplash';

const KINDS = ['All', 'interesting_places', 'historic', 'architecture', 'natural', 'religion', 'sport'];
const KIND_LABELS: Record<string, string> = {
  All: 'All', interesting_places: 'Interesting', historic: 'Historic',
  architecture: 'Architecture', natural: 'Nature', religion: 'Religious', sport: 'Sports',
};

const DEFAULT_LAT = 20.5937; const DEFAULT_LON = 78.9629; // India center

export default function ExploreScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [search, setSearch] = useState('');
  const [kind, setKind] = useState('All');
  const [sortBy, setSortBy] = useState<'name' | 'rate'>('rate');
  const [selectedPlace, setSelectedPlace] = useState<any | null>(null);
  const [wikiData, setWikiData] = useState<any>(null);
  const [wikiLoading, setWikiLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const [lat, setLat] = useState(DEFAULT_LAT);
  const [lon, setLon] = useState(DEFAULT_LON);
  const [geoSearching, setGeoSearching] = useState(false);

  const { data: places = [], isLoading, error, refetch } = useQuery({
    queryKey: ['explore-places', lat, lon, kind],
    queryFn: () => getPlacesNearby(lat, lon, 50000, kind === 'All' ? 'interesting_places' : kind, 30),
    staleTime: 1000 * 60 * 10,
  });

  const handleSearch = async () => {
    if (!search.trim()) return;
    setGeoSearching(true);
    try {
      const results = await geocodeSearch(search);
      if (results.length > 0) {
        setLat(parseFloat(results[0].lat));
        setLon(parseFloat(results[0].lon));
      }
    } catch { }
    finally { setGeoSearching(false); }
  };

  const handlePlaceTap = async (place: OTMPlace) => {
    setModalVisible(true);
    setWikiData(null);
    setSelectedPlace(place);
    setWikiLoading(true);
    try {
      const detail = await getPlaceDetail(place.xid);
      setSelectedPlace(detail);
      if (place.name) {
        const wiki = await getWikiSummary(place.name);
        setWikiData(wiki);
      }
    } catch { }
    finally { setWikiLoading(false); }
  };

  const filtered = places
    .filter(p => !search || p.name?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
      return (b.rate || 0) - (a.rate || 0);
    });

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.safeTop}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Explore India</Text>
          <Text style={styles.headerSub}>Discover your next destination</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchRow}>
          <View style={styles.searchWrap}>
            <Ionicons name="search" size={20} color={Colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search city, attraction…"
              placeholderTextColor={Colors.textMuted}
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {geoSearching && <ActivityIndicator size="small" color={Colors.primary} />}
          </View>
          <TouchableOpacity style={styles.sortBtn} onPress={() => setSortBy(s => s === 'name' ? 'rate' : 'name')}>
            <Ionicons name="swap-vertical" size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Kind filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
          {KINDS.map(k => (
            <TouchableOpacity
              key={k}
              style={[styles.chip, kind === k && { backgroundColor: Colors.primary, borderColor: Colors.primary }]}
              onPress={() => setKind(k)}
            >
              <Text style={[styles.chipText, kind === k && { color: '#FFF' }]}>{KIND_LABELS[k]}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={Colors.primary} size="large" />
          <Text style={styles.loadingText}>Finding places…</Text>
        </View>
      ) : error ? (
        <View style={styles.errorWrap}>
          <Ionicons name="cloud-offline-outline" size={48} color={Colors.border} />
          <Text style={styles.errorTitle}>Could not load places</Text>
          <Text style={styles.errorSub}>Check your API key or connection.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.xid}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="search" size={48} color={Colors.border} />
              <Text style={styles.emptyTitle}>No results found</Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <TouchableOpacity style={styles.placeRow} onPress={() => handlePlaceTap(item)} activeOpacity={0.8}>
              <View style={[styles.placeIndex, { backgroundColor: Colors.primary }]}>
                <Text style={styles.placeIndexText}>{index + 1}</Text>
              </View>
              <View style={styles.placeInfo}>
                <Text style={styles.placeName}>{item.name || 'Unnamed Place'}</Text>
                <Text style={styles.placeKind}>{formatKinds(item.kinds)}</Text>
                {item.dist !== undefined && (
                  <Text style={styles.placeDist}>{(item.dist / 1000).toFixed(1)} km away</Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        />
      )}

      {/* Place Detail Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalRoot}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalClose}>
              <Ionicons name="close" size={22} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle} numberOfLines={2}>{selectedPlace?.name || 'Place Detail'}</Text>
          </View>
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {(selectedPlace?.preview?.source || wikiData?.thumbnail?.source) && (
              <Image
                source={{ uri: selectedPlace?.preview?.source || wikiData?.thumbnail?.source }}
                style={styles.modalImage}
                resizeMode="cover"
              />
            )}
            <View style={styles.modalBody}>
              <View style={styles.kindBadge}>
                <Text style={styles.kindBadgeText}>{formatKinds(selectedPlace?.kinds || '')}</Text>
              </View>
              {selectedPlace?.address && (
                <View style={styles.addressRow}>
                  <Ionicons name="location-outline" size={15} color={Colors.primary} />
                  <Text style={styles.addressText}>
                    {[selectedPlace.address.city, selectedPlace.address.state, selectedPlace.address.country].filter(Boolean).join(', ')}
                  </Text>
                </View>
              )}
              {wikiLoading ? (
                <View style={styles.wikiLoading}>
                  <ActivityIndicator color={Colors.primary} />
                  <Text style={styles.wikiLoadingText}>Loading Wikipedia summary…</Text>
                </View>
              ) : wikiData ? (
                <>
                  <Text style={styles.wikiExtract}>{wikiData.extract}</Text>
                  {wikiData.content_urls?.desktop?.page && (
                    <Text style={styles.wikiLink}>Source: {wikiData.content_urls.desktop.page}</Text>
                  )}
                </>
              ) : (
                <Text style={styles.noWiki}>No additional description available.</Text>
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  safeTop: { backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  header: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 10 },
  headerTitle: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 28, color: Colors.text },
  headerSub: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  searchRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 10, marginBottom: 12 },
  searchWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background, borderRadius: 14, paddingHorizontal: 14, borderWidth: 1.5, borderColor: Colors.border, gap: 10 },
  searchInput: { flex: 1, fontFamily: 'Nunito_400Regular', fontSize: 15, color: Colors.text, paddingVertical: 13 },
  sortBtn: { width: 46, height: 46, borderRadius: 14, backgroundColor: Colors.primaryMuted, justifyContent: 'center', alignItems: 'center' },
  filters: { marginBottom: 12 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border },
  chipText: { fontFamily: 'Nunito_700Bold', fontSize: 12, color: Colors.textSecondary },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.textMuted },
  errorWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  errorTitle: { fontFamily: 'Nunito_700Bold', fontSize: 18, color: Colors.text, marginTop: 16 },
  errorSub: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: Colors.textSecondary, textAlign: 'center', marginTop: 6 },
  retryBtn: { marginTop: 20, backgroundColor: Colors.primaryMuted, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14 },
  retryText: { fontFamily: 'Nunito_700Bold', fontSize: 14, color: Colors.primary },
  list: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 100 },
  emptyWrap: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontFamily: 'Nunito_700Bold', fontSize: 16, color: Colors.text, marginTop: 12 },
  placeRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 16, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 },
  placeIndex: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  placeIndexText: { fontFamily: 'Nunito_700Bold', fontSize: 13, color: '#FFF' },
  placeInfo: { flex: 1 },
  placeName: { fontFamily: 'Nunito_700Bold', fontSize: 15, color: Colors.text, marginBottom: 3 },
  placeKind: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: Colors.textSecondary },
  placeDist: { fontFamily: 'Nunito_400Regular', fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  modalRoot: { flex: 1, backgroundColor: Colors.background },
  modalHeader: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 14 },
  modalClose: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' },
  modalTitle: { flex: 1, fontFamily: 'PlayfairDisplay_700Bold', fontSize: 20, color: Colors.text },
  modalContent: { flex: 1 },
  modalImage: { width: '100%', height: 220 },
  modalBody: { padding: 20 },
  kindBadge: { backgroundColor: Colors.primaryMuted, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12, marginBottom: 14 },
  kindBadgeText: { fontFamily: 'Nunito_700Bold', fontSize: 12, color: Colors.primary },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  addressText: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: Colors.textSecondary },
  wikiLoading: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  wikiLoadingText: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: Colors.textMuted },
  wikiExtract: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.text, lineHeight: 24 },
  wikiLink: { fontFamily: 'Nunito_400Regular', fontSize: 11, color: Colors.textMuted, marginTop: 12 },
  noWiki: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.textMuted },
});

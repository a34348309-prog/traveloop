import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, StatusBar, Modal, KeyboardAvoidingView, Platform
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { Colors } from '../../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL } from '../../lib/apiConfig';

export default function ProfileScreen() {
  const { profile, signOut, updateProfile } = useAuthStore();
  const router = useRouter();

  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState(profile?.name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [city, setCity] = useState(profile?.city || '');
  const [saving, setSaving] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Fetch trips for stats
  const { data: trips = [] } = useQuery({
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

  const handleSave = async () => {
    if (!name.trim()) { Toast.show({ type: 'error', text1: 'Name cannot be empty' }); return; }
    setSaving(true);
    try {
      await updateProfile({ name: name.trim(), phone, city });
      setEditMode(false);
      Toast.show({ type: 'success', text1: 'Profile updated!' });
    } catch { 
      Toast.show({ type: 'error', text1: 'Error saving profile' }); 
    } finally { 
      setSaving(false); 
    }
  };

  const handleLogout = async () => {
    setShowLogoutModal(false);
    await signOut();
  };

  const upcomingTrips = trips.filter((t: any) => {
    const today = new Date().toISOString().split('T')[0];
    return !t.end_date || t.end_date >= today;
  });
  const pastTrips = trips.filter((t: any) => {
    const today = new Date().toISOString().split('T')[0];
    return t.end_date && t.end_date < today;
  });

  const initials = profile?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'T';

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView showsVerticalScrollIndicator={false}>

          {/* Header banner */}
          <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.banner}>
            <SafeAreaView style={styles.bannerContent}>
              <View style={styles.bannerTopRow}>
                <Text style={styles.bannerTitle}>My Profile</Text>
                <TouchableOpacity
                  style={styles.editToggle}
                  onPress={() => { if (editMode) handleSave(); else setEditMode(true); }}
                >
                  <Text style={styles.editToggleText}>{editMode ? (saving ? 'Saving…' : 'Save') : 'Edit'}</Text>
                </TouchableOpacity>
              </View>

              {/* Avatar circle */}
              <View style={styles.avatarWrap}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarInitials}>{initials}</Text>
                </View>
              </View>

              {/* Name (editable) */}
              {editMode ? (
                <TextInput
                  style={styles.nameInput}
                  value={name}
                  onChangeText={setName}
                  placeholder="Your Name"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                />
              ) : (
                <Text style={styles.userName}>{profile?.name}</Text>
              )}
              <Text style={styles.userEmail}>{profile?.email}</Text>
            </SafeAreaView>
          </LinearGradient>

          {/* User Details with appropriate options to edit (wireframe Screen 7) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Details</Text>

            <View style={styles.detailCard}>
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Ionicons name="person-outline" size={18} color={Colors.primary} />
                </View>
                <View style={styles.detailInfo}>
                  <Text style={styles.detailLabel}>Full Name</Text>
                  {editMode ? (
                    <TextInput style={styles.detailInput} value={name} onChangeText={setName} placeholder="Enter name" placeholderTextColor={Colors.textMuted} />
                  ) : (
                    <Text style={styles.detailValue}>{name || '—'}</Text>
                  )}
                </View>
              </View>

              <View style={styles.detailDivider} />

              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Ionicons name="mail-outline" size={18} color={Colors.primary} />
                </View>
                <View style={styles.detailInfo}>
                  <Text style={styles.detailLabel}>Email</Text>
                  <Text style={styles.detailValue}>{profile?.email}</Text>
                </View>
              </View>

              <View style={styles.detailDivider} />

              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Ionicons name="call-outline" size={18} color={Colors.primary} />
                </View>
                <View style={styles.detailInfo}>
                  <Text style={styles.detailLabel}>Phone Number</Text>
                  {editMode ? (
                    <TextInput style={styles.detailInput} value={phone} onChangeText={setPhone} placeholder="+91 XXXXX XXXXX" placeholderTextColor={Colors.textMuted} keyboardType="phone-pad" />
                  ) : (
                    <Text style={styles.detailValue}>{phone || 'Not set'}</Text>
                  )}
                </View>
              </View>

              <View style={styles.detailDivider} />

              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Ionicons name="location-outline" size={18} color={Colors.primary} />
                </View>
                <View style={styles.detailInfo}>
                  <Text style={styles.detailLabel}>City</Text>
                  {editMode ? (
                    <TextInput style={styles.detailInput} value={city} onChangeText={setCity} placeholder="Your city" placeholderTextColor={Colors.textMuted} />
                  ) : (
                    <Text style={styles.detailValue}>{city || 'Not set'}</Text>
                  )}
                </View>
              </View>
            </View>
          </View>

          {/* Trip Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{trips.length}</Text>
              <Text style={styles.statLabel}>Total Trips</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{upcomingTrips.length}</Text>
              <Text style={styles.statLabel}>Upcoming</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{pastTrips.length}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
          </View>

          {/* Planned Trips (wireframe: grid with View buttons) */}
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Planned Trips</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/trips')}>
                <Text style={styles.seeAll}>View All</Text>
              </TouchableOpacity>
            </View>

            {upcomingTrips.length === 0 ? (
              <View style={styles.emptyTrips}>
                <Ionicons name="map-outline" size={32} color={Colors.border} />
                <Text style={styles.emptyTripsText}>No planned trips yet</Text>
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tripScroll}>
                {upcomingTrips.map((trip: any) => (
                  <TouchableOpacity
                    key={trip.id}
                    style={styles.tripThumb}
                    onPress={() => router.push(`/(tabs)/trips/${trip.id}/itinerary` as any)}
                  >
                    <View style={styles.tripThumbImg}>
                      <Ionicons name="airplane" size={28} color={Colors.primary} />
                    </View>
                    <Text style={styles.tripThumbName} numberOfLines={1}>{trip.name}</Text>
                    <Text style={styles.tripThumbDate} numberOfLines={1}>{trip.start_date || 'TBD'}</Text>
                    <TouchableOpacity
                      style={styles.viewBtn}
                      onPress={() => router.push(`/(tabs)/trips/${trip.id}/itinerary` as any)}
                    >
                      <Text style={styles.viewBtnText}>View</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Previous Trips (wireframe grid) */}
          {pastTrips.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Previous Trips</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tripScroll}>
                {pastTrips.map((trip: any) => (
                  <TouchableOpacity
                    key={trip.id}
                    style={[styles.tripThumb, styles.tripThumbPast]}
                    onPress={() => router.push(`/(tabs)/trips/${trip.id}/itinerary` as any)}
                  >
                    <View style={[styles.tripThumbImg, { backgroundColor: Colors.border }]}>
                      <Ionicons name="checkmark-circle" size={28} color={Colors.accent} />
                    </View>
                    <Text style={styles.tripThumbName} numberOfLines={1}>{trip.name}</Text>
                    <Text style={styles.tripThumbDate} numberOfLines={1}>{trip.end_date}</Text>
                    <TouchableOpacity
                      style={[styles.viewBtn, { backgroundColor: Colors.background }]}
                      onPress={() => router.push(`/(tabs)/trips/${trip.id}/itinerary` as any)}
                    >
                      <Text style={[styles.viewBtnText, { color: Colors.textSecondary }]}>View</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Logout */}
          <View style={styles.section}>
            <TouchableOpacity style={styles.logoutBtn} onPress={() => setShowLogoutModal(true)}>
              <Ionicons name="log-out-outline" size={20} color={Colors.error} />
              <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Logout Modal */}
      <Modal visible={showLogoutModal} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Log Out?</Text>
            <Text style={styles.modalDesc}>You will need to log in again to access your trips.</Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowLogoutModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={handleLogout}>
                <Text style={styles.modalConfirmText}>Log Out</Text>
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
  banner: { paddingBottom: 40 },
  bannerContent: { paddingHorizontal: 24, paddingTop: 12 },
  bannerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  bannerTitle: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 24, color: '#FFF' },
  editToggle: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 18, paddingVertical: 9, borderRadius: 14 },
  editToggleText: { fontFamily: 'Nunito_700Bold', fontSize: 14, color: '#FFF' },
  avatarWrap: { alignItems: 'center', marginBottom: 14 },
  avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)' },
  avatarInitials: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 32, color: '#FFF' },
  userName: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 24, color: '#FFF', textAlign: 'center', marginBottom: 4 },
  nameInput: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 24, color: '#FFF', textAlign: 'center', marginBottom: 4, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.5)', paddingBottom: 4 },
  userEmail: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: 'rgba(255,255,255,0.75)', textAlign: 'center' },
  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 20, color: Colors.text, marginBottom: 14 },
  seeAll: { fontFamily: 'Nunito_700Bold', fontSize: 14, color: Colors.primary },
  detailCard: { backgroundColor: Colors.surface, borderRadius: 18, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  detailRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  detailDivider: { height: 1, backgroundColor: Colors.border, marginHorizontal: 16 },
  detailIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.primaryMuted, justifyContent: 'center', alignItems: 'center' },
  detailInfo: { flex: 1 },
  detailLabel: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: Colors.textMuted, marginBottom: 3 },
  detailValue: { fontFamily: 'Nunito_700Bold', fontSize: 15, color: Colors.text },
  detailInput: { fontFamily: 'Nunito_700Bold', fontSize: 15, color: Colors.text, borderBottomWidth: 1, borderBottomColor: Colors.primary, paddingBottom: 2 },
  statsRow: { flexDirection: 'row', backgroundColor: Colors.surface, marginHorizontal: 20, marginTop: 20, borderRadius: 18, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 26, color: Colors.primary },
  statLabel: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: Colors.border },
  tripScroll: { marginBottom: 4 },
  tripThumb: { width: 130, marginRight: 12, backgroundColor: Colors.surface, borderRadius: 16, padding: 14, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  tripThumbPast: { backgroundColor: Colors.surfaceSecondary },
  tripThumbImg: { width: 56, height: 56, borderRadius: 16, backgroundColor: Colors.primaryMuted, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  tripThumbName: { fontFamily: 'Nunito_700Bold', fontSize: 13, color: Colors.text, marginBottom: 3, textAlign: 'center' },
  tripThumbDate: { fontFamily: 'Nunito_400Regular', fontSize: 11, color: Colors.textMuted, marginBottom: 10, textAlign: 'center' },
  viewBtn: { backgroundColor: Colors.primaryMuted, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 },
  viewBtnText: { fontFamily: 'Nunito_700Bold', fontSize: 12, color: Colors.primary },
  emptyTrips: { alignItems: 'center', padding: 24, backgroundColor: Colors.surface, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed' },
  emptyTripsText: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: Colors.textMuted, marginTop: 8 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#FEE2E2', borderRadius: 16, paddingVertical: 16 },
  logoutText: { fontFamily: 'Nunito_700Bold', fontSize: 16, color: Colors.error },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  modalCard: { backgroundColor: Colors.surface, borderRadius: 24, padding: 28, width: '100%' },
  modalTitle: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 22, color: Colors.text, marginBottom: 10 },
  modalDesc: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.textSecondary, lineHeight: 22, marginBottom: 24 },
  modalBtns: { flexDirection: 'row', gap: 12 },
  modalCancel: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 14, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border },
  modalCancelText: { fontFamily: 'Nunito_700Bold', fontSize: 15, color: Colors.textSecondary },
  modalConfirm: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 14, backgroundColor: Colors.error },
  modalConfirmText: { fontFamily: 'Nunito_700Bold', fontSize: 15, color: '#FFF' },
});

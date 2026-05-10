import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, ActivityIndicator, Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAdminStats } from '../hooks/useSupabase';
import { useAuthStore } from '../store/authStore';
import { PieChart, LineChart, BarChart } from 'react-native-chart-kit';
import dayjs from 'dayjs';

const { width } = Dimensions.get('window');
const CHART_W = width - 48;

const CHART_CONFIG = {
  backgroundGradientFrom: '#fff',
  backgroundGradientTo: '#fff',
  color: (o = 1) => `rgba(37, 99, 235, ${o})`,
  labelColor: () => '#64748B',
  strokeWidth: 2,
  barPercentage: 0.7,
  decimalPlaces: 0,
};

type Tab = 'Users' | 'Trips' | 'Charts';
const TABS: Tab[] = ['Users', 'Trips', 'Charts'];

export default function AdminScreen() {
  const { profile } = useAuthStore();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('Charts');
  const { data, isLoading, error, refetch } = useAdminStats();

  // Role gate — non-admin users get bounced
  if (profile?.role !== 'admin') {
    return (
      <View style={styles.gateWrap}>
        <Ionicons name="lock-closed" size={56} color={Colors.error} />
        <Text style={styles.gateTitle}>Access Denied</Text>
        <Text style={styles.gateSub}>This area is restricted to administrators only.</Text>
        <TouchableOpacity style={styles.gateBtn} onPress={() => router.back()}>
          <Text style={styles.gateBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator color={Colors.primary} size="large" /></View>;
  }
  if (error || !data) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Failed to load admin data</Text>
        <TouchableOpacity onPress={() => refetch()}><Text style={styles.retryText}>Retry</Text></TouchableOpacity>
      </View>
    );
  }

  const { users, trips, posts } = data;

  // Trip status breakdown for pie chart
  const statusCounts = { upcoming: 0, ongoing: 0, completed: 0 };
  const today = dayjs().format('YYYY-MM-DD');
  trips.forEach((t: any) => {
    if (!t.start_date) { statusCounts.upcoming++; return; }
    if (t.start_date <= today && (!t.end_date || t.end_date >= today)) statusCounts.ongoing++;
    else if (t.end_date && t.end_date < today) statusCounts.completed++;
    else statusCounts.upcoming++;
  });

  const pieData = [
    { name: 'Upcoming', population: statusCounts.upcoming, color: Colors.primary, legendFontColor: Colors.text, legendFontSize: 13 },
    { name: 'Ongoing', population: statusCounts.ongoing, color: Colors.accent, legendFontColor: Colors.text, legendFontSize: 13 },
    { name: 'Completed', population: statusCounts.completed, color: Colors.textMuted, legendFontColor: Colors.text, legendFontSize: 13 },
  ].filter(d => d.population > 0);

  // Monthly trips for line chart (last 6 months)
  const months = Array.from({ length: 6 }, (_, i) => dayjs().subtract(5 - i, 'month').format('MMM'));
  const monthlyTrips = months.map((_, i) => {
    const m = dayjs().subtract(5 - i, 'month');
    return trips.filter((t: any) => t.created_at && dayjs(t.created_at).isSame(m, 'month')).length;
  });

  // Top cities for bar chart
  const cityCount: Record<string, number> = {};
  trips.forEach((t: any) => { if (t.place) cityCount[t.place] = (cityCount[t.place] || 0) + 1; });
  const topCities = Object.entries(cityCount).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Admin Dashboard</Text>
          </View>
          <View style={styles.statsGrid}>
            {[
              { label: 'Users', val: users.length, icon: 'people', color: Colors.primary },
              { label: 'Trips', val: trips.length, icon: 'map', color: Colors.secondary },
              { label: 'Posts', val: posts.length, icon: 'chatbubbles', color: Colors.accent },
            ].map(s => (
              <View key={s.label} style={styles.statCard}>
                <Ionicons name={s.icon as any} size={24} color={s.color} />
                <Text style={styles.statNum}>{s.val}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabs}>
        {TABS.map(t => (
          <TouchableOpacity key={t} style={[styles.tabBtn, tab === t && styles.tabBtnActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Users Tab */}
        {tab === 'Users' && (
          <>
            <Text style={styles.sectionTitle}>All Users ({users.length})</Text>
            {users.map((u: any) => (
              <View key={u.id} style={styles.row}>
                <View style={styles.rowAvatar}>
                  <Text style={styles.rowAvatarText}>{u.name?.[0]?.toUpperCase() || '?'}</Text>
                </View>
                <View style={styles.rowInfo}>
                  <Text style={styles.rowTitle}>{u.name}</Text>
                  <Text style={styles.rowSub}>{u.email}</Text>
                </View>
                <View style={[styles.roleBadge, u.role === 'admin' && { backgroundColor: '#FEF3C7' }]}>
                  <Text style={[styles.roleText, u.role === 'admin' && { color: '#92400E' }]}>{u.role}</Text>
                </View>
              </View>
            ))}
          </>
        )}

        {/* Trips Tab */}
        {tab === 'Trips' && (
          <>
            <Text style={styles.sectionTitle}>All Trips ({trips.length})</Text>
            {trips.map((t: any) => (
              <View key={t.id} style={styles.row}>
                <View style={[styles.rowAvatar, { backgroundColor: Colors.primaryMuted }]}>
                  <Ionicons name="airplane" size={20} color={Colors.primary} />
                </View>
                <View style={styles.rowInfo}>
                  <Text style={styles.rowTitle}>{t.name}</Text>
                  <Text style={styles.rowSub}>{t.place || 'No destination'}</Text>
                  <Text style={styles.rowDate}>{t.start_date || 'No date'}</Text>
                </View>
              </View>
            ))}
          </>
        )}

        {/* Charts Tab */}
        {tab === 'Charts' && (
          <>
            <Text style={styles.sectionTitle}>Trip Status Breakdown</Text>
            {pieData.length > 0 ? (
              <PieChart
                data={pieData}
                width={CHART_W}
                height={180}
                chartConfig={CHART_CONFIG}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="0"
                style={styles.chart}
              />
            ) : (
              <Text style={styles.noData}>No trip data to display</Text>
            )}

            <Text style={styles.sectionTitle}>Monthly Trips (6 months)</Text>
            <LineChart
              data={{ labels: months, datasets: [{ data: monthlyTrips.length > 0 ? monthlyTrips : [0] }] }}
              width={CHART_W}
              height={200}
              chartConfig={CHART_CONFIG}
              bezier
              style={styles.chart}
            />

            {topCities.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Top Destinations</Text>
                <BarChart
                  data={{ labels: topCities.map(c => c[0].slice(0, 8)), datasets: [{ data: topCities.map(c => c[1]) }] }}
                  width={CHART_W}
                  height={220}
                  yAxisLabel=""
                  yAxisSuffix=""
                  chartConfig={CHART_CONFIG}
                  style={styles.chart}
                />
              </>
            )}
          </>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  gateWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  gateTitle: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 24, color: Colors.text, marginTop: 16 },
  gateSub: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginTop: 8, marginBottom: 24 },
  gateBtn: { backgroundColor: Colors.primaryMuted, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14 },
  gateBtnText: { fontFamily: 'Nunito_700Bold', fontSize: 15, color: Colors.primary },
  errorText: { fontFamily: 'Nunito_700Bold', fontSize: 16, color: Colors.text },
  retryText: { fontFamily: 'Nunito_700Bold', fontSize: 14, color: Colors.primary },
  header: { paddingBottom: 24, paddingHorizontal: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingTop: 12, marginBottom: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 24, color: '#FFF' },
  statsGrid: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 16, padding: 16, alignItems: 'center', gap: 6 },
  statNum: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 28, color: '#FFF' },
  statLabel: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  tabs: { flexDirection: 'row', backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tabBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2.5, borderBottomColor: 'transparent' },
  tabBtnActive: { borderBottomColor: Colors.primary },
  tabText: { fontFamily: 'Nunito_700Bold', fontSize: 14, color: Colors.textMuted },
  tabTextActive: { color: Colors.primary },
  content: { flex: 1, padding: 24 },
  sectionTitle: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 18, color: Colors.text, marginBottom: 14, marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 14, padding: 14, marginBottom: 8 },
  rowAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.primaryMuted, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  rowAvatarText: { fontFamily: 'Nunito_700Bold', fontSize: 18, color: Colors.primary },
  rowInfo: { flex: 1 },
  rowTitle: { fontFamily: 'Nunito_700Bold', fontSize: 14, color: Colors.text },
  rowSub: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: Colors.textSecondary },
  rowDate: { fontFamily: 'Nunito_400Regular', fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  roleBadge: { backgroundColor: Colors.primaryMuted, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  roleText: { fontFamily: 'Nunito_700Bold', fontSize: 11, color: Colors.primary },
  chart: { borderRadius: 16, marginBottom: 20 },
  noData: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.textMuted, marginBottom: 20 },
});

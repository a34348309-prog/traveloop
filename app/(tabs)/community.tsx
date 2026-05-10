import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, ActivityIndicator, TextInput, FlatList, Modal, KeyboardAvoidingView, Platform
} from 'react-native';
import { Colors } from '../../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCommunityPosts, useAddCommunityPost } from '../../hooks/useSupabase';
import { useTrips } from '../../hooks/useSupabase';
import { useAuthStore } from '../../store/authStore';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

export default function CommunityScreen() {
  const { profile } = useAuthStore();
  const { data: posts = [], isLoading, error, refetch } = useCommunityPosts();
  const { data: trips = [] } = useTrips();
  const { mutateAsync: addPost, isPending: posting } = useAddCommunityPost();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [newPostVisible, setNewPostVisible] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [selectedTripId, setSelectedTripId] = useState<string | undefined>();
  const [postError, setPostError] = useState('');

  const handlePost = async () => {
    if (!newContent.trim()) { setPostError('Post content cannot be empty'); return; }
    setPostError('');
    try {
      await addPost({ content: newContent.trim(), trip_id: selectedTripId });
      setNewContent('');
      setSelectedTripId(undefined);
      setNewPostVisible(false);
    } catch (e: any) {
      setPostError(e.message || 'Failed to post');
    }
  };

  const filtered = posts
    .filter((p: any) => !search || p.content?.toLowerCase().includes(search.toLowerCase()))
    .sort((a: any, b: any) => {
      const da = dayjs(a.created_at), db = dayjs(b.created_at);
      return sortBy === 'newest' ? db.diff(da) : da.diff(db);
    });

  const initials = (name: string) => name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.safeTop}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Community</Text>
            <Text style={styles.headerSub}>Share your travel stories</Text>
          </View>
          <TouchableOpacity style={styles.newPostBtn} onPress={() => setNewPostVisible(true)}>
            <LinearGradient colors={[Colors.primary, Colors.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.newPostGradient}>
              <Ionicons name="add" size={20} color="#FFF" />
              <Text style={styles.newPostText}>Share</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Search + Sort */}
        <View style={styles.searchRow}>
          <View style={styles.searchWrap}>
            <Ionicons name="search" size={18} color={Colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search posts…"
              placeholderTextColor={Colors.textMuted}
              value={search}
              onChangeText={setSearch}
            />
          </View>
          <TouchableOpacity style={styles.sortBtn} onPress={() => setSortBy(s => s === 'newest' ? 'oldest' : 'newest')}>
            <Ionicons name="funnel-outline" size={18} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={Colors.primary} size="large" />
          <Text style={styles.loadingText}>Loading community posts…</Text>
        </View>
      ) : error ? (
        <View style={styles.errorWrap}>
          <Ionicons name="wifi-outline" size={48} color={Colors.border} />
          <Text style={styles.errorTitle}>Could not load posts</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="earth-outline" size={56} color={Colors.border} />
              <Text style={styles.emptyTitle}>No posts yet</Text>
              <Text style={styles.emptySub}>Be the first to share your travel story!</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => setNewPostVisible(true)}>
                <Text style={styles.emptyBtnText}>Share Your Experience</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => {
            const isExpanded = selectedPost?.id === item.id;
            const author = (item as any).users;
            return (
              <TouchableOpacity
                style={styles.postCard}
                onPress={() => setSelectedPost(isExpanded ? null : item)}
                activeOpacity={0.85}
              >
                <View style={styles.postHeader}>
                  <View style={styles.postAvatar}>
                    <Text style={styles.postAvatarText}>{initials(author?.name || 'U')}</Text>
                  </View>
                  <View style={styles.postMeta}>
                    <Text style={styles.postAuthor}>{author?.name || 'Traveler'}</Text>
                    {(item as any).trips?.name && (
                      <Text style={styles.postTrip}>📍 {(item as any).trips.name}</Text>
                    )}
                    <Text style={styles.postTime}>{dayjs(item.created_at).fromNow()}</Text>
                  </View>
                  <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.textMuted} />
                </View>
                <Text style={styles.postContent} numberOfLines={isExpanded ? undefined : 3}>
                  {item.content}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* New Post Modal */}
      <Modal visible={newPostVisible} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalRoot}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Share Experience</Text>
              <TouchableOpacity onPress={() => { setNewPostVisible(false); setNewContent(''); setPostError(''); }}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
              {postError ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={16} color={Colors.error} />
                  <Text style={styles.errorText}>{postError}</Text>
                </View>
              ) : null}

              <Text style={styles.modalLabel}>Your story *</Text>
              <TextInput
                style={styles.contentInput}
                placeholder="Share your travel experience, tips, or moments…"
                placeholderTextColor={Colors.textMuted}
                value={newContent}
                onChangeText={v => { setNewContent(v); setPostError(''); }}
                multiline
                textAlignVertical="top"
                autoFocus
              />

              <Text style={styles.modalLabel}>Link to a trip (optional)</Text>
              {trips.length === 0 ? (
                <Text style={styles.noTripsNote}>No trips yet to link.</Text>
              ) : (
                trips.map((t: any) => (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.tripOption, selectedTripId === t.id && styles.tripOptionSelected]}
                    onPress={() => setSelectedTripId(prev => prev === t.id ? undefined : t.id)}
                  >
                    <Ionicons name={selectedTripId === t.id ? 'radio-button-on' : 'radio-button-off'} size={18} color={Colors.primary} />
                    <Text style={styles.tripOptionText}>{t.name}</Text>
                  </TouchableOpacity>
                ))
              )}

              <TouchableOpacity
                style={[styles.postBtn, posting && { opacity: 0.7 }]}
                onPress={handlePost}
                disabled={posting}
              >
                <LinearGradient colors={[Colors.primary, Colors.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.postBtnGradient}>
                  <Text style={styles.postBtnText}>{posting ? 'Posting…' : 'Post Experience'}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  safeTop: { backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 12 },
  headerTitle: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 28, color: Colors.text },
  headerSub: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  newPostBtn: { borderRadius: 14, overflow: 'hidden' },
  newPostGradient: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10 },
  newPostText: { fontFamily: 'Nunito_700Bold', fontSize: 14, color: '#FFF' },
  searchRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 10, paddingBottom: 14 },
  searchWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background, borderRadius: 14, paddingHorizontal: 14, borderWidth: 1.5, borderColor: Colors.border, gap: 10 },
  searchInput: { flex: 1, fontFamily: 'Nunito_400Regular', fontSize: 15, color: Colors.text, paddingVertical: 12 },
  sortBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.primaryMuted, justifyContent: 'center', alignItems: 'center' },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.textMuted },
  errorWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  errorTitle: { fontFamily: 'Nunito_700Bold', fontSize: 16, color: Colors.text, marginTop: 16 },
  retryBtn: { marginTop: 16, backgroundColor: Colors.primaryMuted, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  retryText: { fontFamily: 'Nunito_700Bold', fontSize: 14, color: Colors.primary },
  list: { padding: 20, paddingBottom: 100 },
  emptyWrap: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 40 },
  emptyTitle: { fontFamily: 'Nunito_700Bold', fontSize: 20, color: Colors.text, marginTop: 16 },
  emptySub: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginTop: 8, marginBottom: 24 },
  emptyBtn: { backgroundColor: Colors.primaryMuted, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14 },
  emptyBtnText: { fontFamily: 'Nunito_700Bold', fontSize: 14, color: Colors.primary },
  postCard: { backgroundColor: Colors.surface, borderRadius: 18, padding: 18, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  postHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, gap: 12 },
  postAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.primaryMuted, justifyContent: 'center', alignItems: 'center' },
  postAvatarText: { fontFamily: 'Nunito_700Bold', fontSize: 16, color: Colors.primary },
  postMeta: { flex: 1 },
  postAuthor: { fontFamily: 'Nunito_700Bold', fontSize: 15, color: Colors.text },
  postTrip: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: Colors.primary, marginTop: 2 },
  postTime: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  postContent: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.text, lineHeight: 22 },
  modalRoot: { flex: 1, backgroundColor: Colors.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 22, color: Colors.text },
  modalContent: { flex: 1, padding: 20 },
  modalLabel: { fontFamily: 'Nunito_700Bold', fontSize: 13, color: Colors.text, marginBottom: 10, marginTop: 16 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEE2E2', borderRadius: 12, padding: 12, marginBottom: 16 },
  errorText: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: Colors.error, flex: 1 },
  contentInput: { backgroundColor: Colors.surface, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.border, padding: 16, fontFamily: 'Nunito_400Regular', fontSize: 15, color: Colors.text, minHeight: 140 },
  noTripsNote: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: Colors.textMuted },
  tripOption: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.surface, borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1.5, borderColor: Colors.border },
  tripOptionSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryMuted },
  tripOptionText: { fontFamily: 'Nunito_700Bold', fontSize: 14, color: Colors.text, flex: 1 },
  postBtn: { borderRadius: 18, overflow: 'hidden', marginTop: 24 },
  postBtnGradient: { paddingVertical: 18, alignItems: 'center' },
  postBtnText: { fontFamily: 'Nunito_700Bold', fontSize: 17, color: '#FFF' },
});

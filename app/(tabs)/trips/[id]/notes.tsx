import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Modal, KeyboardAvoidingView, Platform, StatusBar
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { getDB } from '../../../../db/schema';
import { Colors } from '../../../../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

// @ts-ignore
dayjs.extend(require('dayjs/plugin/relativeTime'));

const MOODS = [
  { key: '😊', label: 'Happy' },
  { key: '😍', label: 'Excited' },
  { key: '😎', label: 'Chilled' },
  { key: '😴', label: 'Tired' },
  { key: '🤩', label: 'Amazed' },
];

export default function NotesScreen() {
  const { id } = useLocalSearchParams();
  const [notes, setNotes] = useState<any[]>([]);
  const [isModalVisible, setModalVisible] = useState(false);
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('😊');
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);

  const loadNotes = async () => {
    const db = getDB();
    const loaded = await db.getAllAsync('SELECT * FROM notes WHERE trip_id = ? ORDER BY created_at DESC', [Number(id)]);
    setNotes(loaded);
  };

  useEffect(() => { loadNotes(); }, [id]);

  const handleSave = async () => {
    if (!content.trim()) return;
    const db = getDB();
    if (editingNoteId) {
      await db.runAsync('UPDATE notes SET content = ? WHERE id = ?', [content, editingNoteId]);
    } else {
      await db.runAsync('INSERT INTO notes (trip_id, content) VALUES (?, ?)', [Number(id), content]);
    }
    setModalVisible(false);
    setContent('');
    setEditingNoteId(null);
    loadNotes();
  };

  const handleDelete = async (noteId: number) => {
    const db = getDB();
    await db.runAsync('DELETE FROM notes WHERE id = ?', [noteId]);
    loadNotes();
  };

  const openEdit = (note?: any) => {
    if (note) { setContent(note.content); setEditingNoteId(note.id); }
    else { setContent(''); setEditingNoteId(null); }
    setModalVisible(true);
  };

  const renderNote = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.noteCard} onPress={() => openEdit(item)} activeOpacity={0.85}>
      <View style={styles.noteHeader}>
        <Text style={styles.noteMood}>{mood}</Text>
        <Text style={styles.noteTime}>{(dayjs(item.created_at) as any).fromNow()}</Text>
        <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.noteDelete}>
          <Ionicons name="trash-outline" size={16} color={Colors.error} />
        </TouchableOpacity>
      </View>
      <Text style={styles.noteContent} numberOfLines={4}>{item.content}</Text>
      <Text style={styles.noteDate}>{dayjs(item.created_at).format('MMMM D, YYYY • h:mm A')}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerSub}>Journal</Text>
            <Text style={styles.headerTitle}>Trip Notes</Text>
          </View>
          <View style={styles.notesCount}>
            <Text style={styles.notesCountNum}>{notes.length}</Text>
            <Text style={styles.notesCountLabel}>notes</Text>
          </View>
        </View>
      </SafeAreaView>

      <FlatList
        data={notes}
        keyExtractor={item => item.id.toString()}
        renderItem={renderNote}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="journal-outline" size={48} color={Colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No notes yet</Text>
            <Text style={styles.emptyDesc}>Start writing to capture your travel memories.</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => openEdit()} activeOpacity={0.85}>
        <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.fabGradient}>
          <Ionicons name="pencil" size={24} color="#FFF" />
        </LinearGradient>
      </TouchableOpacity>

      <Modal visible={isModalVisible} animationType="slide" presentationStyle="formSheet">
        <KeyboardAvoidingView style={styles.modalRoot} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalClose}>
              <Ionicons name="close" size={22} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{editingNoteId ? 'Edit Note' : 'New Note'}</Text>
            <TouchableOpacity onPress={handleSave} style={styles.modalSaveBtn}>
              <Text style={styles.modalSaveText}>Save</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.moodSelector}>
            <Text style={styles.moodLabel}>How are you feeling?</Text>
            <View style={styles.moodRow}>
              {MOODS.map(m => (
                <TouchableOpacity
                  key={m.key}
                  style={[styles.moodBtn, mood === m.key && styles.moodBtnActive]}
                  onPress={() => setMood(m.key)}
                >
                  <Text style={styles.moodEmoji}>{m.key}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TextInput
            style={styles.noteInput}
            value={content}
            onChangeText={setContent}
            placeholder="Write about your experience, thoughts, or reminders..."
            placeholderTextColor={Colors.textMuted}
            multiline
            autoFocus
            textAlignVertical="top"
          />
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 20 },
  headerSub: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: Colors.textMuted },
  headerTitle: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 30, color: Colors.text },
  notesCount: { backgroundColor: Colors.primaryMuted, borderRadius: 16, padding: 16, alignItems: 'center' },
  notesCountNum: { fontFamily: 'Nunito_700Bold', fontSize: 24, color: Colors.primary },
  notesCountLabel: { fontFamily: 'Nunito_400Regular', fontSize: 11, color: Colors.primary },
  list: { padding: 20, paddingBottom: 120 },
  noteCard: { backgroundColor: Colors.surface, borderRadius: 20, padding: 18, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3, borderLeftWidth: 4, borderLeftColor: Colors.primary },
  noteHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  noteMood: { fontSize: 20, marginRight: 8 },
  noteTime: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: Colors.textMuted, flex: 1 },
  noteDelete: { width: 32, height: 32, borderRadius: 8, backgroundColor: Colors.errorMuted, justifyContent: 'center', alignItems: 'center' },
  noteContent: { fontFamily: 'Nunito_400Regular', fontSize: 15, color: Colors.text, lineHeight: 24, marginBottom: 12 },
  noteDate: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: Colors.textMuted },
  empty: { alignItems: 'center', paddingVertical: 80 },
  emptyIconWrap: { width: 100, height: 100, borderRadius: 50, backgroundColor: Colors.primaryMuted, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle: { fontFamily: 'Nunito_700Bold', fontSize: 20, color: Colors.text, marginBottom: 8 },
  emptyDesc: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
  fab: { position: 'absolute', bottom: 28, right: 24, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 8 },
  fabGradient: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  modalRoot: { flex: 1, backgroundColor: Colors.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.surface },
  modalClose: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' },
  modalTitle: { fontFamily: 'Nunito_700Bold', fontSize: 17, color: Colors.text },
  modalSaveBtn: { backgroundColor: Colors.primaryMuted, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  modalSaveText: { fontFamily: 'Nunito_700Bold', fontSize: 14, color: Colors.primary },
  moodSelector: { padding: 20, borderBottomWidth: 1, borderBottomColor: Colors.border },
  moodLabel: { fontFamily: 'Nunito_700Bold', fontSize: 13, color: Colors.textSecondary, marginBottom: 12 },
  moodRow: { flexDirection: 'row', gap: 12 },
  moodBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: Colors.border },
  moodBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryMuted },
  moodEmoji: { fontSize: 24 },
  noteInput: { flex: 1, fontFamily: 'Nunito_400Regular', fontSize: 17, color: Colors.text, padding: 24, lineHeight: 28 },
});

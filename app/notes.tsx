import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { ArrowLeft, Plus, Trash2, Edit2, X, BookOpen, Search } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTES_STORAGE_KEY = 'meb-ags-notes';

type NoteCategory = 'formula' | 'note' | 'general';

interface Note {
  id: string;
  title: string;
  content: string;
  category: NoteCategory;
  createdAt: string;
  updatedAt: string;
}

const CATEGORIES: { id: NoteCategory; label: string; color: string }[] = [
  { id: 'formula', label: 'Formüller', color: '#8b5cf6' },
  { id: 'note',    label: 'Notlar',    color: '#3b82f6' },
  { id: 'general', label: 'Genel',     color: '#10b981' },
];

export default function NotesScreen() {
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<NoteCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formCategory, setFormCategory] = useState<NoteCategory>('note');

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      const saved = await AsyncStorage.getItem(NOTES_STORAGE_KEY);
      if (saved) setNotes(JSON.parse(saved));
    } catch (e) {
      console.error('Notlar yüklenirken hata:', e);
    }
  };

  const saveNotes = async (updated: Note[]) => {
    try {
      await AsyncStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Notlar kaydedilirken hata:', e);
    }
  };

  const openAddModal = () => {
    setEditingNote(null);
    setFormTitle('');
    setFormContent('');
    setFormCategory('note');
    setIsModalOpen(true);
  };

  const openEditModal = (note: Note) => {
    setEditingNote(note);
    setFormTitle(note.title);
    setFormContent(note.content);
    setFormCategory(note.category);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formTitle.trim()) {
      Alert.alert('Uyarı', 'Lütfen bir başlık girin.');
      return;
    }
    if (!formContent.trim()) {
      Alert.alert('Uyarı', 'Lütfen içerik girin.');
      return;
    }
    const now = new Date().toISOString();
    let updated: Note[];
    if (editingNote) {
      updated = notes.map(n =>
        n.id === editingNote.id
          ? { ...n, title: formTitle.trim(), content: formContent.trim(), category: formCategory, updatedAt: now }
          : n
      );
    } else {
      const newNote: Note = {
        id: Date.now().toString(),
        title: formTitle.trim(),
        content: formContent.trim(),
        category: formCategory,
        createdAt: now,
        updatedAt: now,
      };
      updated = [newNote, ...notes];
    }
    setNotes(updated);
    saveNotes(updated);
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Notu Sil', 'Bu notu silmek istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: () => {
          const updated = notes.filter(n => n.id !== id);
          setNotes(updated);
          saveNotes(updated);
        },
      },
    ]);
  };

  const getFilteredNotes = () => {
    let filtered = notes;
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(n => n.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(
        n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
      );
    }
    return filtered;
  };

  const getCategoryInfo = (cat: NoteCategory) =>
    CATEGORIES.find(c => c.id === cat) ?? CATEGORIES[2];

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1)
      .toString()
      .padStart(2, '0')}.${d.getFullYear()}`;
  };

  const filteredNotes = getFilteredNotes();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color="#fff" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notlarım</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
          <Plus color="#fff" size={24} />
        </TouchableOpacity>
      </View>

      {/* Arama */}
      <View style={styles.searchContainer}>
        <Search color="#9ca3af" size={18} />
        <TextInput
          style={styles.searchInput}
          placeholder="Not veya formül ara..."
          placeholderTextColor="#64748b"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <X color="#9ca3af" size={18} />
          </TouchableOpacity>
        )}
      </View>

      {/* Kategori Filtresi */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryScrollContent}
      >
        <TouchableOpacity
          style={[styles.catChip, selectedCategory === 'all' && styles.catChipActive]}
          onPress={() => setSelectedCategory('all')}
        >
          <Text style={[styles.catChipText, selectedCategory === 'all' && styles.catChipTextActive]}>
            Tümü ({notes.length})
          </Text>
        </TouchableOpacity>
        {CATEGORIES.map(cat => {
          const count = notes.filter(n => n.category === cat.id).length;
          const active = selectedCategory === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[styles.catChip, active && { backgroundColor: cat.color, borderColor: cat.color }]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Text style={[styles.catChipText, active && styles.catChipTextActive]}>
                {cat.label} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Notlar Listesi */}
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {filteredNotes.length === 0 ? (
          <View style={styles.emptyState}>
            <BookOpen color="#334155" size={48} />
            <Text style={styles.emptyTitle}>
              {notes.length === 0 ? 'Henüz not yok' : 'Sonuç bulunamadı'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {notes.length === 0
                ? 'Sağ üstteki + butonuyla\nformül veya not ekle'
                : 'Farklı arama terimleri dene'}
            </Text>
            {notes.length === 0 && (
              <TouchableOpacity style={styles.emptyBtn} onPress={openAddModal}>
                <Plus color="#fff" size={18} />
                <Text style={styles.emptyBtnText}>İlk Notunu Ekle</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredNotes.map(note => {
            const cat = getCategoryInfo(note.category);
            return (
              <View key={note.id} style={styles.noteCard}>
                <View style={styles.noteCardHeader}>
                  <View style={[styles.catBadge, { backgroundColor: cat.color + '33', borderColor: cat.color }]}>
                    <Text style={[styles.catBadgeText, { color: cat.color }]}>{cat.label}</Text>
                  </View>
                  <View style={styles.noteActions}>
                    <TouchableOpacity style={styles.noteActionBtn} onPress={() => openEditModal(note)}>
                      <Edit2 color="#94a3b8" size={16} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.noteActionBtn} onPress={() => handleDelete(note.id)}>
                      <Trash2 color="#ef4444" size={16} />
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.noteTitle}>{note.title}</Text>
                <Text style={styles.noteContent} numberOfLines={4}>{note.content}</Text>
                <Text style={styles.noteDate}>
                  {note.updatedAt !== note.createdAt ? `Düzenlendi: ${formatDate(note.updatedAt)}` : formatDate(note.createdAt)}
                </Text>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Not Ekleme / Düzenleme Modal */}
      <Modal visible={isModalOpen} animationType="slide" transparent onRequestClose={() => setIsModalOpen(false)}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingNote ? 'Notu Düzenle' : 'Yeni Not'}</Text>
              <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                <X color="#9ca3af" size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Kategori Seçimi */}
              <Text style={styles.formLabel}>Kategori</Text>
              <View style={styles.catSelector}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.catSelectorBtn,
                      formCategory === cat.id && { backgroundColor: cat.color, borderColor: cat.color },
                    ]}
                    onPress={() => setFormCategory(cat.id)}
                  >
                    <Text
                      style={[
                        styles.catSelectorText,
                        formCategory === cat.id && { color: '#fff' },
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Başlık */}
              <Text style={styles.formLabel}>Başlık</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Not başlığı..."
                placeholderTextColor="#64748b"
                value={formTitle}
                onChangeText={setFormTitle}
                maxLength={100}
              />

              {/* İçerik */}
              <Text style={styles.formLabel}>İçerik</Text>
              <TextInput
                style={[styles.formInput, styles.formTextarea]}
                placeholder="Formül, açıklama veya not içeriği..."
                placeholderTextColor="#64748b"
                value={formContent}
                onChangeText={setFormContent}
                multiline
                textAlignVertical="top"
              />

              {/* Kaydet Butonu */}
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>{editingNote ? 'Güncelle' : 'Kaydet'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '600', color: '#fff' },
  addBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#3b82f6',
    alignItems: 'center', justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1e293b', borderRadius: 10,
    marginHorizontal: 16, marginBottom: 12,
    paddingHorizontal: 12, paddingVertical: 10, gap: 8,
  },
  searchInput: { flex: 1, color: '#fff', fontSize: 15, paddingVertical: 0 },
  categoryScroll: { maxHeight: 48 },
  categoryScrollContent: {
    paddingHorizontal: 16, gap: 8, alignItems: 'center',
  },
  catChip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderColor: '#334155',
    backgroundColor: '#1e293b',
  },
  catChipActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  catChipText: { fontSize: 13, color: '#94a3b8', fontWeight: '500' },
  catChipTextActive: { color: '#fff' },
  list: { flex: 1, marginTop: 12 },
  listContent: { paddingHorizontal: 16, paddingBottom: 24, gap: 12 },
  emptyState: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingTop: 80, gap: 12,
  },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#475569' },
  emptySubtitle: { fontSize: 14, color: '#334155', textAlign: 'center', lineHeight: 20 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#3b82f6', paddingHorizontal: 20, paddingVertical: 12,
    borderRadius: 12, marginTop: 8,
  },
  emptyBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  noteCard: {
    backgroundColor: '#1e293b', borderRadius: 12, padding: 16,
  },
  noteCardHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 8,
  },
  catBadge: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1,
  },
  catBadgeText: { fontSize: 12, fontWeight: '600' },
  noteActions: { flexDirection: 'row', gap: 8 },
  noteActionBtn: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: '#0f172a',
    alignItems: 'center', justifyContent: 'center',
  },
  noteTitle: {
    fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 6,
  },
  noteContent: {
    fontSize: 14, color: '#94a3b8', lineHeight: 20, marginBottom: 8,
  },
  noteDate: { fontSize: 12, color: '#475569' },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  formLabel: { fontSize: 14, color: '#94a3b8', marginBottom: 8, marginTop: 16 },
  catSelector: { flexDirection: 'row', gap: 8 },
  catSelectorBtn: {
    flex: 1, paddingVertical: 10, alignItems: 'center',
    borderRadius: 10, borderWidth: 1, borderColor: '#334155',
    backgroundColor: '#0f172a',
  },
  catSelectorText: { fontSize: 13, color: '#94a3b8', fontWeight: '500' },
  formInput: {
    backgroundColor: '#0f172a', borderRadius: 10, borderWidth: 1,
    borderColor: '#334155', color: '#fff', fontSize: 15,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  formTextarea: { minHeight: 160, marginBottom: 8 },
  saveBtn: {
    backgroundColor: '#3b82f6', borderRadius: 12,
    paddingVertical: 14, alignItems: 'center', marginTop: 16, marginBottom: 8,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

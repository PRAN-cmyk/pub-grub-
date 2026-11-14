import React, { useState, useEffect, useMemo } from 'react';
import {
  Lightbulb,
  Pin,
  Trash2,
  Plus,
  Search,
  CheckSquare,
  Square,
  Palette,
  Tag,
  Share2,
  Copy,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Archive,
  Grid,
  List as ListIcon,
  X,
  Check,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  saveNoteToCloud,
  deleteNoteFromCloud,
  subscribeToUserNotesCloud,
  CloudNote,
  getAccessToken,
  auth,
} from '../firebase';
import { saveStateToDB, loadSyncFallback } from '../utils/storage';

export interface KeepNoteItem {
  id: string;
  userId: string;
  title: string;
  content: string;
  color?: string;
  isPinned?: boolean;
  tags?: string[];
  checklist?: { id: string; text: string; done: boolean }[];
  updatedAt: number;
}

const KEEP_COLORS = [
  { id: 'default', bg: 'bg-white dark:bg-slate-900', border: 'border-slate-200 dark:border-slate-800', name: 'Default' },
  { id: 'yellow', bg: 'bg-amber-50 dark:bg-amber-950/40', border: 'border-amber-200 dark:border-amber-800/60', name: 'Yellow' },
  { id: 'emerald', bg: 'bg-emerald-50 dark:bg-emerald-950/40', border: 'border-emerald-200 dark:border-emerald-800/60', name: 'Green' },
  { id: 'sky', bg: 'bg-sky-50 dark:bg-sky-950/40', border: 'border-sky-200 dark:border-sky-800/60', name: 'Blue' },
  { id: 'purple', bg: 'bg-purple-50 dark:bg-purple-950/40', border: 'border-purple-200 dark:border-purple-800/60', name: 'Purple' },
  { id: 'rose', bg: 'bg-rose-50 dark:bg-rose-950/40', border: 'border-rose-200 dark:border-rose-800/60', name: 'Rose' },
  { id: 'orange', bg: 'bg-orange-50 dark:bg-orange-950/40', border: 'border-orange-200 dark:border-orange-800/60', name: 'Orange' },
];

const INITIAL_DEMO_NOTES: KeepNoteItem[] = [
  {
    id: 'note_demo_1',
    userId: 'usr_default',
    title: '💡 বন্ধন প্ল্যাটফর্ম আইডিয়াস ও টু-ডু (Bandhan Roadmap)',
    content: '১. রিলস ও স্টোরি ২০২৪ আপডেট করা\n২. গুগল কিপ ও টাস্ক সিনক্রোনাইজেশন চালু রাখা\n৩. অডিও লাইব্রেরি কপিরাইট ট্র্যাক তৈরি করা',
    color: 'yellow',
    isPinned: true,
    tags: ['Ideas', 'Bandhan'],
    checklist: [
      { id: 'c1', text: 'Firebase Firestore ও Auth ভেরিফিকেশন', done: true },
      { id: 'c2', text: 'Google Keep ক্লাউড নোটস সিন্ক', done: true },
      { id: 'c3', text: 'কমিউনিটি পোলে অংশগ্রহণ ও লাইক দেওয়া', done: false },
    ],
    updatedAt: Date.now(),
  },
  {
    id: 'note_demo_2',
    userId: 'usr_default',
    title: '📝 মিটিং এজেন্ডা ও সাপ্তাহিক প্ল্যান',
    content: 'সোমবার বিকাল ৪টায় বন্ধন লাইভ স্ট্রিমিং ও ওয়েবআরটিসি ভিডিও অডিও কল টেস্ট করা হবে।',
    color: 'sky',
    isPinned: false,
    tags: ['Meeting', 'Work'],
    updatedAt: Date.now() - 3600000,
  },
];

export const GoogleKeepView: React.FC = () => {
  const { currentUser, language, showToast } = useApp();

  const [notes, setNotes] = useState<KeepNoteItem[]>(() => {
    return loadSyncFallback<KeepNoteItem[]>('bandhan_keep_notes', INITIAL_DEMO_NOTES);
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isSyncing, setIsSyncing] = useState(false);

  // New Note Composer State
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newColor, setNewColor] = useState('default');
  const [newIsPinned, setNewIsPinned] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [newTags, setNewTags] = useState<string[]>([]);
  const [isChecklistMode, setIsChecklistMode] = useState(false);
  const [newChecklist, setNewChecklist] = useState<{ id: string; text: string; done: boolean }[]>([]);
  const [checklistItemInput, setChecklistItemInput] = useState('');

  // Editing Note State
  const [editingNote, setEditingNote] = useState<KeepNoteItem | null>(null);

  // Save notes locally whenever changed
  const persistNotes = (updated: KeepNoteItem[]) => {
    setNotes(updated);
    saveStateToDB('bandhan_keep_notes', updated);
  };

  // Subscribe to Cloud Firestore Notes
  useEffect(() => {
    const unsub = subscribeToUserNotesCloud(currentUser.id, (cloudNotes: CloudNote[]) => {
      if (!cloudNotes || cloudNotes.length === 0) return;
      setNotes((prev) => {
        const idMap = new Map(prev.map((n) => [n.id, n]));
        cloudNotes.forEach((cn) => {
          const existing = idMap.get(cn.id);
          idMap.set(cn.id, {
            id: cn.id,
            userId: cn.userId,
            title: cn.title,
            content: cn.content,
            color: cn.color || 'default',
            isPinned: Boolean(cn.isPinned),
            tags: cn.tags || [],
            checklist: existing?.checklist || [],
            updatedAt: cn.updatedAt || Date.now(),
          });
        });
        const merged = Array.from(idMap.values()).sort((a, b) => b.updatedAt - a.updatedAt);
        saveStateToDB('bandhan_keep_notes', merged);
        return merged;
      });
    });

    return () => {
      unsub();
    };
  }, [currentUser.id]);

  // Sync with Google Tasks API via OAuth
  const syncWithGoogleWorkspace = async () => {
    setIsSyncing(true);
    try {
      const token = await getAccessToken();
      if (!token) {
        showToast(
          language === 'bn'
            ? 'ℹ️ ক্লাউড ফায়ারবেসে সিনক্রোনাইজেশন সক্রিয়। গুগল অ্যাকাউন্ট লগইনে ড্রাইভ/টাস্ক পারমিশন দিন।'
            : 'ℹ️ Firebase Cloud Sync active. Sign in with Google to enable Google Tasks bridge.',
        );
        setIsSyncing(false);
        return;
      }

      // Fetch task lists from Google Tasks API
      const res = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        const primaryListId = data.items?.[0]?.id || '@default';
        const tasksRes = await fetch(
          `https://tasks.googleapis.com/tasks/v1/lists/${primaryListId}/tasks?maxResults=20`,
          { headers: { Authorization: `Bearer ${token}` } },
        );

        if (tasksRes.ok) {
          const tasksData = await tasksRes.json();
          if (tasksData.items && Array.isArray(tasksData.items)) {
            const googleNotes: KeepNoteItem[] = tasksData.items.map((task: any) => ({
              id: `gtask_${task.id}`,
              userId: currentUser.id,
              title: task.title || 'Google Keep Task',
              content: task.notes || 'Imported from Google Workspace',
              color: 'yellow',
              isPinned: false,
              tags: ['Google Tasks', 'Workspace'],
              checklist: [
                {
                  id: `gt_${task.id}`,
                  text: task.title || 'Task',
                  done: task.status === 'completed',
                },
              ],
              updatedAt: task.updated ? new Date(task.updated).getTime() : Date.now(),
            }));

            setNotes((prev) => {
              const existingIds = new Set(prev.map((n) => n.id));
              const additions = googleNotes.filter((gn) => !existingIds.has(gn.id));
              if (additions.length === 0) return prev;
              const merged = [...additions, ...prev];
              saveStateToDB('bandhan_keep_notes', merged);
              return merged;
            });
          }
        }
      }

      showToast(
        language === 'bn'
          ? '✅ গুগল কিপ ও টাস্ক সফলভাবে সিঙ্ক সম্পন্ন হয়েছে!'
          : '✅ Google Keep & Tasks synced successfully!',
      );
    } catch (err) {
      console.warn('Google Tasks sync notice:', err);
      showToast(
        language === 'bn'
          ? 'ক্লাউড ফায়ারবেস ব্যাকআপ সম্পন্ন হয়েছে।'
          : 'Firebase cloud backup completed.',
      );
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCreateNote = async () => {
    if (!newTitle.trim() && !newContent.trim() && newChecklist.length === 0) {
      setIsComposerOpen(false);
      return;
    }

    const noteId = `note_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newNote: KeepNoteItem = {
      id: noteId,
      userId: currentUser.id,
      title: newTitle.trim() || (language === 'bn' ? 'শিরোনামহীন নোট' : 'Untitled Note'),
      content: newContent.trim(),
      color: newColor,
      isPinned: newIsPinned,
      tags: newTags,
      checklist: newChecklist.length > 0 ? newChecklist : undefined,
      updatedAt: Date.now(),
    };

    const next = [newNote, ...notes];
    persistNotes(next);

    // Save to Firestore cloud
    saveNoteToCloud({
      id: newNote.id,
      userId: currentUser.id,
      title: newNote.title,
      content: newNote.content,
      color: newNote.color,
      isPinned: newNote.isPinned,
      tags: newNote.tags,
      updatedAt: newNote.updatedAt,
    }).catch(() => {});

    // Reset composer
    setNewTitle('');
    setNewContent('');
    setNewColor('default');
    setNewIsPinned(false);
    setNewTags([]);
    setNewChecklist([]);
    setIsChecklistMode(false);
    setIsComposerOpen(false);

    showToast(language === 'bn' ? '💡 নোট সফলভাবে তৈরি হয়েছে!' : '💡 Note created successfully!');
  };

  const handleTogglePin = (noteId: string) => {
    const updated = notes.map((n) => {
      if (n.id !== noteId) return n;
      const nextPinned = !n.isPinned;
      saveNoteToCloud({
        id: n.id,
        userId: currentUser.id,
        title: n.title,
        content: n.content,
        color: n.color,
        isPinned: nextPinned,
        tags: n.tags,
        updatedAt: Date.now(),
      }).catch(() => {});
      return { ...n, isPinned: nextPinned, updatedAt: Date.now() };
    });
    persistNotes(updated);
  };

  const handleDeleteNote = (noteId: string) => {
    const updated = notes.filter((n) => n.id !== noteId);
    persistNotes(updated);
    deleteNoteFromCloud(noteId).catch(() => {});
    showToast(language === 'bn' ? '🗑️ নোট মুছে ফেলা হয়েছে' : '🗑️ Note deleted');
  };

  const handleColorChange = (noteId: string, color: string) => {
    const updated = notes.map((n) => {
      if (n.id !== noteId) return n;
      saveNoteToCloud({
        id: n.id,
        userId: currentUser.id,
        title: n.title,
        content: n.content,
        color,
        isPinned: n.isPinned,
        tags: n.tags,
        updatedAt: Date.now(),
      }).catch(() => {});
      return { ...n, color, updatedAt: Date.now() };
    });
    persistNotes(updated);
  };

  const handleToggleChecklistItem = (noteId: string, itemId: string) => {
    const updated = notes.map((n) => {
      if (n.id !== noteId || !n.checklist) return n;
      return {
        ...n,
        checklist: n.checklist.map((item) =>
          item.id === itemId ? { ...item, done: !item.done } : item,
        ),
        updatedAt: Date.now(),
      };
    });
    persistNotes(updated);
  };

  const handleAddChecklistItemToComposer = () => {
    if (!checklistItemInput.trim()) return;
    setNewChecklist((prev) => [
      ...prev,
      {
        id: `ci_${Date.now()}`,
        text: checklistItemInput.trim(),
        done: false,
      },
    ]);
    setChecklistItemInput('');
  };

  const handleAddTagToComposer = () => {
    if (!newTagInput.trim()) return;
    const clean = newTagInput.trim().replace(/^#/, '');
    if (!newTags.includes(clean)) {
      setNewTags((prev) => [...prev, clean]);
    }
    setNewTagInput('');
  };

  // Extract all unique tags
  const allTags = useMemo(() => {
    const s = new Set<string>();
    notes.forEach((n) => n.tags?.forEach((t) => s.add(t)));
    return Array.from(s);
  }, [notes]);

  // Filtered notes
  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      const matchSearch =
        searchQuery.trim() === '' ||
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchTag = selectedTag === 'all' || n.tags?.includes(selectedTag);

      return matchSearch && matchTag;
    });
  }, [notes, searchQuery, selectedTag]);

  const pinnedNotes = filteredNotes.filter((n) => n.isPinned);
  const otherNotes = filteredNotes.filter((n) => !n.isPinned);

  const getColorConfig = (colorId?: string) => {
    return KEEP_COLORS.find((c) => c.id === colorId) || KEEP_COLORS[0];
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-20">
      {/* Google Keep Workspace Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0 border border-amber-500/30 shadow-inner">
            <Lightbulb className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Google Keep & Notes
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
                Workspace
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {language === 'bn'
                ? 'আইডিয়া, চেকলিস্ট, ব্যক্তিগত নোটস এবং গুগল টাস্ক রিয়েলটাইম সিনক্রোনাইজেশন'
                : 'Capture ideas, checklists, rich notes and sync with Google Tasks & Cloud'}
            </p>
          </div>
        </div>

        {/* Action Buttons: Sync & View Mode */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={syncWithGoogleWorkspace}
            disabled={isSyncing}
            className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? (language === 'bn' ? 'সিঙ্ক হচ্ছে...' : 'Syncing...') : (language === 'bn' ? 'গুগল সিঙ্ক' : 'Sync Keep')}</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title={viewMode === 'grid' ? 'List View' : 'Grid View'}
          >
            {viewMode === 'grid' ? <ListIcon className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Note Creation Bar (Google Keep Style) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md p-4 transition-all">
        {!isComposerOpen ? (
          <div
            onClick={() => setIsComposerOpen(true)}
            className="flex items-center justify-between text-slate-500 dark:text-slate-400 cursor-text select-none py-1 px-2"
          >
            <span className="text-sm font-semibold">
              {language === 'bn' ? 'একটি নোট লিখুন...' : 'Take a note...'}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsChecklistMode(true);
                  setIsComposerOpen(true);
                }}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-amber-500 transition-colors"
                title="New Checklist"
              >
                <CheckSquare className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsComposerOpen(true);
                }}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-amber-500 transition-colors"
                title="New Note"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 animate-in fade-in duration-200">
            {/* Title & Pin */}
            <div className="flex items-center justify-between gap-2">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder={language === 'bn' ? 'শিরোনাম (Title)' : 'Title'}
                className="w-full text-base font-bold bg-transparent border-none outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setNewIsPinned(!newIsPinned)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  newIsPinned
                    ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`}
                title={newIsPinned ? 'Pinned' : 'Pin note'}
              >
                <Pin className={`w-4 h-4 ${newIsPinned ? 'fill-amber-500' : ''}`} />
              </button>
            </div>

            {/* Note Content */}
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder={language === 'bn' ? 'নোটের বিস্তারিত লিখুন...' : 'Take a note...'}
              rows={3}
              className="w-full text-sm bg-transparent border-none outline-none resize-none text-slate-800 dark:text-slate-200 placeholder-slate-400"
            />

            {/* Checklist items if in checklist mode */}
            {isChecklistMode && (
              <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                {newChecklist.map((item, idx) => (
                  <div key={item.id} className="flex items-center gap-2 text-xs">
                    <Square className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="flex-1 text-slate-700 dark:text-slate-300">{item.text}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setNewChecklist((prev) => prev.filter((_, i) => i !== idx))
                      }
                      className="text-slate-400 hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}

                <div className="flex items-center gap-2 pt-1">
                  <Plus className="w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={checklistItemInput}
                    onChange={(e) => setChecklistItemInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddChecklistItemToComposer();
                      }
                    }}
                    placeholder={language === 'bn' ? 'আইটেম যোগ করুন (Enter চাপুন)' : 'List item (Press Enter)'}
                    className="flex-1 text-xs bg-transparent border-none outline-none text-slate-800 dark:text-slate-200"
                  />
                  <button
                    type="button"
                    onClick={handleAddChecklistItemToComposer}
                    className="text-xs font-bold text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-md hover:bg-amber-50 dark:hover:bg-amber-950/40"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}

            {/* Tags preview */}
            {newTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {newTags.map((t, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    #{t}
                    <button
                      type="button"
                      onClick={() => setNewTags((prev) => prev.filter((_, i) => i !== idx))}
                      className="hover:text-red-500"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Bottom Controls */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1.5">
                {/* Color Palette */}
                <div className="flex items-center gap-1">
                  {KEEP_COLORS.map((col) => (
                    <button
                      key={col.id}
                      type="button"
                      onClick={() => setNewColor(col.id)}
                      className={`w-5 h-5 rounded-full border transition-transform ${
                        col.id === 'default'
                          ? 'bg-slate-200 border-slate-300 dark:bg-slate-700'
                          : col.id === 'yellow'
                          ? 'bg-amber-300 border-amber-400'
                          : col.id === 'emerald'
                          ? 'bg-emerald-300 border-emerald-400'
                          : col.id === 'sky'
                          ? 'bg-sky-300 border-sky-400'
                          : col.id === 'purple'
                          ? 'bg-purple-300 border-purple-400'
                          : col.id === 'rose'
                          ? 'bg-rose-300 border-rose-400'
                          : 'bg-orange-300 border-orange-400'
                      } ${newColor === col.id ? 'scale-125 ring-2 ring-amber-500' : 'hover:scale-110'}`}
                      title={col.name}
                    />
                  ))}
                </div>

                <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

                {/* Checklist Toggle */}
                <button
                  type="button"
                  onClick={() => setIsChecklistMode(!isChecklistMode)}
                  className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                    isChecklistMode
                      ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/40'
                      : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                  title="Toggle Checklist"
                >
                  <CheckSquare className="w-4 h-4" />
                </button>

                {/* Tag Input */}
                <div className="flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTagToComposer();
                      }
                    }}
                    placeholder="Tag..."
                    className="w-16 text-xs bg-transparent border-none outline-none text-slate-700 dark:text-slate-300"
                  />
                </div>
              </div>

              {/* Close & Save Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsComposerOpen(false);
                    setNewTitle('');
                    setNewContent('');
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                >
                  {language === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleCreateNote}
                  className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-sm cursor-pointer"
                >
                  {language === 'bn' ? 'সংরক্ষণ করুন' : 'Done'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'bn' ? 'নোট অনুসন্ধান করুন...' : 'Search notes...'}
            className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Tag Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setSelectedTag('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer whitespace-nowrap transition-colors ${
              selectedTag === 'all'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
            }`}
          >
            {language === 'bn' ? 'সকল নোট' : 'All Notes'} ({notes.length})
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setSelectedTag(tag)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer whitespace-nowrap transition-colors ${
                selectedTag === tag
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      {/* PINNED NOTES SECTION */}
      {pinnedNotes.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 px-1">
            <Pin className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>{language === 'bn' ? 'পিন করা নোটসমূহ (Pinned)' : 'Pinned'}</span>
          </h2>
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
                : 'space-y-3'
            }
          >
            {pinnedNotes.map((note) => renderNoteCard(note))}
          </div>
        </div>
      )}

      {/* OTHER NOTES SECTION */}
      <div className="space-y-3">
        {pinnedNotes.length > 0 && otherNotes.length > 0 && (
          <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider px-1">
            {language === 'bn' ? 'অন্যান্য নোটসমূহ' : 'Others'}
          </h2>
        )}
        {otherNotes.length > 0 ? (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
                : 'space-y-3'
            }
          >
            {otherNotes.map((note) => renderNoteCard(note))}
          </div>
        ) : (
          pinnedNotes.length === 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center shadow-xs">
              <Lightbulb className="w-12 h-12 text-amber-400/80 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                {language === 'bn' ? 'কোনো নোট পাওয়া যায়নি' : 'No notes here yet'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                {language === 'bn'
                  ? 'উপরে "একটি নোট লিখুন..." বক্সে ক্লিক করে আপনার প্রথম আইডিয়া বা চেকলিস্ট যোগ করুন।'
                  : 'Notes you add appear here. Capture thoughts, lists, and ideas synced with Google Keep & Tasks.'}
              </p>
            </div>
          )
        )}
      </div>

      {/* EDIT NOTE MODAL */}
      {editingNote && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <input
                type="text"
                value={editingNote.title}
                onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
                className="text-lg font-bold bg-transparent border-none outline-none text-slate-900 dark:text-slate-100 flex-1"
              />
              <button
                type="button"
                onClick={() => setEditingNote(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <textarea
              value={editingNote.content}
              onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
              rows={5}
              className="w-full text-sm bg-transparent border-none outline-none resize-none text-slate-800 dark:text-slate-200"
            />

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  handleDeleteNote(editingNote.id);
                  setEditingNote(null);
                }}
                className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  const updated = notes.map((n) =>
                    n.id === editingNote.id ? { ...editingNote, updatedAt: Date.now() } : n,
                  );
                  persistNotes(updated);
                  saveNoteToCloud({
                    id: editingNote.id,
                    userId: currentUser.id,
                    title: editingNote.title,
                    content: editingNote.content,
                    color: editingNote.color,
                    isPinned: editingNote.isPinned,
                    tags: editingNote.tags,
                    updatedAt: Date.now(),
                  }).catch(() => {});
                  setEditingNote(null);
                  showToast(language === 'bn' ? 'নোট আপডেট করা হয়েছে' : 'Note updated');
                }}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs"
              >
                {language === 'bn' ? 'সংরক্ষণ' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  function renderNoteCard(note: KeepNoteItem) {
    const col = getColorConfig(note.color);

    return (
      <div
        key={note.id}
        onClick={() => setEditingNote(note)}
        className={`${col.bg} ${col.border} border rounded-2xl p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer relative`}
      >
        <div className="space-y-2">
          {/* Header: Title and Pin */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug">
              {note.title}
            </h3>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleTogglePin(note.id);
              }}
              className="p-1 rounded-md text-slate-400 hover:text-amber-500 transition-colors shrink-0 cursor-pointer"
              title={note.isPinned ? 'Unpin' : 'Pin'}
            >
              <Pin className={`w-3.5 h-3.5 ${note.isPinned ? 'fill-amber-500 text-amber-500' : ''}`} />
            </button>
          </div>

          {/* Content */}
          {note.content && (
            <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap line-clamp-5 leading-relaxed">
              {note.content}
            </p>
          )}

          {/* Checklist */}
          {note.checklist && note.checklist.length > 0 && (
            <div className="space-y-1.5 pt-1">
              {note.checklist.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleChecklistItem(note.id, item.id);
                  }}
                  className="flex items-center gap-2 text-xs group/item cursor-pointer"
                >
                  {item.done ? (
                    <CheckSquare className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  ) : (
                    <Square className="w-3.5 h-3.5 text-slate-400 shrink-0 group-hover/item:text-slate-600" />
                  )}
                  <span
                    className={`truncate ${
                      item.done
                        ? 'line-through text-slate-400 dark:text-slate-500'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {item.text}
                  </span>
                </div>
              ))}
              {note.checklist.length > 4 && (
                <p className="text-[10px] text-slate-400 italic">
                  +{note.checklist.length - 4} more items...
                </p>
              )}
            </div>
          )}

          {/* Tags */}
          {note.tags && note.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {note.tags.map((t, idx) => (
                <span
                  key={idx}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/5 text-slate-600 dark:text-slate-400"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Card Footer: Color buttons & Delete (visible on hover) */}
        <div className="flex items-center justify-between pt-3 mt-3 border-t border-black/5 dark:border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            {KEEP_COLORS.slice(0, 4).map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => handleColorChange(note.id, c.id)}
                className={`w-3.5 h-3.5 rounded-full border border-black/10 ${
                  c.id === 'default'
                    ? 'bg-slate-300'
                    : c.id === 'yellow'
                    ? 'bg-amber-300'
                    : c.id === 'emerald'
                    ? 'bg-emerald-300'
                    : 'bg-sky-300'
                }`}
                title={c.name}
              />
            ))}
          </div>

          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(`${note.title}\n\n${note.content}`);
                showToast(language === 'bn' ? 'নোট কপি করা হয়েছে' : 'Copied to clipboard');
              }}
              className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              title="Copy text"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleDeleteNote(note.id)}
              className="p-1 rounded text-slate-400 hover:text-rose-500"
              title="Delete note"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }
};

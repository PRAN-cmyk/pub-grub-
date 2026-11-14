import React, { useState, useEffect } from 'react';
import {
  Users,
  Globe,
  Lock,
  Check,
  Plus,
  ArrowLeft,
  Image as ImageIcon,
  Video,
  Send,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Eye,
  Radio,
  X,
  FolderOpen,
  Flag,
  MessageCircle,
  Mic,
  MicOff,
  VideoOff,
  PhoneCall,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PostCard } from './PostCard';
import { CreatePostBox } from './CreatePostBox';
import { LiveStreamModal } from './LiveStreamModal';
import { fileToDataUrl } from '../utils/storage';

export const GroupsView: React.FC = () => {
  const {
    currentUser,
    profiles = [],
    contacts = [],
    groups = [],
    toggleJoinGroup,
    addGroup,
    selectedGroupId,
    setSelectedGroupId,
    pages = [],
    createPage,
    toggleFollowPage,
    groupChats = {},
    sendGroupChatMessage,
    setActiveGroupChatId,
    activeTab,
    posts = [],
    addPost,
    viewUserProfile,
    language,
    t,
    showToast,
  } = useApp();

  const [groupSubTab, setGroupSubTab] = useState<'discussion' | 'chat' | 'media' | 'members'>('discussion');
  const [isGroupLiveModalOpen, setIsGroupLiveModalOpen] = useState(false);
  const [directoryFilter, setDirectoryFilter] = useState<'all' | 'joined' | 'pages' | 'google_hub' | 'feed'>(
    activeTab === 'pages' ? 'pages' : 'all',
  );

  useEffect(() => {
    if (activeTab === 'pages') {
      setSelectedGroupId(null);
      setDirectoryFilter('pages');
    } else if (activeTab === 'groups' && directoryFilter === 'pages') {
      setDirectoryFilter('all');
    }
  }, [activeTab]);

  // Group Chat input inside group
  const [inlineGroupChatInput, setInlineGroupChatInput] = useState('');

  // Create Page modal state
  const [isCreatePageOpen, setIsCreatePageOpen] = useState(false);
  const [newPageName, setNewPageName] = useState('');
  const [newPageCategory, setNewPageCategory] = useState('Official Brand / Creator');
  const [newPageDescription, setNewPageDescription] = useState('');
  const [newPageCover, setNewPageCover] = useState('');
  const [selectedPageForPost, setSelectedPageForPost] = useState<string>('');
  const [pagePostText, setPagePostText] = useState('');

  // Google Chat & Video Hub (Privacy Protected) state
  const [isGoogleVideoLive, setIsGoogleVideoLive] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [e2ePrivacyLock, setE2ePrivacyLock] = useState(true);
  const [inviteOnlyMode, setInviteOnlyMode] = useState(true);
  const [googleChatMessages, setGoogleChatMessages] = useState<
    { id: string; sender: string; avatar: string; text: string; time: string }[]
  >(() => [
    {
      id: 'gc_1',
      sender: 'Arafat Hossain',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      text: 'গুগল চ্যাট ও ভিডিও রুমে সবাইকে স্বাগতম! আমাদের কথোপকথন এন্ড-টু-এন্ড প্রাইভেসি দ্বারা সুরক্ষিত 🔒',
      time: '10:30 AM',
    },
    {
      id: 'gc_2',
      sender: 'Nusrat Jahan',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
      text: 'অসাধারণ! ভিডিও মিটিং কোড দিয়ে সরাসরি জয়েন করা যাচ্ছে 🎥✨',
      time: '10:32 AM',
    },
  ]);
  const [googleChatInput, setGoogleChatInput] = useState('');

  // Inside-group quick composer state
  const [groupPostText, setGroupPostText] = useState('');
  const [groupPhotoPreview, setGroupPhotoPreview] = useState<string | null>(null);
  const [groupVideoPreview, setGroupVideoPreview] = useState<string | null>(null);
  const [groupMediaName, setGroupMediaName] = useState<string>('');
  const [isLiveGroupPost, setIsLiveGroupPost] = useState(false);

  // Create Group modal state
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupCategory, setNewGroupCategory] = useState('Community & Social');
  const [newGroupPrivacy, setNewGroupPrivacy] = useState<'public' | 'private'>('public');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [newGroupCover, setNewGroupCover] = useState<string>('');

  const selectedGroup = groups.find((g) => g.id === selectedGroupId) || null;

  // Merge unique members from profiles + contacts
  const allMembers = React.useMemo(() => {
    const map = new Map<string, typeof currentUser>();
    map.set(currentUser.id, currentUser);
    profiles.forEach((p) => map.set(p.id, p));
    contacts.forEach((c) => map.set(c.id, c));
    return Array.from(map.values());
  }, [currentUser, profiles, contacts]);

  const isVideoFile = (file: File) => {
    if (file.type.startsWith('video/')) return true;
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    return ['mp4', 'mov', 'webm', 'mkv', 'avi', 'm4v', '3gp', 'ogg'].includes(ext);
  };

  const handleGroupMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await fileToDataUrl(file);
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      setGroupMediaName(`${file.name} (${sizeMB} MB)`);
      if (isVideoFile(file)) {
        setGroupVideoPreview(url);
        setGroupPhotoPreview(null);
        showToast(
          language === 'bn'
            ? `গ্রুপে ভিডিও (${sizeMB} MB) যুক্ত হয়েছে!`
            : `Video (${sizeMB} MB) ready to post in group!`,
        );
      } else {
        setGroupPhotoPreview(url);
        setGroupVideoPreview(null);
        showToast(
          language === 'bn'
            ? `গ্রুপে ছবি যুক্ত হয়েছে!`
            : `Photo ready to post in group!`,
        );
      }
    } catch {
      showToast(language === 'bn' ? 'ফাইল আপলোডে সমস্যা হয়েছে' : 'Failed to load media');
    }
    e.target.value = '';
  };

  const handlePublishGroupPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup) return;
    if (!groupPostText.trim() && !groupPhotoPreview && !groupVideoPreview && !isLiveGroupPost) return;

    const groupDisplayName =
      language === 'bn' ? selectedGroup.nameBn || selectedGroup.name : selectedGroup.name;

    addPost({
      content:
        groupPostText.trim() ||
        (isLiveGroupPost
          ? language === 'bn'
            ? `🔴 "${groupDisplayName}" গ্রুপে সরাসরি লাইভ ভিডিও!`
            : `🔴 Live in ${groupDisplayName}!`
          : ''),
      image: groupPhotoPreview || undefined,
      video: groupVideoPreview || undefined,
      mediaType: groupVideoPreview ? 'video' : groupPhotoPreview ? 'image' : undefined,
      privacy: 'public',
      isLive: isLiveGroupPost || undefined,
      groupId: selectedGroup.id,
      groupName: selectedGroup.nameBn || selectedGroup.name,
    });

    setGroupPostText('');
    setGroupPhotoPreview(null);
    setGroupVideoPreview(null);
    setGroupMediaName('');
    setIsLiveGroupPost(false);
  };

  const handleCreateGroupCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await fileToDataUrl(file);
      setNewGroupCover(url);
    } catch {
      // ignore
    }
    e.target.value = '';
  };

  const handleCreateNewGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    addGroup({
      name: newGroupName.trim(),
      nameBn: newGroupName.trim(),
      category: newGroupCategory,
      categoryBn: newGroupCategory,
      coverImage:
        newGroupCover ||
        currentUser.coverImage ||
        groups[0]?.coverImage ||
        'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1000&auto=format&fit=crop&q=80',
      description:
        newGroupDescription.trim() ||
        (language === 'bn'
          ? 'সদস্যদের ছবি, ভিডিও ও আলোচনার উন্মুক্ত গ্রুপ।'
          : 'Open community group for sharing photos, videos, and discussions.'),
      privacy: newGroupPrivacy,
    });

    setNewGroupName('');
    setNewGroupDescription('');
    setNewGroupCover('');
    setIsCreateGroupOpen(false);
  };

  // ============================================================================
  // INSIDE A SELECTED GROUP VIEW (গ্রুপের ভেতরে প্রবেশ করলে)
  // ============================================================================
  if (selectedGroup) {
    const groupPosts = posts.filter((p) => p.groupId === selectedGroup.id);
    const groupMediaPosts = groupPosts.filter((p) => p.image || p.video);

    return (
      <div className="space-y-4 pb-10">
        {/* Top Bar: Back to All Groups + Security Badge */}
        <div className="flex items-center justify-between bg-white dark:bg-slate-900 px-4 py-3 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setSelectedGroupId(null)}
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{language === 'bn' ? 'সকল গ্রুপে ফিরে যান' : 'Back to All Groups'}</span>
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>
              {language === 'bn'
                ? 'প্রোফাইল সিঙ্ক ও এনক্রিপ্টেড গ্রুপ'
                : 'Profile-Synced & Encrypted Group'}
            </span>
          </div>
        </div>

        {/* Group Hero Cover & Header Info */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="relative h-52 sm:h-64 bg-slate-200 dark:bg-slate-800">
            <img
              src={selectedGroup.coverImage}
              alt={selectedGroup.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
            <div className="absolute bottom-4 left-5 right-5 flex flex-col sm:flex-row sm:items-end justify-between gap-3 text-white">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-600/90 text-[11px] font-bold mb-2">
                  {selectedGroup.privacy === 'public' ? (
                    <Globe className="w-3 h-3" />
                  ) : (
                    <Lock className="w-3 h-3" />
                  )}
                  <span>
                    {selectedGroup.privacy === 'public'
                      ? language === 'bn'
                        ? 'পাবলিক গ্রুপ'
                        : 'Public Group'
                      : language === 'bn'
                      ? 'প্রাইভেট গ্রুপ'
                      : 'Private Group'}
                  </span>
                  <span>•</span>
                  <span>
                    {language === 'bn'
                      ? selectedGroup.categoryBn || selectedGroup.category
                      : selectedGroup.category}
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold drop-shadow">
                  {language === 'bn' ? selectedGroup.nameBn || selectedGroup.name : selectedGroup.name}
                </h1>
                <p className="text-xs sm:text-sm text-white/85 mt-1 line-clamp-2">
                  {selectedGroup.description}
                </p>
              </div>

              <button
                type="button"
                onClick={() => toggleJoinGroup(selectedGroup.id)}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 shrink-0 cursor-pointer transition-all shadow-lg ${
                  selectedGroup.isJoined
                    ? 'bg-white/20 hover:bg-white/30 backdrop-blur-md text-white border border-white/30'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {selectedGroup.isJoined ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{language === 'bn' ? 'যুক্ত আছেন' : 'Joined'}</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>{language === 'bn' ? 'গ্রুপে জয়েন করুন' : 'Join Group'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Member Avatars Strip & Sub-Navigation */}
          <div className="px-5 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {allMembers.slice(0, 5).map((member) => (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => viewUserProfile(member)}
                    title={member.name}
                    className="cursor-pointer focus:outline-none"
                  >
                    <img
                      src={member.avatar}
                      alt={member.name}
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 object-cover hover:scale-110 transition-transform"
                    />
                  </button>
                ))}
              </div>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                {selectedGroup.membersCount.toLocaleString()}{' '}
                {language === 'bn' ? 'জন সদস্য' : 'members'} •{' '}
                {groupPosts.length}{' '}
                {language === 'bn' ? 'টি পোস্ট' : 'posts'}
              </span>
            </div>

            {/* Group Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex-wrap">
              <button
                type="button"
                onClick={() => setGroupSubTab('discussion')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                  groupSubTab === 'discussion'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {language === 'bn' ? 'আলোচনা ও আপলোড' : 'Discussion & Upload'}
              </button>
              <button
                type="button"
                onClick={() => setGroupSubTab('chat')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors flex items-center gap-1 ${
                  groupSubTab === 'chat'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>
                  {language === 'bn'
                    ? `গ্রুপ চ্যাট (${(groupChats[selectedGroup.id] || []).length})`
                    : `Group Chat (${(groupChats[selectedGroup.id] || []).length})`}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setGroupSubTab('media')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                  groupSubTab === 'media'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {language === 'bn'
                  ? `ছবি ও ভিডিও (${groupMediaPosts.length})`
                  : `Photos & Videos (${groupMediaPosts.length})`}
              </button>
              <button
                type="button"
                onClick={() => setGroupSubTab('members')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                  groupSubTab === 'members'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {language === 'bn'
                  ? `সদস্যদের প্রোফাইল (${allMembers.length})`
                  : `Members (${allMembers.length})`}
              </button>
            </div>
          </div>
        </div>

        {/* SUB-TAB: REAL-TIME GROUP CHAT */}
        {groupSubTab === 'chat' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col h-[460px]">
            <div className="px-4 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                <div>
                  <h4 className="font-bold text-sm">
                    {language === 'bn'
                      ? `${selectedGroup.nameBn || selectedGroup.name} — লাইভ গ্রুপ চ্যাট`
                      : `${selectedGroup.name} — Live Group Chat`}
                  </h4>
                  <p className="text-[11px] text-indigo-100">
                    {language === 'bn'
                      ? `${allMembers.length} জন সদস্য অনলাইনে যুক্ত আছেন`
                      : `${allMembers.length} members connected online`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveGroupChatId(selectedGroup.id)}
                className="px-3 py-1 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold cursor-pointer"
              >
                {language === 'bn' ? 'মেসেঞ্জার ডকে খুলুন' : 'Open in Dock'}
              </button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/60 dark:bg-slate-950/50">
              {(groupChats[selectedGroup.id] || []).map((msg) => {
                const isMe = msg.senderId === currentUser.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-2.5 ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isMe && (
                      <img
                        src={msg.senderAvatar}
                        alt={msg.senderName}
                        referrerPolicy="no-referrer"
                        className="w-8 h-8 rounded-full object-cover shrink-0"
                      />
                    )}
                    <div
                      className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-xs sm:text-sm ${
                        isMe
                          ? 'bg-indigo-600 text-white rounded-br-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700 rounded-bl-xs'
                      }`}
                    >
                      {!isMe && (
                        <p className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 mb-0.5">
                          {msg.senderName}
                        </p>
                      )}
                      <p>{msg.text}</p>
                      <span
                        className={`block text-[10px] mt-0.5 text-right ${
                          isMe ? 'text-indigo-200' : 'text-slate-400'
                        }`}
                      >
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!inlineGroupChatInput.trim()) return;
                sendGroupChatMessage(selectedGroup.id, inlineGroupChatInput.trim());
                setInlineGroupChatInput('');
              }}
              className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
            >
              <input
                type="text"
                value={inlineGroupChatInput}
                onChange={(e) => setInlineGroupChatInput(e.target.value)}
                placeholder={
                  language === 'bn'
                    ? 'গ্রুপের সবাইকে বার্তা পাঠান...'
                    : 'Send a message to everyone in the group...'
                }
                className="flex-1 px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{language === 'bn' ? 'পাঠান' : 'Send'}</span>
              </button>
            </form>
          </div>
        )}

        {/* SUB-TAB 1: DISCUSSION & UPLOAD EVERYTHING */}
        {groupSubTab === 'discussion' && (
          <div className="space-y-4">
            {/* Dedicated Group Media & Post Uploader Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => viewUserProfile(currentUser)}
                    className="flex items-center gap-2 cursor-pointer group"
                  >
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      referrerPolicy="no-referrer"
                      className="w-9 h-9 rounded-full object-cover ring-2 ring-blue-500/40"
                    />
                    <div className="text-left">
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600">
                        {language === 'bn'
                          ? currentUser.nameBn || currentUser.name
                          : currentUser.name}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {language === 'bn'
                          ? 'যা আপলোড করবেন তা গ্রুপে ও আপনার প্রোফাইলে স্থায়ীভাবে থাকবে'
                          : 'Uploads stay in this group & on your profile'}
                      </p>
                    </div>
                  </button>
                </div>

                {isLiveGroupPost && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-600 text-white text-xs font-bold animate-pulse">
                    <Radio className="w-3 h-3" />
                    {language === 'bn' ? 'লাইভ মোড চালু' : 'LIVE MODE ON'}
                  </span>
                )}
              </div>

              <form onSubmit={handlePublishGroupPost} className="space-y-3">
                <textarea
                  rows={3}
                  value={groupPostText}
                  onChange={(e) => setGroupPostText(e.target.value)}
                  placeholder={
                    language === 'bn'
                      ? `${selectedGroup.nameBn || selectedGroup.name}-এ কিছু লিখুন, ছবি বা যেকোনো সাইজের বড় ভিডিও শেয়ার করুন...`
                      : `Write something, or share photos & large videos in ${selectedGroup.name}...`
                  }
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 p-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />

                {/* Preview of attached Photo or Unlimited Video */}
                {(groupPhotoPreview || groupVideoPreview) && (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-black">
                    {groupVideoPreview ? (
                      <video
                        src={groupVideoPreview}
                        controls
                        className="w-full max-h-80 object-contain mx-auto"
                      />
                    ) : (
                      <img
                        src={groupPhotoPreview!}
                        alt="Group upload preview"
                        className="w-full max-h-80 object-contain mx-auto"
                      />
                    )}
                    {groupMediaName && (
                      <div className="px-3 py-1.5 bg-slate-900/90 text-white text-xs flex items-center justify-between">
                        <span className="truncate">{groupMediaName}</span>
                        <span className="text-emerald-400 font-semibold ml-2 shrink-0">
                          ✓ IndexedDB HD Ready
                        </span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setGroupPhotoPreview(null);
                        setGroupVideoPreview(null);
                        setGroupMediaName('');
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white hover:bg-black cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Upload Photo or Video of any size */}
                    <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-xs font-bold cursor-pointer transition-colors border border-emerald-200/70 dark:border-emerald-800/60">
                      <ImageIcon className="w-4 h-4 text-emerald-600" />
                      <span>
                        {language === 'bn' ? 'ছবি আপলোড' : 'Upload Photo'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleGroupMediaUpload}
                        className="hidden"
                      />
                    </label>

                    <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-xs font-bold cursor-pointer transition-colors border border-blue-200/70 dark:border-blue-800/60">
                      <Video className="w-4 h-4 text-blue-600" />
                      <span>
                        {language === 'bn'
                          ? 'যেকোনো সাইজের ভিডিও আপলোড'
                          : 'Upload Any Size Video'}
                      </span>
                      <input
                        type="file"
                        accept="video/*,.mp4,.mov,.webm,.mkv,.avi"
                        onChange={handleGroupMediaUpload}
                        className="hidden"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => setIsGroupLiveModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors border bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200/70 dark:border-rose-800/60 hover:bg-rose-100"
                    >
                      <Radio className="w-4 h-4 text-red-500 animate-pulse" />
                      <span>{language === 'bn' ? 'গ্রুপ লাইভ স্টুডিও' : 'Group Live Studio'}</span>
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={
                      !groupPostText.trim() &&
                      !groupPhotoPreview &&
                      !groupVideoPreview &&
                      !isLiveGroupPost
                    }
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm cursor-pointer transition-all shadow-sm"
                  >
                    <Send className="w-4 h-4" />
                    <span>
                      {language === 'bn' ? 'গ্রুপে পোস্ট করুন' : 'Post to Group'}
                    </span>
                  </button>
                </div>
              </form>
            </div>

            {/* Also render full CreatePostBox for feelings, gradient backgrounds, camera capture */}
            <CreatePostBox
              groupId={selectedGroup.id}
              groupName={selectedGroup.nameBn || selectedGroup.name}
            />

            {/* Group Posts Feed */}
            {groupPosts.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-10 text-center border border-slate-200 dark:border-slate-800">
                <Sparkles className="w-10 h-10 text-blue-500 mx-auto mb-2" />
                <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
                  {language === 'bn'
                    ? 'এই গ্রুপে প্রথম পোস্ট বা ভিডিও শেয়ার করুন!'
                    : 'Be the first to post a photo or video in this group!'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {language === 'bn'
                    ? 'আপনার আপলোড করা ছবি ও ভিডিও এই গ্রুপে এবং আপনার নিজের প্রোফাইলে সুরক্ষিত থাকবে।'
                    : 'Your uploaded photos and videos will appear both here and on your personal profile.'}
                </p>
              </div>
            ) : (
              groupPosts.map((post) => <PostCard key={post.id} post={post} />)
            )}
          </div>
        )}

        {/* SUB-TAB 2: GROUP PHOTOS & VIDEOS GALLERY (WITH AUTHOR PROFILE LINK) */}
        {groupSubTab === 'media' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 mb-4">
              {language === 'bn'
                ? 'গ্রুপের সকল ছবি ও ভিডিও (আপলোডকারীর প্রোফাইলসহ)'
                : 'Group Photos & Videos (with Uploader Profiles)'}
            </h3>

            {groupMediaPosts.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                {language === 'bn'
                  ? 'এখনো কোনো ছবি বা ভিডিও আপলোড করা হয়নি।'
                  : 'No photos or videos uploaded to this group yet.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {groupMediaPosts.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-col"
                  >
                    <div className="aspect-video bg-black relative">
                      {p.video ? (
                        <video
                          src={p.video}
                          controls
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <img
                          src={p.image}
                          alt={p.content}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="p-3 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => viewUserProfile(p.author)}
                        className="flex items-center gap-2.5 text-left cursor-pointer group"
                      >
                        <img
                          src={p.author.avatar}
                          alt={p.author.name}
                          referrerPolicy="no-referrer"
                          className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-500/30"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600">
                            {language === 'bn' ? p.author.nameBn || p.author.name : p.author.name}
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">
                            {p.createdAt}
                          </p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => viewUserProfile(p.author)}
                        className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 text-[11px] font-bold hover:bg-blue-100 cursor-pointer"
                      >
                        {language === 'bn' ? 'প্রোফাইল দেখুন' : 'View Profile'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SUB-TAB 3: GROUP MEMBERS & PROFILES */}
        {groupSubTab === 'members' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 mb-4">
              {language === 'bn'
                ? 'গ্রুপের সদস্যবৃন্দ (যেকোনো প্রোফাইলে ক্লিক করে তাঁর সব পোস্ট ও ভিডিও দেখুন)'
                : 'Group Members (Click any member to view their profile & uploads)'}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {allMembers.map((member) => {
                const memberPostCount = posts.filter((p) => p.author.id === member.id).length;
                return (
                  <div
                    key={member.id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 hover:border-blue-400/60 transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => viewUserProfile(member)}
                      className="flex items-center gap-3 text-left cursor-pointer min-w-0"
                    >
                      <img
                        src={member.avatar}
                        alt={member.name}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-full object-cover shrink-0 ring-2 ring-blue-500/20"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                            {language === 'bn' ? member.nameBn || member.name : member.name}
                          </span>
                          {member.isVerified && (
                            <span className="text-blue-500 text-xs">✓</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          @{member.username} • {memberPostCount}{' '}
                          {language === 'bn' ? 'টি পোস্ট' : 'posts'}
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => viewUserProfile(member)}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-700 dark:text-slate-200 text-xs font-bold shrink-0 cursor-pointer transition-colors flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{language === 'bn' ? 'প্রোফাইল' : 'Profile'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Live Stream Broadcasting Studio Modal for Group */}
        <LiveStreamModal
          isOpen={isGroupLiveModalOpen}
          onClose={() => setIsGroupLiveModalOpen(false)}
          groupId={selectedGroup.id}
          groupName={selectedGroup.nameBn || selectedGroup.name}
        />
      </div>
    );
  }

  // ============================================================================
  // ALL GROUPS DIRECTORY & GROUP ACTIVITY FEED
  // ============================================================================
  const filteredGroups =
    directoryFilter === 'joined' ? groups.filter((g) => g.isJoined) : groups;
  const allGroupPosts = posts.filter((p) => Boolean(p.groupId));

  return (
    <div className="space-y-4 pb-8">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {t.groups}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'bn'
                  ? 'যেকোনো গ্রুপে ঢুকে ছবি, বড় ভিডিও ও পোস্ট শেয়ার করুন — সব কিছু আপনার প্রোফাইলেও সংরক্ষিত থাকবে'
                  : 'Enter any group to share photos, HD videos & posts — synced with your profile'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsCreateGroupOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm cursor-pointer transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'bn' ? 'নতুন গ্রুপ খুলুন' : 'Create New Group'}</span>
          </button>
        </div>

        {/* Filter Pills: Groups, Official Pages, Google Chat & Video Hub, Group Feed */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setDirectoryFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
              directoryFilter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            {language === 'bn' ? `সকল গ্রুপ (${groups.length})` : `All Groups (${groups.length})`}
          </button>
          <button
            type="button"
            onClick={() => setDirectoryFilter('joined')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
              directoryFilter === 'joined'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            {language === 'bn'
              ? `আমার গ্রুপসমূহ (${groups.filter((g) => g.isJoined).length})`
              : `Your Groups (${groups.filter((g) => g.isJoined).length})`}
          </button>
          <button
            type="button"
            onClick={() => setDirectoryFilter('pages')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5 ${
              directoryFilter === 'pages'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
            }`}
          >
            <Flag className="w-3.5 h-3.5" />
            <span>
              {language === 'bn' ? `অফিসিয়াল পেইজ (${pages.length})` : `Official Pages (${pages.length})`}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setDirectoryFilter('google_hub')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5 ${
              directoryFilter === 'google_hub'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>
              {language === 'bn'
                ? 'গুগল চ্যাট ও ভিডিও (প্রাইভেসি সুরক্ষিত)'
                : 'Google Chat & Video (Privacy Protected)'}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setDirectoryFilter('feed')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
              directoryFilter === 'feed'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            {language === 'bn'
              ? `গ্রুপ পোস্ট ফিড (${allGroupPosts.length})`
              : `Group Feed (${allGroupPosts.length})`}
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* OFFICIAL PAGES HUB (পেইজ অপশন)                                         */}
      {/* ===================================================================== */}
      {directoryFilter === 'pages' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-gradient-to-r from-indigo-700 via-blue-700 to-slate-900 rounded-2xl p-5 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-[11px] font-bold mb-1.5">
                <Flag className="w-3.5 h-3.5 text-amber-300" />
                {language === 'bn' ? 'অফিসিয়াল পেইজ ও ব্র্যান্ড হাব' : 'Official Pages & Creator Hub'}
              </span>
              <h3 className="text-lg font-extrabold">
                {language === 'bn'
                  ? 'পেইজ ফলো করুন, নতুন পেইজ খুলুন এবং পেইজ থেকে পোস্ট করুন'
                  : 'Follow Official Pages, Create Your Page & Publish Posts'}
              </h3>
              <p className="text-xs text-indigo-100 mt-0.5">
                {language === 'bn'
                  ? 'আপনার ব্যবসা, ক্রিয়েটর ব্র্যান্ড বা কমিউনিটির জন্য ভেরিফাইড পেইজ পরিচালনা করুন।'
                  : 'Manage verified pages for your brand, creator channel, or community.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsCreatePageOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-white text-indigo-900 hover:bg-indigo-50 text-xs font-extrabold flex items-center gap-1.5 shrink-0 cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>{language === 'bn' ? 'নতুন পেইজ খুলুন' : 'Create New Page'}</span>
            </button>
          </div>

          {/* Quick Publish Post as a Page */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Flag className="w-4 h-4 text-indigo-600" />
              <span>
                {language === 'bn'
                  ? 'পেইজ থেকে সরাসরি নিউজফিডে পোস্ট প্রকাশ করুন'
                  : 'Publish a Post Directly from an Official Page'}
              </span>
            </h4>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!pagePostText.trim()) return;
                const chosenPage =
                  pages.find((pg) => pg.id === selectedPageForPost) || pages[0];
                addPost({
                  content: `📢 [${
                    language === 'bn'
                      ? chosenPage?.nameBn || chosenPage?.name || 'Official Page'
                      : chosenPage?.name || 'Official Page'
                  }] ${pagePostText.trim()}`,
                  privacy: 'public',
                });
                setPagePostText('');
              }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
            >
              <select
                value={selectedPageForPost || pages[0]?.id || ''}
                onChange={(e) => setSelectedPageForPost(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
              >
                {pages.map((pg) => (
                  <option key={pg.id} value={pg.id}>
                    🚩 {language === 'bn' ? pg.nameBn || pg.name : pg.name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={pagePostText}
                onChange={(e) => setPagePostText(e.target.value)}
                placeholder={
                  language === 'bn'
                    ? 'পেইজের ঘোষণা বা নতুন আপডেট লিখুন...'
                    : 'Write an update from this page...'
                }
                className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer shrink-0"
              >
                {language === 'bn' ? 'পেইজ পোস্ট করুন' : 'Post as Page'}
              </button>
            </form>
          </div>

          {/* Pages Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pages.map((pg) => (
              <div
                key={pg.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="h-32 bg-slate-200 dark:bg-slate-800 relative">
                    <img
                      src={pg.coverImage}
                      alt={pg.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-black/65 text-white text-[10px] font-bold">
                      {pg.category}
                    </span>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-3 -mt-9 mb-2 relative z-10">
                      <img
                        src={pg.avatar}
                        alt={pg.name}
                        referrerPolicy="no-referrer"
                        className="w-14 h-14 rounded-2xl border-3 border-white dark:border-slate-900 object-cover bg-white shadow-md"
                      />
                      <div className="pt-5">
                        <h4 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-1">
                          <span>{language === 'bn' ? pg.nameBn || pg.name : pg.name}</span>
                          {pg.isVerified && <span className="text-blue-500 text-xs">✓</span>}
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          {pg.followersCount.toLocaleString()}{' '}
                          {language === 'bn' ? 'জন ফলোয়ার' : 'followers'}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                      {pg.description}
                    </p>
                  </div>
                </div>

                <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => toggleFollowPage(pg.id)}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                      pg.isFollowed
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                  >
                    {pg.isFollowed ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>{language === 'bn' ? 'ফলো করছেন (Following)' : 'Following Page'}</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>{language === 'bn' ? '+ পেইজ ফলো করুন' : '+ Follow Page'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* PRIVACY-PROTECTED GOOGLE CHAT & VIDEO SECTION                          */}
      {/* ===================================================================== */}
      {directoryFilter === 'google_hub' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Privacy Protection Shield Header */}
          <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-2xl p-5 text-white shadow-xl border border-emerald-500/30 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold mb-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  {language === 'bn'
                    ? 'গুগল চ্যাট ও ভিডিও হাব • প্রাইভেসি শতভাগ সুরক্ষিত'
                    : 'Google Chat & Meet Video Hub • 100% Privacy Protected'}
                </span>
                <h3 className="text-lg sm:text-xl font-extrabold">
                  {language === 'bn'
                    ? 'নিরাপদ গুগল চ্যাট ও এইচডি ভিডিও কনফারেন্স রুম'
                    : 'Secure Google Chat & HD Video Conference Room'}
                </h3>
                <p className="text-xs text-emerald-100 mt-0.5">
                  {language === 'bn'
                    ? 'এন্ড-টু-এন্ড প্রাইভেসি লকসহ বন্ধু ও গ্রুপের সদস্যদের সাথে গুগল চ্যাট এবং ভিডিও মিটিং করুন।'
                    : 'Collaborate via Google Chat and HD Video with end-to-end privacy protection.'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setE2ePrivacyLock((p) => !p)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer border ${
                    e2ePrivacyLock
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                      : 'bg-white/10 text-white border-white/20'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>
                    {language === 'bn'
                      ? e2ePrivacyLock
                        ? 'প্রাইভেসি লক: চালু'
                        : 'প্রাইভেসি লক: বন্ধ'
                      : e2ePrivacyLock
                      ? 'E2E Privacy: ON'
                      : 'E2E Privacy: OFF'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setInviteOnlyMode((p) => !p)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer border ${
                    inviteOnlyMode
                      ? 'bg-sky-500 text-slate-950 border-sky-400'
                      : 'bg-white/10 text-white border-white/20'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>
                    {language === 'bn'
                      ? inviteOnlyMode
                        ? 'শুধুমাত্র আমন্ত্রিত সদস্য'
                        : 'সবার জন্য উন্মুক্ত'
                      : inviteOnlyMode
                      ? 'Invite-Only Shield'
                      : 'Open Access'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left Column: Google Video (Meet) Live Room */}
            <div className="bg-slate-950 text-white rounded-2xl border border-slate-800 p-4 flex flex-col justify-between space-y-4 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Video className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">
                      {language === 'bn' ? 'গুগল ভিডিও মিটিং (Google Meet)' : 'Google Video Meeting'}
                    </h4>
                    <p className="text-[11px] text-emerald-400">
                      🔒 {language === 'bn' ? 'প্রাইভেসি এনক্রিপ্টেড ভিডিও' : 'Privacy Encrypted Video'}
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-white/10 text-[11px] font-mono">
                  meet-bdn-2026
                </span>
              </div>

              {/* Video Stage */}
              <div className="relative h-60 rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center">
                {isGoogleVideoLive && !isCamOff ? (
                  <video
                    src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-4 space-y-2">
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 rounded-full mx-auto object-cover ring-4 ring-emerald-500/40"
                    />
                    <p className="text-xs font-bold text-slate-200">
                      {isGoogleVideoLive
                        ? language === 'bn'
                          ? 'ক্যামেরা প্রাইভেসি মোডে বন্ধ আছে (অডিও সক্রিয়)'
                          : 'Camera hidden by Privacy Guard (Audio Active)'
                        : language === 'bn'
                        ? 'প্রাইভেট গুগল ভিডিও কল শুরু করতে নিচের বাটনে ক্লিক করুন'
                        : 'Click Start Google Video below to launch private video room'}
                    </p>
                  </div>
                )}

                {isGoogleVideoLive && (
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-red-600 text-white text-[10px] font-extrabold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                    <span>LIVE GOOGLE MEET</span>
                  </div>
                )}
              </div>

              {/* Video Controls */}
              <div className="flex items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsMicMuted((m) => !m)}
                  className={`p-2.5 rounded-full cursor-pointer ${
                    isMicMuted ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                  }`}
                  title="Toggle Microphone"
                >
                  {isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => setIsCamOff((c) => !c)}
                  className={`p-2.5 rounded-full cursor-pointer ${
                    isCamOff ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                  }`}
                  title="Toggle Camera Privacy"
                >
                  {isCamOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsGoogleVideoLive((prev) => !prev);
                    showToast(
                      !isGoogleVideoLive
                        ? language === 'bn'
                          ? '🎥 প্রাইভেসি সুরক্ষিত গুগল ভিডিও কল শুরু হয়েছে!'
                          : '🎥 Privacy-protected Google Video started!'
                        : language === 'bn'
                        ? 'গুগল ভিডিও কল সমাপ্ত হয়েছে'
                        : 'Google Video ended',
                    );
                  }}
                  className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer ${
                    isGoogleVideoLive
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950'
                  }`}
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>
                    {isGoogleVideoLive
                      ? language === 'bn'
                        ? 'ভিডিও কল শেষ করুন'
                        : 'Leave Video'
                      : language === 'bn'
                      ? 'গুগল ভিডিও শুরু করুন'
                      : 'Start Google Video'}
                  </span>
                </button>
              </div>
            </div>

            {/* Right Column: Privacy-Protected Google Chat Space */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col h-[370px] overflow-hidden shadow-xs">
              <div className="px-4 py-3 bg-emerald-600 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm">
                      {language === 'bn'
                        ? 'গুগল চ্যাট স্পেস (Google Chat)'
                        : 'Google Chat Space'}
                    </h4>
                    <p className="text-[10px] text-emerald-100">
                      {e2ePrivacyLock
                        ? language === 'bn'
                          ? '🔒 এন্ড-টু-এন্ড প্রাইভেসি সুরক্ষিত চ্যাট'
                          : '🔒 End-to-End Privacy Protected'
                        : 'Standard Chat'}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full">
                  {contacts.filter((c) => c.isOnline !== false).length}{' '}
                  {language === 'bn' ? 'অনলাইন' : 'Online'}
                </span>
              </div>

              <div className="flex-1 p-3.5 overflow-y-auto space-y-2.5 bg-slate-50/50 dark:bg-slate-950/50">
                {googleChatMessages.map((m) => (
                  <div key={m.id} className="flex items-start gap-2.5">
                    <img
                      src={m.avatar}
                      alt={m.sender}
                      referrerPolicy="no-referrer"
                      className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5"
                    />
                    <div className="flex-1 bg-white dark:bg-slate-800 p-2.5 rounded-2xl border border-slate-200/70 dark:border-slate-700 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-700 dark:text-emerald-400">
                          {m.sender}
                        </span>
                        <span className="text-[10px] text-slate-400">{m.time}</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-200 mt-0.5">{m.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!googleChatInput.trim()) return;
                  const text = googleChatInput.trim();
                  setGoogleChatMessages((prev) => [
                    ...prev,
                    {
                      id: `gc_${Date.now()}`,
                      sender: currentUser.nameBn || currentUser.name,
                      avatar: currentUser.avatar,
                      text,
                      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    },
                  ]);
                  setGoogleChatInput('');
                }}
                className="p-2.5 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={googleChatInput}
                  onChange={(e) => setGoogleChatInput(e.target.value)}
                  placeholder={
                    language === 'bn'
                      ? 'প্রাইভেট গুগল চ্যাটে বার্তা লিখুন...'
                      : 'Write a privacy-protected Google Chat message...'
                  }
                  className="flex-1 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                >
                  {language === 'bn' ? 'পাঠান' : 'Send'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Group Cards Grid */}
      {(directoryFilter === 'all' || directoryFilter === 'joined') && (
        <div className="space-y-4">
          {filteredGroups.map((group) => {
            const countInGroup = posts.filter((p) => p.groupId === group.id).length;
            return (
              <div
                key={group.id}
                className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col sm:flex-row hover:border-blue-400/60 transition-all"
              >
                <div
                  onClick={() => setSelectedGroupId(group.id)}
                  className="sm:w-56 h-44 sm:h-auto bg-slate-100 dark:bg-slate-800 shrink-0 relative cursor-pointer group overflow-hidden"
                >
                  <img
                    src={group.coverImage}
                    alt={group.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                  <span className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-xs text-white text-[11px] font-bold">
                    {countInGroup} {language === 'bn' ? 'টি পোস্ট' : 'posts'}
                  </span>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
                      <span>
                        {language === 'bn' ? group.categoryBn || group.category : group.category}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-normal">
                        {group.privacy === 'public' ? (
                          <Globe className="w-3.5 h-3.5" />
                        ) : (
                          <Lock className="w-3.5 h-3.5" />
                        )}
                        {group.privacy === 'public'
                          ? language === 'bn'
                            ? 'পাবলিক গ্রুপ'
                            : 'Public'
                          : language === 'bn'
                          ? 'প্রাইভেট'
                          : 'Private'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedGroupId(group.id)}
                      className="text-left cursor-pointer group"
                    >
                      <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {language === 'bn' ? group.nameBn || group.name : group.name}
                      </h3>
                    </button>

                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                      {group.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {group.membersCount.toLocaleString()} {t.members}
                    </span>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveGroupChatId(group.id)}
                        className="px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 transition-all cursor-pointer"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>{language === 'bn' ? 'গ্রুপ চ্যাট' : 'Group Chat'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedGroupId(group.id)}
                        className="px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all cursor-pointer"
                      >
                        <FolderOpen className="w-3.5 h-3.5" />
                        <span>
                          {language === 'bn'
                            ? 'গ্রুপে ঢুকুন ও পোস্ট করুন'
                            : 'Enter Group & Post'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (!group.isJoined) {
                            toggleJoinGroup(group.id);
                          }
                          setSelectedGroupId(group.id);
                        }}
                        className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1 transition-all cursor-pointer ${
                          group.isJoined
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200'
                            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                        }`}
                      >
                        {group.isJoined ? (
                          <>
                            <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                            <span>{language === 'bn' ? 'যুক্ত আছেন (ঢুকুন)' : t.joinedGroup}</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>{language === 'bn' ? 'যোগ দিন ও ঢুকুন' : t.joinGroup}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Recent Posts from Groups */}
      {allGroupPosts.length > 0 && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">
              {language === 'bn'
                ? 'গ্রুপসমূহের সাম্প্রতিক পোস্ট, ছবি ও ভিডিও'
                : 'Recent Posts, Photos & Videos from Groups'}
            </h3>
          </div>
          {allGroupPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}

      {/* Create New Page Modal */}
      {isCreatePageOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Flag className="w-4 h-4 text-indigo-600" />
                <span>{language === 'bn' ? 'নতুন অফিসিয়াল পেইজ খুলুন' : 'Create Official Page'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsCreatePageOpen(false)}
                className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newPageName.trim()) return;
                createPage({
                  name: newPageName.trim(),
                  nameBn: newPageName.trim(),
                  category: newPageCategory,
                  description:
                    newPageDescription.trim() ||
                    (language === 'bn' ? 'অফিসিয়াল কমিউনিটি ও ব্র্যান্ড পেইজ' : 'Official Brand & Community Page'),
                  coverImage: newPageCover || undefined,
                });
                setNewPageName('');
                setNewPageDescription('');
                setNewPageCover('');
                setIsCreatePageOpen(false);
              }}
              className="p-5 space-y-3.5"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'bn' ? 'পেইজের নাম *' : 'Page Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={newPageName}
                  onChange={(e) => setNewPageName(e.target.value)}
                  placeholder={language === 'bn' ? 'যেমন: ঢাকা টেক স্টুডিও' : 'e.g., Dhaka Tech Studio'}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'bn' ? 'ক্যাটাগরি' : 'Category'}
                </label>
                <input
                  type="text"
                  value={newPageCategory}
                  onChange={(e) => setNewPageCategory(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'bn' ? 'পেইজের বিবরণ' : 'Page Description'}
                </label>
                <textarea
                  rows={2}
                  value={newPageDescription}
                  onChange={(e) => setNewPageDescription(e.target.value)}
                  placeholder={language === 'bn' ? 'পেইজ সম্পর্কে সংক্ষেপে লিখুন...' : 'Describe your page...'}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatePageOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 cursor-pointer"
                >
                  {language === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer"
                >
                  {language === 'bn' ? 'পেইজ তৈরি করুন' : 'Create Page'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create New Group Modal */}
      {isCreateGroupOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                {language === 'bn' ? 'নতুন গ্রুপ তৈরি করুন' : 'Create New Group'}
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateGroupOpen(false)}
                className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewGroup} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'bn' ? 'গ্রুপের নাম *' : 'Group Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder={
                    language === 'bn'
                      ? 'যেমন: বাংলাদেশ ভিডিও ক্রিয়েটরস ক্লাব'
                      : 'e.g., Bangladesh Video Creators Club'
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'bn' ? 'ক্যাটাগরি' : 'Category'}
                  </label>
                  <input
                    type="text"
                    value={newGroupCategory}
                    onChange={(e) => setNewGroupCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'bn' ? 'প্রাইভেসি' : 'Privacy'}
                  </label>
                  <select
                    value={newGroupPrivacy}
                    onChange={(e) => setNewGroupPrivacy(e.target.value as 'public' | 'private')}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
                  >
                    <option value="public">
                      {language === 'bn' ? 'পাবলিক (সবার জন্য উন্মুক্ত)' : 'Public'}
                    </option>
                    <option value="private">
                      {language === 'bn' ? 'প্রাইভেট' : 'Private'}
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'bn' ? 'গ্রুপের বিবরণ' : 'Description'}
                </label>
                <textarea
                  rows={2}
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                  placeholder={
                    language === 'bn'
                      ? 'এই গ্রুপে কী কী শেয়ার করা যাবে তা লিখুন...'
                      : 'Describe what members can share in this group...'
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 resize-none"
                />
              </div>

              <div>
                <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer hover:bg-slate-200">
                  <ImageIcon className="w-4 h-4 text-blue-600" />
                  <span>
                    {newGroupCover
                      ? language === 'bn'
                        ? '✓ কভার ছবি যুক্ত হয়েছে'
                        : '✓ Cover Photo Selected'
                      : language === 'bn'
                      ? 'গ্রুপের কভার ছবি আপলোড করুন'
                      : 'Upload Group Cover Photo'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCreateGroupCover}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateGroupOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  {language === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer shadow-sm"
                >
                  {language === 'bn' ? 'গ্রুপ তৈরি ও প্রবেশ করুন' : 'Create & Enter Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

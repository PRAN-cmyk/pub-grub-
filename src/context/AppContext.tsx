import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  User,
  Post,
  Story,
  ReactionType,
  MarketplaceItem,
  SocialGroup,
  ReelItem,
  AppNotification,
  FriendRequest,
  ChatConversation,
  ChatMessage,
  MainTab,
  ActiveCall,
  AudioTrack,
  GroupChatMessage,
  OfficialPage,
  PhotoAlbum,
  ThemeMode,
  UserActivityItem,
  StoryReactionUser,
} from '../types';
import {
  currentUser as defaultUser,
  initialPosts,
  initialStories,
  initialFriendRequests,
  initialMarketplaceItems,
  initialGroups,
  initialReels,
  initialNotifications,
  sampleUsers,
  createAvatarUrl,
} from '../data/mockData';
import { Language, translations } from '../translations';
import { saveStateToDB, loadStateFromDB, loadSyncFallback } from '../utils/storage';
import {
  hashPinOrPassword,
  sanitizeUserContent,
  initSecurityShield,
} from '../utils/security';
import {
  initAuth,
  googleSignIn,
  firebaseLogout,
  firebaseLoginWithEmailPassword,
  firebaseRegisterWithEmailPassword,
  firebaseSendPasswordResetEmail,
  savePostToFirestoreCloud,
  deletePostFromFirestoreCloud,
  subscribeToPublicCloudPosts,
  saveReelToFirestoreCloud,
  deleteReelFromFirestoreCloud,
  subscribeToCloudReels,
  updateReelReactionCloud,
  updatePostReactionCloud,
  sendChatMessageCloud,
  subscribeToChatMessagesCloud,
} from '../firebase';

const INITIAL_PROFILES: User[] = [
  defaultUser,
  sampleUsers.arafat,
  sampleUsers.nusrat,
  sampleUsers.tanvir,
  sampleUsers.sarah,
];

const DEFAULT_CONVERSATIONS: Record<string, ChatConversation> = {
  usr_arafat: {
    friend: sampleUsers.arafat,
    isOnline: true,
    unreadCount: 0,
    messages: [
      {
        id: 'm1',
        senderId: 'usr_arafat',
        text: 'আসসালামু আলাইকুম প্রান্ত ভাই! নতুন ফেসবুক বিকল্প প্ল্যাটফর্মটা দুর্দান্ত হয়েছে 👌',
        timestamp: '11:42 AM',
      },
      {
        id: 'm2',
        senderId: defaultUser.id,
        text: 'ওয়ালাইকুম আসসালাম আরাফাত ভাই! অনেক ধন্যবাদ। নতুন ফিচারগুলো কেমন লাগছে জানাবেন।',
        timestamp: '11:44 AM',
      },
    ],
  },
  usr_nusrat: {
    friend: sampleUsers.nusrat,
    isOnline: true,
    unreadCount: 1,
    messages: [
      {
        id: 'm3',
        senderId: 'usr_nusrat',
        text: 'শ্রীমঙ্গলের ছবিগুলো দেখে কেমন লাগল জানাবেন! 🌿',
        timestamp: '1:15 PM',
      },
    ],
  },
  usr_tanvir: {
    friend: sampleUsers.tanvir,
    isOnline: false,
    lastActive: '30m ago',
    unreadCount: 0,
    messages: [
      {
        id: 'm4',
        senderId: 'usr_tanvir',
        text: 'নতুন গেম লবি এবং অডিও-ভিডিও কলিং ফিচারটা দারুণ কাজ করছে!',
        timestamp: 'Yesterday',
      },
    ],
  },
};

const FALLBACK_PUBLIC_MP4_PRIMARY =
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
const FALLBACK_PUBLIC_MP4_SECONDARY =
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4';

const repairLegacyMediaUrl = (url?: string): string | undefined => {
  if (!url) return url;
  if (url.includes('assets.mixkit.co')) {
    return url.includes('1173') ? FALLBACK_PUBLIC_MP4_SECONDARY : FALLBACK_PUBLIC_MP4_PRIMARY;
  }
  return url;
};

const INITIAL_AUDIO_LIBRARY: AudioTrack[] = [
  {
    id: 'aud_1',
    title: 'Anupam Roy - Tomake Bujhina Priyo 🎵',
    artist: 'Anupam Roy',
    creatorId: defaultUser.id,
    creatorName: defaultUser.name,
    creatorAvatar: defaultUser.avatar,
    sourceType: 'reel',
    videoUrl: FALLBACK_PUBLIC_MP4_SECONDARY,
    createdAt: 'Original Track',
    copyrightLicense: '© 2026 Bandhan Audio Library • DMCA Protected',
    usesCount: 148,
  },
  {
    id: 'aud_2',
    title: 'Habib Wahid - Hridoyer Kotha 🌊',
    artist: 'Habib Wahid',
    creatorId: sampleUsers.arafat.id,
    creatorName: sampleUsers.arafat.name,
    creatorAvatar: sampleUsers.arafat.avatar,
    sourceType: 'reel',
    videoUrl: FALLBACK_PUBLIC_MP4_PRIMARY,
    createdAt: 'Trending Audio',
    copyrightLicense: '© 2026 Bandhan Audio Library • DMCA Protected',
    usesCount: 94,
  },
  {
    id: 'aud_3',
    title: 'Lofi Chill Beats - Bandhan Sessions 🎧',
    artist: 'Bandhan Studio',
    creatorId: sampleUsers.nusrat.id,
    creatorName: sampleUsers.nusrat.name,
    creatorAvatar: sampleUsers.nusrat.avatar,
    sourceType: 'story',
    videoUrl: FALLBACK_PUBLIC_MP4_PRIMARY,
    createdAt: 'Royalty Free',
    copyrightLicense: '© 2026 Bandhan Original Audio • Licensed',
    usesCount: 62,
  },
];

const INITIAL_OFFICIAL_PAGES: OfficialPage[] = [
  {
    id: 'page_1',
    name: 'Bandhan Creators Hub',
    nameBn: 'বন্ধন ক্রিয়েটরস হাব',
    category: 'Media & Creator Community',
    description: 'Official creator monetization, original Reels audio, and live streaming hub.',
    avatar: createAvatarUrl('Bandhan Creators', '#1877F2', '#ffffff'),
    coverImage: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1000&auto=format&fit=crop&q=80',
    followersCount: 18450,
    isFollowed: true,
    ownerId: defaultUser.id,
    isVerified: true,
  },
  {
    id: 'page_2',
    name: 'Tech Bangladesh Official',
    nameBn: 'টেক বাংলাদেশ অফিসিয়াল',
    category: 'Science & Technology',
    description: 'Latest software engineering, AI startups, and tech news across Bangladesh.',
    avatar: createAvatarUrl('Tech BD', '#059669', '#ffffff'),
    coverImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1000&auto=format&fit=crop&q=80',
    followersCount: 9320,
    isFollowed: false,
    ownerId: sampleUsers.arafat.id,
    isVerified: true,
  },
  {
    id: 'page_3',
    name: 'Beautiful Bengal Travel',
    nameBn: 'সুন্দর বাংলা ট্রাভেল পেইজ',
    category: 'Travel & Nature',
    description: 'Exploring Sylhet, Sajek Valley, Cox’s Bazar, and Sundarbans.',
    avatar: createAvatarUrl('Bengal Travel', '#db2777', '#ffffff'),
    coverImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1000&auto=format&fit=crop&q=80',
    followersCount: 12700,
    isFollowed: true,
    ownerId: sampleUsers.nusrat.id,
    isVerified: true,
  },
];

const DEFAULT_ACTIVITIES: UserActivityItem[] = [
  {
    id: 'act_init_1',
    type: 'login',
    titleEn: 'Logged in from Chrome on Android',
    titleBn: 'অ্যান্ড্রয়েড ক্রোম ব্রাউজার থেকে লগইন হয়েছে',
    detailEn: 'Dhaka, Bangladesh • IP 103.25.14.92 • Active Session',
    detailBn: 'ঢাকা, বাংলাদেশ • আইপি ১০৩.২৫.১৪.৯২ • সক্রিয় সেশন',
    timestamp: 'Today at 8:40 AM',
    device: 'Chrome on Android',
    ip: '103.25.14.92',
  },
  {
    id: 'act_init_2',
    type: 'security',
    titleEn: 'Security PIN & Profile Protection verified',
    titleBn: 'সিকিউরিটি পিন ও প্রোফাইল সুরক্ষা যাচাই করা হয়েছে',
    detailEn: 'Device storage anti-tamper encryption active',
    detailBn: 'ডিভাইস স্টোরেজ অ্যান্টি-ট্যাম্পার এনক্রিপশন সক্রিয়',
    timestamp: 'Yesterday at 9:15 PM',
  },
  {
    id: 'act_init_3',
    type: 'post',
    titleEn: 'Published status update on Bandhan',
    titleBn: 'বন্ধনে নতুন স্ট্যাটাস পোস্ট করা হয়েছে',
    detailEn: 'Audience: Public (সকলের জন্য)',
    detailBn: 'অডিয়েন্স: পাবলিক (সকলের জন্য)',
    timestamp: '2 days ago',
  },
];

const STORY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours in ms

const filterValidStories = (list: Story[]): Story[] => {
  const now = Date.now();
  return list
    .map((s) => {
      // If a story was saved without expiresAt, assign 20 hours remaining from now
      if (!s.expiresAt) {
        return { ...s, expiresAt: now + 20 * 60 * 60 * 1000 };
      }
      return s;
    })
    .filter((s) => typeof s.expiresAt === 'number' && s.expiresAt > now);
};

interface AppContextType {
  currentUser: User;
  updateUser: (updates: Partial<User>) => void;
  isAuthenticated: boolean;
  logout: () => void;
  deleteCurrentAccount: () => void;
  resetAccountPasswordOrPin: (identifier: string, newPinOrPassword: string) => boolean;
  loginAccount: (identifier: string, passwordOrPin?: string) => boolean;
  audioLibrary: AudioTrack[];
  selectedAudioForCreation: string | null;
  setSelectedAudioForCreation: (title: string | null) => void;
  pages: OfficialPage[];
  createPage: (data: {
    name: string;
    nameBn?: string;
    category: string;
    description: string;
    coverImage?: string;
  }) => void;
  toggleFollowPage: (pageId: string) => void;
  groupChats: Record<string, GroupChatMessage[]>;
  sendGroupChatMessage: (groupId: string, text: string) => void;
  activeGroupChatId: string | null;
  setActiveGroupChatId: (groupId: string | null) => void;
  isMyStatusOnline: boolean;
  toggleMyOnlineStatus: () => void;
  deleteComment: (postId: string, commentId: string, replyId?: string) => void;
  firebaseUserEmail: string | null;
  driveAccessToken: string | null;
  signInWithGoogleAccount: () => Promise<boolean>;
  signInWithEmail: (email: string, pass: string) => Promise<boolean>;
  registerWithEmail: (email: string, pass: string, name: string, nameBn?: string) => Promise<boolean>;
  sendPasswordReset: (email: string) => Promise<boolean>;
  workspaceSubTab: 'drive' | 'gmail' | 'contacts' | 'chat' | 'meet';
  setWorkspaceSubTab: (subTab: 'drive' | 'gmail' | 'contacts' | 'chat' | 'meet') => void;
  importGoogleContactAsFriend: (contact: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    avatar?: string;
  }) => void;
  profiles: User[];
  createNewProfile: (data: {
    name: string;
    nameBn?: string;
    username: string;
    email?: string;
    phone?: string;
    bio?: string;
    city?: string;
    workplace?: string;
    avatar?: string;
    coverImage?: string;
    pin?: string;
  }) => User;
  switchProfile: (userId: string, pinInput?: string) => boolean;
  setProfilePin: (pin: string | null) => void;
  isAccountSecurityOpen: boolean;
  setIsAccountSecurityOpen: (open: boolean) => void;
  followingUserIds: string[];
  toggleFollowUser: (userId: string) => void;
  isFollowingUser: (userId: string) => boolean;
  posts: Post[];
  addPost: (post: Omit<Post, 'id' | 'author' | 'createdAt' | 'reactions' | 'comments' | 'sharesCount'>) => void;
  deletePost: (postId: string) => void;
  setPostSelfDestructTimer: (postId: string, minutes: number | null) => void;
  isProfileLocked: boolean;
  setIsProfileLocked: (locked: boolean) => void;
  albums: PhotoAlbum[];
  createAlbum: (album: Omit<PhotoAlbum, 'id' | 'createdAt'>) => PhotoAlbum;
  deleteAlbum: (albumId: string) => void;
  addPhotoToAlbum: (albumId: string, photoUrl: string) => void;
  removePhotoFromAlbum: (albumId: string, photoUrl: string) => void;
  updatePostPrivacy: (postId: string, privacy: 'public' | 'friends' | 'only_me') => void;
  togglePinPost: (postId: string) => void;
  toggleSavePost: (postId: string) => void;
  reactToPost: (postId: string, reaction: ReactionType) => void;
  votePoll: (postId: string, optionId: string) => void;
  addComment: (postId: string, content: string, parentCommentId?: string) => void;
  likeComment: (postId: string, commentId: string, replyId?: string) => void;
  reactToComment: (postId: string, commentId: string, reaction: ReactionType, replyId?: string) => void;
  isFeedLoading: boolean;
  refreshFeed: () => void;
  sharePost: (postId: string) => void;
  stories: Story[];
  addStory: (story: Omit<Story, 'id' | 'author' | 'createdAt' | 'isViewed'>) => void;
  deleteStory: (storyId: string) => void;
  reactToStory: (storyId: string, emoji: string) => void;
  activeStoryIndex: number | null;
  setActiveStoryIndex: (index: number | null) => void;
  friendRequests: FriendRequest[];
  acceptFriendRequest: (reqId: string) => void;
  declineFriendRequest: (reqId: string) => void;
  sentFriendRequestIds: string[];
  sendFriendRequest: (user: User) => void;
  cancelFriendRequest: (userId: string) => void;
  contacts: User[];
  conversations: Record<string, ChatConversation>;
  activeChatIds: string[];
  openChatWith: (friend: User) => void;
  closeChat: (friendId: string) => void;
  sendMessage: (
    friendId: string,
    text: string,
    options?: { audioUrl?: string; audioDuration?: number; mediaUrl?: string },
  ) => void;
  activeCall: ActiveCall | null;
  startCall: (friend: User, type: 'audio' | 'video') => void;
  endCall: (durationText?: string) => void;
  notifications: AppNotification[];
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  toggleNotificationRead: (id: string) => void;
  deleteNotification: (id: string) => void;
  clearAllNotifications: () => void;
  addNotification: (notif: Omit<AppNotification, 'id' | 'timestamp' | 'isRead'>) => void;
  blockedUserIds: string[];
  blockUser: (userId: string) => void;
  unblockUser: (userId: string) => void;
  isUserBlocked: (userId: string) => boolean;
  viewingUser: User | null;
  viewUserProfile: (user: User | null) => void;
  marketplace: MarketplaceItem[];
  addMarketplaceItem: (item: Omit<MarketplaceItem, 'id' | 'seller' | 'createdAt'>) => void;
  groups: SocialGroup[];
  toggleJoinGroup: (groupId: string) => void;
  addGroup: (group: Omit<SocialGroup, 'id' | 'membersCount' | 'isJoined'>) => SocialGroup;
  selectedGroupId: string | null;
  setSelectedGroupId: (groupId: string | null) => void;
  enterGroup: (groupId: string) => void;
  reels: ReelItem[];
  toggleLikeReel: (reelId: string) => void;
  addReelComment: (reelId: string, content: string) => void;
  incrementReelShares: (reelId: string) => void;
  incrementReelViews: (reelId: string) => void;
  activeTab: MainTab;
  setActiveTab: (tab: MainTab) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations.en;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  activityLog: UserActivityItem[];
  addActivityLog: (item: Omit<UserActivityItem, 'id' | 'timestamp'>) => void;
  clearActivityLog: () => void;
  isCreatePostOpen: boolean;
  setIsCreatePostOpen: (open: boolean) => void;
  isCreateStoryOpen: boolean;
  setIsCreateStoryOpen: (open: boolean) => void;
  isCreateReelOpen: boolean;
  setIsCreateReelOpen: (open: boolean) => void;
  isAudioLibraryOpen: boolean;
  setIsAudioLibraryOpen: (open: boolean) => void;
  addReel: (reel: Omit<ReelItem, 'id' | 'author' | 'likesCount' | 'commentsCount' | 'sharesCount' | 'isLiked'>) => void;
  sharePostToStory: (postId: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  toast: string | null;
  showToast: (msg: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDbHydrated, setIsDbHydrated] = useState(false);

  // Theme state: System / Light / Dark
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    return (localStorage.getItem('bandhan_theme_mode') as ThemeMode) || 'system';
  });

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const savedMode = localStorage.getItem('bandhan_theme_mode') as ThemeMode | null;
    if (savedMode === 'dark') return true;
    if (savedMode === 'light') return false;
    const legacySaved = localStorage.getItem('bandhan_dark_mode');
    if (legacySaved !== null) return legacySaved === 'true';
    return (
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    );
  });

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      localStorage.setItem('bandhan_theme_mode', mode);
      if (mode === 'dark') localStorage.setItem('bandhan_dark_mode', 'true');
      else if (mode === 'light') localStorage.setItem('bandhan_dark_mode', 'false');
    } catch {
      // ignore
    }

    if (mode === 'dark') {
      setIsDarkMode(true);
    } else if (mode === 'light') {
      setIsDarkMode(false);
    } else {
      const prefersDark =
        typeof window !== 'undefined' &&
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(prefersDark);
    }
  };

  useEffect(() => {
    if (themeMode !== 'system' || typeof window === 'undefined' || !window.matchMedia) return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches);
    };
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, [themeMode]);

  useEffect(() => {
    try {
      localStorage.setItem('bandhan_dark_mode', String(isDarkMode));
    } catch {
      // ignore
    }
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    setThemeModeState(next ? 'dark' : 'light');
    try {
      localStorage.setItem('bandhan_theme_mode', next ? 'dark' : 'light');
      localStorage.setItem('bandhan_dark_mode', String(next));
    } catch {}
  };

  // Language state
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('bandhan_language') as Language) || 'bn';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('bandhan_language', lang);
    } catch {
      // ignore
    }
  };

  const t = translations[language];

  // Toast notification state & helper
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast(null);
    }, 3000);
  }, []);

  // User state & Multi-Profile Vault
  const [currentUser, setCurrentUser] = useState<User>(() =>
    loadSyncFallback<User>('bandhan_user', defaultUser),
  );

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() =>
    loadSyncFallback<boolean>('bandhan_is_authenticated', true),
  );

  const [profiles, setProfiles] = useState<User[]>(() =>
    loadSyncFallback<User[]>('bandhan_profiles', INITIAL_PROFILES),
  );

  const [followingUserIds, setFollowingUserIds] = useState<string[]>(() =>
    loadSyncFallback<string[]>('bandhan_following', ['usr_arafat', 'usr_nusrat']),
  );

  const [isAccountSecurityOpen, setIsAccountSecurityOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  // Activity Log State & History
  const [activityLog, setActivityLog] = useState<UserActivityItem[]>(() =>
    loadSyncFallback<UserActivityItem[]>('bandhan_activity_log', DEFAULT_ACTIVITIES),
  );

  const addActivityLog = useCallback(
    (item: Omit<UserActivityItem, 'id' | 'timestamp'>) => {
      const newEntry: UserActivityItem = {
        ...item,
        id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          month: 'short',
          day: 'numeric',
        }),
      };
      setActivityLog((prev) => {
        const next = [newEntry, ...prev.slice(0, 99)];
        saveStateToDB('bandhan_activity_log', next);
        return next;
      });
    },
    [],
  );

  const clearActivityLog = useCallback(() => {
    setActivityLog([]);
    saveStateToDB('bandhan_activity_log', []);
    showToast(language === 'bn' ? 'কার্যক্রম লগ মুছে ফেলা হয়েছে' : 'Activity log cleared');
  }, [language, showToast]);

  useEffect(() => {
    initSecurityShield();
  }, []);

  // Posts state hydrated via IndexedDB + signed storage envelope (avoids stale raw blob: URLs)
  const [posts, setPosts] = useState<Post[]>(() => {
    try {
      localStorage.removeItem('bandhan_posts_local');
    } catch {
      // ignore
    }
    return loadSyncFallback<Post[]>('bandhan_posts', initialPosts).map((p) => ({
      ...p,
      video: repairLegacyMediaUrl(p.video),
      image: repairLegacyMediaUrl(p.image),
    }));
  });

  // Audio Library state (automatically receives audio from every new Reel & Story)
  const [audioLibrary, setAudioLibrary] = useState<AudioTrack[]>(() =>
    loadSyncFallback<AudioTrack[]>('bandhan_audio_library', INITIAL_AUDIO_LIBRARY),
  );
  const [selectedAudioForCreation, setSelectedAudioForCreation] = useState<string | null>(null);

  // Official Pages state
  const [pages, setPages] = useState<OfficialPage[]>(() =>
    loadSyncFallback<OfficialPage[]>('bandhan_pages', INITIAL_OFFICIAL_PAGES),
  );

  // Group Chat messages state
  const [groupChats, setGroupChats] = useState<Record<string, GroupChatMessage[]>>(() =>
    loadSyncFallback<Record<string, GroupChatMessage[]>>('bandhan_group_chats', {
      grp_1: [
        {
          id: 'gmsg_init_1',
          groupId: 'grp_1',
          senderId: sampleUsers.arafat.id,
          senderName: sampleUsers.arafat.nameBn || sampleUsers.arafat.name,
          senderAvatar: sampleUsers.arafat.avatar,
          text: 'সবাইকে গ্রুপ চ্যাটে স্বাগতম! কে কে অনলাইনে আছেন? 👋',
          timestamp: '10:30 AM',
        },
        {
          id: 'gmsg_init_2',
          groupId: 'grp_1',
          senderId: sampleUsers.nusrat.id,
          senderName: sampleUsers.nusrat.nameBn || sampleUsers.nusrat.name,
          senderAvatar: sampleUsers.nusrat.avatar,
          text: 'আমি অনলাইনে আছি! নতুন ফিচারগুলো দারুণ লাগছে ✨',
          timestamp: '10:32 AM',
        },
      ],
    }),
  );
  const [activeGroupChatId, setActiveGroupChatId] = useState<string | null>(null);
  const [isMyStatusOnline, setIsMyStatusOnline] = useState<boolean>(() => {
    const saved = localStorage.getItem('bandhan_my_online_status');
    return saved !== null ? saved === 'true' : true;
  });

  const toggleMyOnlineStatus = () => {
    setIsMyStatusOnline((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('bandhan_my_online_status', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Stories state (filtered by 24h expiration)
  const [stories, setStories] = useState<Story[]>(() =>
    filterValidStories(loadSyncFallback<Story[]>('bandhan_stories', initialStories)),
  );

  // Friend requests
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>(() =>
    loadSyncFallback<FriendRequest[]>('bandhan_friend_reqs', initialFriendRequests),
  );

  // Sent Friend Requests
  const [sentFriendRequestIds, setSentFriendRequestIds] = useState<string[]>(() =>
    loadSyncFallback<string[]>('bandhan_sent_friend_reqs', []),
  );

  // Contacts (Friends)
  const [contacts, setContacts] = useState<User[]>(() =>
    loadSyncFallback<User[]>('bandhan_contacts', Object.values(sampleUsers)),
  );

  // Marketplace items
  const [marketplace, setMarketplace] = useState<MarketplaceItem[]>(() =>
    loadSyncFallback<MarketplaceItem[]>('bandhan_marketplace', initialMarketplaceItems),
  );

  // Groups
  const [groups, setGroups] = useState<SocialGroup[]>(() =>
    loadSyncFallback<SocialGroup[]>('bandhan_groups', initialGroups),
  );

  // Reels
  const [reels, setReels] = useState<ReelItem[]>(() =>
    loadSyncFallback<ReelItem[]>('bandhan_reels', initialReels),
  );

  // Notifications
  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    loadSyncFallback<AppNotification[]>('bandhan_notifications', initialNotifications),
  );

  // Blocked users state
  const [blockedUserIds, setBlockedUserIds] = useState<string[]>(() =>
    loadSyncFallback<string[]>('bandhan_blocked_users', []),
  );

  // Chat Conversations
  const [conversations, setConversations] = useState<Record<string, ChatConversation>>(() =>
    loadSyncFallback<Record<string, ChatConversation>>('bandhan_conversations', DEFAULT_CONVERSATIONS),
  );

  // Hydrate all state from IndexedDB on initial mount so large video/image posts, stories & reels survive refresh
  useEffect(() => {
    let mounted = true;
    async function hydrateAll() {
      const [
        dbUser,
        dbAuth,
        dbProfiles,
        dbFollowing,
        dbPosts,
        dbStories,
        dbFriendReqs,
        dbSentReqs,
        dbContacts,
        dbMarketplace,
        dbGroups,
        dbReels,
        dbNotifs,
        dbBlocked,
        dbConvs,
        dbAudioLib,
      ] = await Promise.all([
        loadStateFromDB<User>('bandhan_user'),
        loadStateFromDB<boolean>('bandhan_is_authenticated'),
        loadStateFromDB<User[]>('bandhan_profiles'),
        loadStateFromDB<string[]>('bandhan_following'),
        loadStateFromDB<Post[]>('bandhan_posts'),
        loadStateFromDB<Story[]>('bandhan_stories'),
        loadStateFromDB<FriendRequest[]>('bandhan_friend_reqs'),
        loadStateFromDB<string[]>('bandhan_sent_friend_reqs'),
        loadStateFromDB<User[]>('bandhan_contacts'),
        loadStateFromDB<MarketplaceItem[]>('bandhan_marketplace'),
        loadStateFromDB<SocialGroup[]>('bandhan_groups'),
        loadStateFromDB<ReelItem[]>('bandhan_reels'),
        loadStateFromDB<AppNotification[]>('bandhan_notifications'),
        loadStateFromDB<string[]>('bandhan_blocked_users'),
        loadStateFromDB<Record<string, ChatConversation>>('bandhan_conversations'),
        loadStateFromDB<AudioTrack[]>('bandhan_audio_library'),
      ]);

      if (!mounted) return;
      if (dbUser) setCurrentUser(dbUser);
      if (typeof dbAuth === 'boolean') setIsAuthenticated(dbAuth);
      if (dbProfiles && dbProfiles.length > 0) {
        setProfiles(dbProfiles);
      } else if (dbUser) {
        setProfiles((prev) => {
          const exists = prev.some((p) => p.id === dbUser.id);
          return exists ? prev.map((p) => (p.id === dbUser.id ? dbUser : p)) : [dbUser, ...prev];
        });
      }
      if (dbFollowing) setFollowingUserIds(dbFollowing);
      if (dbPosts && dbPosts.length > 0) {
        const repairedPosts = dbPosts.map((p) => ({
          ...p,
          video: repairLegacyMediaUrl(p.video),
          image: repairLegacyMediaUrl(p.image),
        }));
        setPosts((prev) => {
          // Prefer IndexedDB-resolved entries so idb:// -> live blob: URLs replace any stale sync fallback
          const map = new Map<string, Post>();
          prev.forEach((p) => map.set(p.id, { ...p, video: repairLegacyMediaUrl(p.video), image: repairLegacyMediaUrl(p.image) }));
          repairedPosts.forEach((p) => {
            map.set(p.id, p);
          });
          return Array.from(map.values());
        });
      }
      if (dbStories && dbStories.length > 0) {
        const repairedStories = dbStories.map((s) => ({
          ...s,
          mediaUrl: repairLegacyMediaUrl(s.mediaUrl),
          videoUrl: repairLegacyMediaUrl(s.videoUrl),
          audioUrl: repairLegacyMediaUrl(s.audioUrl),
        }));
        const validStories = filterValidStories(repairedStories);
        setStories(validStories);
        if (validStories.length !== dbStories.length) {
          saveStateToDB('bandhan_stories', validStories);
        }
      }
      if (dbAudioLib && dbAudioLib.length > 0) {
        setAudioLibrary(
          dbAudioLib.map((a) => ({
            ...a,
            videoUrl: repairLegacyMediaUrl(a.videoUrl),
            audioUrl: repairLegacyMediaUrl(a.audioUrl),
          })),
        );
      }
      if (dbFriendReqs) setFriendRequests(dbFriendReqs);
      if (dbSentReqs) setSentFriendRequestIds(dbSentReqs);
      if (dbContacts && dbContacts.length > 0) setContacts(dbContacts);
      if (dbMarketplace && dbMarketplace.length > 0) setMarketplace(dbMarketplace);
      if (dbGroups && dbGroups.length > 0) setGroups(dbGroups);
      if (dbReels && dbReels.length > 0) {
        setReels(
          dbReels.map((r) => ({
            ...r,
            videoUrl: repairLegacyMediaUrl(r.videoUrl),
          })),
        );
      }
      if (dbNotifs) setNotifications(dbNotifs);
      if (dbBlocked) setBlockedUserIds(dbBlocked);
      if (dbConvs) setConversations(dbConvs);

      setIsDbHydrated(true);
    }

    hydrateAll();
    // Periodically purge stories older than 24 hours
    const expiryTimer = setInterval(() => {
      setStories((prev) => {
        const valid = filterValidStories(prev);
        if (valid.length !== prev.length) {
          saveStateToDB('bandhan_stories', valid);
        }
        return valid;
      });
    }, 60000);
    return () => {
      mounted = false;
      clearInterval(expiryTimer);
    };
  }, []);

  // Persist every state change to IndexedDB + localStorage once hydrated
  useEffect(() => {
    if (!isDbHydrated) return;
    saveStateToDB('bandhan_user', currentUser);
  }, [currentUser, isDbHydrated]);

  useEffect(() => {
    if (!isDbHydrated) return;
    saveStateToDB('bandhan_profiles', profiles);
  }, [profiles, isDbHydrated]);

  useEffect(() => {
    if (!isDbHydrated) return;
    saveStateToDB('bandhan_is_authenticated', isAuthenticated);
  }, [isAuthenticated, isDbHydrated]);

  useEffect(() => {
    if (!isDbHydrated) return;
    saveStateToDB('bandhan_following', followingUserIds);
  }, [followingUserIds, isDbHydrated]);

  useEffect(() => {
    if (!isDbHydrated) return;
    saveStateToDB('bandhan_posts', posts);
  }, [posts, isDbHydrated]);

  useEffect(() => {
    if (!isDbHydrated) return;
    saveStateToDB('bandhan_stories', stories);
  }, [stories, isDbHydrated]);

  // Periodic cleaner: automatically purge stories older than 24 hours
  useEffect(() => {
    const interval = setInterval(() => {
      setStories((prev) => {
        const valid = filterValidStories(prev);
        if (valid.length !== prev.length) {
          saveStateToDB('bandhan_stories', valid);
          return valid;
        }
        return prev;
      });
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isDbHydrated) return;
    saveStateToDB('bandhan_friend_reqs', friendRequests);
  }, [friendRequests, isDbHydrated]);

  useEffect(() => {
    if (!isDbHydrated) return;
    saveStateToDB('bandhan_sent_friend_reqs', sentFriendRequestIds);
  }, [sentFriendRequestIds, isDbHydrated]);

  useEffect(() => {
    if (!isDbHydrated) return;
    saveStateToDB('bandhan_contacts', contacts);
  }, [contacts, isDbHydrated]);

  useEffect(() => {
    if (!isDbHydrated) return;
    saveStateToDB('bandhan_marketplace', marketplace);
  }, [marketplace, isDbHydrated]);

  useEffect(() => {
    if (!isDbHydrated) return;
    saveStateToDB('bandhan_groups', groups);
  }, [groups, isDbHydrated]);

  useEffect(() => {
    if (!isDbHydrated) return;
    saveStateToDB('bandhan_reels', reels);
  }, [reels, isDbHydrated]);

  useEffect(() => {
    if (!isDbHydrated) return;
    saveStateToDB('bandhan_notifications', notifications);
  }, [notifications, isDbHydrated]);

  useEffect(() => {
    if (!isDbHydrated) return;
    saveStateToDB('bandhan_blocked_users', blockedUserIds);
  }, [blockedUserIds, isDbHydrated]);

  useEffect(() => {
    if (!isDbHydrated) return;
    saveStateToDB('bandhan_conversations', conversations);
  }, [conversations, isDbHydrated]);

  const syncAuthorAcrossAllContent = useCallback((updatedUser: User) => {
    setProfiles((prev) => {
      const exists = prev.some((u) => u.id === updatedUser.id);
      const next = exists
        ? prev.map((u) => (u.id === updatedUser.id ? updatedUser : u))
        : [updatedUser, ...prev];
      saveStateToDB('bandhan_profiles', next);
      return next;
    });

    setContacts((prev) => {
      const next = prev.map((c) => (c.id === updatedUser.id ? updatedUser : c));
      saveStateToDB('bandhan_contacts', next);
      return next;
    });

    setPosts((prev) => {
      const next = prev.map((p) => ({
        ...p,
        author: p.author.id === updatedUser.id ? updatedUser : p.author,
        comments: p.comments.map((c) => ({
          ...c,
          author: c.author.id === updatedUser.id ? updatedUser : c.author,
          replies: c.replies?.map((r) => ({
            ...r,
            author: r.author.id === updatedUser.id ? updatedUser : r.author,
          })),
        })),
      }));
      saveStateToDB('bandhan_posts', next);
      return next;
    });

    setStories((prev) => {
      const next = prev.map((s) =>
        s.author.id === updatedUser.id ? { ...s, author: updatedUser } : s,
      );
      saveStateToDB('bandhan_stories', next);
      return next;
    });

    setReels((prev) => {
      const next = prev.map((r) => ({
        ...r,
        author: r.author.id === updatedUser.id ? updatedUser : r.author,
        comments: r.comments?.map((c) =>
          c.author.id === updatedUser.id ? { ...c, author: updatedUser } : c,
        ),
      }));
      saveStateToDB('bandhan_reels', next);
      return next;
    });

    setMarketplace((prev) => {
      const next = prev.map((m) =>
        m.seller.id === updatedUser.id ? { ...m, seller: updatedUser } : m,
      );
      saveStateToDB('bandhan_marketplace', next);
      return next;
    });
  }, []);

  const updateUser = (updates: Partial<User>) => {
    setCurrentUser((prev) => {
      const next: User = {
        ...prev,
        ...updates,
        name: updates.name ? sanitizeUserContent(updates.name) : prev.name,
        nameBn: updates.nameBn !== undefined ? sanitizeUserContent(updates.nameBn) : prev.nameBn,
        bio: updates.bio !== undefined ? sanitizeUserContent(updates.bio) : prev.bio,
        bioBn: updates.bioBn !== undefined ? sanitizeUserContent(updates.bioBn) : prev.bioBn,
        city: updates.city !== undefined ? sanitizeUserContent(updates.city) : prev.city,
        workplace: updates.workplace !== undefined ? sanitizeUserContent(updates.workplace) : prev.workplace,
        website: updates.website !== undefined ? sanitizeUserContent(updates.website) : prev.website,
        education: updates.education !== undefined ? sanitizeUserContent(updates.education) : prev.education,
        relationship: updates.relationship !== undefined ? sanitizeUserContent(updates.relationship) : prev.relationship,
        hobbies: updates.hobbies !== undefined ? sanitizeUserContent(updates.hobbies) : prev.hobbies,
      };
      saveStateToDB('bandhan_user', next);
      syncAuthorAcrossAllContent(next);
      return next;
    });
  };

  const createNewProfile = (data: {
    name: string;
    nameBn?: string;
    username: string;
    email?: string;
    phone?: string;
    bio?: string;
    city?: string;
    workplace?: string;
    avatar?: string;
    coverImage?: string;
    pin?: string;
  }): User => {
    const cleanName = sanitizeUserContent(data.name.trim()) || 'New User';
    const colors = ['#1877F2', '#0284c7', '#db2777', '#16a34a', '#9333ea', '#ea580c', '#0d9488'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const newUser: User = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: cleanName,
      nameBn: data.nameBn ? sanitizeUserContent(data.nameBn.trim()) : cleanName,
      username:
        sanitizeUserContent(data.username.trim().toLowerCase().replace(/\s+/g, '_')) ||
        `user_${Date.now().toString().slice(-4)}`,
      email: data.email ? sanitizeUserContent(data.email.trim()) : undefined,
      phone: data.phone ? sanitizeUserContent(data.phone.trim()) : undefined,
      avatar: data.avatar || createAvatarUrl(cleanName, randomColor, '#ffffff'),
      coverImage: data.coverImage || defaultUser.coverImage,
      bio: data.bio ? sanitizeUserContent(data.bio.trim()) : 'Bandhan Verified Creator ✨',
      bioBn: data.bio ? sanitizeUserContent(data.bio.trim()) : 'বন্ধন ভেরিফায়েড প্রোফাইল ✨',
      city: data.city ? sanitizeUserContent(data.city.trim()) : 'Dhaka, Bangladesh',
      workplace: data.workplace ? sanitizeUserContent(data.workplace.trim()) : 'Bandhan Community',
      joinedDate: 'Joined Today',
      followersCount: 1,
      friendsCount: profiles.length,
      isVerified: true,
      pinHash: data.pin && data.pin.trim() ? hashPinOrPassword(data.pin.trim()) : undefined,
    };

    setProfiles((prev) => {
      const next = [newUser, ...prev];
      saveStateToDB('bandhan_profiles', next);
      return next;
    });

    setContacts((prev) => {
      const next = [newUser, ...prev];
      saveStateToDB('bandhan_contacts', next);
      return next;
    });

    setCurrentUser(newUser);
    saveStateToDB('bandhan_user', newUser);
    setIsAuthenticated(true);
    saveStateToDB('bandhan_is_authenticated', true);
    setViewingUser(null);
    showToast(
      language === 'bn'
        ? `🎉 স্বাগতম "${newUser.nameBn || newUser.name}"! আপনার নিজস্ব অ্যাকাউন্ট তৈরি ও লগইন সম্পন্ন হয়েছে!`
        : `🎉 Welcome "${newUser.name}"! Your account is created and logged in!`,
    );
    return newUser;
  };

  const switchProfile = (userId: string, pinInput?: string): boolean => {
    const target = profiles.find((p) => p.id === userId) || contacts.find((c) => c.id === userId);
    if (!target) return false;

    if (target.pinHash) {
      if (!pinInput || hashPinOrPassword(pinInput.trim()) !== target.pinHash) {
        showToast(
          language === 'bn'
            ? '❌ ভুল পাসওয়ার্ড বা পিন! এই অ্যাকাউন্টটি এনক্রিপশনে লক করা আছে।'
            : '❌ Invalid Password or PIN! This account is encrypted and locked.',
        );
        return false;
      }
    }

    // Ensure current profile's latest state is saved in profiles list before switching
    setProfiles((prev) => {
      const withCurrent = prev.some((p) => p.id === currentUser.id)
        ? prev.map((p) => (p.id === currentUser.id ? currentUser : p))
        : [currentUser, ...prev];
      const withTarget = withCurrent.some((p) => p.id === target.id)
        ? withCurrent
        : [target, ...withCurrent];
      saveStateToDB('bandhan_profiles', withTarget);
      return withTarget;
    });

    setCurrentUser(target);
    saveStateToDB('bandhan_user', target);
    setIsAuthenticated(true);
    saveStateToDB('bandhan_is_authenticated', true);
    setViewingUser(null);
    showToast(
      language === 'bn'
        ? `✅ "${target.nameBn || target.name}" অ্যাকাউন্টে লগইন সম্পন্ন হয়েছে`
        : `✅ Logged in as "${target.name}"`,
    );
    return true;
  };

  const logout = () => {
    // Save current user into profiles before logging out
    setProfiles((prev) => {
      const exists = prev.some((p) => p.id === currentUser.id);
      const next = exists
        ? prev.map((p) => (p.id === currentUser.id ? currentUser : p))
        : [currentUser, ...prev];
      saveStateToDB('bandhan_profiles', next);
      return next;
    });
    setActiveChatIds([]);
    setIsAccountSecurityOpen(false);
    setIsAuthenticated(false);
    saveStateToDB('bandhan_is_authenticated', false);
    setDriveAccessToken(null);
    setFirebaseUserEmail(null);
    firebaseLogout().catch(() => {});
    showToast(
      language === 'bn'
        ? '👋 সফলভাবে লগআউট করা হয়েছে। যেকোনো অ্যাকাউন্টে লগইন বা নতুন অ্যাকাউন্ট খুলুন।'
        : '👋 Logged out successfully. Sign in or create a new account.',
    );
  };

  const deleteCurrentAccount = () => {
    const deletedId = currentUser.id;
    const deletedName = currentUser.nameBn || currentUser.name;

    setProfiles((prev) => {
      const next = prev.filter((p) => p.id !== deletedId);
      saveStateToDB('bandhan_profiles', next);
      return next;
    });

    setPosts((prev) => {
      const next = prev.filter((p) => p.author.id !== deletedId);
      saveStateToDB('bandhan_posts', next);
      return next;
    });

    setStories((prev) => {
      const next = prev.filter((s) => s.author.id !== deletedId);
      saveStateToDB('bandhan_stories', next);
      return next;
    });

    setReels((prev) => {
      const next = prev.filter((r) => r.author.id !== deletedId);
      saveStateToDB('bandhan_reels', next);
      return next;
    });

    setActiveChatIds([]);
    setIsAccountSecurityOpen(false);
    setIsAuthenticated(false);
    saveStateToDB('bandhan_is_authenticated', false);
    setDriveAccessToken(null);
    setFirebaseUserEmail(null);
    firebaseLogout().catch(() => {});

    showToast(
      language === 'bn'
        ? `🗑️ "${deletedName}" অ্যাকাউন্টটি স্থায়ীভাবে ডিলিট করা হয়েছে।`
        : `🗑️ Account "${deletedName}" has been permanently deleted.`,
    );
  };

  const resetAccountPasswordOrPin = (identifier: string, newPinOrPassword: string): boolean => {
    const clean = identifier.trim().toLowerCase();
    if (!clean) return false;

    const target = profiles.find(
      (p) =>
        p.id.toLowerCase() === clean ||
        p.username.toLowerCase() === clean ||
        p.name.toLowerCase() === clean ||
        (p.nameBn && p.nameBn.toLowerCase() === clean) ||
        (p.email && p.email.toLowerCase() === clean) ||
        (p.phone && p.phone.toLowerCase() === clean),
    );

    if (!target) {
      showToast(
        language === 'bn'
          ? '❌ এই ইউজারনেম, ইমেইল বা ফোনে কোনো অ্যাকাউন্ট পাওয়া যায়নি!'
          : '❌ No account found matching that username, email, or phone!',
      );
      return false;
    }

    const newPinHash =
      newPinOrPassword && newPinOrPassword.trim()
        ? hashPinOrPassword(newPinOrPassword.trim())
        : undefined;

    const updatedTarget: User = {
      ...target,
      pinHash: newPinHash,
    };

    setProfiles((prev) => {
      const next = prev.map((p) => (p.id === target.id ? updatedTarget : p));
      saveStateToDB('bandhan_profiles', next);
      return next;
    });

    if (currentUser.id === target.id) {
      setCurrentUser(updatedTarget);
      saveStateToDB('bandhan_user', updatedTarget);
    }

    showToast(
      language === 'bn'
        ? `✅ "${target.nameBn || target.name}" অ্যাকাউন্টের পাসওয়ার্ড/পিন সফলভাবে রিসেট হয়েছে!`
        : `✅ Password/PIN reset successfully for "${target.name}"!`,
    );
    return true;
  };

  const [firebaseUserEmail, setFirebaseUserEmail] = useState<string | null>(null);
  const [driveAccessToken, setDriveAccessToken] = useState<string | null>(null);
  const [workspaceSubTab, setWorkspaceSubTab] = useState<'drive' | 'gmail' | 'contacts' | 'chat' | 'meet'>('gmail');

  const importGoogleContactAsFriend = (contact: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    avatar?: string;
  }) => {
    const cleanId = `gcontact_${contact.id.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
    const newFriend: User = {
      id: cleanId,
      name: contact.name,
      nameBn: contact.name,
      username: (contact.email ? contact.email.split('@')[0] : contact.name)
        .toLowerCase()
        .replace(/[^a-z0-9._]/g, '.'),
      avatar:
        contact.avatar ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.name)}&background=2563eb&color=fff`,
      email: contact.email,
      phone: contact.phone,
      bio: 'Connected via Google Contacts',
      city: 'Google Contacts',
      followersCount: 1,
      friendsCount: 1,
      isVerified: true,
    };

    setContacts((prev) => {
      if (prev.some((c) => c.id === cleanId)) return prev;
      return [newFriend, ...prev];
    });

    setConversations((prev) => {
      if (prev[cleanId]) return prev;
      const next: Record<string, ChatConversation> = {
        ...prev,
        [cleanId]: {
          friend: newFriend,
          isOnline: true,
          unreadCount: 0,
          messages: [
            {
              id: `msg_${Date.now()}`,
              senderId: cleanId,
              text:
                language === 'bn'
                  ? `হ্যালো! গুগল কন্টাক্টস থেকে বন্ধনে যুক্ত হলাম 👋`
                  : `Hi! Connected on Bandhan via Google Contacts 👋`,
              timestamp: 'Just now',
            },
          ],
        },
      };
      saveStateToDB('bandhan_conversations', next);
      return next;
    });

    openChatWith(newFriend);
    showToast(
      language === 'bn'
        ? `✅ "${contact.name}"-কে বন্ধন ফ্রেন্ড ও মেসেঞ্জারে যুক্ত করা হয়েছে!`
        : `✅ "${contact.name}" added to Bandhan Friends & Messenger!`,
    );
  };

  useEffect(() => {
    let unsubscribePosts: (() => void) | null = null;
    let unsubscribeReels: (() => void) | null = null;
    const unsubscribeAuth = initAuth(
      (fbUser, token) => {
        setFirebaseUserEmail(fbUser.email || fbUser.displayName || 'Connected');
        if (token) {
          setDriveAccessToken(token);
        }

        // Fetch posts from authenticated backend API
        fbUser
          .getIdToken()
          .then((idToken) =>
            fetch('/api/posts', {
              headers: { Authorization: `Bearer ${idToken}` },
            }),
          )
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data && Array.isArray(data.posts) && data.posts.length > 0) {
              setPosts((prev) => {
                const existingIds = new Set(prev.map((p) => p.id));
                const apiPosts: Post[] = data.posts
                  .filter((row: { clientPostId: string }) => !existingIds.has(row.clientPostId))
                  .map(
                    (row: {
                      clientPostId: string;
                      authorUid: string;
                      authorName?: string;
                      authorEmail?: string;
                      authorAvatar?: string;
                      content: string;
                      privacy?: 'public' | 'friends' | 'only_me';
                      mediaUrl?: string;
                    }) => ({
                      id: row.clientPostId,
                      author: {
                        id: row.authorUid,
                        name: row.authorName || row.authorEmail || 'Bandhan Member',
                        nameBn: row.authorName || 'বন্ধন সদস্য',
                        username: (row.authorName || 'user').toLowerCase().replace(/\s+/g, '.'),
                        avatar:
                          row.authorAvatar ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(row.authorName || 'User')}`,
                        followersCount: 120,
                        friendsCount: 45,
                        isVerified: true,
                      },
                      createdAt: 'Synced',
                      content: row.content,
                      privacy: row.privacy || 'public',
                      image: repairLegacyMediaUrl(row.mediaUrl) || undefined,
                      reactions: {
                        like: 1,
                        love: 0,
                        care: 0,
                        haha: 0,
                        wow: 0,
                        sad: 0,
                        angry: 0,
                      },
                      comments: [],
                      sharesCount: 0,
                    }),
                  );
                if (apiPosts.length === 0) return prev;
                const merged = [...apiPosts, ...prev];
                saveStateToDB('bandhan_posts', merged);
                return merged;
              });
            }
          })
          .catch(() => {});

        if (unsubscribePosts) unsubscribePosts();
        unsubscribePosts = subscribeToPublicCloudPosts((cloudRecords) => {
          if (!cloudRecords || cloudRecords.length === 0) return;
          setPosts((prev) => {
            const existingIds = new Set(prev.map((p) => p.id));
            const newFromCloud: Post[] = cloudRecords
              .filter((cr) => !existingIds.has(cr.id))
              .map((cr) => {
                const safeUrl = repairLegacyMediaUrl(
                  cr.mediaUrl && !cr.mediaUrl.startsWith('blob:') && !cr.mediaUrl.startsWith('idb://')
                    ? cr.mediaUrl
                    : undefined,
                );
                return {
                  id: cr.id,
                  author: {
                    id: cr.authorId,
                    name: cr.authorName,
                    nameBn: cr.authorName,
                    username: cr.authorName.toLowerCase().replace(/\s+/g, '.'),
                    avatar: cr.authorAvatar,
                    followersCount: 0,
                    friendsCount: 0,
                    isVerified: true,
                  },
                  createdAt: 'Cloud Sync',
                  content: cr.content,
                  privacy: cr.privacy,
                  image: cr.mediaType !== 'video' ? safeUrl : undefined,
                  video: cr.mediaType === 'video' ? safeUrl : undefined,
                  mediaType:
                    (cr.mediaType as 'image' | 'video') ||
                    (safeUrl
                      ? safeUrl.startsWith('data:video') || /\.(mp4|webm|mov|m4v)(\?|$)/i.test(safeUrl)
                        ? 'video'
                        : 'image'
                      : undefined),
                  driveFile: cr.driveFileId
                    ? {
                        id: cr.driveFileId,
                        name: cr.driveFileName || 'Google Drive File',
                        webViewLink: cr.driveWebViewLink,
                      }
                    : undefined,
                  reactions: {
                    like: 0,
                    love: 0,
                    care: 0,
                    haha: 0,
                    wow: 0,
                    sad: 0,
                    angry: 0,
                  },
                  comments: [],
                  sharesCount: 0,
                };
              });
            if (newFromCloud.length === 0) return prev;
            const merged = [...newFromCloud, ...prev];
            saveStateToDB('bandhan_posts', merged);
            return merged;
          });
        });

        if (unsubscribeReels) unsubscribeReels();
        unsubscribeReels = subscribeToCloudReels((cloudReels) => {
          if (!cloudReels || cloudReels.length === 0) return;
          setReels((prev) => {
            const existingIds = new Set(prev.map((r) => r.id));
            const newFromCloud: ReelItem[] = cloudReels
              .filter(
                (cr) =>
                  !existingIds.has(cr.id) &&
                  cr.videoUrl &&
                  !cr.videoUrl.startsWith('blob:') &&
                  !cr.videoUrl.startsWith('idb://'),
              )
              .map((cr) => ({
                id: cr.id,
                author: {
                  id: cr.authorId,
                  name: cr.authorName,
                  nameBn: cr.authorName,
                  username: cr.authorName.toLowerCase().replace(/\s+/g, '.'),
                  avatar: cr.authorAvatar,
                  followersCount: 0,
                  friendsCount: 0,
                  isVerified: true,
                },
                videoUrl: repairLegacyMediaUrl(cr.videoUrl),
                description: cr.caption,
                songTitle: cr.soundTitle || 'Original Audio',
                likesCount: cr.likesCount || 0,
                likedUserIds: cr.likedUserIds || [],
                commentsCount: cr.commentsCount || 0,
                sharesCount: cr.sharesCount || 0,
                viewsCount: cr.viewsCount || 0,
                createdAt: 'Cloud Sync',
                isLiked: Array.isArray(cr.likedUserIds) && cr.likedUserIds.includes(currentUser.id),
              }));
            if (newFromCloud.length === 0) return prev;
            const merged = [...newFromCloud, ...prev];
            saveStateToDB('bandhan_reels', merged);
            return merged;
          });
        });
      },
      () => {
        setFirebaseUserEmail(null);
        setDriveAccessToken(null);
        if (unsubscribePosts) {
          unsubscribePosts();
          unsubscribePosts = null;
        }
        if (unsubscribeReels) {
          unsubscribeReels();
          unsubscribeReels = null;
        }
      },
    );

    return () => {
      unsubscribeAuth();
      if (unsubscribePosts) unsubscribePosts();
      if (unsubscribeReels) unsubscribeReels();
    };
  }, []);

  const signInWithGoogleAccount = async (): Promise<boolean> => {
    try {
      const res = await googleSignIn();
      if (!res) return false;

      const { user: fbUser, accessToken } = res;
      setDriveAccessToken(accessToken);
      setFirebaseUserEmail(fbUser.email || fbUser.displayName || 'Connected');

      const safeUid = fbUser.uid.replace(/[^a-zA-Z0-9_-]/g, '_');
      const existingProfile = profiles.find(
        (p) =>
          p.id === safeUid ||
          (fbUser.email && p.email?.toLowerCase() === fbUser.email.toLowerCase()),
      );

      if (existingProfile) {
        const updatedUser: User = {
          ...existingProfile,
          name: fbUser.displayName || existingProfile.name,
          avatar: fbUser.photoURL || existingProfile.avatar,
          email: fbUser.email || existingProfile.email,
          isVerified: true,
        };
        setCurrentUser(updatedUser);
        saveStateToDB('bandhan_user', updatedUser);
        setIsAuthenticated(true);
        saveStateToDB('bandhan_is_authenticated', true);
      } else {
        createNewProfile({
          name: fbUser.displayName || 'Google User',
          nameBn: fbUser.displayName || 'গুগল ইউজার',
          username: fbUser.email ? fbUser.email.split('@')[0] : `google_${safeUid.slice(0, 6)}`,
          email: fbUser.email || undefined,
          avatar: fbUser.photoURL || undefined,
          bio: 'Connected via Google Drive & Firebase Cloud ☁️',
        });
      }

      showToast(
        language === 'bn'
          ? `✅ গুগল ড্রাইভ ও ফায়ারবেস ক্লাউড সংযুক্ত হয়েছে (${fbUser.displayName || fbUser.email})!`
          : `✅ Connected to Google Drive & Firebase Cloud (${fbUser.displayName || fbUser.email})!`,
      );
      return true;
    } catch (err) {
      console.error('Google Sign-In failed:', err);
      showToast(
        language === 'bn'
          ? '⚠️ গুগল সাইন-ইন সম্পন্ন হয়নি। পপআপ অনুমতি দিয়ে আবার চেষ্টা করুন।'
          : '⚠️ Google Sign-In was cancelled or blocked by popup settings.',
      );
      return false;
    }
  };

  const signInWithEmail = async (email: string, pass: string): Promise<boolean> => {
    try {
      const fbUser = await firebaseLoginWithEmailPassword(email, pass);
      setFirebaseUserEmail(fbUser.email || fbUser.displayName);
      const safeUid = fbUser.uid.replace(/[^a-zA-Z0-9_-]/g, '_');
      const existing = profiles.find((p) => p.id === safeUid || (fbUser.email && p.email?.toLowerCase() === fbUser.email.toLowerCase()));
      if (existing) {
        setCurrentUser(existing);
        saveStateToDB('bandhan_user', existing);
      } else {
        createNewProfile({
          name: fbUser.displayName || email.split('@')[0],
          username: email.split('@')[0],
          email: fbUser.email || email,
          bio: 'Verified Bandhan Member ✨',
        });
      }
      setIsAuthenticated(true);
      saveStateToDB('bandhan_is_authenticated', true);
      showToast(language === 'bn' ? `✅ সফলভাবে লগইন হয়েছে (${fbUser.email})` : `✅ Logged in successfully (${fbUser.email})`);
      return true;
    } catch (err: any) {
      console.error('Firebase Email Login error:', err);
      showToast(language === 'bn' ? `❌ ইমেইল বা পাসওয়ার্ড সঠিক নয়: ${err.message || 'Login failed'}` : `❌ Login failed: ${err.message || 'Invalid credentials'}`);
      return false;
    }
  };

  const registerWithEmail = async (email: string, pass: string, name: string, nameBn?: string): Promise<boolean> => {
    try {
      const fbUser = await firebaseRegisterWithEmailPassword(email, pass, name, nameBn);
      setFirebaseUserEmail(fbUser.email || fbUser.displayName);
      createNewProfile({
        name: name.trim() || email.split('@')[0],
        nameBn: nameBn?.trim(),
        username: email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_'),
        email: fbUser.email || email,
        bio: 'New Bandhan Creator ✨',
      });
      setIsAuthenticated(true);
      saveStateToDB('bandhan_is_authenticated', true);
      showToast(language === 'bn' ? '🎉 ফায়ারবেস অথেন্টিকেশনে সফলভাবে অ্যাকাউন্ট খোলা সম্পন্ন হয়েছে!' : '🎉 Account registered and authenticated with Firebase!');
      return true;
    } catch (err: any) {
      console.error('Firebase Email Register error:', err);
      showToast(language === 'bn' ? `❌ রেজিস্ট্রেশন ব্যর্থ হয়েছে: ${err.message || 'Registration error'}` : `❌ Registration failed: ${err.message || 'Error creating account'}`);
      return false;
    }
  };

  const sendPasswordReset = async (email: string): Promise<boolean> => {
    try {
      await firebaseSendPasswordResetEmail(email.trim());
      showToast(
        language === 'bn'
          ? `📩 "${email}"-এ পাসওয়ার্ড রিসেট ইমেইল পাঠানো হয়েছে! ইনবক্স চেক করুন।`
          : `📩 Password reset link sent to "${email}"! Please check your inbox.`,
      );
      return true;
    } catch (err: any) {
      console.error('Password reset email error:', err);
      showToast(
        language === 'bn'
          ? `⚠️ পাসওয়ার্ড রিসেট ইমেইল পাঠানো যায়নি: ${err.message || 'Error'}`
          : `⚠️ Could not send password reset email: ${err.message || 'Error'}`,
      );
      return false;
    }
  };

  const loginAccount = (identifier: string, passwordOrPin?: string): boolean => {
    const clean = identifier.trim().toLowerCase();
    if (!clean) return false;

    const target = profiles.find(
      (p) =>
        p.id.toLowerCase() === clean ||
        p.username.toLowerCase() === clean ||
        p.name.toLowerCase() === clean ||
        (p.nameBn && p.nameBn.toLowerCase() === clean) ||
        (p.email && p.email.toLowerCase() === clean) ||
        (p.phone && p.phone.toLowerCase() === clean),
    );

    if (!target) {
      showToast(
        language === 'bn'
          ? '❌ এই নামে বা ইমেইলে কোনো অ্যাকাউন্ট পাওয়া যায়নি। "নতুন অ্যাকাউন্ট খুলুন" বাটনে ক্লিক করুন!'
          : '❌ Account not found. Click "Create New Account" to register!',
      );
      return false;
    }

    return switchProfile(target.id, passwordOrPin);
  };

  const isFollowingUser = (userId: string): boolean => {
    return followingUserIds.includes(userId);
  };

  const toggleFollowUser = (userId: string) => {
    if (userId === currentUser.id) return;
    const currentlyFollowing = followingUserIds.includes(userId);
    const delta = currentlyFollowing ? -1 : 1;

    setFollowingUserIds((prev) => {
      const next = currentlyFollowing ? prev.filter((id) => id !== userId) : [...prev, userId];
      saveStateToDB('bandhan_following', next);
      return next;
    });

    const targetUser =
      profiles.find((p) => p.id === userId) || contacts.find((c) => c.id === userId);
    if (targetUser) {
      const updatedTarget: User = {
        ...targetUser,
        followersCount: Math.max(0, (targetUser.followersCount || 0) + delta),
      };
      syncAuthorAcrossAllContent(updatedTarget);
      showToast(
        !currentlyFollowing
          ? language === 'bn'
            ? `✨ আপনি এখন "${targetUser.nameBn || targetUser.name}"-কে ফলো করছেন!`
            : `✨ You are now following ${targetUser.name}!`
          : language === 'bn'
          ? `"${targetUser.nameBn || targetUser.name}"-কে আনফলো করা হয়েছে`
          : `Unfollowed ${targetUser.name}`,
      );
    }
  };

  const setProfilePin = (pin: string | null) => {
    const pinHash = pin && pin.trim() ? hashPinOrPassword(pin.trim()) : undefined;
    updateUser({ pinHash });
    showToast(
      pinHash
        ? language === 'bn'
          ? '🔐 প্রোফাইল সিকিউরিটি পিন ও এনক্রিপশন লক সক্রিয় করা হয়েছে!'
          : '🔐 Profile Security PIN & Encryption Lock activated!'
        : language === 'bn'
        ? 'প্রোফাইল পিন লক সরানো হয়েছে'
        : 'Profile PIN lock removed',
    );
  };

  // Newsfeed skeleton loader state
  const [isFeedLoading, setIsFeedLoading] = useState<boolean>(false);

  const refreshFeed = () => {
    setIsFeedLoading(true);
    setTimeout(() => {
      setIsFeedLoading(false);
    }, 600);
  };

  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [isCreateStoryOpen, setIsCreateStoryOpen] = useState(false);

  // Viewed user profile (null = own profile)
  const [viewingUser, setViewingUser] = useState<User | null>(null);

  // Active Audio/Video Call state
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);

  const viewUserProfile = (user: User | null) => {
    setViewingUser(user);
    setActiveTab('profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const blockUser = (userId: string) => {
    if (userId === currentUser.id) return;
    setBlockedUserIds((prev) => {
      const next = prev.includes(userId) ? prev : [...prev, userId];
      saveStateToDB('bandhan_blocked_users', next);
      return next;
    });
    setActiveChatIds((prev) => prev.filter((id) => id !== userId));
    showToast(language === 'bn' ? 'ইউজারকে সফলভাবে ব্লক করা হয়েছে' : 'User has been blocked successfully');
  };

  const unblockUser = (userId: string) => {
    setBlockedUserIds((prev) => {
      const next = prev.filter((id) => id !== userId);
      saveStateToDB('bandhan_blocked_users', next);
      return next;
    });
    showToast(language === 'bn' ? 'ইউজারকে আনব্লক করা হয়েছে' : 'User unblocked successfully');
  };

  const isUserBlocked = (userId: string) => {
    return blockedUserIds.includes(userId);
  };

  // Notification management & interaction tracking
  const addNotification = useCallback((notifData: Omit<AppNotification, 'id' | 'timestamp' | 'isRead'>) => {
    const newNotif: AppNotification = {
      ...notifData,
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: language === 'bn' ? 'এইমাত্র' : 'Just now',
      isRead: false,
    };
    setNotifications((prev) => {
      const next = [newNotif, ...prev];
      saveStateToDB('bandhan_notifications', next);
      return next;
    });
  }, [language]);

  const toggleNotificationRead = (id: string) => {
    setNotifications((prev) => {
      const next = prev.map((n) => (n.id === id ? { ...n, isRead: !n.isRead } : n));
      saveStateToDB('bandhan_notifications', next);
      return next;
    });
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => {
      const next = prev.filter((n) => n.id !== id);
      saveStateToDB('bandhan_notifications', next);
      return next;
    });
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    saveStateToDB('bandhan_notifications', []);
    showToast(language === 'bn' ? 'সকল নোটিফিকেশন মুছে ফেলা হয়েছে' : 'All notifications cleared');
  };

  // UI Navigation and modals
  const [activeTab, setActiveTab] = useState<MainTab>('feed');
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [isCreateReelOpen, setIsCreateReelOpen] = useState(false);
  const [isAudioLibraryOpen, setIsAudioLibraryOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [activeChatIds, setActiveChatIds] = useState<string[]>([]);

  // Post Actions
  const addPost = (postData: Omit<Post, 'id' | 'author' | 'createdAt' | 'reactions' | 'comments' | 'sharesCount'>) => {
    const newPost: Post = {
      ...postData,
      content: sanitizeUserContent(postData.content),
      id: `post_${Date.now()}`,
      author: currentUser,
      createdAt: language === 'bn' ? 'এইমাত্র' : 'Just now',
      reactions: {
        like: 0,
        love: 0,
        care: 0,
        haha: 0,
        wow: 0,
        sad: 0,
        angry: 0,
      },
      comments: [],
      sharesCount: 0,
    };
    setPosts((prev) => {
      const next = [newPost, ...prev];
      saveStateToDB('bandhan_posts', next);
      return next;
    });
    savePostToFirestoreCloud({
      postId: newPost.id,
      content: newPost.content,
      privacy: newPost.privacy,
      mediaUrl: newPost.image || newPost.video,
      mediaType: newPost.mediaType || (newPost.video ? 'video' : newPost.image ? 'image' : undefined),
      driveFileId: newPost.driveFile?.id,
      driveFileName: newPost.driveFile?.name,
      driveWebViewLink: newPost.driveFile?.webViewLink,
      poll: newPost.poll,
    }).catch(() => {});
    showToast(language === 'bn' ? 'আপনার পোস্ট সফলভাবে প্রকাশিত হয়েছে!' : 'Your post has been published!');
  };

  // Profile Lock State & Management
  const [isProfileLocked, setIsProfileLockedState] = useState<boolean>(() => {
    try {
      return localStorage.getItem('bandhan_profile_locked') === 'true';
    } catch {
      return false;
    }
  });

  const setIsProfileLocked = (locked: boolean) => {
    setIsProfileLockedState(locked);
    try {
      localStorage.setItem('bandhan_profile_locked', String(locked));
    } catch {
      // ignore
    }
    showToast(
      locked
        ? (language === 'bn' ? '🔒 আপনার প্রোফাইল সফলভাবে লক করা হয়েছে! অপরিচিতরা আপনার ফুল তথ্য দেখতে পারবে না।' : '🔒 Profile locked! Non-friends cannot view your full content.')
        : (language === 'bn' ? '🔓 আপনার প্রোফাইল আনলক করা হয়েছে।' : '🔓 Profile unlocked.')
    );
  };

  // Self-Destruct Post Timer Setting
  const setPostSelfDestructTimer = (postId: string, minutes: number | null) => {
    setPosts((prev) => {
      const next = prev.map((p) => {
        if (p.id !== postId) return p;
        if (minutes === null || minutes <= 0) {
          const { expiresAt, selfDestructDuration, ...rest } = p;
          return rest as Post;
        }
        const expiresAt = new Date(Date.now() + minutes * 60 * 1000).toISOString();
        return {
          ...p,
          expiresAt,
          selfDestructDuration: minutes,
        };
      });
      saveStateToDB('bandhan_posts', next);
      return next;
    });

    if (minutes === null) {
      showToast(language === 'bn' ? 'স্বয়ংক্রিয় ধ্বংসের টাইমার বাতিল করা হয়েছে' : 'Self-destruct timer disabled');
    } else {
      const durationLabel =
        minutes < 60
          ? `${minutes} ${language === 'bn' ? 'মিনিট' : 'minutes'}`
          : minutes < 1440
          ? `${Math.round(minutes / 60)} ${language === 'bn' ? 'ঘণ্টা' : 'hours'}`
          : `${Math.round(minutes / 1440)} ${language === 'bn' ? 'দিন' : 'days'}`;
      showToast(
        language === 'bn'
          ? `💥 পোস্টটি ${durationLabel} পর স্বয়ংক্রিয়ভাবে মুছে যাবে`
          : `💥 Post will self-destruct in ${durationLabel}`
      );
    }
  };

  // Background Auto-Deletion of Expired Posts
  useEffect(() => {
    const checkExpiredPosts = () => {
      const now = Date.now();
      setPosts((prev) => {
        const expired = prev.filter((p) => p.expiresAt && new Date(p.expiresAt).getTime() <= now);
        if (expired.length === 0) return prev;

        const remaining = prev.filter((p) => !p.expiresAt || new Date(p.expiresAt).getTime() > now);
        saveStateToDB('bandhan_posts', remaining);
        expired.forEach((expPost) => {
          deletePostFromFirestoreCloud(expPost.id).catch(() => {});
        });
        showToast(
          language === 'bn'
            ? '💥 একটি স্বয়ংক্রিয় ধ্বংসশীল পোস্টের নির্ধারিত সময় শেষ হওয়ায় মুছে ফেলা হয়েছে'
            : '💥 A self-destructing post has reached its timer and was removed from the feed'
        );
        return remaining;
      });
    };

    const timer = window.setInterval(checkExpiredPosts, 2500);
    return () => window.clearInterval(timer);
  }, [language, showToast]);

  // Photo Albums State & Management
  const [albums, setAlbums] = useState<PhotoAlbum[]>(() => {
    const defaultAlbums: PhotoAlbum[] = [
      {
        id: 'album_profile_pics',
        userId: currentUser.id,
        title: 'Profile Pictures',
        titleBn: 'প্রোফাইল ছবি',
        description: 'Profile display images',
        coverUrl: currentUser.avatar,
        photos: [currentUser.avatar],
        createdAt: new Date().toISOString(),
        isSystem: true,
      },
      {
        id: 'album_cover_photos',
        userId: currentUser.id,
        title: 'Cover Photos',
        titleBn: 'কভার ছবি',
        description: 'Header and landscape covers',
        coverUrl: currentUser.coverImage || currentUser.avatar,
        photos: [currentUser.coverImage || currentUser.avatar],
        createdAt: new Date().toISOString(),
        isSystem: true,
      },
      {
        id: 'album_timeline',
        userId: currentUser.id,
        title: 'Timeline Uploads',
        titleBn: 'টাইমলাইন ছবি',
        description: 'Photos shared on feed',
        coverUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80',
        photos: [
          'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=80',
        ],
        createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
        isSystem: true,
      },
      {
        id: 'album_memories',
        userId: currentUser.id,
        title: 'Travel & Memories',
        titleBn: 'ভ্রমণ ও স্মৃতি',
        description: 'Beautiful trips across Bangladesh',
        coverUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80',
        photos: [
          'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&auto=format&fit=crop&q=80',
        ],
        createdAt: new Date(Date.now() - 86400000 * 12).toISOString(),
        isSystem: false,
      },
    ];
    return loadSyncFallback<PhotoAlbum[]>('bandhan_photo_albums', defaultAlbums);
  });

  const createAlbum = (albumData: Omit<PhotoAlbum, 'id' | 'createdAt'>): PhotoAlbum => {
    const newAlbum: PhotoAlbum = {
      ...albumData,
      id: `album_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    setAlbums((prev) => {
      const next = [newAlbum, ...prev];
      saveStateToDB('bandhan_photo_albums', next);
      return next;
    });
    showToast(
      language === 'bn'
        ? `"${albumData.titleBn || albumData.title}" অ্যালবাম তৈরি হয়েছে!`
        : `Album "${albumData.title}" created successfully!`
    );
    return newAlbum;
  };

  const deleteAlbum = (albumId: string) => {
    setAlbums((prev) => {
      const next = prev.filter((a) => a.id !== albumId);
      saveStateToDB('bandhan_photo_albums', next);
      return next;
    });
    showToast(language === 'bn' ? 'অ্যালবাম মুছে ফেলা হয়েছে' : 'Album deleted');
  };

  const addPhotoToAlbum = (albumId: string, photoUrl: string) => {
    setAlbums((prev) => {
      const next = prev.map((a) => {
        if (a.id !== albumId) return a;
        const exists = a.photos.includes(photoUrl);
        const updatedPhotos = exists ? a.photos : [photoUrl, ...a.photos];
        return {
          ...a,
          photos: updatedPhotos,
          coverUrl: a.coverUrl || photoUrl,
        };
      });
      saveStateToDB('bandhan_photo_albums', next);
      return next;
    });
    showToast(language === 'bn' ? 'অ্যালবামে ছবি যুক্ত করা হয়েছে' : 'Photo added to album');
  };

  const removePhotoFromAlbum = (albumId: string, photoUrl: string) => {
    setAlbums((prev) => {
      const next = prev.map((a) => {
        if (a.id !== albumId) return a;
        const updatedPhotos = a.photos.filter((p) => p !== photoUrl);
        return {
          ...a,
          photos: updatedPhotos,
          coverUrl: a.coverUrl === photoUrl ? (updatedPhotos[0] || '') : a.coverUrl,
        };
      });
      saveStateToDB('bandhan_photo_albums', next);
      return next;
    });
    showToast(language === 'bn' ? 'ছবিটি অ্যালবাম থেকে সরানো হয়েছে' : 'Photo removed from album');
  };

  const deletePost = (postId: string) => {
    setPosts((prev) => {
      const next = prev.filter((p) => p.id !== postId);
      saveStateToDB('bandhan_posts', next);
      return next;
    });
    deletePostFromFirestoreCloud(postId).catch(() => {});
    showToast(language === 'bn' ? 'পোস্টটি মুছে ফেলা হয়েছে' : 'Post removed');
  };

  const updatePostPrivacy = (postId: string, privacy: 'public' | 'friends' | 'only_me') => {
    setPosts((prev) => {
      const next = prev.map((p) => (p.id === postId ? { ...p, privacy } : p));
      saveStateToDB('bandhan_posts', next);
      return next;
    });
    const labelBn =
      privacy === 'public' ? '🌐 পাবলিক' : privacy === 'friends' ? '👥 বন্ধুদের জন্য' : '🔒 শুধুমাত্র আমি';
    const labelEn =
      privacy === 'public' ? '🌐 Public' : privacy === 'friends' ? '👥 Friends' : '🔒 Only Me';
    showToast(
      language === 'bn'
        ? `পোস্টের প্রাইভেসি "${labelBn}" করা হয়েছে`
        : `Post privacy updated to "${labelEn}"`,
    );
  };

  const togglePinPost = (postId: string) => {
    setPosts((prev) => {
      const next = prev.map((p) => {
        if (p.id === postId) {
          const isPinned = !p.isPinned;
          showToast(
            isPinned
              ? language === 'bn'
                ? '📌 পোস্টটি ফিডের শুরুতে পিন করা হয়েছে'
                : '📌 Post pinned to top'
              : language === 'bn'
              ? 'পিন সরানো হয়েছে'
              : 'Post unpinned',
          );
          return { ...p, isPinned };
        }
        return p;
      });
      saveStateToDB('bandhan_posts', next);
      return next;
    });
  };

  const toggleSavePost = (postId: string) => {
    setPosts((prev) => {
      const next = prev.map((p) => {
        if (p.id === postId) {
          const isSaved = !p.isSaved;
          showToast(
            isSaved
              ? language === 'bn'
                ? 'পোস্টটি সেভ করা হয়েছে'
                : 'Post saved to collection'
              : language === 'bn'
              ? 'সেভ বাতিল করা হয়েছে'
              : 'Post removed from saved',
          );
          return { ...p, isSaved };
        }
        return p;
      });
      saveStateToDB('bandhan_posts', next);
      return next;
    });
  };

  const reactToPost = (postId: string, reaction: ReactionType) => {
    setPosts((prev) => {
      const next = prev.map((post) => {
        if (post.id !== postId) return post;

        const updatedReactions = { ...post.reactions };
        const userReactionsMap = { ...(post.userReactions || {}) };
        const prevUserReaction = userReactionsMap[currentUser.id] || null;

        // If clicking the same reaction, toggle off
        if (prevUserReaction === reaction) {
          updatedReactions[reaction] = Math.max(0, (updatedReactions[reaction] || 1) - 1);
          delete userReactionsMap[currentUser.id];
          return {
            ...post,
            reactions: updatedReactions,
            userReaction: null,
            userReactions: userReactionsMap,
          };
        }

        // Remove old reaction if existed for this user
        if (prevUserReaction) {
          updatedReactions[prevUserReaction] = Math.max(0, (updatedReactions[prevUserReaction] || 1) - 1);
        }

        // Add new reaction for this user
        updatedReactions[reaction] = (updatedReactions[reaction] || 0) + 1;
        userReactionsMap[currentUser.id] = reaction;

        return {
          ...post,
          reactions: updatedReactions,
          userReaction: reaction,
          userReactions: userReactionsMap,
        };
      });
      saveStateToDB('bandhan_posts', next);
      return next;
    });

    addActivityLog({
      type: 'reaction',
      titleEn: `Reacted with "${reaction.toUpperCase()}" to a post`,
      titleBn: `পোস্টে "${reaction}" রিঅ্যাকশন দেওয়া হয়েছে`,
      detailEn: `Post reaction registered for ${currentUser.name}`,
      detailBn: `${currentUser.nameBn || currentUser.name} দ্বারা রিঅ্যাক্ট করা হয়েছে`,
    });

    // Synchronize reaction with Firestore Cloud
    updatePostReactionCloud(postId, reaction).catch((err) => {
      console.warn('Post cloud reaction notice:', err);
    });
  };

  const votePoll = (postId: string, optionId: string) => {
    setPosts((prev) => {
      const next = prev.map((post) => {
        if (post.id !== postId || !post.poll) return post;
        const currentUserId = currentUser.id;

        const updatedOptions = post.poll.options.map((opt) => {
          const isVoted = opt.votes.includes(currentUserId);
          if (opt.id === optionId) {
            // Toggle vote on or off
            const newVotes = isVoted
              ? opt.votes.filter((uid) => uid !== currentUserId)
              : [...opt.votes, currentUserId];
            return { ...opt, votes: newVotes };
          } else {
            // Remove user from other options (single-choice voting)
            return {
              ...opt,
              votes: opt.votes.filter((uid) => uid !== currentUserId),
            };
          }
        });

        return {
          ...post,
          poll: {
            ...post.poll,
            options: updatedOptions,
          },
        };
      });
      saveStateToDB('bandhan_posts', next);
      return next;
    });

    showToast(
      language === 'bn'
        ? '🗳️ আপনার ভোট সফলভাবে গ্রহণ করা হয়েছে!'
        : '🗳️ Your vote has been recorded!',
    );
  };

  const addComment = (postId: string, content: string, parentCommentId?: string) => {
    if (!content.trim()) return;

    const targetPost = posts.find((p) => p.id === postId);

    setPosts((prev) => {
      const next = prev.map((post) => {
        if (post.id !== postId) return post;

        if (parentCommentId) {
          // Reply to nested comment
          const updatedComments = post.comments.map((c) => {
            if (c.id === parentCommentId) {
              const newReply = {
                id: `cr_${Date.now()}`,
                author: currentUser,
                content: content.trim(),
                createdAt: language === 'bn' ? 'এইমাত্র' : 'Just now',
                likesCount: 0,
              };
              return {
                ...c,
                replies: [...(c.replies || []), newReply],
              };
            }
            return c;
          });
          return { ...post, comments: updatedComments };
        }

        // Top level comment
        const newComment = {
          id: `c_${Date.now()}`,
          author: currentUser,
          content: content.trim(),
          createdAt: language === 'bn' ? 'এইমাত্র' : 'Just now',
          likesCount: 0,
          replies: [],
        };
        return {
          ...post,
          comments: [...post.comments, newComment],
        };
      });
      saveStateToDB('bandhan_posts', next);
      return next;
    });

    // Simulate interaction notification for comment
    if (targetPost && targetPost.author.id !== currentUser.id && !blockedUserIds.includes(targetPost.author.id)) {
      setTimeout(() => {
        addNotification({
          type: 'comment',
          sender: targetPost.author,
          textEn: `replied to your comment on "${targetPost.content.slice(0, 20)}..."`,
          textBn: `আপনার মন্তব্যে সাড়া দিয়েছেন: "${targetPost.content.slice(0, 20)}..."`,
          postId: targetPost.id,
        });
      }, 3000);
    }
  };

  const deleteComment = (postId: string, commentId: string, replyId?: string) => {
    setPosts((prev) => {
      const next = prev.map((post) => {
        if (post.id !== postId) return post;
        if (replyId) {
          return {
            ...post,
            comments: post.comments.map((c) =>
              c.id === commentId
                ? { ...c, replies: (c.replies || []).filter((r) => r.id !== replyId) }
                : c,
            ),
          };
        }
        return {
          ...post,
          comments: post.comments.filter((c) => c.id !== commentId),
        };
      });
      saveStateToDB('bandhan_posts', next);
      return next;
    });
    showToast(language === 'bn' ? 'কমেন্ট মুছে ফেলা হয়েছে' : 'Comment deleted');
  };

  const reactToComment = (
    postId: string,
    commentId: string,
    reaction: ReactionType,
    replyId?: string,
  ) => {
    setPosts((prev) => {
      const next = prev.map((post) => {
        if (post.id !== postId) return post;

        const updatedComments = post.comments.map((c) => {
          // If reacting to a nested reply
          if (replyId && c.replies) {
            const updatedReplies = c.replies.map((r) => {
              if (r.id !== replyId) return r;

              const userMap: Record<string, ReactionType> = { ...(r.userReactions || {}) };
              if (r.userReaction && !userMap[currentUser.id] && r.author.id === currentUser.id) {
                userMap[currentUser.id] = r.userReaction;
              }
              const prevUserReaction = userMap[currentUser.id] || null;
              const existingReactions: Partial<Record<ReactionType, number>> = { ...(r.reactions || {}) };

              // If clicking the same reaction, toggle off
              if (prevUserReaction === reaction) {
                existingReactions[reaction] = Math.max(0, (existingReactions[reaction] || 1) - 1);
                delete userMap[currentUser.id];
              } else {
                if (prevUserReaction) {
                  existingReactions[prevUserReaction] = Math.max(0, (existingReactions[prevUserReaction] || 1) - 1);
                }
                existingReactions[reaction] = (existingReactions[reaction] || 0) + 1;
                userMap[currentUser.id] = reaction;
              }

              const totalLikes = Math.max(
                Object.keys(userMap).length,
                Object.values(existingReactions).reduce((sum, count) => (sum || 0) + (count || 0), 0) || 0,
              );

              return {
                ...r,
                userReactions: userMap,
                userReaction: userMap[currentUser.id] || null,
                isLiked: Boolean(userMap[currentUser.id]),
                reactions: existingReactions,
                likesCount: totalLikes,
              };
            });
            return { ...c, replies: updatedReplies };
          }

          // Reacting to the comment itself
          if (c.id === commentId) {
            const userMap: Record<string, ReactionType> = { ...(c.userReactions || {}) };
            if (c.userReaction && !userMap[currentUser.id] && c.author.id === currentUser.id) {
              userMap[currentUser.id] = c.userReaction;
            }
            const prevUserReaction = userMap[currentUser.id] || null;
            const existingReactions: Partial<Record<ReactionType, number>> = { ...(c.reactions || {}) };

            // If clicking the same reaction, toggle off
            if (prevUserReaction === reaction) {
              existingReactions[reaction] = Math.max(0, (existingReactions[reaction] || 1) - 1);
              delete userMap[currentUser.id];
            } else {
              if (prevUserReaction) {
                existingReactions[prevUserReaction] = Math.max(0, (existingReactions[prevUserReaction] || 1) - 1);
              }
              existingReactions[reaction] = (existingReactions[reaction] || 0) + 1;
              userMap[currentUser.id] = reaction;
            }

            const totalLikes = Math.max(
              Object.keys(userMap).length,
              Object.values(existingReactions).reduce((sum, count) => (sum || 0) + (count || 0), 0) || 0,
            );

            return {
              ...c,
              userReactions: userMap,
              userReaction: userMap[currentUser.id] || null,
              isLiked: Boolean(userMap[currentUser.id]),
              reactions: existingReactions,
              likesCount: totalLikes,
            };
          }

          return c;
        });

        return { ...post, comments: updatedComments };
      });
      saveStateToDB('bandhan_posts', next);
      return next;
    });
  };

  const likeComment = (postId: string, commentId: string, replyId?: string) => {
    reactToComment(postId, commentId, 'love', replyId);
  };

  const sharePost = (postId: string) => {
    const postToShare = posts.find((p) => p.id === postId);
    if (!postToShare) return;

    const sharedPost: Post = {
      id: `post_share_${Date.now()}`,
      author: currentUser,
      createdAt: language === 'bn' ? 'এইমাত্র' : 'Just now',
      content: language === 'bn' ? `শেয়ার করা হয়েছে: "${postToShare.author.name}" এর পোস্ট` : `Shared post from ${postToShare.author.name}`,
      image: postToShare.image,
      video: postToShare.video,
      mediaType: postToShare.mediaType,
      privacy: 'public',
      reactions: { like: 1, love: 0, care: 0, haha: 0, wow: 0, sad: 0, angry: 0 },
      userReaction: 'like',
      comments: [],
      sharesCount: 0,
    };

    setPosts((prev) => {
      const updated = prev.map((p) => (p.id === postId ? { ...p, sharesCount: p.sharesCount + 1 } : p));
      const next = [sharedPost, ...updated];
      saveStateToDB('bandhan_posts', next);
      return next;
    });
    showToast(t.shared);
  };

  const sharePostToStory = (postId: string) => {
    const postToShare = posts.find((p) => p.id === postId);
    if (!postToShare) return;

    const newStory: Story = {
      id: `story_share_${Date.now()}`,
      author: currentUser,
      createdAt: language === 'bn' ? 'এইমাত্র' : 'Just now',
      expiresAt: Date.now() + STORY_TTL_MS,
      isViewed: false,
      mediaUrl: postToShare.video || postToShare.image,
      videoUrl: postToShare.video,
      mediaType: postToShare.video ? 'video' : postToShare.image ? 'image' : 'text',
      text: postToShare.content ? `"${postToShare.content.slice(0, 110)}..."` : undefined,
      gradientBg: postToShare.image || postToShare.video ? undefined : 'from-indigo-600 via-purple-600 to-pink-600',
    };

    setStories((prev) => {
      const next = [newStory, ...filterValidStories(prev)];
      saveStateToDB('bandhan_stories', next);
      return next;
    });
    showToast(language === 'bn' ? 'পোস্টটি ২৪ ঘন্টার জন্য আপনার স্টোরিতে শেয়ার করা হয়েছে!' : 'Shared to your Story for 24 hours!');
  };

  // Story actions (24h expiration)
  const addStory = (storyData: Omit<Story, 'id' | 'author' | 'createdAt' | 'isViewed'>) => {
    const newStory: Story = {
      ...storyData,
      id: `story_${Date.now()}`,
      author: currentUser,
      createdAt: language === 'bn' ? 'এইমাত্র' : 'Just now',
      expiresAt: Date.now() + STORY_TTL_MS,
      isViewed: false,
    };
    setStories((prev) => {
      const next = [newStory, ...filterValidStories(prev)];
      saveStateToDB('bandhan_stories', next);
      return next;
    });

    // Automatically add Story's audio to the shared Audio Library
    const trackTitle =
      storyData.audioTitle?.trim() ||
      (storyData.mediaType === 'video'
        ? `${currentUser.name} - Story Original Audio 🎵`
        : `${currentUser.name} - Story Vibe Track ✨`);
    const newAudioTrack: AudioTrack = {
      id: `aud_story_${Date.now()}`,
      title: trackTitle,
      artist: currentUser.name,
      creatorId: currentUser.id,
      creatorName: currentUser.nameBn || currentUser.name,
      creatorAvatar: currentUser.avatar,
      sourceType: 'story',
      audioUrl: storyData.audioUrl,
      videoUrl: storyData.videoUrl,
      createdAt: language === 'bn' ? 'এইমাত্র (স্টোরি থেকে)' : 'Just now (From Story)',
      copyrightLicense: `© ${new Date().getFullYear()} ${currentUser.name} • Bandhan Copyright Protected`,
      usesCount: 1,
    };
    setAudioLibrary((prev) => {
      const next = [newAudioTrack, ...prev];
      saveStateToDB('bandhan_audio_library', next);
      return next;
    });

    setIsCreateStoryOpen(false);
    showToast(
      language === 'bn'
        ? '🎵 আপনার স্টোরি প্রকাশিত হয়েছে এবং অডিওটি অডিও লাইব্রেরিতে যুক্ত হয়েছে!'
        : '🎵 Story published & audio added to Audio Library!',
    );
  };

  const deleteStory = (storyId: string) => {
    setStories((prev) => {
      const next = prev.filter((s) => s.id !== storyId);
      saveStateToDB('bandhan_stories', next);
      return next;
    });
    showToast(language === 'bn' ? 'স্টোরিটি মুছে ফেলা হয়েছে' : 'Story deleted');
  };

  const reactToStory = (storyId: string, emoji: string) => {
    const targetStory = stories.find((s) => s.id === storyId);
    if (!targetStory) return;

    setStories((prev) => {
      const next = prev.map((s) => {
        if (s.id !== storyId) return s;
        const reactions = { ...(s.reactions || {}) };
        reactions[emoji] = (reactions[emoji] || 0) + 1;

        const userReactions = { ...(s.userReactions || {}) };
        userReactions[currentUser.id] = emoji;

        const prevReactionUsers = (s.reactionUsers || []).filter((u) => u.userId !== currentUser.id);
        const newReactionUser: StoryReactionUser = {
          userId: currentUser.id,
          userName: currentUser.nameBn || currentUser.name,
          userAvatar: currentUser.avatar,
          emoji,
          createdAt: language === 'bn' ? 'এইমাত্র' : 'Just now',
        };

        return {
          ...s,
          reactions,
          userReactions,
          reactionUsers: [newReactionUser, ...prevReactionUsers],
        };
      });
      saveStateToDB('bandhan_stories', next);
      return next;
    });

    // Add to notification center so story reactions appear in NotificationCenter
    addNotification({
      type: 'reaction',
      sender: targetStory.author.id === currentUser.id ? sampleUsers.nusrat : targetStory.author,
      textEn:
        targetStory.author.id === currentUser.id
          ? `sent a ${emoji} reaction to your story!`
          : `received your ${emoji} reaction on their story!`,
      textBn:
        targetStory.author.id === currentUser.id
          ? `আপনার স্টোরিতে ${emoji} রিঅ্যাকশন পাঠিয়েছেন!`
          : `তাঁর স্টোরিতে আপনার ${emoji} রিঅ্যাকশন গ্রহণ করেছেন!`,
    });

    if (targetStory.author.id !== currentUser.id) {
      sendMessage(targetStory.author.id, `${emoji} reacted to your story`);
    }

    showToast(
      language === 'bn'
        ? `${emoji} স্টোরি রিঅ্যাকশন পাঠানো হয়েছে!`
        : `Sent ${emoji} reaction to ${targetStory.author.name}'s story!`,
    );
  };

  // Friend Request actions
  const acceptFriendRequest = (reqId: string) => {
    const req = friendRequests.find((r) => r.id === reqId);
    if (!req) return;
    setFriendRequests((prev) => {
      const next = prev.filter((r) => r.id !== reqId);
      saveStateToDB('bandhan_friend_reqs', next);
      return next;
    });
    setContacts((prev) => {
      if (prev.some((c) => c.id === req.user.id)) return prev;
      const next = [req.user, ...prev];
      saveStateToDB('bandhan_contacts', next);
      return next;
    });
    setCurrentUser((prev) => {
      const next = {
        ...prev,
        friendsCount: prev.friendsCount + 1,
      };
      saveStateToDB('bandhan_user', next);
      return next;
    });
    addNotification({
      type: 'friend_request',
      sender: req.user,
      textEn: `is now connected with you as a friend!`,
      textBn: `আপনার ফ্রেন্ড রিকোয়েস্ট গ্রহণ করা হয়েছে এবং এখন আপনার বন্ধু!`,
    });
    showToast(
      language === 'bn'
        ? `${req.user.nameBn || req.user.name} এখন আপনার বন্ধু!`
        : `You and ${req.user.name} are now friends!`,
    );
  };

  const declineFriendRequest = (reqId: string) => {
    setFriendRequests((prev) => {
      const next = prev.filter((r) => r.id !== reqId);
      saveStateToDB('bandhan_friend_reqs', next);
      return next;
    });
    showToast(language === 'bn' ? 'রিকোয়েস্ট মুছে ফেলা হয়েছে' : 'Request removed');
  };

  const sendFriendRequest = (targetUser: User) => {
    if (sentFriendRequestIds.includes(targetUser.id)) return;
    setSentFriendRequestIds((prev) => {
      const next = [...prev, targetUser.id];
      saveStateToDB('bandhan_sent_friend_reqs', next);
      return next;
    });
    showToast(
      language === 'bn'
        ? `${targetUser.nameBn || targetUser.name}-কে ফ্রেন্ড রিকোয়েস্ট পাঠানো হয়েছে!`
        : `Friend request sent to ${targetUser.name}!`,
    );

    // Also simulate the person accepting or acknowledging after a moment so users can chat/call them
    setTimeout(() => {
      setContacts((prev) => {
        if (prev.some((c) => c.id === targetUser.id)) return prev;
        const next = [...prev, targetUser];
        saveStateToDB('bandhan_contacts', next);
        return next;
      });
      addNotification({
        type: 'friend_request',
        sender: targetUser,
        textEn: `accepted your friend request! You can now audio or video call them.`,
        textBn: `আপনার ফ্রেন্ড রিকোয়েস্ট গ্রহণ করেছেন! এখন অডিও বা ভিডিও কলে কথা বলতে পারবেন।`,
      });
    }, 2500);
  };

  const cancelFriendRequest = (userId: string) => {
    setSentFriendRequestIds((prev) => {
      const next = prev.filter((id) => id !== userId);
      saveStateToDB('bandhan_sent_friend_reqs', next);
      return next;
    });
    showToast(language === 'bn' ? 'ফ্রেন্ড রিকোয়েস্ট বাতিল করা হয়েছে' : 'Friend request cancelled');
  };

  // Audio & Video Call Actions
  const startCall = (friend: User, type: 'audio' | 'video') => {
    setActiveCall({ friend, type });
  };

  const endCall = (durationText?: string) => {
    if (activeCall) {
      const callFriend = activeCall.friend;
      const callType = activeCall.type;
      const summary =
        language === 'bn'
          ? `📞 ${callType === 'video' ? 'ভিডিও কল' : 'অডিও কল'} সমাপ্ত হয়েছে ${durationText ? `(${durationText})` : ''}`
          : `📞 ${callType === 'video' ? 'Video call' : 'Audio call'} ended ${durationText ? `(${durationText})` : ''}`;

      setConversations((prev) => {
        const existing = prev[callFriend.id] || {
          friend: callFriend,
          isOnline: true,
          unreadCount: 0,
          messages: [],
        };
        const next = {
          ...prev,
          [callFriend.id]: {
            ...existing,
            messages: [
              ...existing.messages,
              {
                id: `msg_call_${Date.now()}`,
                senderId: currentUser.id,
                text: summary,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              },
            ],
          },
        };
        saveStateToDB('bandhan_conversations', next);
        return next;
      });
    }
    setActiveCall(null);
  };

  // Chat Actions
  const openChatWith = (friend: User) => {
    if (!activeChatIds.includes(friend.id)) {
      const newActive = [...activeChatIds, friend.id].slice(-3);
      setActiveChatIds(newActive);
    }
    if (!conversations[friend.id]) {
      setConversations((prev) => {
        const next = {
          ...prev,
          [friend.id]: {
            friend,
            messages: [
              {
                id: `m_init_${Date.now()}`,
                senderId: friend.id,
                text: language === 'bn' ? `হাই! কেমন আছেন? 😊` : `Hey! How are you doing? 😊`,
                timestamp: 'Just now',
              },
            ],
            unreadCount: 0,
            isOnline: true,
          },
        };
        saveStateToDB('bandhan_conversations', next);
        return next;
      });
    }
  };

  const closeChat = (friendId: string) => {
    setActiveChatIds((prev) => prev.filter((id) => id !== friendId));
  };

  const sendMessage = (
    friendId: string,
    text: string,
    options?: { audioUrl?: string; audioDuration?: number; mediaUrl?: string },
  ) => {
    if (!text.trim() && !options?.audioUrl && !options?.mediaUrl) return;

    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      senderId: currentUser.id,
      text: text.trim(),
      audioUrl: options?.audioUrl,
      audioDuration: options?.audioDuration,
      mediaUrl: options?.mediaUrl,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRead: false,
    };

    const targetFriend = contacts.find((c) => c.id === friendId) || sampleUsers.arafat;

    setConversations((prev) => {
      const conv = prev[friendId] || {
        friend: targetFriend,
        isOnline: true,
        unreadCount: 0,
        messages: [],
      };
      const next = {
        ...prev,
        [friendId]: {
          ...conv,
          messages: [...conv.messages, newMsg],
        },
      };
      saveStateToDB('bandhan_conversations', next);
      return next;
    });

    // Cloud Firestore Sync for real-time chat between accounts
    const chatId = [currentUser.id, friendId].sort().join('_');
    sendChatMessageCloud(chatId, {
      id: newMsg.id,
      senderId: currentUser.id,
      recipientId: friendId,
      text: newMsg.text,
      audioUrl: newMsg.audioUrl,
      audioDuration: newMsg.audioDuration,
      imageUrl: newMsg.mediaUrl,
    }).catch((err) => {
      console.warn('Chat message cloud sync notice:', err);
    });
  };

  // Notifications
  const markNotificationRead = (id: string) => {
    setNotifications((prev) => {
      const next = prev.map((n) => (n.id === id ? { ...n, isRead: true } : n));
      saveStateToDB('bandhan_notifications', next);
      return next;
    });
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => {
      const next = prev.map((n) => ({ ...n, isRead: true }));
      saveStateToDB('bandhan_notifications', next);
      return next;
    });
    showToast(t.markAllAsRead);
  };

  // Marketplace
  const addMarketplaceItem = (itemData: Omit<MarketplaceItem, 'id' | 'seller' | 'createdAt'>) => {
    const newItem: MarketplaceItem = {
      ...itemData,
      id: `mkt_${Date.now()}`,
      seller: currentUser,
      createdAt: language === 'bn' ? 'এইমাত্র' : 'Just now',
    };
    setMarketplace((prev) => {
      const next = [newItem, ...prev];
      saveStateToDB('bandhan_marketplace', next);
      return next;
    });
    showToast(language === 'bn' ? 'আপনার বিজ্ঞাপন সফলভাবে যুক্ত হয়েছে!' : 'Listing published successfully!');
  };

  // Groups
  const enterGroup = (groupId: string) => {
    setSelectedGroupId(groupId);
    setActiveTab('groups');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const addGroup = (groupData: Omit<SocialGroup, 'id' | 'membersCount' | 'isJoined'>): SocialGroup => {
    const newGroup: SocialGroup = {
      ...groupData,
      name: sanitizeUserContent(groupData.name),
      nameBn: groupData.nameBn ? sanitizeUserContent(groupData.nameBn) : sanitizeUserContent(groupData.name),
      description: sanitizeUserContent(groupData.description),
      id: `grp_${Date.now()}`,
      membersCount: 1,
      isJoined: true,
    };
    setGroups((prev) => {
      const next = [newGroup, ...prev];
      saveStateToDB('bandhan_groups', next);
      return next;
    });
    setSelectedGroupId(newGroup.id);
    showToast(
      language === 'bn'
        ? `🎉 নতুন গ্রুপ "${newGroup.nameBn || newGroup.name}" তৈরি হয়েছে!`
        : `🎉 Group "${newGroup.name}" created!`,
    );
    return newGroup;
  };

  const toggleJoinGroup = (groupId: string, autoEnter: boolean = true) => {
    let joinedNow = false;
    let targetGroup: SocialGroup | undefined;

    setGroups((prev) => {
      const next = prev.map((g) => {
        if (g.id === groupId) {
          const isJoined = !g.isJoined;
          joinedNow = isJoined;
          targetGroup = g;
          showToast(
            isJoined
              ? language === 'bn'
                ? `🎉 আপনি "${g.nameBn || g.name}" গ্রুপে যুক্ত হয়েছেন এবং ভেতরে প্রবেশ করেছেন!`
                : `Joined and entered group: ${g.name}`
              : language === 'bn'
              ? 'গ্রুপ ত্যাগ করেছেন'
              : 'Left group',
          );
          return {
            ...g,
            isJoined,
            membersCount: isJoined ? g.membersCount + 1 : Math.max(0, g.membersCount - 1),
          };
        }
        return g;
      });
      saveStateToDB('bandhan_groups', next);
      return next;
    });

    if (joinedNow || autoEnter) {
      setSelectedGroupId(groupId);
      setActiveTab('groups');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Reels
  const toggleLikeReel = (reelId: string) => {
    setReels((prev) => {
      const next = prev.map((r) => {
        if (r.id !== reelId) return r;
        const currentLikedUsers = Array.isArray(r.likedUserIds)
          ? r.likedUserIds
          : r.isLiked
          ? [currentUser.id]
          : [];
        const isCurrentlyLiked = currentLikedUsers.includes(currentUser.id);
        const nextLikedUsers = isCurrentlyLiked
          ? currentLikedUsers.filter((uid) => uid !== currentUser.id)
          : [...currentLikedUsers, currentUser.id];
        const nextCount = isCurrentlyLiked
          ? Math.max(0, r.likesCount - 1)
          : r.likesCount + 1;
        return {
          ...r,
          likedUserIds: nextLikedUsers,
          isLiked: !isCurrentlyLiked,
          likesCount: nextCount,
        };
      });
      saveStateToDB('bandhan_reels', next);
      return next;
    });

    const targetReel = reels.find((r) => r.id === reelId);
    const wasLiked = targetReel && Array.isArray(targetReel.likedUserIds)
      ? targetReel.likedUserIds.includes(currentUser.id)
      : targetReel?.isLiked;
    updateReelReactionCloud(reelId, 'like', !wasLiked).catch((err) => {
      console.warn('Reel cloud reaction warning:', err);
    });
  };

  const incrementReelShares = (reelId: string) => {
    setReels((prev) => {
      const next = prev.map((r) =>
        r.id === reelId ? { ...r, sharesCount: (r.sharesCount || 0) + 1 } : r,
      );
      saveStateToDB('bandhan_reels', next);
      return next;
    });
  };

  const incrementReelViews = (reelId: string) => {
    setReels((prev) => {
      const next = prev.map((r) =>
        r.id === reelId ? { ...r, viewsCount: (r.viewsCount || 0) + 1 } : r,
      );
      saveStateToDB('bandhan_reels', next);
      return next;
    });
  };

  const addReelComment = (reelId: string, content: string) => {
    if (!content.trim()) return;
    const newComment = {
      id: `rc_${Date.now()}`,
      author: currentUser,
      content: content.trim(),
      createdAt: language === 'bn' ? 'এইমাত্র' : 'Just now',
      likesCount: 0,
    };

    setReels((prev) => {
      const next = prev.map((r) => {
        if (r.id !== reelId) return r;
        const existingComments = r.comments || [];
        return {
          ...r,
          commentsCount: (r.commentsCount || existingComments.length) + 1,
          comments: [newComment, ...existingComments],
        };
      });
      saveStateToDB('bandhan_reels', next);
      return next;
    });

    showToast(language === 'bn' ? 'ভিডিওতে আপনার কমেন্ট যুক্ত হয়েছে!' : 'Comment added to video!');
  };

  const addReel = (reelData: Omit<ReelItem, 'id' | 'author' | 'likesCount' | 'commentsCount' | 'sharesCount' | 'isLiked'>) => {
    const newReel: ReelItem = {
      ...reelData,
      id: `reel_${Date.now()}`,
      author: currentUser,
      viewsCount: reelData.viewsCount ?? 1,
      likesCount: 1,
      commentsCount: 0,
      sharesCount: 0,
      isLiked: true,
      createdAt: language === 'bn' ? 'এইমাত্র' : 'Just now',
    };
    setReels((prev) => {
      const next = [newReel, ...prev];
      saveStateToDB('bandhan_reels', next);
      return next;
    });

    saveReelToFirestoreCloud({
      id: newReel.id,
      videoUrl: newReel.videoUrl || '',
      caption: newReel.description || '',
      soundTitle: newReel.songTitle,
    }).catch((err) => {
      console.warn('Reel cloud save warning:', err);
    });

    // Automatically add Reel's audio to the shared Audio Library
    const reelAudioTrack: AudioTrack = {
      id: `aud_reel_${Date.now()}`,
      title: newReel.songTitle || `${currentUser.name} - Original Reel Audio 🎵`,
      artist: currentUser.name,
      creatorId: currentUser.id,
      creatorName: currentUser.nameBn || currentUser.name,
      creatorAvatar: currentUser.avatar,
      sourceType: 'reel',
      videoUrl: newReel.videoUrl,
      createdAt: language === 'bn' ? 'এইমাত্র (রিল থেকে)' : 'Just now (From Reel)',
      copyrightLicense: `© ${new Date().getFullYear()} ${currentUser.name} • Bandhan Copyright Protected`,
      usesCount: 1,
    };
    setAudioLibrary((prev) => {
      const next = [reelAudioTrack, ...prev];
      saveStateToDB('bandhan_audio_library', next);
      return next;
    });

    setIsCreateReelOpen(false);
    showToast(
      language === 'bn'
        ? '🎬 আপনার রিল প্রকাশিত হয়েছে এবং এর অডিওটি অডিও লাইব্রেরিতে যুক্ত হয়েছে!'
        : '🎬 Your Reel is live & its audio has been added to the Audio Library!',
    );
  };

  const createPage = (data: {
    name: string;
    nameBn?: string;
    category: string;
    description: string;
    coverImage?: string;
  }) => {
    const cleanName = sanitizeUserContent(data.name.trim()) || 'New Page';
    const newPage: OfficialPage = {
      id: `page_${Date.now()}`,
      name: cleanName,
      nameBn: data.nameBn ? sanitizeUserContent(data.nameBn.trim()) : cleanName,
      category: sanitizeUserContent(data.category.trim()) || 'Community Page',
      description: sanitizeUserContent(data.description.trim()) || 'Official Bandhan Page',
      avatar: createAvatarUrl(cleanName, '#1877F2', '#ffffff'),
      coverImage:
        data.coverImage ||
        'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1000&auto=format&fit=crop&q=80',
      followersCount: 1,
      isFollowed: true,
      ownerId: currentUser.id,
      isVerified: true,
    };
    setPages((prev) => {
      const next = [newPage, ...prev];
      saveStateToDB('bandhan_pages', next);
      return next;
    });
    showToast(
      language === 'bn'
        ? `🎉 নতুন পেইজ "${newPage.nameBn || newPage.name}" তৈরি হয়েছে!`
        : `🎉 Page "${newPage.name}" created!`,
    );
  };

  const toggleFollowPage = (pageId: string) => {
    setPages((prev) => {
      const next = prev.map((pg) => {
        if (pg.id !== pageId) return pg;
        const nowFollowed = !pg.isFollowed;
        showToast(
          nowFollowed
            ? language === 'bn'
              ? `✨ আপনি "${pg.nameBn || pg.name}" পেইজটি ফলো করছেন!`
              : `✨ Following page "${pg.name}"!`
            : language === 'bn'
            ? `"${pg.nameBn || pg.name}" পেইজ আনফলো করা হয়েছে`
            : `Unfollowed page "${pg.name}"`,
        );
        return {
          ...pg,
          isFollowed: nowFollowed,
          followersCount: nowFollowed
            ? pg.followersCount + 1
            : Math.max(0, pg.followersCount - 1),
        };
      });
      saveStateToDB('bandhan_pages', next);
      return next;
    });
  };

  const sendGroupChatMessage = (groupId: string, text: string) => {
    if (!text.trim()) return;
    const myMsg: GroupChatMessage = {
      id: `gmsg_${Date.now()}`,
      groupId,
      senderId: currentUser.id,
      senderName: currentUser.nameBn || currentUser.name,
      senderAvatar: currentUser.avatar,
      text: sanitizeUserContent(text.trim()),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setGroupChats((prev) => {
      const list = prev[groupId] || [];
      const next = { ...prev, [groupId]: [...list, myMsg] };
      saveStateToDB('bandhan_group_chats', next);
      return next;
    });
  };

  // Filter out blocked users from all platform content and sort pinned posts first
  const visiblePosts = posts
    .filter((p) => !blockedUserIds.includes(p.author.id))
    .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
  const visibleStories = filterValidStories(stories).filter((s) => !blockedUserIds.includes(s.author.id));
  const visibleMarketplace = marketplace.filter((m) => !blockedUserIds.includes(m.seller.id));
  const visibleReels = reels.filter((r) => !blockedUserIds.includes(r.author.id));
  const visibleContacts = contacts.filter((c) => !blockedUserIds.includes(c.id));
  const visibleNotifications = notifications.filter((n) => !blockedUserIds.includes(n.sender.id));
  const visibleFriendRequests = friendRequests.filter((r) => !blockedUserIds.includes(r.user.id));

  return (
    <AppContext.Provider
      value={{
        currentUser,
        updateUser,
        isAuthenticated,
        logout,
        deleteCurrentAccount,
        resetAccountPasswordOrPin,
        loginAccount,
        audioLibrary,
        selectedAudioForCreation,
        setSelectedAudioForCreation,
        pages,
        createPage,
        toggleFollowPage,
        groupChats,
        sendGroupChatMessage,
        activeGroupChatId,
        setActiveGroupChatId,
        isMyStatusOnline,
        toggleMyOnlineStatus,
        deleteComment,
        firebaseUserEmail,
        driveAccessToken,
        signInWithGoogleAccount,
        signInWithEmail,
        registerWithEmail,
        sendPasswordReset,
        workspaceSubTab,
        setWorkspaceSubTab,
        importGoogleContactAsFriend,
        profiles,
        createNewProfile,
        switchProfile,
        setProfilePin,
        isAccountSecurityOpen,
        setIsAccountSecurityOpen,
        followingUserIds,
        toggleFollowUser,
        isFollowingUser,
        posts: visiblePosts,
        addPost,
        deletePost,
        setPostSelfDestructTimer,
        isProfileLocked,
        setIsProfileLocked,
        albums,
        createAlbum,
        deleteAlbum,
        addPhotoToAlbum,
        removePhotoFromAlbum,
        updatePostPrivacy,
        togglePinPost,
        toggleSavePost,
        reactToPost,
        votePoll,
        addComment,
        likeComment,
        reactToComment,
        isFeedLoading,
        refreshFeed,
        sharePost,
        stories: visibleStories,
        addStory,
        deleteStory,
        reactToStory,
        activeStoryIndex,
        setActiveStoryIndex,
        friendRequests: visibleFriendRequests,
        acceptFriendRequest,
        declineFriendRequest,
        sentFriendRequestIds,
        sendFriendRequest,
        cancelFriendRequest,
        contacts: visibleContacts,
        conversations,
        activeChatIds,
        openChatWith,
        closeChat,
        sendMessage,
        activeCall,
        startCall,
        endCall,
        notifications: visibleNotifications,
        markNotificationRead,
        markAllNotificationsRead,
        toggleNotificationRead,
        deleteNotification,
        clearAllNotifications,
        addNotification,
        blockedUserIds,
        blockUser,
        unblockUser,
        isUserBlocked,
        viewingUser,
        viewUserProfile,
        marketplace: visibleMarketplace,
        addMarketplaceItem,
        groups,
        toggleJoinGroup,
        addGroup,
        selectedGroupId,
        setSelectedGroupId,
        enterGroup,
        reels: visibleReels,
        toggleLikeReel,
        addReelComment,
        incrementReelShares,
        incrementReelViews,
        addReel,
        isCreateReelOpen,
        setIsCreateReelOpen,
        sharePostToStory,
        activeTab,
        setActiveTab,
        language,
        setLanguage,
        t,
        isDarkMode,
        toggleDarkMode,
        themeMode,
        setThemeMode,
        activityLog,
        addActivityLog,
        clearActivityLog,
        isCreatePostOpen,
        setIsCreatePostOpen,
        isCreateStoryOpen,
        setIsCreateStoryOpen,
        isAudioLibraryOpen,
        setIsAudioLibraryOpen,
        searchQuery,
        setSearchQuery,
        toast,
        showToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Home,
  Tv,
  Store,
  Users,
  UserCheck,
  Plus,
  MessageCircle,
  Bell,
  Sun,
  Moon,
  Bookmark,
  LogOut,
  ChevronDown,
  X,
  Sparkles,
  Gamepad2,
  UserPlus,
  Flag,
  Settings,
  Users as UsersIcon,
  Clock,
  Cloud,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MainTab } from '../types';
import { NotificationCenter } from './NotificationCenter';
import { CloudinarySettingsModal } from './CloudinarySettingsModal';

export const Navbar: React.FC = () => {
  const {
    currentUser,
    activeTab,
    setActiveTab,
    viewUserProfile,
    language,
    setLanguage,
    t,
    isDarkMode,
    toggleDarkMode,
    setIsCreatePostOpen,
    setIsCreateStoryOpen,
    setIsCreateReelOpen,
    setIsAccountSecurityOpen,
    logout,
    profiles,
    enterGroup,
    notifications,
    markAllNotificationsRead,
    conversations,
    openChatWith,
    contacts,
    posts,
    groups,
    groupChats,
    setActiveGroupChatId,
    isMyStatusOnline,
    toggleMyOnlineStatus,
    marketplace,
    showToast,
  } = useApp();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [isCloudinaryModalOpen, setIsCloudinaryModalOpen] = useState(false);

  // Local storage recent search history system
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('bandhan_navbar_search_history');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      'Tanvir Hasan',
      'Bangladesh Developers',
      'MacBook Pro',
      'Landscape Photography',
    ];
  });

  const saveQueryToHistory = (query: string) => {
    const clean = query.trim();
    if (!clean) return;
    setSearchHistory((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== clean.toLowerCase());
      const next = [clean, ...filtered].slice(0, 8);
      try {
        localStorage.setItem('bandhan_navbar_search_history', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const removeHistoryItem = (queryToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSearchHistory((prev) => {
      const next = prev.filter((item) => item !== queryToRemove);
      try {
        localStorage.setItem('bandhan_navbar_search_history', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const clearAllSearchHistory = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSearchHistory([]);
    try {
      localStorage.removeItem('bandhan_navbar_search_history');
    } catch {}
  };

  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isMessengerOpen, setIsMessengerOpen] = useState(false);
  const [messengerTab, setMessengerTab] = useState<'direct' | 'groups'>('direct');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const createMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const messengerRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
      if (createMenuRef.current && !createMenuRef.current.contains(e.target as Node)) {
        setIsCreateMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
      if (messengerRef.current && !messengerRef.current.contains(e.target as Node)) {
        setIsMessengerOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadNotifs = notifications.filter((n) => !n.isRead).length;
  const unreadMessages = Object.values(conversations).reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  // Filtered search results
  const searchResults = searchInput.trim()
    ? {
        people: contacts.filter(
          (c) =>
            c.name.toLowerCase().includes(searchInput.toLowerCase()) ||
            (c.nameBn && c.nameBn.includes(searchInput)),
        ),
        posts: posts.filter((p) => p.content.toLowerCase().includes(searchInput.toLowerCase())),
        groups: groups.filter((g) => g.name.toLowerCase().includes(searchInput.toLowerCase())),
        marketplace: marketplace.filter((m) => m.title.toLowerCase().includes(searchInput.toLowerCase())),
      }
    : null;

  return (
    <header className="sticky top-0 z-40 h-14 w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="h-full px-2 sm:px-4 flex items-center justify-between gap-1.5 sm:gap-2 max-w-[1920px] mx-auto">
        {/* Zone 1: Brand & Search */}
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 flex-1 md:flex-none" ref={searchRef}>
          <button
            onClick={() => setActiveTab('feed')}
            className="flex items-center gap-2 focus-visible:outline-none group text-left cursor-pointer shrink-0"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-500 flex items-center justify-center text-white font-black text-xl sm:text-2xl shadow-md shadow-blue-500/25 group-hover:scale-105 transition-transform">
              ব
            </div>
            <div className="hidden sm:block">
              <span className="text-xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
                {language === 'bn' ? 'বন্ধন' : 'Bandhan'}
              </span>
            </div>
          </button>

          {/* Search Box with Local Storage History & Results */}
          <div className="relative flex-1 max-w-[190px] sm:max-w-none md:flex-none">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 absolute left-2.5 sm:left-3 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchInput.trim()) {
                    saveQueryToHistory(searchInput);
                  }
                }}
                className="w-full sm:w-60 md:w-68 pl-8 sm:pl-9 pr-7 sm:pr-8 py-1.5 sm:py-2 text-xs sm:text-sm bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-full border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all placeholder:text-slate-400"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput('')}
                  className="absolute right-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Dropdown Container: Search History or Live Search Results */}
            {isSearchOpen && (
              <div className="fixed sm:absolute top-14 sm:top-12 left-2 right-2 sm:left-0 sm:right-auto sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-3 max-h-96 overflow-y-auto z-50 animate-in fade-in zoom-in-95 duration-150">
                {!searchInput.trim() ? (
                  /* ========================================================= */
                  /* RECENT SEARCH HISTORY (LOCAL STORAGE SYSTEM)              */
                  /* ========================================================= */
                  <div>
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-blue-500" />
                        <span>{language === 'bn' ? 'সাম্প্রতিক অনুসন্ধান' : 'Recent Searches'}</span>
                      </span>
                      {searchHistory.length > 0 && (
                        <button
                          type="button"
                          onClick={clearAllSearchHistory}
                          className="text-[11px] font-semibold text-rose-500 hover:text-rose-600 hover:underline cursor-pointer"
                        >
                          {language === 'bn' ? 'সব মুছুন' : 'Clear all'}
                        </button>
                      )}
                    </div>

                    {searchHistory.length > 0 ? (
                      <div className="space-y-1">
                        {searchHistory.map((query, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              setSearchInput(query);
                              saveQueryToHistory(query);
                            }}
                            className="group flex items-center justify-between px-2.5 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/60 transition-colors">
                                <Clock className="w-3.5 h-3.5" />
                              </div>
                              <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                                {query}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => removeHistoryItem(query, e)}
                              className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer opacity-70 group-hover:opacity-100"
                              title={language === 'bn' ? 'মুছে ফেলুন' : 'Remove'}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-4 text-center text-slate-400 text-xs">
                        <Clock className="w-5 h-5 mx-auto mb-1 opacity-40" />
                        <p>{language === 'bn' ? 'কোনো সাম্প্রতিক অনুসন্ধান নেই' : 'No recent searches'}</p>
                      </div>
                    )}

                    {/* Quick Popular Suggestions */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                        {language === 'bn' ? 'প্রস্তাবিত সার্চসমূহ' : 'Suggested Searches'}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          'Tanvir Hasan',
                          'Bangladesh Developers',
                          'Tech Community',
                          'MacBook Pro',
                          'Photography',
                        ].map((sug, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setSearchInput(sug);
                              saveQueryToHistory(sug);
                            }}
                            className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 text-[11px] font-medium text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                          >
                            {sug}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* ========================================================= */
                  /* LIVE FILTERED SEARCH RESULTS                              */
                  /* ========================================================= */
                  <div>
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        {language === 'bn' ? 'অনুসন্ধানের ফলাফল' : 'Search Results'}
                      </div>
                      <button
                        type="button"
                        onClick={() => saveQueryToHistory(searchInput)}
                        className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
                      >
                        {language === 'bn' ? 'সার্চ সেভ করুন' : 'Save query'}
                      </button>
                    </div>

                    {searchResults && (
                      <>
                        {searchResults.people.length > 0 && (
                          <div className="mb-3">
                            <div className="text-xs font-medium text-slate-500 mb-1">
                              {language === 'bn' ? 'ব্যক্তি' : 'People'}
                            </div>
                            {searchResults.people.map((person) => (
                              <button
                                key={person.id}
                                type="button"
                                onClick={() => {
                                  saveQueryToHistory(searchInput);
                                  viewUserProfile(person);
                                  setIsSearchOpen(false);
                                }}
                                className="w-full flex items-center gap-3 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-left cursor-pointer transition-colors"
                              >
                                <img
                                  src={person.avatar}
                                  alt={person.name}
                                  referrerPolicy="no-referrer"
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                                <div className="truncate">
                                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                    {language === 'bn' ? person.nameBn || person.name : person.name}
                                  </p>
                                  <p className="text-xs text-slate-400">{person.city || person.workplace}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}

                        {searchResults.posts.length > 0 && (
                          <div className="mb-3">
                            <div className="text-xs font-medium text-slate-500 mb-1">
                              {language === 'bn' ? 'পোস্ট' : 'Posts'}
                            </div>
                            {searchResults.posts.slice(0, 3).map((post) => (
                              <button
                                key={post.id}
                                type="button"
                                onClick={() => {
                                  saveQueryToHistory(searchInput);
                                  setActiveTab('feed');
                                  setIsSearchOpen(false);
                                }}
                                className="w-full flex items-start gap-2 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-left cursor-pointer transition-colors"
                              >
                                <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2">
                                  "{post.content}"
                                </p>
                              </button>
                            ))}
                          </div>
                        )}

                        {searchResults.groups.length > 0 && (
                          <div>
                            <div className="text-xs font-medium text-slate-500 mb-1">
                              {language === 'bn' ? 'গ্রুপসমূহ' : 'Groups'}
                            </div>
                            {searchResults.groups.map((group) => (
                              <button
                                key={group.id}
                                type="button"
                                onClick={() => {
                                  saveQueryToHistory(searchInput);
                                  setActiveTab('groups');
                                  setIsSearchOpen(false);
                                }}
                                className="w-full flex items-center justify-between p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-left cursor-pointer transition-colors"
                              >
                                <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                                  {language === 'bn' ? group.nameBn || group.name : group.name}
                                </span>
                                <span className="text-xs text-slate-400">
                                  {group.membersCount.toLocaleString()} {t.members}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}

                        {searchResults.people.length === 0 &&
                          searchResults.posts.length === 0 &&
                          searchResults.groups.length === 0 && (
                            <p className="text-sm text-slate-400 text-center py-4">
                              {language === 'bn' ? 'কিছু পাওয়া যায়নি' : 'No results found'}
                            </p>
                          )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Zone 2: Navigation Links (Desktop center tabs — mobile uses ergonomic bottom bar) */}
        <nav className="hidden md:flex items-center justify-center flex-1 max-w-xl h-full px-2">
          <div className="flex items-center justify-around w-full h-full gap-1">
            <button
              onClick={() => setActiveTab('feed')}
              title={t.home}
              className={`relative flex items-center justify-center flex-1 h-12 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'feed'
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Home className="w-6 h-6" />
              {activeTab === 'feed' && (
                <span className="absolute bottom-0 left-2 right-2 h-1 bg-blue-600 rounded-full" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('watch')}
              title={t.watch}
              className={`relative flex items-center justify-center flex-1 h-12 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'watch'
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Tv className="w-6 h-6" />
              {activeTab === 'watch' && (
                <span className="absolute bottom-0 left-2 right-2 h-1 bg-blue-600 rounded-full" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('marketplace')}
              title={t.marketplace}
              className={`relative flex items-center justify-center flex-1 h-12 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'marketplace'
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Store className="w-6 h-6" />
              {activeTab === 'marketplace' && (
                <span className="absolute bottom-0 left-2 right-2 h-1 bg-blue-600 rounded-full" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('groups')}
              title={t.groups}
              className={`relative flex items-center justify-center flex-1 h-12 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'groups'
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Users className="w-6 h-6" />
              {activeTab === 'groups' && (
                <span className="absolute bottom-0 left-2 right-2 h-1 bg-blue-600 rounded-full" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('gaming')}
              title={language === 'bn' ? 'গেম জোন ও টুর্নামেন্ট' : 'Gaming & Playroom'}
              className={`relative flex items-center justify-center flex-1 h-12 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'gaming'
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Gamepad2 className="w-6 h-6" />
              {activeTab === 'gaming' && (
                <span className="absolute bottom-0 left-2 right-2 h-1 bg-blue-600 rounded-full" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('pages')}
              title={language === 'bn' ? 'অফিসিয়াল পেইজ' : 'Official Pages'}
              className={`relative flex items-center justify-center flex-1 h-12 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'pages'
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Flag className="w-6 h-6" />
              {activeTab === 'pages' && (
                <span className="absolute bottom-0 left-2 right-2 h-1 bg-blue-600 rounded-full" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('friends')}
              title={t.friends}
              className={`relative flex items-center justify-center flex-1 h-12 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'friends'
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <UserCheck className="w-6 h-6" />
              {activeTab === 'friends' && (
                <span className="absolute bottom-0 left-2 right-2 h-1 bg-blue-600 rounded-full" />
              )}
            </button>
          </div>
        </nav>

        {/* Zone 3: Actions & Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Create (+) menu */}
          <div className="relative" ref={createMenuRef}>
            <button
              onClick={() => setIsCreateMenuOpen(!isCreateMenuOpen)}
              className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              title={t.create}
            >
              <Plus className="w-5 h-5" />
            </button>

            {isCreateMenuOpen && (
              <div className="absolute right-0 top-11 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 py-2 z-50">
                <button
                  onClick={() => {
                    setIsCreatePostOpen(true);
                    setIsCreateMenuOpen(false);
                  }}
                  className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-slate-800 text-left text-sm font-medium text-slate-800 dark:text-slate-200"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 flex items-center justify-center">
                    ✏️
                  </div>
                  <span>{t.createPost}</span>
                </button>
                <button
                  onClick={() => {
                    setIsCreateStoryOpen(true);
                    setIsCreateMenuOpen(false);
                  }}
                  className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-slate-800 text-left text-sm font-medium text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-600 flex items-center justify-center">
                    📖
                  </div>
                  <span>{t.createStory}</span>
                </button>
                <button
                  onClick={() => {
                    setIsCreateReelOpen(true);
                    setIsCreateMenuOpen(false);
                  }}
                  className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-slate-800 text-left text-sm font-medium text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/50 text-rose-600 flex items-center justify-center">
                    🎬
                  </div>
                  <span>{t.createReel || (language === 'bn' ? 'রিল তৈরি করুন' : 'Create Reel')}</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('marketplace');
                    setIsCreateMenuOpen(false);
                  }}
                  className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-slate-800 text-left text-sm font-medium text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 flex items-center justify-center">
                    🛍️
                  </div>
                  <span>{t.sellItem}</span>
                </button>
              </div>
            )}
          </div>

          {/* Messenger button */}
          <div className="relative" ref={messengerRef}>
            <button
              onClick={() => setIsMessengerOpen(!isMessengerOpen)}
              className="relative w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              title={t.messenger}
            >
              <MessageCircle className="w-5 h-5" />
              {unreadMessages > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1">
                  {unreadMessages}
                </span>
              )}
            </button>

            {/* Messenger Quick Dropdown - Responsive size + Direct & Group Chats + Online Toggle */}
            {isMessengerOpen && (
              <div className="fixed sm:absolute right-2 sm:right-0 top-14 sm:top-11 w-[calc(100vw-1rem)] max-w-[350px] sm:w-84 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-3 z-50">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                    {t.messenger}
                  </h3>
                  <button
                    type="button"
                    onClick={toggleMyOnlineStatus}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-colors ${
                      isMyStatusOnline
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isMyStatusOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                      }`}
                    />
                    <span>
                      {isMyStatusOnline
                        ? language === 'bn'
                          ? 'অনলাইন সক্রিয়'
                          : 'Active Online'
                        : language === 'bn'
                        ? 'অফলাইন'
                        : 'Offline'}
                    </span>
                  </button>
                </div>

                {/* Direct vs Group Chats Toggle */}
                <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl my-2">
                  <button
                    type="button"
                    onClick={() => setMessengerTab('direct')}
                    className={`py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                      messengerTab === 'direct'
                        ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    💬 {language === 'bn' ? 'ইনবক্স চ্যাট' : 'Direct Chats'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMessengerTab('groups')}
                    className={`py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                      messengerTab === 'groups'
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    👥 {language === 'bn' ? 'গ্রুপ চ্যাট' : 'Group Chats'}
                  </button>
                </div>

                <div className="space-y-1 max-h-72 overflow-y-auto">
                  {messengerTab === 'direct' ? (
                    contacts.map((contact) => {
                      const conv = conversations[contact.id];
                      const lastMsg = conv?.messages[conv.messages.length - 1];
                      const isOnline = contact.isOnline !== false;
                      return (
                        <button
                          key={contact.id}
                          onClick={() => {
                            openChatWith(contact);
                            setIsMessengerOpen(false);
                          }}
                          className="w-full flex items-center gap-3 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-left transition-colors cursor-pointer"
                        >
                          <div className="relative shrink-0">
                            <img
                              src={contact.avatar}
                              alt={contact.name}
                              referrerPolicy="no-referrer"
                              className="w-10 h-10 rounded-full object-cover"
                            />
                            <span
                              className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white dark:border-slate-900 rounded-full ${
                                isOnline ? 'bg-emerald-500' : 'bg-slate-400'
                              }`}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                                {language === 'bn' ? contact.nameBn || contact.name : contact.name}
                              </p>
                              <span
                                className={`text-[10px] font-bold ${
                                  isOnline ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                                }`}
                              >
                                {isOnline
                                  ? language === 'bn'
                                    ? 'অনলাইন'
                                    : 'Online'
                                  : language === 'bn'
                                  ? 'অফলাইন'
                                  : 'Offline'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              {lastMsg ? lastMsg.text : t.activeNow}
                            </p>
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    groups.map((grp) => {
                      const grpMsgs = groupChats[grp.id] || [];
                      const lastGrpMsg = grpMsgs[grpMsgs.length - 1];
                      return (
                        <button
                          key={grp.id}
                          type="button"
                          onClick={() => {
                            setActiveGroupChatId(grp.id);
                            setIsMessengerOpen(false);
                          }}
                          className="w-full flex items-center gap-3 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-left transition-colors cursor-pointer"
                        >
                          <div className="relative shrink-0">
                            <img
                              src={grp.coverImage}
                              alt={grp.name}
                              referrerPolicy="no-referrer"
                              className="w-10 h-10 rounded-xl object-cover"
                            />
                            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                                {language === 'bn' ? grp.nameBn || grp.name : grp.name}
                              </p>
                              <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                                👥 {grp.membersCount}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              {lastGrpMsg
                                ? `${lastGrpMsg.senderName.split(' ')[0]}: ${lastGrpMsg.text}`
                                : grp.description}
                            </p>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Notifications button */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="relative w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              title={t.notifications}
            >
              <Bell className="w-5 h-5" />
              {unreadNotifs > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1 animate-pulse">
                  {unreadNotifs}
                </span>
              )}
            </button>

            {/* Notification Center Dropdown */}
            <NotificationCenter isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
          </div>

          {/* Floating Language Switcher Component (Desktop/Tablet inline; Mobile inside profile menu) */}
          <div
            className="hidden sm:inline-flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200/90 dark:border-slate-700 shadow-xs"
            role="group"
            aria-label="Language selector"
          >
            <button
              type="button"
              onClick={() => setLanguage('bn')}
              title="বাংলা ভাষা নির্বাচন করুন (Bangla)"
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
                language === 'bn'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span className="text-[12px] leading-none">🇧🇩</span>
              <span>বাং</span>
            </button>
            <button
              type="button"
              onClick={() => setLanguage('en')}
              title="Switch to English"
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
                language === 'en'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span className="text-[12px] leading-none">🇺🇸</span>
              <span>EN</span>
            </button>
          </div>

          {/* Dark / Light Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            title={isDarkMode ? t.lightMode : t.darkMode}
            className="hidden sm:flex w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 items-center justify-center text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Clean Settings Button */}
          <button
            onClick={() => setIsAccountSecurityOpen(true)}
            title={
              language === 'bn'
                ? 'সেটিংস, প্রাইভেসি ও একাউন্ট'
                : 'Settings, Privacy & Account'
            }
            className="hidden sm:flex w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 items-center justify-center text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* User Profile Avatar / Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-1 cursor-pointer p-0.5 rounded-full hover:ring-2 hover:ring-blue-500 transition-all relative"
            >
              <img
                src={currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                alt={currentUser?.name || 'User'}
                referrerPolicy="no-referrer"
                className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700"
              />
              <span
                className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-900 ${
                  isMyStatusOnline ? 'bg-emerald-500' : 'bg-slate-400'
                }`}
              />
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 top-11 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2 z-50">
                <button
                  onClick={() => {
                    viewUserProfile(null);
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-left cursor-pointer"
                >
                  <img
                    src={currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                    alt={currentUser?.name || 'User'}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="truncate">
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {language === 'bn' ? currentUser?.nameBn || currentUser?.name || 'ব্যবহারকারী' : currentUser?.name || 'User'}
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                      {language === 'bn' ? 'প্রোফাইল ও সেভড পোস্ট দেখুন' : 'See profile & saved posts'}
                    </p>
                  </div>
                </button>

                <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

                <button
                  onClick={() => {
                    setActiveTab('saved');
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-left cursor-pointer"
                >
                  <Bookmark className="w-4 h-4 text-purple-500" />
                  <span>{language === 'bn' ? 'সংরক্ষিত পোস্ট (Saved Posts)' : t.saved}</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('pages');
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-left cursor-pointer"
                >
                  <Flag className="w-4 h-4 text-indigo-600" />
                  <span>{language === 'bn' ? 'অফিসিয়াল পেইজসমূহ (Pages)' : 'Official Pages'}</span>
                </button>

                {/* Cloudinary Free Media Storage Option */}
                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    setIsCloudinaryModalOpen(true);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Cloud className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>
                      {language === 'bn'
                        ? 'ক্লাউডিনারি মিডিয়া স্টোরেজ'
                        : 'Cloudinary Media Storage'}
                    </span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                    Free Tier
                  </span>
                </button>

                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    setIsAccountSecurityOpen(true);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <UserPlus className="w-4 h-4 text-blue-600" />
                    <span>
                      {language === 'bn'
                        ? 'একাউন্ট সুইচ করুন'
                        : 'Switch Account'}
                    </span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
                    {profiles.length}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    setIsAccountSecurityOpen(true);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-left cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-emerald-600" />
                  <span>
                    {language === 'bn'
                      ? 'সেটিংস, কপিরাইট ও একাউন্ট ডিলিট'
                      : 'Settings, Copyright & Account Delete'}
                  </span>
                </button>

                <div className="sm:hidden px-3 py-2 flex items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800 mt-1 pt-2">
                  <div className="inline-flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setLanguage('bn')}
                      className={`px-2 py-1 rounded-full text-[11px] font-bold cursor-pointer ${
                        language === 'bn' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      🇧🇩 বাং
                    </button>
                    <button
                      type="button"
                      onClick={() => setLanguage('en')}
                      className={`px-2 py-1 rounded-full text-[11px] font-bold cursor-pointer ${
                        language === 'en' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      🇺🇸 EN
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={toggleDarkMode}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
                  >
                    {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
                    <span>{isDarkMode ? t.lightMode : t.darkMode}</span>
                  </button>
                </div>

                <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg text-left cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>
                    {language === 'bn'
                      ? 'লগআউট (Log Out)'
                      : 'Log Out'}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cloudinary Free Media Storage Configuration Modal */}
      <CloudinarySettingsModal
        isOpen={isCloudinaryModalOpen}
        onClose={() => setIsCloudinaryModalOpen(false)}
      />
    </header>
  );
};

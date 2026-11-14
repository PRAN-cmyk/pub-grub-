/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { LeftSidebar } from './components/LeftSidebar';
import { RightSidebar } from './components/RightSidebar';
import { StoriesSection } from './components/StoriesSection';
import { CreatePostBox } from './components/CreatePostBox';
import { PostCard } from './components/PostCard';
import { FeedSkeleton } from './components/PostSkeleton';
import { StoryViewerModal } from './components/StoryViewerModal';
import { CreateStoryModal } from './components/CreateStoryModal';
import { CreateReelModal } from './components/CreateReelModal';
import { AudioLibraryModal } from './components/AudioLibraryModal';
import { MessengerDock } from './components/MessengerDock';
import { ReelsView } from './components/ReelsView';
import { MarketplaceView } from './components/MarketplaceView';
import { GroupsView } from './components/GroupsView';
import { FriendsView } from './components/FriendsView';
import { ProfileView } from './components/ProfileView';
import { GamingView } from './components/GamingView';
import { GoogleDriveView } from './components/GoogleDriveView';
import { GmailView } from './components/GmailView';
import { GoogleClassroomView } from './components/GoogleClassroomView';
import { GoogleKeepView } from './components/GoogleKeepView';
import { WelcomeModal } from './components/WelcomeModal';
import { CallModal } from './components/CallModal';
import { AccountSecurityModal } from './components/AccountSecurityModal';
import { AuthScreen } from './components/AuthScreen';
import { AdBannerSlot } from './components/AdBannerSlot';
import { createAvatarUrl } from './data/mockData';
import { Post } from './types';
import {
  Home,
  Tv,
  Store,
  Users,
  UserCheck,
  UserPlus,
  Bookmark,
  RefreshCw,
  Gamepad2,
  LayoutGrid,
  Image as ImageIcon,
  Film,
  FileText,
  Check,
  X,
} from 'lucide-react';

type FeedCategoryFilter = 'all' | 'photos' | 'videos' | 'text';

const FEED_SUGGESTED_USERS = [
  {
    id: 'sug_feed_1',
    name: 'Tahmid Hasan',
    nameBn: 'তাহমিদ হাসান',
    username: 'tahmid.hasan',
    avatar: createAvatarUrl('Tahmid Hasan', '#2563eb', '#ffffff'),
    bio: 'Full Stack Engineer',
    city: 'Dhaka, Bangladesh',
    followersCount: 920,
    friendsCount: 410,
  },
  {
    id: 'sug_feed_2',
    name: 'Samira Khan',
    nameBn: 'সামিরা খান',
    username: 'samira.khan',
    avatar: createAvatarUrl('Samira Khan', '#db2777', '#ffffff'),
    bio: 'Visual Storyteller & Vlogger',
    city: 'Sylhet, Bangladesh',
    followersCount: 1540,
    friendsCount: 520,
  },
  {
    id: 'sug_feed_3',
    name: 'Imran Mahmud',
    nameBn: 'ইমরান মাহমুদ',
    username: 'imran.mahmud',
    avatar: createAvatarUrl('Imran Mahmud', '#059669', '#ffffff'),
    bio: 'Tech Entrepreneur',
    city: 'Chattogram, Bangladesh',
    followersCount: 680,
    friendsCount: 310,
  },
  {
    id: 'sug_feed_4',
    name: 'Nadia Islam',
    nameBn: 'নাদিয়া ইসলাম',
    username: 'nadia.islam',
    avatar: createAvatarUrl('Nadia Islam', '#7c3aed', '#ffffff'),
    bio: 'Product Designer',
    city: 'Dhaka, Bangladesh',
    followersCount: 1120,
    friendsCount: 450,
  },
];

function isPostVideo(p: Post): boolean {
  return Boolean(
    p.video || p.mediaType === 'video' || (p.image && p.image.startsWith('data:video')),
  );
}

function isPostPhoto(p: Post): boolean {
  return !isPostVideo(p) && Boolean(p.image || p.mediaType === 'image');
}

function isPostTextOnly(p: Post): boolean {
  return !isPostVideo(p) && !isPostPhoto(p);
}

const MainContent: React.FC = () => {
  const {
    currentUser,
    isAuthenticated,
    activeTab,
    setActiveTab,
    posts,
    isFeedLoading,
    refreshFeed,
    sentFriendRequestIds,
    sendFriendRequest,
    cancelFriendRequest,
    isFollowingUser,
    toggleFollowUser,
    viewUserProfile,
    isAudioLibraryOpen,
    setIsAudioLibraryOpen,
    language,
    t,
    toast,
  } = useApp();

  const [feedCategory, setFeedCategory] = useState<FeedCategoryFilter>('all');
  const [showWelcomeModal, setShowWelcomeModal] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('bandhan_welcome_shown') !== 'true';
    } catch {
      return false;
    }
  });
  const [showWelcomeBanner, setShowWelcomeBanner] = useState<boolean>(() => {
    try {
      return localStorage.getItem('bandhan_welcome_banner_dismissed') !== 'true';
    } catch {
      return true;
    }
  });

  // Filter out 'only_me' posts and future scheduled posts belonging to other accounts
  const visibleFeedPosts = useMemo(
    () =>
      posts.filter((p) => {
        if (!p || !p.author) return false;
        if (currentUser?.id && p.author.id === currentUser.id) return true;
        if (p.privacy === 'only_me') return false;
        if (p.scheduledFor && new Date(p.scheduledFor).getTime() > Date.now()) {
          return false;
        }
        return true;
      }),
    [posts, currentUser?.id],
  );

  const categoryCounts = useMemo(
    () => ({
      all: visibleFeedPosts.length,
      photos: visibleFeedPosts.filter(isPostPhoto).length,
      videos: visibleFeedPosts.filter(isPostVideo).length,
      text: visibleFeedPosts.filter(isPostTextOnly).length,
    }),
    [visibleFeedPosts],
  );

  const filteredPosts = useMemo(() => {
    if (feedCategory === 'photos') return visibleFeedPosts.filter(isPostPhoto);
    if (feedCategory === 'videos') return visibleFeedPosts.filter(isPostVideo);
    if (feedCategory === 'text') return visibleFeedPosts.filter(isPostTextOnly);
    return visibleFeedPosts;
  }, [visibleFeedPosts, feedCategory]);

  const savedPosts = visibleFeedPosts.filter((p) => p.isSaved);

  // If logged out, show Facebook-style Login & Registration screen
  if (!isAuthenticated) {
    return (
      <>
        <AuthScreen />
        {toast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-slate-900/90 dark:bg-white/95 text-white dark:text-slate-900 text-xs font-semibold rounded-full shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-200">
            {toast}
          </div>
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen w-full overflow-x-clip bg-[#f0f2f5] dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Bar Contract (3 zones, single wordmark, responsive search, controls) */}
      <Navbar />

      {/* Single Top Floating Ad (Isolated in sandboxed 320x50 iframe, zero impact on layout/clicks) */}
      <AdBannerSlot />

      {/* Main Responsive Grid Layout - expansive full viewport layout without half-screen empty gutters */}
      <div className="w-full mx-auto flex justify-center gap-3 md:gap-5 px-2 sm:px-3 md:px-4 lg:px-6">
        {/* Left Sidebar (Desktop) */}
        <LeftSidebar />

        {/* Center Main Stage Content - takes full natural width on all screen sizes */}
        <main
          className={`flex-1 min-w-0 ${
            activeTab === 'gaming'
              ? 'max-w-7xl'
              : activeTab === 'watch'
              ? 'max-w-4xl 2xl:max-w-5xl'
              : activeTab === 'profile' ||
                activeTab === 'drive' ||
                activeTab === 'gmail' ||
                activeTab === 'pages' ||
                activeTab === 'groups'
              ? 'max-w-6xl 2xl:max-w-7xl'
              : 'max-w-4xl 2xl:max-w-5xl'
          } w-full py-3 pb-20 md:pb-6 transition-all duration-200`}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12, scale: 0.995 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.995 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Feed View */}
              {activeTab === 'feed' && (
                <div>
                  {/* Stories Bar */}
                  <StoriesSection />

                  {/* Live Broadcasts Active Banner (সবাই লাইভ দেখতে পারবে) */}
                  {posts.some((p) => p.isLive) && (
                    <div className="bg-gradient-to-r from-red-600 via-rose-600 to-slate-900 rounded-2xl p-3.5 mb-4 text-white shadow-md flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="px-2.5 py-1 rounded-full bg-white text-red-600 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shrink-0 animate-pulse">
                          ● LIVE
                        </span>
                        <div className="truncate">
                          <p className="text-xs sm:text-sm font-extrabold truncate">
                            {language === 'bn'
                              ? `🔴 ${posts.filter((p) => p.isLive).length}টি লাইভ সম্প্রচার চলছে — সবাই সরাসরি দেখতে ও কমেন্ট করতে পারছেন`
                              : `🔴 ${posts.filter((p) => p.isLive).length} Live Broadcast(s) Active — Open to Everyone`}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFeedCategory('all')}
                        className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold shrink-0 cursor-pointer"
                      >
                        {language === 'bn' ? 'লাইভ দেখুন' : 'Watch Live'}
                      </button>
                    </div>
                  )}

                  {/* WELCOME friend Hero Logo Banner (কেউ প্রথম ওয়েবসাইটে ঢুকলে দেখানোর জন্য) */}
                  {showWelcomeBanner && (
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-4 sm:p-5 text-white shadow-xl shadow-blue-500/20 mb-4 border border-white/20 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="absolute -right-8 -bottom-8 w-44 h-44 rounded-full bg-white/10 blur-2xl pointer-events-none" />
                      <div className="absolute right-1/3 -top-10 w-36 h-36 rounded-full bg-pink-500/20 blur-xl pointer-events-none" />

                      <div className="relative flex items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3.5 min-w-0">
                          {/* Logo Icon with greeting handshake */}
                          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl sm:text-3xl shadow-inner border border-white/30 shrink-0">
                            🤝
                          </div>
                          <div>
                            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-black uppercase tracking-wider backdrop-blur-sm mb-1">
                              <span>✨</span>
                              <span>WELCOME friend</span>
                            </div>
                            <h2 className="text-lg sm:text-xl font-black tracking-tight leading-snug">
                              {language === 'bn'
                                ? 'স্বাগতম প্রিয় বন্ধু — বন্ধন সোশ্যাল প্ল্যাটফর্মে!'
                                : 'WELCOME friend — Welcome to Bandhan Social!'}
                            </h2>
                            <p className="text-xs sm:text-sm text-blue-100 mt-0.5 max-w-xl">
                              {language === 'bn'
                                ? 'বন্ধুদের সাথে যুক্ত থাকুন, স্ট্যাটাস ও ছবি শেয়ার করুন, রিল দেখুন এবং দারুণ সব গেম খেলুন।'
                                : 'Connect with friends, share stories, react with animated emojis, enjoy reels, and play games together.'}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setShowWelcomeBanner(false);
                            try {
                              localStorage.setItem('bandhan_welcome_banner_dismissed', 'true');
                            } catch {}
                          }}
                          className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer shrink-0"
                          title={language === 'bn' ? 'বন্ধ করুন' : 'Dismiss'}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Status Composer Box */}
                  <CreatePostBox />

                  {/* Newsfeed Category Filter Bar ('All', 'Photos', 'Videos', 'Text-only') */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-2 mb-4 shadow-xs flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
                    <div className="flex items-center gap-1.5">
                      {(
                        [
                          {
                            id: 'all',
                            icon: LayoutGrid,
                            labelEn: 'All',
                            labelBn: 'সব পোস্ট',
                            count: categoryCounts.all,
                          },
                          {
                            id: 'photos',
                            icon: ImageIcon,
                            labelEn: 'Photos',
                            labelBn: 'ছবি',
                            count: categoryCounts.photos,
                          },
                          {
                            id: 'videos',
                            icon: Film,
                            labelEn: 'Videos',
                            labelBn: 'ভিডিও',
                            count: categoryCounts.videos,
                          },
                          {
                            id: 'text',
                            icon: FileText,
                            labelEn: 'Text-only',
                            labelBn: 'শুধু লেখা',
                            count: categoryCounts.text,
                          },
                        ] as const
                      ).map((tab) => {
                        const IconComp = tab.icon;
                        const isActive = feedCategory === tab.id;
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setFeedCategory(tab.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                              isActive
                                ? 'bg-[#1877F2] text-white shadow-xs'
                                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            <IconComp className="w-3.5 h-3.5" />
                            <span>{language === 'bn' ? tab.labelBn : tab.labelEn}</span>
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                                isActive
                                  ? 'bg-white/20 text-white'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                              }`}
                            >
                              {tab.count}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={refreshFeed}
                      disabled={isFeedLoading}
                      className="flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors px-2 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
                      title={t.refreshFeed}
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${isFeedLoading ? 'animate-spin text-blue-600' : ''}`}
                      />
                      <span className="hidden sm:inline">
                        {isFeedLoading ? t.loadingFeed : t.refreshFeed}
                      </span>
                    </button>
                  </div>

                  {/* Posts Stream or Skeleton Screen Loaders */}
                  {isFeedLoading ? (
                    <FeedSkeleton />
                  ) : filteredPosts.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 text-center shadow-xs mb-4">
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                        {language === 'bn'
                          ? 'এই ক্যাটাগরিতে কোনো পোস্ট পাওয়া যায়নি'
                          : 'No posts found in this category'}
                      </p>
                      <button
                        type="button"
                        onClick={() => setFeedCategory('all')}
                        className="mt-3 px-4 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold cursor-pointer"
                      >
                        {language === 'bn' ? 'সব পোস্ট দেখুন' : 'Show All Posts'}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      {filteredPosts.slice(0, 1).map((post) => (
                        <PostCard key={post.id} post={post} />
                      ))}

                      {/* Facebook-style "People You May Know" Carousel inside Feed */}
                      {feedCategory === 'all' && (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                              <UserPlus className="w-4 h-4 text-blue-600" />
                              <span>
                                {language === 'bn'
                                  ? 'যাদের আপনি চিনতে পারেন ও ফলো করতে পারেন'
                                  : 'People You May Know & Follow'}
                              </span>
                            </h3>
                            <button
                              type="button"
                              onClick={() => setActiveTab('friends')}
                              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                            >
                              {language === 'bn' ? 'সব দেখুন' : 'See All'}
                            </button>
                          </div>
                          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1">
                            {FEED_SUGGESTED_USERS.map((person) => {
                              const isSent = sentFriendRequestIds.includes(person.id);
                              const following = isFollowingUser(person.id);
                              return (
                                <div
                                  key={person.id}
                                  className="shrink-0 w-44 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50/60 dark:bg-slate-800/50 flex flex-col"
                                >
                                  <img
                                    src={person.avatar}
                                    alt={person.name}
                                    referrerPolicy="no-referrer"
                                    onClick={() => viewUserProfile(person)}
                                    className="w-full h-32 object-cover cursor-pointer hover:opacity-95 transition-opacity"
                                  />
                                  <div className="p-2.5 flex-1 flex flex-col justify-between">
                                    <div>
                                      <p
                                        onClick={() => viewUserProfile(person)}
                                        className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate cursor-pointer hover:underline"
                                      >
                                        {language === 'bn' ? person.nameBn : person.name}
                                      </p>
                                      <p className="text-[10px] text-slate-400 truncate mt-0.5">
                                        {person.city}
                                      </p>
                                    </div>
                                    <div className="mt-2.5 space-y-1.5">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          isSent
                                            ? cancelFriendRequest(person.id)
                                            : sendFriendRequest(person)
                                        }
                                        className={`w-full py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                                          isSent
                                            ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                                            : 'bg-blue-600 text-white hover:bg-blue-700'
                                        }`}
                                      >
                                        {isSent ? (
                                          <>
                                            <UserCheck className="w-3.5 h-3.5" />
                                            <span>
                                              {language === 'bn' ? 'পাঠানো হয়েছে' : 'Requested'}
                                            </span>
                                          </>
                                        ) : (
                                          <>
                                            <UserPlus className="w-3.5 h-3.5" />
                                            <span>
                                              {language === 'bn' ? 'অ্যাড ফ্রেন্ড' : 'Add Friend'}
                                            </span>
                                          </>
                                        )}
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => toggleFollowUser(person.id)}
                                        className={`w-full py-1 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                                          following
                                            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                                            : 'bg-slate-200/70 dark:bg-slate-700/70 text-slate-700 dark:text-slate-200 hover:bg-slate-200'
                                        }`}
                                      >
                                        {following ? (
                                          <>
                                            <Check className="w-3 h-3" />
                                            <span>
                                              {language === 'bn' ? 'ফলো করছেন' : 'Following'}
                                            </span>
                                          </>
                                        ) : (
                                          <span>
                                            {language === 'bn' ? '+ ফলো করুন' : '+ Follow'}
                                          </span>
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {filteredPosts.slice(1).map((post) => (
                        <PostCard key={post.id} post={post} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Watch / Reels Tab */}
              {activeTab === 'watch' && <ReelsView />}

              {/* Gaming & Playroom Tab */}
              {activeTab === 'gaming' && <GamingView />}

              {/* Marketplace Tab */}
              {activeTab === 'marketplace' && <MarketplaceView />}

              {/* Groups & Official Pages Tab */}
              {(activeTab === 'groups' || activeTab === 'pages') && <GroupsView />}

              {/* Google Drive & Firebase Cloud Tab */}
              {activeTab === 'drive' && <GoogleDriveView />}

              {/* Gmail Inbox & Compose Tab */}
              {activeTab === 'gmail' && <GmailView />}

              {/* Google Classroom Tab */}
              {activeTab === 'classroom' && <GoogleClassroomView />}

              {/* Google Keep & Tasks Tab */}
              {activeTab === 'keep' && <GoogleKeepView />}

              {/* Friends Tab */}
              {activeTab === 'friends' && <FriendsView />}

              {/* Profile Tab */}
              {activeTab === 'profile' && <ProfileView />}

              {/* Saved Posts Tab */}
              {activeTab === 'saved' && (
                <div className="space-y-4">
                  <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <Bookmark className="w-5 h-5 text-purple-600" />
                        <span>{t.saved}</span>
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {language === 'bn'
                          ? 'আপনার পছন্দের সংরক্ষিত পোস্টসমূহ'
                          : 'Posts you have bookmarked for later'}
                      </p>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-full">
                      {savedPosts.length} items
                    </span>
                  </div>

                  {savedPosts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}

                  {savedPosts.length === 0 && (
                    <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                      <Bookmark className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        {language === 'bn' ? 'কোনো সেভ করা পোস্ট নেই' : 'No saved posts'}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {language === 'bn'
                          ? 'পোস্টের মেনু থেকে "Save Post" ক্লিক করে এখানে জমা রাখুন।'
                          : 'Save posts from the feed menu to view them here anytime.'}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Right Sidebar (Desktop Contacts & Friend Requests) */}
        <RightSidebar />
      </div>

      {/* Floating Messenger Docks */}
      <MessengerDock />

      {/* Story Viewer Modal */}
      <StoryViewerModal />

      {/* Create Story Modal */}
      <CreateStoryModal />

      {/* Create Reel Modal */}
      <CreateReelModal />

      {/* Global Audio Library Modal */}
      <AudioLibraryModal
        isOpen={isAudioLibraryOpen}
        onClose={() => setIsAudioLibraryOpen(false)}
      />

      {/* Audio & Video Call Overlay Modal */}
      <CallModal />

      {/* Welcome Presentation Modal (session-based) */}
      <WelcomeModal
        isOpen={showWelcomeModal}
        onClose={() => {
          setShowWelcomeModal(false);
          try {
            sessionStorage.setItem('bandhan_welcome_shown', 'true');
          } catch {}
        }}
      />

      {/* Multi-Profile Vault & Encryption Security Shield Modal */}
      <AccountSecurityModal />

      {/* Ergonomic Mobile Bottom Tab Bar (< md screens) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pb-safe">
        <div className="grid grid-cols-6 items-center h-14">
          <button
            onClick={() => setActiveTab('feed')}
            className={`min-h-[44px] flex flex-col items-center justify-center cursor-pointer ${
              activeTab === 'feed'
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-0.5">{t.home}</span>
          </button>

          <button
            onClick={() => setActiveTab('watch')}
            className={`min-h-[44px] flex flex-col items-center justify-center cursor-pointer ${
              activeTab === 'watch'
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Tv className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-0.5">{t.watch}</span>
          </button>

          <button
            onClick={() => setActiveTab('gaming')}
            className={`min-h-[44px] flex flex-col items-center justify-center cursor-pointer ${
              activeTab === 'gaming'
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Gamepad2 className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-0.5">
              {language === 'bn' ? 'গেম জোন' : 'Gaming'}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('marketplace')}
            className={`min-h-[44px] flex flex-col items-center justify-center cursor-pointer ${
              activeTab === 'marketplace'
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Store className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-0.5">{t.marketplace}</span>
          </button>

          <button
            onClick={() => setActiveTab('groups')}
            className={`min-h-[44px] flex flex-col items-center justify-center cursor-pointer ${
              activeTab === 'groups'
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-0.5">{t.groups}</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`min-h-[44px] flex flex-col items-center justify-center cursor-pointer ${
              activeTab === 'profile'
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <UserCheck className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-0.5">{t.profile}</span>
          </button>
        </div>
      </div>

      {/* Global Toast Notification */}
      {toast && (
        <div className="fixed bottom-16 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-slate-900/90 dark:bg-white/95 text-white dark:text-slate-900 text-xs font-semibold rounded-full shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-200">
          {toast}
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}

import React, { useState, useRef, useEffect } from 'react';
import {
  Heart,
  MessageCircle,
  Share2,
  Music2,
  Volume2,
  VolumeX,
  Plus,
  BarChart3,
  Eye,
  Film,
  TrendingUp,
  Send,
  X,
  Play,
  Pause,
  Disc3,
  ShieldCheck,
  RotateCcw,
  RotateCw,
  FastForward,
  Check,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { sampleUsers } from '../data/mockData';
import { PostComment } from '../types';

const DEFAULT_REEL_COMMENTS: PostComment[] = [
  {
    id: 'rc_def_1',
    author: sampleUsers.arafat,
    content: 'অসাধারণ ভিডিও! দৃশ্য এবং মিউজিক দুটোই দারুণ হয়েছে 🔥👏',
    createdAt: '15m ago',
    likesCount: 14,
  },
  {
    id: 'rc_def_2',
    author: sampleUsers.nusrat,
    content: 'মন ভালো করে দেওয়ার মতো একটি রিল! ❤️✨',
    createdAt: '1h ago',
    likesCount: 9,
  },
];

export const ReelsView: React.FC = () => {
  const {
    reels,
    audioLibrary,
    currentUser,
    toggleLikeReel,
    addReelComment,
    incrementReelShares,
    setIsCreateReelOpen,
    setIsCreateStoryOpen,
    isFollowingUser,
    toggleFollowUser,
    viewUserProfile,
    language,
    t,
    showToast,
  } = useApp();

  const [isMuted, setIsMuted] = useState(false);
  const [viewMode, setViewMode] = useState<'watch' | 'trending' | 'insights'>('watch');
  const [activeReelIndex, setActiveReelIndex] = useState<number>(0);
  const [isManualPaused, setIsManualPaused] = useState<boolean>(false);
  const [openCommentsReelId, setOpenCommentsReelId] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [showHeartBurst, setShowHeartBurst] = useState<Record<string, boolean>>({});
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [reelSeekFeedback, setReelSeekFeedback] = useState<{ reelId: string; dir: 'back' | 'forward'; id: number } | null>(null);
  const [activeReactionReelId, setActiveReactionReelId] = useState<string | null>(null);
  const [reelVideoErrors, setReelVideoErrors] = useState<Record<string, boolean>>({});
  const reactionHoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const cardRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const seekReelBySeconds = (reelId: string, deltaSeconds: number) => {
    const vid = videoRefs.current[reelId];
    if (!vid) return;
    const nextTime = Math.max(0, Math.min(vid.duration || 9999, vid.currentTime + deltaSeconds));
    vid.currentTime = nextTime;
    setReelSeekFeedback({
      reelId,
      dir: deltaSeconds < 0 ? 'back' : 'forward',
      id: Date.now(),
    });
    setTimeout(() => {
      setReelSeekFeedback(null);
    }, 700);
  };

  const handleTogglePlaybackSpeed = (reelId: string) => {
    const speeds = [1.0, 1.5, 2.0];
    const nextSpeed = speeds[(speeds.indexOf(playbackSpeed) + 1) % speeds.length];
    setPlaybackSpeed(nextSpeed);
    const vid = videoRefs.current[reelId];
    if (vid) {
      vid.playbackRate = nextSpeed;
    }
  };

  // Keyboard Arrow Navigation for Reels (Up / Down)
  useEffect(() => {
    if (viewMode !== 'watch') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveReelIndex((curr) => {
          const next = Math.min(reels.length - 1, curr + 1);
          cardRefs.current[next]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return next;
        });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveReelIndex((curr) => {
          const prev = Math.max(0, curr - 1);
          cardRefs.current[prev]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return prev;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [reels.length, viewMode]);

  // IntersectionObserver so scrolling automatically switches the active reel and pauses all others
  useEffect(() => {
    if (viewMode !== 'watch') return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            const idxAttr = entry.target.getAttribute('data-reel-index');
            if (idxAttr !== null) {
              const parsed = parseInt(idxAttr, 10);
              if (!Number.isNaN(parsed)) {
                setActiveReelIndex(parsed);
                setIsManualPaused(false);
              }
            }
          }
        });
      },
      { threshold: [0.6, 0.75] },
    );

    Object.values(cardRefs.current).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [reels.length, viewMode]);

  // Strictly enforce that ONLY the active reel video plays, and all other videos pause!
  useEffect(() => {
    reels.forEach((reel, idx) => {
      const vid = videoRefs.current[reel.id];
      if (!vid) return;
      const shouldPlay = viewMode === 'watch' && idx === activeReelIndex && !isManualPaused;
      vid.muted = isMuted || !shouldPlay;
      if (shouldPlay) {
        vid.play().catch(() => {
          vid.muted = true;
          vid.play().catch(() => {});
        });
      } else {
        vid.pause();
      }
    });
  }, [activeReelIndex, viewMode, isMuted, isManualPaused, reels]);

  // Pause all videos on unmount
  useEffect(() => {
    return () => {
      Object.values(videoRefs.current).forEach((vid) => {
        try {
          vid?.pause();
        } catch {
          // ignore
        }
      });
    };
  }, []);

  // Filter reels published by current user (or show all reels in breakdown if none yet)
  const myReels = reels.filter((r) => r.author.id === currentUser.id);
  const analyticsReels = myReels.length > 0 ? myReels : reels;

  const totalViews = analyticsReels.reduce((acc, r) => acc + (r.viewsCount || 0), 0);
  const totalLikes = analyticsReels.reduce((acc, r) => acc + r.likesCount, 0);
  const totalShares = analyticsReels.reduce((acc, r) => acc + r.sharesCount, 0);
  const totalComments = analyticsReels.reduce((acc, r) => acc + r.commentsCount, 0);

  const handleCommentSubmit = (e: React.FormEvent, reelId: string) => {
    e.preventDefault();
    const text = commentInputs[reelId];
    if (!text || !text.trim()) return;
    addReelComment(reelId, text.trim());
    setCommentInputs((prev) => ({ ...prev, [reelId]: '' }));
  };

  return (
    <div className="max-w-xl mx-auto py-4 space-y-6">
      {/* Header with Watch / Insights Tabs & Create Reel Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-2">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>{t.watch}</span>
          </h2>

          {/* View Mode Switcher: Watch vs Trending vs Insights */}
          <div className="flex items-center bg-slate-200/80 dark:bg-slate-800 p-1 rounded-full">
            <button
              type="button"
              onClick={() => setViewMode('watch')}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'watch'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'রিলস প্লেয়ার' : 'Reels Player'}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('trending')}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'trending'
                  ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'ট্রেন্ডিং রিলস' : 'Trending'}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('insights')}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'insights'
                  ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'ইনসাইটস' : 'Insights'}</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCreateReelOpen(true)}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white shadow-md shadow-pink-500/20 cursor-pointer transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.createReel || (language === 'bn' ? 'রিল আপলোড' : 'Create Reel')}</span>
          </button>

          {viewMode === 'watch' && (
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span>{isMuted ? t.soundOff : t.soundOn}</span>
            </button>
          )}
        </div>
      </div>

      {/* TRENDING REELS VIEW */}
      {viewMode === 'trending' ? (
        <div className="space-y-4 px-1 animate-in fade-in duration-200">
          <div className="bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 text-white p-5 rounded-3xl shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-rose-200 bg-white/10 px-2.5 py-1 rounded-full mb-2">
                  <TrendingUp className="w-3.5 h-3.5" />
                  {language === 'bn' ? 'ট্রেন্ডিং ও জনপ্রিয় রিলস' : 'Trending & Popular Reels'}
                </span>
                <h3 className="text-lg font-extrabold">
                  {language === 'bn' ? 'বর্তমানে ভাইরাল সকল শর্ট ভিডিও' : 'Viral Bangladeshi & Global Reels'}
                </h3>
                <p className="text-xs text-rose-100 mt-1">
                  {language === 'bn'
                    ? 'সবচেয়ে বেশি দেখা এবং পছন্দ করা রিলগুলো এক নজরে এক্সপ্লোর করুন।'
                    : 'Explore the most-watched and loved short video reels in one place.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateReelOpen(true)}
                className="px-4 py-2 bg-white text-rose-600 hover:bg-rose-50 text-xs font-bold rounded-xl shadow-md cursor-pointer transition-all"
              >
                + {language === 'bn' ? 'রিল আপলোড' : 'Upload Reel'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {reels.map((reel, idx) => (
              <div
                key={reel.id}
                onClick={() => {
                  setActiveReelIndex(idx);
                  setViewMode('watch');
                  setIsManualPaused(false);
                }}
                className="group relative aspect-[9/14] rounded-2xl overflow-hidden bg-slate-900 shadow-md cursor-pointer hover:ring-2 hover:ring-rose-500 transition-all"
              >
                {reel.videoUrl ? (
                  <video
                    src={reel.videoUrl}
                    poster={reel.posterUrl}
                    muted
                    playsInline
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <img
                    src={reel.posterUrl}
                    alt={reel.description}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-between p-2.5 text-white">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-600/90 flex items-center gap-1 shadow-xs">
                      🔥 #{idx + 1}
                    </span>
                    <span className="text-[10px] font-semibold flex items-center gap-1 bg-black/50 px-1.5 py-0.5 rounded-full">
                      <Eye className="w-3 h-3" />
                      {(reel.viewsCount || 0).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <img
                        src={reel.author.avatar}
                        alt={reel.author.name}
                        referrerPolicy="no-referrer"
                        className="w-5 h-5 rounded-full object-cover border border-white/50"
                      />
                      <span className="text-xs font-bold truncate">
                        {language === 'bn' ? reel.author.nameBn || reel.author.name : reel.author.name}
                      </span>
                    </div>
                    <p className="text-[11px] text-white/90 line-clamp-1 leading-snug">
                      {reel.description}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-rose-300 font-bold">
                      <span className="flex items-center gap-1">
                        <Heart className="w-3 h-3 fill-current" />
                        {reel.likesCount.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-3 h-3" />
                        {(reel.commentsCount || reel.comments?.length || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : viewMode === 'insights' ? (
        <div className="space-y-5 px-1 animate-in fade-in duration-200">
          {/* Summary Banner */}
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-rose-950 text-white p-5 rounded-3xl shadow-xl border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  {language === 'bn' ? 'ক্রিয়েটর রিলস ইনসাইটস' : 'Creator Reels Insights'}
                </span>
                <h3 className="text-lg font-bold mt-0.5">
                  {myReels.length > 0
                    ? language === 'bn'
                      ? 'আপনার প্রকাশিত রিলসের পারফরম্যান্স'
                      : 'Your Published Reels Performance'
                    : language === 'bn'
                    ? 'সামগ্রিক রিলস অ্যানালিটিক্স ওভারভিউ'
                    : 'Platform Reels Analytics Overview'}
                </h3>
              </div>
              <span className="px-3 py-1 rounded-full bg-white/10 text-xs font-bold">
                {analyticsReels.length} {language === 'bn' ? 'টি রিল' : 'Reels'}
              </span>
            </div>

            {/* 4 Key Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
                <div className="flex items-center gap-1.5 text-sky-300 text-xs font-semibold mb-1">
                  <Eye className="w-4 h-4" />
                  <span>{language === 'bn' ? 'মোট ভিউ' : 'Total Views'}</span>
                </div>
                <p className="text-xl font-black">{totalViews.toLocaleString()}</p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
                <div className="flex items-center gap-1.5 text-rose-300 text-xs font-semibold mb-1">
                  <Heart className="w-4 h-4" />
                  <span>{language === 'bn' ? 'মোট লাইক' : 'Total Likes'}</span>
                </div>
                <p className="text-xl font-black">{totalLikes.toLocaleString()}</p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
                <div className="flex items-center gap-1.5 text-emerald-300 text-xs font-semibold mb-1">
                  <Share2 className="w-4 h-4" />
                  <span>{language === 'bn' ? 'মোট শেয়ার' : 'Total Shares'}</span>
                </div>
                <p className="text-xl font-black">{totalShares.toLocaleString()}</p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
                <div className="flex items-center gap-1.5 text-amber-300 text-xs font-semibold mb-1">
                  <MessageCircle className="w-4 h-4" />
                  <span>{language === 'bn' ? 'মোট মন্তব্য' : 'Comments'}</span>
                </div>
                <p className="text-xl font-black">{totalComments.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Per-Reel Breakdown */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {language === 'bn' ? 'রিল অনুযায়ী বিস্তারিত রিপোর্ট' : 'Reel-by-Reel Breakdown'}
              </h4>
              <button
                type="button"
                onClick={() => setIsCreateReelOpen(true)}
                className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
              >
                + {language === 'bn' ? 'নতুন রিল যোগ করুন' : 'Upload New Reel'}
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {analyticsReels.map((reel) => {
                const views = reel.viewsCount || 0;
                const engagementRate = views > 0
                  ? Math.min(
                      100,
                      Math.round(((reel.likesCount + reel.sharesCount + reel.commentsCount) / views) * 100),
                    )
                  : 0;

                return (
                  <div key={reel.id} className="py-3.5 flex items-center gap-3.5">
                    <div className="w-14 h-20 rounded-xl overflow-hidden bg-slate-900 shrink-0 relative border border-slate-200 dark:border-slate-700">
                      {reel.videoUrl ? (
                        <video
                          src={reel.videoUrl}
                          poster={reel.posterUrl}
                          muted
                          playsInline
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <img
                          src={reel.posterUrl}
                          alt={reel.description}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                        {reel.description}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {reel.songTitle}
                      </p>

                      <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                        <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                          <Eye className="w-3.5 h-3.5 text-sky-500" />
                          <span className="font-bold">{views.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                          <Heart className="w-3.5 h-3.5 text-rose-500" />
                          <span className="font-bold">{reel.likesCount.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                          <Share2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="font-bold">{reel.sharesCount.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Engagement bar */}
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-rose-500 to-pink-500 rounded-full"
                            style={{ width: `${engagementRate}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-slate-500">
                          {engagementRate}% Eng.
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* WATCH REELS STREAM - SINGLE ACTIVE VIDEO PLAYBACK */
        <div className="space-y-6">
          {/* Active Reel Control Strip */}
          <div className="flex items-center justify-between bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-md">
            <div className="flex items-center gap-2 text-xs font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                {language === 'bn'
                  ? `একবারে ১টি ভিডিও চলছে (রিল ${activeReelIndex + 1} / ${reels.length})`
                  : `Single Video Mode (Playing Reel ${activeReelIndex + 1} of ${reels.length})`}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={activeReelIndex <= 0}
                onClick={() => {
                  const nextIdx = Math.max(0, activeReelIndex - 1);
                  setActiveReelIndex(nextIdx);
                  setIsManualPaused(false);
                  cardRefs.current[nextIdx]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-35 text-xs font-bold cursor-pointer"
              >
                {language === 'bn' ? '⬆ আগের রিল' : '⬆ Prev'}
              </button>
              <button
                type="button"
                disabled={activeReelIndex >= reels.length - 1}
                onClick={() => {
                  const nextIdx = Math.min(reels.length - 1, activeReelIndex + 1);
                  setActiveReelIndex(nextIdx);
                  setIsManualPaused(false);
                  cardRefs.current[nextIdx]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-35 text-xs font-bold cursor-pointer"
              >
                {language === 'bn' ? '⬇ পরের রিল' : '⬇ Next'}
              </button>
            </div>
          </div>

          {reels.map((reel, idx) => {
            const reelComments =
              reel.comments && reel.comments.length > 0
                ? [...reel.comments, ...DEFAULT_REEL_COMMENTS]
                : DEFAULT_REEL_COMMENTS;
            const isCommentsOpen = openCommentsReelId === reel.id;
            const isCurrentActive = idx === activeReelIndex;
            const isCurrentlyPlaying = isCurrentActive && !isManualPaused;

            return (
              <div
                key={reel.id}
                ref={(el) => {
                  cardRefs.current[idx] = el;
                }}
                data-reel-index={idx}
                onClick={() => {
                  if (!isCurrentActive) {
                    setActiveReelIndex(idx);
                    setIsManualPaused(false);
                  }
                }}
                className={`relative w-full aspect-[9/14] sm:aspect-[9/13] max-h-[720px] bg-black rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between transition-all ${
                  isCurrentActive
                    ? 'ring-2 ring-rose-500 shadow-rose-500/10'
                    : 'opacity-80 hover:opacity-95'
                }`}
              >
                {/* Reel Video or Poster - Strictly controlled via videoRefs so only 1 video plays */}
                {reel.videoUrl ? (
                  <>
                    <video
                      ref={(el) => {
                        videoRefs.current[reel.id] = el;
                      }}
                      src={reel.videoUrl}
                      poster={reel.posterUrl}
                      loop
                      preload="metadata"
                      muted={isMuted || !isCurrentlyPlaying}
                      playsInline
                      onLoadedData={() => {
                        if (reelVideoErrors[reel.id]) {
                          setReelVideoErrors((prev) => ({ ...prev, [reel.id]: false }));
                        }
                      }}
                      onError={() => {
                        setReelVideoErrors((prev) => ({ ...prev, [reel.id]: true }));
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isCurrentActive) {
                          setIsManualPaused((p) => !p);
                        } else {
                          setActiveReelIndex(idx);
                          setIsManualPaused(false);
                        }
                      }}
                      className={`absolute inset-0 w-full h-full object-cover cursor-pointer ${
                        reelVideoErrors[reel.id] ? 'opacity-0 pointer-events-none' : ''
                      }`}
                    />
                    <img
                      src={reel.posterUrl}
                      alt={reel.description}
                      referrerPolicy="no-referrer"
                      className="absolute inset-0 w-full h-full object-cover -z-10"
                    />
                    {reelVideoErrors[reel.id] && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute inset-0 z-15 bg-slate-950/75 backdrop-blur-xs flex flex-col items-center justify-center gap-3 p-6 text-center text-white"
                      >
                        <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-400/40 flex items-center justify-center">
                          <Play className="w-5 h-5 text-rose-400 fill-current ml-0.5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold">
                            {language === 'bn' ? 'রিল ভিডিওটি লোড করা যায়নি' : 'Reel video failed to load'}
                          </p>
                          <p className="text-xs text-slate-300 mt-1">
                            {language === 'bn' ? 'পুনরায় লোড করতে নিচের বাটনে চাপ দিন' : 'Tap below to reload the video'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setReelVideoErrors((prev) => ({ ...prev, [reel.id]: false }));
                            const vid = videoRefs.current[reel.id];
                            if (vid) {
                              vid.load();
                              vid.play().catch(() => {});
                            }
                          }}
                          className="px-4 py-2 rounded-full bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white flex items-center gap-1.5 shadow-lg cursor-pointer transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>{language === 'bn' ? 'পুনরায় চেষ্টা করুন' : 'Retry Video'}</span>
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <img
                    src={reel.posterUrl}
                    alt="Reel clip"
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}

                {/* Gradient Scrims */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/40 pointer-events-none" />

                {/* Top Bar info & Video Controls */}
                <div className="relative z-10 p-3.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isCurrentActive) {
                          setIsManualPaused((p) => !p);
                        } else {
                          setActiveReelIndex(idx);
                          setIsManualPaused(false);
                        }
                      }}
                      className={`text-xs font-bold text-white uppercase tracking-wider backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1.5 cursor-pointer ${
                        isCurrentlyPlaying ? 'bg-rose-600/90' : 'bg-black/60 hover:bg-black/80'
                      }`}
                    >
                      {isCurrentlyPlaying ? (
                        <>
                          <Pause className="w-3 h-3" />
                          <span>{language === 'bn' ? 'পজ' : 'Pause'}</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 fill-current" />
                          <span>{language === 'bn' ? 'প্লে' : 'Play'}</span>
                        </>
                      )}
                    </button>

                    {/* 5-Second Rewind Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        seekReelBySeconds(reel.id, -5);
                      }}
                      className="px-2 py-1 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white text-[11px] font-bold border border-white/20 flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                      title={language === 'bn' ? '৫ সেকেন্ড পিছিয়ে যান' : 'Rewind 5s'}
                    >
                      <RotateCcw className="w-3 h-3 text-amber-400" />
                      <span>-5s</span>
                    </button>

                    {/* 5-Second Fast-Forward Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        seekReelBySeconds(reel.id, 5);
                      }}
                      className="px-2 py-1 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white text-[11px] font-bold border border-white/20 flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                      title={language === 'bn' ? '৫ সেকেন্ড এগিয়ে যান' : 'Skip forward 5s'}
                    >
                      <span>+5s</span>
                      <RotateCw className="w-3 h-3 text-emerald-400" />
                    </button>

                    {/* Playback Speed (1x, 1.5x, 2x) */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTogglePlaybackSpeed(reel.id);
                      }}
                      className="px-2 py-1 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white text-[11px] font-bold border border-white/20 flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                      title={language === 'bn' ? 'ভিডিও গতি পরিবর্তন' : 'Playback Speed'}
                    >
                      <FastForward className="w-3 h-3 text-indigo-400" />
                      <span>{playbackSpeed}x</span>
                    </button>
                  </div>

                  <span className="text-xs font-semibold text-white/90 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0">
                    <Eye className="w-3.5 h-3.5" />
                    {(reel.viewsCount || 0).toLocaleString()}
                  </span>
                </div>

                {/* Floating Seek Ripple feedback badge */}
                {reelSeekFeedback && reelSeekFeedback.reelId === reel.id && (
                  <div
                    className={`pointer-events-none absolute top-1/2 -translate-y-1/2 z-30 flex items-center justify-center animate-in zoom-in-75 fade-in duration-150 ${
                      reelSeekFeedback.dir === 'back' ? 'left-8' : 'right-8'
                    }`}
                  >
                    <div className="px-3.5 py-2 rounded-2xl bg-black/90 text-white backdrop-blur-md border border-white/30 flex items-center gap-2 shadow-2xl font-black text-sm">
                      {reelSeekFeedback.dir === 'back' ? (
                        <>
                          <RotateCcw className="w-4 h-4 text-amber-400" />
                          <span>-5s</span>
                        </>
                      ) : (
                        <>
                          <span>+5s</span>
                          <RotateCw className="w-4 h-4 text-emerald-400" />
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Floating Right Actions Dock */}
                <div className="absolute right-3 bottom-28 z-20 flex flex-col items-center gap-4">
                  {/* Like Reel with Quick Emoji Reaction Popover */}
                  {(() => {
                    const isReelLikedByMe = Array.isArray(reel.likedUserIds)
                      ? reel.likedUserIds.includes(currentUser.id)
                      : Boolean(reel.isLiked && reel.author.id === currentUser.id);

                    return (
                      <div
                        className="relative flex flex-col items-center"
                        onMouseEnter={() => {
                          if (reactionHoverTimeoutRef.current) clearTimeout(reactionHoverTimeoutRef.current);
                          reactionHoverTimeoutRef.current = setTimeout(() => {
                            setActiveReactionReelId(reel.id);
                          }, 300);
                        }}
                        onMouseLeave={() => {
                          if (reactionHoverTimeoutRef.current) clearTimeout(reactionHoverTimeoutRef.current);
                          reactionHoverTimeoutRef.current = setTimeout(() => {
                            setActiveReactionReelId(null);
                          }, 400);
                        }}
                      >
                        {/* Floating Quick Emoji Reactions Dock */}
                        {activeReactionReelId === reel.id && (
                          <div className="absolute right-12 bottom-1 z-40 bg-black/85 backdrop-blur-md rounded-full shadow-2xl border border-white/20 px-2 py-1.5 flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-150">
                            {[
                              { emoji: '👍', label: 'Like' },
                              { emoji: '❤️', label: 'Love' },
                              { emoji: '😂', label: 'Haha' },
                              { emoji: '😮', label: 'Wow' },
                              { emoji: '😢', label: 'Sad' },
                              { emoji: '😡', label: 'Angry' },
                            ].map((r) => (
                              <button
                                key={r.label}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleLikeReel(reel.id);
                                  setActiveReactionReelId(null);
                                  setShowHeartBurst((prev) => ({ ...prev, [reel.id]: true }));
                                  setTimeout(() => {
                                    setShowHeartBurst((prev) => ({ ...prev, [reel.id]: false }));
                                  }, 800);
                                }}
                                className="text-xl p-1 rounded-full hover:scale-130 transition-transform active:scale-95 cursor-pointer"
                                title={r.label}
                              >
                                {r.emoji}
                              </button>
                            ))}
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => toggleLikeReel(reel.id)}
                          className="flex flex-col items-center group cursor-pointer"
                        >
                          <div
                            className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md transition-transform group-hover:scale-110 ${
                              isReelLikedByMe ? 'bg-rose-500 text-white' : 'bg-black/50 text-white'
                            }`}
                          >
                            <Heart className={`w-6 h-6 ${isReelLikedByMe ? 'fill-current' : ''}`} />
                          </div>
                          <span className="text-xs font-bold text-white mt-1 drop-shadow">
                            {reel.likesCount.toLocaleString()}
                          </span>
                        </button>
                      </div>
                    );
                  })()}

                  {/* Comments Drawer Trigger */}
                  <button
                    type="button"
                    onClick={() =>
                      setOpenCommentsReelId(isCommentsOpen ? null : reel.id)
                    }
                    className="flex flex-col items-center group cursor-pointer"
                  >
                    <div
                      className={`w-11 h-11 rounded-full backdrop-blur-md flex items-center justify-center text-white group-hover:scale-110 transition-transform ${
                        isCommentsOpen ? 'bg-blue-600' : 'bg-black/50'
                      }`}
                    >
                      <MessageCircle className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-white mt-1 drop-shadow">
                      {reel.commentsCount.toLocaleString()}
                    </span>
                  </button>

                  {/* Share */}
                  <button
                    type="button"
                    onClick={() => {
                      incrementReelShares(reel.id);
                      navigator.clipboard?.writeText?.(window.location.href);
                      showToast(t.linkCopied);
                    }}
                    className="flex flex-col items-center group cursor-pointer"
                  >
                    <div className="w-11 h-11 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                      <Share2 className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-white mt-1 drop-shadow">
                      {reel.sharesCount.toLocaleString()}
                    </span>
                  </button>
                </div>

                {/* Bottom Caption, Audio & Inline Video Comment Box */}
                <div className="relative z-10 p-4 sm:p-5 space-y-3">
                  {/* Author badge */}
                  <div className="flex items-center gap-3 pr-14">
                    <img
                      src={reel.author.avatar}
                      alt={reel.author.name}
                      referrerPolicy="no-referrer"
                      onClick={() => viewUserProfile(reel.author)}
                      className="w-10 h-10 rounded-full border-2 border-white object-cover cursor-pointer"
                    />
                    <span
                      onClick={() => viewUserProfile(reel.author)}
                      className="text-sm font-bold text-white drop-shadow cursor-pointer hover:underline"
                    >
                      {language === 'bn' ? reel.author.nameBn || reel.author.name : reel.author.name}
                    </span>
                    {reel.author.id !== currentUser.id && (
                      <button
                        type="button"
                        onClick={() => toggleFollowUser(reel.author.id)}
                        className={`px-3 py-1 backdrop-blur-md text-xs font-semibold rounded-full border transition-colors cursor-pointer ${
                          isFollowingUser(reel.author.id)
                            ? 'bg-emerald-500/80 text-white border-emerald-400'
                            : 'bg-white/20 hover:bg-white/30 text-white border-white/40'
                        }`}
                      >
                        {isFollowingUser(reel.author.id)
                          ? language === 'bn'
                            ? '✓ ফলো করছেন'
                            : '✓ Following'
                          : language === 'bn'
                          ? '+ ফলো'
                          : '+ Follow'}
                      </button>
                    )}
                  </div>

                  {/* Caption */}
                  <p className="text-xs sm:text-sm text-white/90 leading-relaxed drop-shadow line-clamp-2 pr-14">
                    {reel.description}
                  </p>

                  {/* Audio Track marquee style display */}
                  <div className="flex items-center justify-between gap-2 pr-14">
                    <div className="flex items-center gap-2 text-xs text-white/90 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full max-w-full">
                      <Music2 className={`w-3.5 h-3.5 text-rose-400 shrink-0 ${isCurrentlyPlaying ? 'animate-spin' : ''}`} />
                      <span className="truncate">{reel.songTitle}</span>
                      <span className="text-[10px] text-rose-300 font-bold shrink-0">
                        • {language === 'bn' ? 'অরিজিনাল অডিও' : 'Original Audio'}
                      </span>
                    </div>
                  </div>

                  {/* Latest User Comment Preview Badge */}
                  {reel.comments && reel.comments.length > 0 && (
                    <div
                      onClick={() => setOpenCommentsReelId(reel.id)}
                      className="bg-black/45 backdrop-blur-md border border-white/15 rounded-xl px-3 py-1.5 flex items-center gap-2 cursor-pointer hover:bg-black/60 transition-colors"
                    >
                      <img
                        src={reel.comments[0].author.avatar}
                        alt={reel.comments[0].author.name}
                        referrerPolicy="no-referrer"
                        className="w-5 h-5 rounded-full object-cover"
                      />
                      <p className="text-xs text-white/95 truncate">
                        <span className="font-bold mr-1.5">
                          {language === 'bn'
                            ? reel.comments[0].author.nameBn || reel.comments[0].author.name
                            : reel.comments[0].author.name}:
                        </span>
                        {reel.comments[0].content}
                      </p>
                    </div>
                  )}

                  {/* Quick Direct Video Comment Input Bar */}
                  <form
                    onSubmit={(e) => handleCommentSubmit(e, reel.id)}
                    className="flex items-center gap-2 pt-1"
                  >
                    <input
                      type="text"
                      value={commentInputs[reel.id] || ''}
                      onChange={(e) =>
                        setCommentInputs((prev) => ({ ...prev, [reel.id]: e.target.value }))
                      }
                      placeholder={
                        language === 'bn'
                          ? 'এই ভিডিওতে কমেন্ট লিখুন...'
                          : 'Write a comment on this video...'
                      }
                      className="flex-1 px-4 py-2 rounded-full bg-white/15 hover:bg-white/20 focus:bg-white/25 text-white placeholder-white/70 text-xs sm:text-sm border border-white/20 focus:outline-none backdrop-blur-md"
                    />
                    <button
                      type="submit"
                      disabled={!commentInputs[reel.id]?.trim()}
                      className="p-2 rounded-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white transition-colors cursor-pointer"
                      title={language === 'bn' ? 'কমেন্ট পাঠান' : 'Post Comment'}
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>

                {/* Slide-Up Full Video Comments Drawer */}
                {isCommentsOpen && (
                  <div className="absolute inset-x-0 bottom-0 h-[68%] bg-white dark:bg-slate-900 rounded-t-3xl z-30 flex flex-col shadow-2xl border-t border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom duration-200">
                    {/* Drawer Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-blue-600" />
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {language === 'bn'
                            ? `ভিডিও কমেন্টসমূহ (${reel.commentsCount})`
                            : `Video Comments (${reel.commentsCount})`}
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => setOpenCommentsReelId(null)}
                        className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Comments List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {reelComments.map((c) => (
                        <div key={c.id} className="flex items-start gap-2.5">
                          <img
                            src={c.author.avatar}
                            alt={c.author.name}
                            referrerPolicy="no-referrer"
                            className="w-8 h-8 rounded-full object-cover shrink-0 mt-0.5"
                          />
                          <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-2xl px-3.5 py-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                                {language === 'bn' ? c.author.nameBn || c.author.name : c.author.name}
                              </span>
                              <span className="text-[10px] text-slate-400">{c.createdAt}</span>
                            </div>
                            <p className="text-xs text-slate-700 dark:text-slate-200 mt-0.5 leading-relaxed">
                              {c.content}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Quick Reaction Comment Chips */}
                    <div className="px-4 py-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar border-t border-slate-100 dark:border-slate-800">
                      {[
                        '🔥 অসাধারণ ভিডিও!',
                        '❤️ অনেক সুন্দর হয়েছে',
                        '👏 দারুণ কাজ!',
                        '😍 এক কথায় চমৎকার',
                      ].map((chip) => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => addReelComment(reel.id, chip)}
                          className="shrink-0 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-[11px] font-medium text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>

                    {/* Drawer Input Form */}
                    <form
                      onSubmit={(e) => handleCommentSubmit(e, reel.id)}
                      className="p-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 bg-slate-50 dark:bg-slate-900/90"
                    >
                      <img
                        src={currentUser.avatar}
                        alt={currentUser.name}
                        referrerPolicy="no-referrer"
                        className="w-8 h-8 rounded-full object-cover shrink-0"
                      />
                      <input
                        type="text"
                        value={commentInputs[reel.id] || ''}
                        onChange={(e) =>
                          setCommentInputs((prev) => ({ ...prev, [reel.id]: e.target.value }))
                        }
                        placeholder={
                          language === 'bn'
                            ? 'ভিডিওতে আপনার মন্তব্য লিখুন...'
                            : 'Add a comment to this video...'
                        }
                        className="flex-1 px-3.5 py-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                      />
                      <button
                        type="submit"
                        disabled={!commentInputs[reel.id]?.trim()}
                        className="p-2 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white transition-colors cursor-pointer"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

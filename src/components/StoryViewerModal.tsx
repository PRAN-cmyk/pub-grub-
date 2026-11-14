import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Send,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Clock,
  Trash2,
  Music2,
  Disc3,
  Share2,
  Eye,
  SlidersHorizontal,
  ExternalLink,
  Plus,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface FloatingParticle {
  id: string;
  emoji: string;
  x: number; // percentage 10% - 90%
  scale: number;
  rot: number;
  rotMid: number;
  rotEnd: number;
  duration: number;
}

const STORY_REACTIONS = [
  { type: 'love', emoji: '❤️', labelEn: 'Love', labelBn: 'লাভ' },
  { type: 'haha', emoji: '😂', labelEn: 'Haha', labelBn: 'হাহা' },
  { type: 'wow', emoji: '😮', labelEn: 'Wow', labelBn: 'ওয়াও' },
  { type: 'sad', emoji: '😢', labelEn: 'Sad', labelBn: 'স্যাড' },
  { type: 'fire', emoji: '🔥', labelEn: 'Fire', labelBn: 'আগুন' },
  { type: 'clap', emoji: '👏', labelEn: 'Clap', labelBn: 'হাততালি' },
  { type: 'party', emoji: '🎉', labelEn: 'Party', labelBn: 'উৎসব' },
  { type: 'like', emoji: '👍', labelEn: 'Like', labelBn: 'লাইক' },
];

const DEFAULT_STORY_AUDIO =
  'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3';

export const StoryViewerModal: React.FC = () => {
  const {
    currentUser,
    stories,
    activeStoryIndex,
    setActiveStoryIndex,
    deleteStory,
    reactToStory,
    sendMessage,
    showToast,
    language,
    setIsCreateStoryOpen,
    setIsCreateReelOpen,
    setSelectedAudioForCreation,
  } = useApp();

  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [floatingParticles, setFloatingParticles] = useState<FloatingParticle[]>([]);
  const [isMusicDetailsOpen, setIsMusicDetailsOpen] = useState(false);
  const [isReactionsDrawerOpen, setIsReactionsDrawerOpen] = useState(false);
  const [selectedReactionFilter, setSelectedReactionFilter] = useState<string>('all');
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isHoldingRef = useRef<boolean>(false);

  const activeStory = activeStoryIndex !== null ? stories[activeStoryIndex] : null;

  const isVideoStory = Boolean(
    activeStory &&
      (activeStory.mediaType === 'video' ||
        activeStory.videoUrl ||
        (activeStory.mediaUrl &&
          (activeStory.mediaUrl.startsWith('data:video') ||
            activeStory.mediaUrl.endsWith('.mp4')))),
  );
  const videoSrc = activeStory?.videoUrl || activeStory?.mediaUrl;

  const activeAudioTitle =
    activeStory?.audioTitle?.trim() ||
    (isVideoStory ? 'Video Original Soundtrack' : 'Acoustic Melody & Chill Lo-Fi');
  const activeAudioArtist =
    activeStory?.audioArtist?.trim() ||
    activeStory?.author?.name ||
    'Bandhan Music Studio';
  const activeAudioUrl = activeStory?.audioUrl || (!isVideoStory ? DEFAULT_STORY_AUDIO : undefined);

  const advanceToNextStory = useCallback(() => {
    if (activeStoryIndex === null) return;
    if (activeStoryIndex < stories.length - 1) {
      setActiveStoryIndex(activeStoryIndex + 1);
      setProgress(0);
    } else {
      setActiveStoryIndex(null);
      setProgress(0);
    }
  }, [activeStoryIndex, stories.length, setActiveStoryIndex]);

  // Reset progress and audio when story index changes
  useEffect(() => {
    setProgress(0);
    setIsPaused(false);
    setIsMusicDetailsOpen(false);
    setIsReactionsDrawerOpen(false);
    setFloatingParticles([]);

    if (audioRef.current && !isVideoStory) {
      audioRef.current.currentTime = 0;
      if (!isMuted) {
        audioRef.current.play().catch(() => {
          // Autoplay policy fallback
        });
      }
    }
  }, [activeStoryIndex, isVideoStory, isMuted]);

  // Handle keyboard navigation (Left/Right arrow, Space to pause, Esc to close)
  useEffect(() => {
    if (activeStoryIndex === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === 'ArrowRight') {
        advanceToNextStory();
      } else if (e.key === 'ArrowLeft') {
        if (activeStoryIndex > 0) {
          setActiveStoryIndex(activeStoryIndex - 1);
          setProgress(0);
        }
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPaused((prev) => !prev);
      } else if (e.key === 'Escape') {
        setActiveStoryIndex(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeStoryIndex, advanceToNextStory, setActiveStoryIndex]);

  // Advance story safely in useEffect when progress reaches 100
  useEffect(() => {
    if (activeStoryIndex === null || !activeStory) return;
    if (progress >= 100) {
      advanceToNextStory();
    }
  }, [progress, activeStoryIndex, activeStory, advanceToNextStory]);

  // Handle auto-advance timer for image/text stories
  useEffect(() => {
    if (activeStoryIndex === null || !activeStory) return;
    if (isVideoStory) return; // Video stories use onTimeUpdate

    const interval = 50;
    const totalDuration = (activeStory.duration || 6) * 1000;
    const step = (interval / totalDuration) * 100;

    const timer = setInterval(() => {
      if (!isPaused && !isMusicDetailsOpen && !isReactionsDrawerOpen) {
        setProgress((prev) => Math.min(100, prev + step));
      }
    }, interval);

    return () => clearInterval(timer);
  }, [activeStoryIndex, activeStory, isPaused, isVideoStory, isMusicDetailsOpen, isReactionsDrawerOpen]);

  // Sync video play/pause with paused state
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid || !isVideoStory) return;
    if (isPaused || isMusicDetailsOpen || isReactionsDrawerOpen) {
      vid.pause();
    } else {
      vid.play().catch(() => {});
    }
  }, [isPaused, isVideoStory, activeStoryIndex, isMusicDetailsOpen, isReactionsDrawerOpen]);

  // Sync background audio play/pause with paused & muted state
  useEffect(() => {
    const aud = audioRef.current;
    if (!aud || isVideoStory) return;
    aud.muted = isMuted;
    if (isPaused || isMusicDetailsOpen || isReactionsDrawerOpen) {
      aud.pause();
    } else if (!isMuted) {
      aud.play().catch(() => {});
    }
  }, [isPaused, isMuted, isVideoStory, isMusicDetailsOpen, isReactionsDrawerOpen]);

  if (activeStoryIndex === null || !activeStory) return null;

  const handlePrev = () => {
    if (activeStoryIndex > 0) {
      setActiveStoryIndex(activeStoryIndex - 1);
      setProgress(0);
    }
  };

  const handleNext = () => {
    advanceToNextStory();
  };

  // Launch stream of floating emoji reactions
  const handleSendReaction = (emoji: string) => {
    // Spawn 6-8 particles with randomized trajectories
    const particleCount = 7;
    const newParticles: FloatingParticle[] = [];

    for (let i = 0; i < particleCount; i++) {
      newParticles.push({
        id: `fp_${Date.now()}_${i}_${Math.random()}`,
        emoji,
        x: Math.floor(Math.random() * 70) + 15, // 15% to 85%
        scale: Math.random() * 0.7 + 0.85, // 0.85 to 1.55
        rot: Math.floor(Math.random() * 24) - 12,
        rotMid: Math.floor(Math.random() * 30) - 15,
        rotEnd: Math.floor(Math.random() * 40) - 20,
        duration: Math.random() * 0.7 + 1.8, // 1.8s to 2.5s
      });
    }

    setFloatingParticles((prev) => [...prev, ...newParticles]);

    // Cleanup particles after 2.5 seconds
    setTimeout(() => {
      setFloatingParticles((prev) =>
        prev.filter((p) => !newParticles.some((np) => np.id === p.id)),
      );
    }, 2600);

    // Call store mutation
    reactToStory(activeStory.id, emoji);
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    sendMessage(activeStory.author.id, `Replied to your story: "${replyText.trim()}"`);
    setReplyText('');
    showToast(language === 'bn' ? 'স্টোরির উত্তর পাঠানো হয়েছে!' : 'Reply sent to story!');
  };

  const handleShareStory = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast(
        language === 'bn'
          ? '🔗 স্টোরি লিংক কপি করা হয়েছে!'
          : '🔗 Story link copied to clipboard!',
      );
    } else {
      showToast(language === 'bn' ? 'স্টোরি লিংক প্রস্তুত' : 'Story link ready');
    }
  };

  const handleUseAudioForCreation = () => {
    setSelectedAudioForCreation(activeAudioTitle);
    try {
      localStorage.setItem('bandhan_selected_audio', activeAudioTitle);
    } catch {}
    setIsMusicDetailsOpen(false);
    setActiveStoryIndex(null);
    setIsCreateStoryOpen(true);
    showToast(
      language === 'bn'
        ? `🎵 "${activeAudioTitle}" স্টোরির ব্যাকগ্রাউন্ড মিউজিক হিসেবে নির্বাচিত হয়েছে!`
        : `🎵 "${activeAudioTitle}" selected for your new Story!`,
    );
  };

  // Hold to pause support
  const handlePointerDown = (e: React.PointerEvent) => {
    // Only pause if clicking main background area, not interactive buttons
    if ((e.target as HTMLElement).closest('button, input, form')) return;
    isHoldingRef.current = true;
    pressTimerRef.current = setTimeout(() => {
      if (isHoldingRef.current) {
        setIsPaused(true);
      }
    }, 180);
  };

  const handlePointerUp = () => {
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
    if (isHoldingRef.current && isPaused) {
      setIsPaused(false);
    }
    isHoldingRef.current = false;
  };

  // Aggregate reactions list
  const totalReactionsCount = Object.values(activeStory.reactions || {}).reduce(
    (sum, count) => sum + count,
    0,
  );
  const myReaction = activeStory.userReactions?.[currentUser.id];

  const reactionUsersList = activeStory.reactionUsers || [];
  const filteredReactionUsers =
    selectedReactionFilter === 'all'
      ? reactionUsersList
      : reactionUsersList.filter((u) => u.emoji === selectedReactionFilter);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center backdrop-blur-md select-none"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* Background Audio Element for Image/Text Stories */}
      {!isVideoStory && activeAudioUrl && (
        <audio
          ref={audioRef}
          src={activeAudioUrl}
          loop
          autoPlay
          muted={isMuted}
          onTimeUpdate={(e) => {
            const el = e.currentTarget;
            setAudioCurrentTime(el.currentTime);
            if (el.duration && !isNaN(el.duration)) {
              setAudioDuration(el.duration);
            }
          }}
          onLoadedMetadata={(e) => {
            const el = e.currentTarget;
            if (el.duration && !isNaN(el.duration)) {
              setAudioDuration(el.duration);
            }
          }}
        />
      )}

      {/* Floating Reactions Particle Layer (Instagram / Facebook Style Cascade) */}
      <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
        {floatingParticles.map((particle) => (
          <div
            key={particle.id}
            className="absolute bottom-16 animate-float-up text-4xl sm:text-5xl drop-shadow-2xl select-none"
            style={
              {
                left: `${particle.x}%`,
                '--rot': `${particle.rot}deg`,
                '--rot-mid': `${particle.rotMid}deg`,
                '--rot-end': `${particle.rotEnd}deg`,
                transform: `scale(${particle.scale})`,
                animationDuration: `${particle.duration}s`,
              } as React.CSSProperties
            }
          >
            {particle.emoji}
          </div>
        ))}
      </div>

      {/* Desktop Close button */}
      <button
        onClick={() => setActiveStoryIndex(null)}
        className="absolute top-4 right-4 z-50 p-2.5 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full cursor-pointer transition-colors backdrop-blur-md"
        title="Close (Esc)"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Desktop Prev button */}
      {activeStoryIndex > 0 && (
        <button
          onClick={handlePrev}
          className="absolute left-4 md:left-10 top-1/2 -translate-y-1/2 z-50 p-3 text-white bg-black/40 hover:bg-black/70 rounded-full transition-colors cursor-pointer hidden sm:block backdrop-blur-sm"
          title="Previous story"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
      )}

      {/* Desktop Next button */}
      {activeStoryIndex < stories.length - 1 && (
        <button
          onClick={handleNext}
          className="absolute right-4 md:right-10 top-1/2 -translate-y-1/2 z-50 p-3 text-white bg-black/40 hover:bg-black/70 rounded-full transition-colors cursor-pointer hidden sm:block backdrop-blur-sm"
          title="Next story"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      )}

      {/* Main Story Container (Aspect Ratio & Framing) */}
      <div className="relative w-full max-w-[430px] h-[92vh] max-h-[840px] rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between bg-slate-950 mx-2 sm:mx-4 border border-white/10">
        {/* Left/Right Tap zones for quick mobile skipping */}
        <div
          onClick={handlePrev}
          className="absolute left-0 top-20 bottom-32 w-1/4 z-10 cursor-pointer"
        />
        <div
          onClick={handleNext}
          className="absolute right-0 top-20 bottom-32 w-1/4 z-10 cursor-pointer"
        />

        {/* Story Background: Video, Image, or Gradient */}
        {isVideoStory && videoSrc ? (
          <video
            ref={videoRef}
            src={videoSrc}
            autoPlay
            playsInline
            preload="metadata"
            muted={isMuted}
            onError={() => {
              setTimeout(() => advanceToNextStory(), 3500);
            }}
            onTimeUpdate={(e) => {
              const vid = e.currentTarget;
              if (vid.duration && vid.duration > 0) {
                setProgress((vid.currentTime / vid.duration) * 100);
              }
            }}
            onEnded={advanceToNextStory}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : activeStory.mediaUrl ? (
          <img
            src={activeStory.mediaUrl}
            alt="Story"
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div
            className={`absolute inset-0 bg-gradient-to-br ${
              activeStory.gradientBg || 'from-indigo-600 via-purple-600 to-pink-500'
            } flex items-center justify-center p-8`}
          >
            <p className="text-white text-2xl font-bold text-center leading-snug drop-shadow-md">
              {activeStory.text}
            </p>
          </div>
        )}

        {/* Top Scrim gradient */}
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/85 via-black/45 to-transparent pointer-events-none z-10" />

        {/* Bottom Scrim gradient */}
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/90 via-black/55 to-transparent pointer-events-none z-10" />

        {/* Floating Animated Reaction Emojis Stream Burst */}
        <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
          {floatingParticles.map((particle) => (
            <div
              key={particle.id}
              className="absolute text-4xl select-none filter drop-shadow-2xl transition-all"
              style={{
                left: `${particle.x}%`,
                bottom: '90px',
                animation: `floatUpStoryParticle ${particle.duration}s cubic-bezier(0.2, 0.8, 0.2, 1) forwards`,
                transform: `scale(${particle.scale})`,
              }}
            >
              {particle.emoji}
            </div>
          ))}
        </div>
        <style>{`
          @keyframes floatUpStoryParticle {
            0% {
              opacity: 1;
              transform: translateY(0) scale(0.6) rotate(0deg);
            }
            30% {
              opacity: 1;
              transform: translateY(-180px) scale(1.35) rotate(15deg);
            }
            70% {
              opacity: 0.9;
              transform: translateY(-380px) scale(1.15) rotate(-12deg);
            }
            100% {
              opacity: 0;
              transform: translateY(-560px) scale(0.85) rotate(22deg);
            }
          }
        `}</style>

        {/* TOP SECTION: Progress bars, Author bar & Music Tag */}
        <div className="relative z-20 p-3.5 space-y-2.5">
          {/* Progress Bars */}
          <div className="flex items-center gap-1.5 w-full">
            {stories.map((s, idx) => (
              <div
                key={s.id}
                className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
              >
                <div
                  className="h-full bg-white transition-all duration-75"
                  style={{
                    width:
                      idx < activeStoryIndex
                        ? '100%'
                        : idx === activeStoryIndex
                        ? `${progress}%`
                        : '0%',
                  }}
                />
              </div>
            ))}
          </div>

          {/* Author metadata & Top Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img
                src={activeStory.author.avatar}
                alt={activeStory.author.name}
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-full border-2 border-blue-500 object-cover shadow-md"
              />
              <div>
                <p className="text-sm font-bold text-white leading-tight flex items-center gap-1.5 drop-shadow">
                  <span>
                    {language === 'bn'
                      ? activeStory.author.nameBn || activeStory.author.name
                      : activeStory.author.name}
                  </span>
                  {activeStory.author.isVerified && (
                    <span className="w-3.5 h-3.5 rounded-full bg-blue-500 text-white inline-flex items-center justify-center text-[9px] font-bold">
                      ✓
                    </span>
                  )}
                </p>
                <div className="flex items-center gap-2 text-xs text-white/80">
                  <span>{activeStory.createdAt}</span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-white/15 text-[10px] font-semibold text-sky-300">
                    <Clock className="w-2.5 h-2.5" />
                    {(() => {
                      const rem = activeStory.expiresAt
                        ? Math.max(
                            1,
                            Math.min(
                              24,
                              Math.ceil((activeStory.expiresAt - Date.now()) / (1000 * 60 * 60)),
                            ),
                          )
                        : 24;
                      return language === 'bn' ? `${rem} ঘন্টা বাকি` : `${rem}h left`;
                    })()}
                  </span>
                </div>
              </div>
            </div>

            {/* Top Right Buttons: Audio Mute, Play/Pause, Delete */}
            <div className="flex items-center gap-1.5">
              {/* Audio Mute / Unmute Toggle */}
              <button
                type="button"
                onClick={() => setIsMuted((prev) => !prev)}
                className="p-2 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors cursor-pointer backdrop-blur-md"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              {/* Play / Pause Toggle */}
              <button
                type="button"
                onClick={() => setIsPaused((prev) => !prev)}
                className="p-2 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors cursor-pointer backdrop-blur-md"
                title={isPaused ? 'Play' : 'Pause'}
              >
                {isPaused ? (
                  <Play className="w-4 h-4 fill-current" />
                ) : (
                  <Pause className="w-4 h-4" />
                )}
              </button>

              {/* Share button */}
              <button
                type="button"
                onClick={handleShareStory}
                className="p-2 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors cursor-pointer backdrop-blur-md"
                title={language === 'bn' ? 'স্টোরি শেয়ার করুন' : 'Share story'}
              >
                <Share2 className="w-4 h-4" />
              </button>

              {/* Delete story if author is currentUser */}
              {activeStory.author.id === currentUser.id && (
                <button
                  type="button"
                  onClick={() => {
                    const idToDelete = activeStory.id;
                    if (stories.length <= 1) {
                      setActiveStoryIndex(null);
                    } else if (activeStoryIndex >= stories.length - 1) {
                      setActiveStoryIndex(Math.max(0, activeStoryIndex - 1));
                    }
                    deleteStory(idToDelete);
                  }}
                  className="p-2 rounded-full bg-red-500/80 hover:bg-red-600 text-white transition-colors cursor-pointer shadow-md"
                  title={language === 'bn' ? 'স্টোরি মুছুন' : 'Delete story'}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* ============================================================== */}
          {/* THE REQUESTED MUSIC TAG & BACKGROUND AUDIO PLAYER COMPONENT   */}
          {/* Displays Song Title and Artist currently playing over story    */}
          {/* ============================================================== */}
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                setIsPaused(true);
                setIsMusicDetailsOpen(true);
              }}
              className="group flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white text-xs transition-all shadow-lg cursor-pointer max-w-[85%]"
              title={language === 'bn' ? 'মিউজিক প্লেয়ার বিস্তারিত দেখুন' : 'View Music Details'}
            >
              {/* Spinning Vinyl Disc Icon */}
              <div className="relative flex items-center justify-center shrink-0">
                <Disc3
                  className={`w-4 h-4 text-purple-400 ${
                    !isPaused && !isMuted ? 'animate-spin-slow' : ''
                  }`}
                />
                <span className="absolute w-1 h-1 rounded-full bg-white" />
              </div>

              {/* Equalizer animation bars */}
              <div className="flex items-end gap-0.5 h-3 shrink-0">
                <span
                  className={`w-0.5 bg-gradient-to-t from-pink-500 to-purple-400 rounded-full ${
                    !isPaused && !isMuted ? 'animate-eq-1' : 'h-1'
                  }`}
                />
                <span
                  className={`w-0.5 bg-gradient-to-t from-pink-500 to-purple-400 rounded-full ${
                    !isPaused && !isMuted ? 'animate-eq-2' : 'h-2'
                  }`}
                />
                <span
                  className={`w-0.5 bg-gradient-to-t from-pink-500 to-purple-400 rounded-full ${
                    !isPaused && !isMuted ? 'animate-eq-3' : 'h-1.5'
                  }`}
                />
                <span
                  className={`w-0.5 bg-gradient-to-t from-pink-500 to-purple-400 rounded-full ${
                    !isPaused && !isMuted ? 'animate-eq-4' : 'h-1'
                  }`}
                />
              </div>

              {/* Song Title & Artist marquee */}
              <div className="flex items-center gap-1.5 overflow-hidden text-left truncate">
                <span className="font-bold text-white truncate max-w-[140px] group-hover:text-purple-300 transition-colors">
                  {activeAudioTitle}
                </span>
                <span className="text-white/60 text-[10px]">•</span>
                <span className="text-purple-300/90 text-[11px] truncate max-w-[110px] font-medium">
                  {activeAudioArtist}
                </span>
              </div>
            </button>

            {/* Quick Audio Controls badge */}
            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              className="px-2 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold border border-white/15 backdrop-blur-sm cursor-pointer flex items-center gap-1"
            >
              {isMuted ? (
                <>
                  <VolumeX className="w-3 h-3 text-rose-400" />
                  <span>{language === 'bn' ? 'শব্দ বন্ধ' : 'Muted'}</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3 h-3 text-emerald-400" />
                  <span>{language === 'bn' ? 'চলছে' : 'Playing'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* MIDDLE SECTION: Story Text Overlay if media present */}
        {(activeStory.mediaUrl || activeStory.videoUrl) && activeStory.text && (
          <div className="relative z-20 px-6 py-4 text-center my-auto">
            <span className="inline-block px-4 py-2.5 rounded-2xl bg-black/60 backdrop-blur-md text-white text-base font-semibold drop-shadow-lg leading-relaxed border border-white/15">
              {activeStory.text}
            </span>
          </div>
        )}

        {/* BOTTOM SECTION: Reactions breakdown pill, Reaction buttons & Reply input */}
        <div className="relative z-20 p-3.5 space-y-2.5">
          {/* Reaction Summary Pill & Viewers Button */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setIsPaused(true);
                setIsReactionsDrawerOpen(true);
              }}
              className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white text-xs cursor-pointer transition-colors shadow-md"
            >
              <div className="flex items-center -space-x-1">
                {Object.keys(activeStory.reactions || {}).length > 0 ? (
                  Object.keys(activeStory.reactions || {})
                    .slice(0, 3)
                    .map((emo, idx) => (
                      <span key={idx} className="text-sm">
                        {emo}
                      </span>
                    ))
                ) : (
                  <span className="text-sm">❤️</span>
                )}
              </div>
              <span className="font-semibold text-[11px] text-white/90">
                {totalReactionsCount > 0
                  ? language === 'bn'
                    ? `${totalReactionsCount} টি রিঅ্যাকশন`
                    : `${totalReactionsCount} reactions`
                  : language === 'bn'
                  ? 'প্রথম রিঅ্যাক্ট করুন'
                  : 'Be first to react'}
              </span>
              <span className="text-white/40">•</span>
              <span className="text-[10px] text-sky-300 flex items-center gap-1 font-medium">
                <Eye className="w-3 h-3" />
                <span>{activeStory.viewsCount || 0}</span>
              </span>
            </button>

            {myReaction && (
              <span className="px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white text-[11px] font-semibold border border-white/20 flex items-center gap-1">
                <span>{language === 'bn' ? 'আপনার রিঅ্যাক্ট:' : 'You reacted:'}</span>
                <span className="text-sm">{myReaction}</span>
              </span>
            )}
          </div>

          {/* ============================================================== */}
          {/* THE REQUESTED FLOATING REACTION BUTTONS (like, love, wow, haha, sad, angry) */}
          {/* ============================================================== */}
          {/* Animated Quick Reaction Dock */}
          <div className="flex items-center justify-between gap-1 px-3 py-2 rounded-2xl bg-black/65 backdrop-blur-md border border-white/20 shadow-2xl">
            {STORY_REACTIONS.map(({ type, emoji, labelEn, labelBn }) => {
              const isSelected = myReaction === emoji;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleSendReaction(emoji)}
                  title={language === 'bn' ? labelBn : labelEn}
                  className={`group relative flex flex-col items-center p-1 rounded-xl transition-all duration-200 cursor-pointer select-none active:scale-75 hover:scale-130 hover:-translate-y-1 ${
                    isSelected ? 'ring-2 ring-purple-400 bg-white/20 shadow-inner' : 'hover:bg-white/10'
                  }`}
                >
                  <span className="text-2xl drop-shadow-md filter transition-transform group-hover:scale-115 group-active:scale-90 group-hover:rotate-6 inline-block">
                    {emoji}
                  </span>
                  <span className="text-[9px] text-white/70 font-semibold group-hover:text-white transition-colors">
                    {language === 'bn' ? labelBn : labelEn}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Reply input & Send button */}
          <form onSubmit={handleSendReply} className="flex items-center gap-2">
            <input
              type="text"
              placeholder={
                language === 'bn'
                  ? `${activeStory.author.nameBn || activeStory.author.name}-কে মেসেজ পাঠান...`
                  : `Reply to ${activeStory.author.name}...`
              }
              value={replyText}
              onFocus={() => setIsPaused(true)}
              onBlur={() => setIsPaused(false)}
              onChange={(e) => setReplyText(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-full bg-white/20 hover:bg-white/25 focus:bg-white/30 text-white placeholder-white/70 text-sm focus:outline-none backdrop-blur-md border border-white/15 transition-all"
            />
            <button
              type="submit"
              disabled={!replyText.trim()}
              className="p-2.5 rounded-full bg-blue-600 text-white disabled:opacity-40 hover:bg-blue-500 transition-colors cursor-pointer shadow-lg shrink-0"
              title="Send reply"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* ============================================================== */}
        {/* MUSIC PLAYER DETAILS SHEET                                     */}
        {/* ============================================================== */}
        {isMusicDetailsOpen && (
          <div className="absolute inset-x-0 bottom-0 z-40 bg-slate-900/95 backdrop-blur-xl rounded-t-3xl border-t border-purple-500/30 p-5 shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Music2 className="w-5 h-5 text-purple-400" />
                <h4 className="text-white font-bold text-sm">
                  {language === 'bn' ? 'স্টোরি ব্যাকগ্রাউন্ড মিউজিক' : 'Story Background Music'}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsMusicDetailsOpen(false);
                  setIsPaused(false);
                }}
                className="p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Song Card Info */}
            <div className="flex items-center gap-4 py-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center shadow-lg relative overflow-hidden shrink-0">
                <Disc3
                  className={`w-10 h-10 text-white/90 ${
                    !isMuted && !isPaused ? 'animate-spin-slow' : ''
                  }`}
                />
                <span className="absolute w-2.5 h-2.5 rounded-full bg-black/60 border border-white/30" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-base leading-tight truncate">
                  {activeAudioTitle}
                </p>
                <p className="text-purple-300 text-xs font-medium truncate mt-0.5">
                  {activeAudioArtist}
                </p>
                <div className="flex items-center gap-2 mt-1.5 text-[11px] text-white/60">
                  <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-medium">
                    🎵 High Fidelity Audio
                  </span>
                  <span>•</span>
                  <span>{Math.floor(audioCurrentTime)}s / {Math.floor(audioDuration || 30)}s</span>
                </div>
              </div>
            </div>

            {/* Audio Waveform / Seek bar */}
            <div className="space-y-1 mb-4">
              <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-150"
                  style={{
                    width: `${
                      audioDuration > 0
                        ? (audioCurrentTime / audioDuration) * 100
                        : progress
                    }%`,
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-white/50">
                <span>0:00</span>
                <span>
                  {audioDuration > 0
                    ? `0:${Math.floor(audioDuration).toString().padStart(2, '0')}`
                    : '0:30'}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleUseAudioForCreation}
                className="py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>{language === 'bn' ? 'এই অডিও দিয়ে স্টোরি ছাড়ুন' : 'Use in My Story'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  try {
                    localStorage.setItem('bandhan_selected_audio', activeAudioTitle);
                  } catch {}
                  setIsMusicDetailsOpen(false);
                  setActiveStoryIndex(null);
                  setIsCreateReelOpen(true);
                  showToast(
                    language === 'bn'
                      ? `🎬 "${activeAudioTitle}" রিলের জন্য নির্বাচিত হয়েছে!`
                      : `🎬 "${activeAudioTitle}" selected for Reel!`,
                  );
                }}
                className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-white/15"
              >
                <Disc3 className="w-4 h-4 text-purple-400" />
                <span>{language === 'bn' ? 'রিলে ব্যবহার করুন' : 'Use in Reel'}</span>
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* REACTIONS & VIEWERS DRAWER                                    */}
        {/* ============================================================== */}
        {isReactionsDrawerOpen && (
          <div className="absolute inset-x-0 bottom-0 z-40 bg-slate-900/95 backdrop-blur-xl rounded-t-3xl border-t border-white/20 p-5 shadow-2xl max-h-[60%] flex flex-col animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-lg">🎉</span>
                <h4 className="text-white font-bold text-sm">
                  {language === 'bn' ? 'স্টোরি রিঅ্যাকশন ও দর্শক' : 'Story Reactions & Viewers'}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsReactionsDrawerOpen(false);
                  setIsPaused(false);
                }}
                className="p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Reaction Filter Chips */}
            <div className="flex items-center gap-1.5 py-3 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setSelectedReactionFilter('all')}
                className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 cursor-pointer transition-colors ${
                  selectedReactionFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white/10 text-white/70 hover:text-white'
                }`}
              >
                {language === 'bn' ? `সব (${totalReactionsCount})` : `All (${totalReactionsCount})`}
              </button>
              {STORY_REACTIONS.map(({ emoji, type }) => {
                const count = activeStory.reactions?.[emoji] || 0;
                if (count === 0) return null;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSelectedReactionFilter(emoji)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium shrink-0 flex items-center gap-1 cursor-pointer transition-colors ${
                      selectedReactionFilter === emoji
                        ? 'bg-purple-600 text-white'
                        : 'bg-white/10 text-white/80 hover:bg-white/20'
                    }`}
                  >
                    <span>{emoji}</span>
                    <span>{count}</span>
                  </button>
                );
              })}
            </div>

            {/* Viewers & Reactors List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 no-scrollbar">
              {filteredReactionUsers.length > 0 ? (
                filteredReactionUsers.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="relative">
                        <img
                          src={item.userAvatar}
                          alt={item.userName}
                          referrerPolicy="no-referrer"
                          className="w-9 h-9 rounded-full object-cover border border-white/20"
                        />
                        <span className="absolute -bottom-1 -right-1 text-sm bg-slate-900 rounded-full px-0.5">
                          {item.emoji}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">{item.userName}</p>
                        <p className="text-[10px] text-white/60">{item.createdAt}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        sendMessage(item.userId, 'Thanks for viewing my story! 😊');
                        showToast(
                          language === 'bn'
                            ? `${item.userName}-কে ধন্যবাদ মেসেজ পাঠানো হয়েছে!`
                            : `Message sent to ${item.userName}!`,
                        );
                      }}
                      className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold cursor-pointer"
                    >
                      {language === 'bn' ? 'মেসেজ' : 'Message'}
                    </button>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-white/60 text-xs">
                  <p>
                    {language === 'bn'
                      ? 'এখনও এই ক্যাটাগরিতে কোনো রিঅ্যাকশন নেই'
                      : 'No reactions in this category yet'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

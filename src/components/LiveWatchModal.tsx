import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Radio,
  Eye,
  Heart,
  Flame,
  Laugh,
  Send,
  Volume2,
  VolumeX,
  Share2,
  Maximize,
  Minimize,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Post } from '../types';

interface LiveWatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post | null;
}

const FALLBACK_LIVE_VIDEOS = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
];

export const LiveWatchModal: React.FC<LiveWatchModalProps> = ({ isOpen, onClose, post }) => {
  const { currentUser, language, showToast, reactToPost } = useApp();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const commentsEndRef = useRef<HTMLDivElement | null>(null);

  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [viewerCount, setViewerCount] = useState(() => Math.floor(Math.random() * 25) + 38);
  const [liveComments, setLiveComments] = useState<
    { id: string; sender: string; avatar?: string; text: string; time: string }[]
  >([]);
  const [commentText, setCommentText] = useState('');
  const [floatingEmojis, setFloatingEmojis] = useState<{ id: number; emoji: string }[]>([]);

  // Initialize live session and comments
  useEffect(() => {
    if (!isOpen || !post) {
      setLiveComments([]);
      setVideoError(false);
      return;
    }

    // Initial simulated active comments
    const initial = [
      {
        id: 'lc_1',
        sender: 'Arafat Hossain',
        text: language === 'bn' ? 'লাইভে যুক্ত হলাম! আওয়াজ একদম ক্লিয়ার ভাই 🔥' : 'Joined the live! Audio is super clear 🔥',
        time: 'Just now',
      },
      {
        id: 'lc_2',
        sender: 'Nusrat Jahan',
        text: language === 'bn' ? 'অনেক সুন্দর লাইভ সম্প্রচার ❤️✨' : 'Awesome broadcast ❤️✨',
        time: 'Just now',
      },
      {
        id: 'lc_3',
        sender: 'Tanvir Ahmed',
        text: language === 'bn' ? 'সবাই লাইক ও শেয়ার দিন 👍' : 'Drop likes and shares everyone 👍',
        time: 'Just now',
      },
    ];
    setLiveComments(initial);

    // Periodically update viewer count and simulate incoming interaction
    const viewerInterval = setInterval(() => {
      setViewerCount((prev) => Math.max(12, prev + Math.floor(Math.random() * 5) - 2));
    }, 4000);

    return () => {
      clearInterval(viewerInterval);
    };
  }, [isOpen, post, language]);

  // Scroll to bottom of comments
  useEffect(() => {
    if (commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [liveComments]);

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !post) return;

    const newC = {
      id: `lc_${Date.now()}`,
      sender: language === 'bn' ? currentUser.nameBn || currentUser.name : currentUser.name,
      avatar: currentUser.avatar,
      text: commentText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setLiveComments((prev) => [...prev, newC]);
    setCommentText('');
    triggerFloatingReaction('❤️');
  };

  const triggerFloatingReaction = (emoji: string) => {
    const id = Date.now() + Math.random();
    setFloatingEmojis((prev) => [...prev, { id, emoji }]);
    if (post) {
      reactToPost(post.id, emoji === '❤️' ? 'love' : 'like');
    }
    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((item) => item.id !== id));
    }, 1800);
  };

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };

  if (!isOpen || !post) return null;

  const authorName = language === 'bn' ? post.author.nameBn || post.author.name : post.author.name;
  const videoSource = post.video || FALLBACK_LIVE_VIDEOS[0];

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200 select-none">
      <div
        className={`bg-slate-950 border border-slate-800 w-full rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row relative transition-all ${
          isFullscreen ? 'fixed inset-0 rounded-none max-w-none h-full' : 'max-w-5xl h-[92vh] max-h-[820px]'
        }`}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white cursor-pointer transition-colors shadow-lg"
          title="Close live room"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Video Player Section (Left) */}
        <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden min-h-[300px] md:min-h-full">
          {!videoError ? (
            <video
              ref={videoRef}
              src={videoSource}
              autoPlay
              loop
              playsInline
              preload="metadata"
              muted={isMuted}
              onError={() => {
                console.warn('Live video stream error, switching to HD visualizer fallback');
                setVideoError(true);
              }}
              className="w-full h-full object-cover"
            />
          ) : (
            /* Resilient Canvas/Visualizer Studio Fallback when network/video source fails */
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-red-950/40 to-slate-900 flex flex-col items-center justify-center p-6 text-center text-white">
              <div className="relative mb-4">
                <div className="w-24 h-24 rounded-full border-4 border-red-500/80 overflow-hidden shadow-2xl animate-pulse">
                  <img src={post.author.avatar} alt={authorName} className="w-full h-full object-cover" />
                </div>
                <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-red-600 text-[10px] font-black uppercase tracking-wider">
                  LIVE
                </span>
              </div>
              <h3 className="text-lg font-bold">{authorName}</h3>
              <p className="text-xs text-emerald-300 font-semibold mt-1 max-w-md">
                {language === 'bn'
                  ? '🔴 লাইভ ভিডিও সম্প্রচার নিরবচ্ছিন্নভাবে চলছে। কমেন্ট ও রিঅ্যাকশন দিন।'
                  : '🔴 Public Live Broadcast Stream Active. Send comments and live reactions below.'}
              </p>
              <button
                type="button"
                onClick={() => {
                  setVideoError(false);
                  setTimeout(() => {
                    videoRef.current?.load();
                    videoRef.current?.play().catch(() => {});
                  }, 50);
                }}
                className="mt-4 px-4 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-xs font-bold text-white cursor-pointer border border-white/20"
              >
                {language === 'bn' ? 'ভিডিও পুনরায় চালু করুন' : 'Reload Live Video'}
              </button>
            </div>
          )}

          {/* Gradient Scrims */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/60 pointer-events-none" />

          {/* Top Host & Live Stats Bar */}
          <div className="absolute top-4 left-4 z-30 flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600 text-white text-xs font-black uppercase tracking-wider animate-pulse shadow-lg">
              <Radio className="w-3.5 h-3.5" />
              {language === 'bn' ? 'সরাসরি লাইভ' : 'LIVE'}
            </span>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/65 backdrop-blur-md text-white border border-white/10 shadow-md">
              <img src={post.author.avatar} alt={authorName} className="w-5 h-5 rounded-full object-cover" />
              <span className="text-xs font-bold truncate max-w-[130px]">{authorName}</span>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-black/65 backdrop-blur-md text-white text-xs font-bold flex items-center gap-1 border border-white/10">
              <Eye className="w-3.5 h-3.5 text-emerald-400" />
              <span>{viewerCount}</span>
            </span>
          </div>

          {/* Floating Emoji Reactions */}
          <div className="absolute right-4 bottom-20 z-30 flex flex-col gap-2 pointer-events-none">
            {floatingEmojis.map((item) => (
              <span key={item.id} className="text-4xl animate-bounce drop-shadow-xl">
                {item.emoji}
              </span>
            ))}
          </div>

          {/* Bottom Stream Player Controls */}
          <div className="absolute bottom-4 inset-x-4 z-30 flex items-center justify-between p-2.5 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 text-white">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-colors"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
              </button>
              <button
                type="button"
                onClick={toggleFullscreen}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-colors hidden sm:flex"
                title="Toggle Fullscreen"
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </button>
            </div>

            {/* Quick Reactions Bar */}
            <div className="flex items-center gap-1.5">
              {[
                { emoji: '❤️', icon: Heart, color: 'text-rose-500' },
                { emoji: '🔥', icon: Flame, color: 'text-amber-500' },
                { emoji: '😂', icon: Laugh, color: 'text-yellow-400' },
                { emoji: '👏', icon: Sparkles, color: 'text-sky-400' },
              ].map((r) => (
                <button
                  key={r.emoji}
                  type="button"
                  onClick={() => triggerFloatingReaction(r.emoji)}
                  className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/25 text-sm cursor-pointer transition-transform hover:scale-110 active:scale-95"
                >
                  {r.emoji}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Chat & Comments Section (Right Column) */}
        <div className="w-full md:w-80 lg:w-96 bg-slate-900 border-t md:border-t-0 md:border-l border-slate-800 flex flex-col justify-between h-72 md:h-full">
          {/* Live Chat Header */}
          <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span>{language === 'bn' ? 'সরাসরি লাইভ চ্যাট' : 'Live Chat Room'}</span>
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[200px]">
                {post.content}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                showToast(
                  language === 'bn'
                    ? 'লাইভ স্ট্রিম শেয়ার লিঙ্ক কপি করা হয়েছে!'
                    : 'Live stream link copied!',
                );
              }}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              title="Share live"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>

          {/* Comments List */}
          <div className="flex-1 p-3 overflow-y-auto space-y-2.5 text-xs">
            {liveComments.map((c) => (
              <div key={c.id} className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/50">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-bold text-sky-400">{c.sender}</span>
                  <span className="text-[10px] text-slate-500">{c.time}</span>
                </div>
                <p className="text-slate-200 text-xs break-words">{c.text}</p>
              </div>
            ))}
            <div ref={commentsEndRef} />
          </div>

          {/* Live Comment Input Box */}
          <form onSubmit={handleSendComment} className="p-3 border-t border-slate-800 flex items-center gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={language === 'bn' ? 'লাইভে মন্তব্য লিখুন...' : 'Say something in live chat...'}
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
            <button
              type="submit"
              disabled={!commentText.trim()}
              className="p-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white cursor-pointer transition-colors shadow-md"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

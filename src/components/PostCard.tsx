import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  ThumbsUp,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  Trash2,
  Copy,
  Globe,
  Users as UsersIcon,
  Lock,
  Send,
  CornerDownRight,
  Heart,
  Smile,
  Check,
  Ban,
  Pin,
  MapPin,
  Radio,
  UserPlus,
  UserCheck,
  ChevronDown,
  Eye,
  BarChart2,
  Clock,
  X,
  Hourglass,
  Flame,
  Play,
  RotateCcw,
  RotateCw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Post, ReactionType } from '../types';
import { useApp } from '../context/AppContext';
import { ShareModal } from './ShareModal';
import { PostInsightsModal } from './PostInsightsModal';
import { LiveWatchModal } from './LiveWatchModal';

interface PostCardProps {
  post: Post;
}

const REACTIONS: { type: ReactionType; emoji: string; labelEn: string; labelBn: string; color: string }[] = [
  { type: 'like', emoji: '👍', labelEn: 'Like', labelBn: 'লাইক', color: 'text-blue-600' },
  { type: 'love', emoji: '❤️', labelEn: 'Love', labelBn: 'লাভ', color: 'text-rose-500' },
  { type: 'care', emoji: '🥰', labelEn: 'Care', labelBn: 'কেয়ার', color: 'text-amber-500' },
  { type: 'haha', emoji: '😂', labelEn: 'Haha', labelBn: 'হাহা', color: 'text-yellow-500' },
  { type: 'wow', emoji: '😮', labelEn: 'Wow', labelBn: 'ওয়াও', color: 'text-amber-400' },
  { type: 'sad', emoji: '😢', labelEn: 'Sad', labelBn: 'স্যাড', color: 'text-yellow-600' },
  { type: 'angry', emoji: '😡', labelEn: 'Angry', labelBn: 'অ্যাংরি', color: 'text-orange-600' },
];

const REACTION_BURSTS: Record<ReactionType, { emoji: string; particles: string[] }> = {
  like: { emoji: '👍', particles: ['👍', '🌟', '✨', '🔥', '💙'] },
  love: { emoji: '❤️', particles: ['💖', '❤️', '✨', '💗', '🔥'] },
  care: { emoji: '🥰', particles: ['🥰', '💖', '✨', '🌸', '🤗'] },
  haha: { emoji: '😂', particles: ['😂', '🤣', '😆', '✨', '🎉'] },
  wow: { emoji: '😮', particles: ['😮', '🤩', '✨', '🌟', '💫'] },
  sad: { emoji: '😢', particles: ['😢', '🥺', '💧', '💔', '🌧️'] },
  angry: { emoji: '😡', particles: ['😡', '💥', '💢', '🔥', '⚡'] },
};

const SOCIAL_COMMENT_EMOJIS = [
  '😀', '😂', '😍', '🥰', '😎', '🥳', '😭', '😮', '😡', '🤔',
  '👍', '👏', '🙏', '🔥', '✨', '💖', '❤️', '💯', '🎉', '🌟',
  '🌹', '🌸', '🤝', '🙌', '💪', '🤗', '🤩', '😇', '🥺', '🚀',
  '😘', '😋', '😜', '🤤', '😴', '🤐', '🤯', '🤠', '💐', '🎊',
];

export const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const {
    currentUser,
    reactToPost,
    votePoll,
    deletePost,
    setPostSelfDestructTimer,
    updatePostPrivacy,
    togglePinPost,
    toggleSavePost,
    addComment,
    deleteComment,
    likeComment,
    reactToComment,
    sharePost,
    language,
    t,
    showToast,
    viewUserProfile,
    enterGroup,
    blockUser,
    isFollowingUser,
    toggleFollowUser,
  } = useApp();

  const rawMediaSrc = post.video || post.image || '';
  const isVideoPost = Boolean(
    post.video ||
      post.mediaType === 'video' ||
      rawMediaSrc.startsWith('data:video') ||
      /\.(mp4|webm|mov|m4v)(\?|$)/i.test(rawMediaSrc) ||
      rawMediaSrc.includes('/video/upload/'),
  );
  const resolvedVideoSrc = isVideoPost ? rawMediaSrc : undefined;

  const [showReactionsPopover, setShowReactionsPopover] = useState(false);
  const [hoveredReaction, setHoveredReaction] = useState<ReactionType | null>(null);
  const [isPrivacyMenuOpen, setIsPrivacyMenuOpen] = useState(false);
  const [activeCommentReactionPicker, setActiveCommentReactionPicker] = useState<string | null>(null);
  const [showComments, setShowComments] = useState(
    Boolean(isVideoPost || post.isLive || (post.comments && post.comments.length > 0)),
  );
  const [commentText, setCommentText] = useState('');
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isCommentEmojiPickerOpen, setIsCommentEmojiPickerOpen] = useState(false);
  const [isReplyEmojiPickerOpen, setIsReplyEmojiPickerOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSelfDestructMenuOpen, setIsSelfDestructMenuOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);
  const [isLiveWatchOpen, setIsLiveWatchOpen] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const postVideoRef = useRef<HTMLVideoElement | null>(null);
  const [videoSeekFeedback, setVideoSeekFeedback] = useState<{ dir: 'back' | 'forward'; id: number } | null>(null);

  const seekVideoBySeconds = (deltaSeconds: number) => {
    if (!postVideoRef.current) return;
    const current = postVideoRef.current.currentTime || 0;
    const duration = postVideoRef.current.duration || 0;
    const nextTime = Math.max(0, Math.min(duration || current + deltaSeconds, current + deltaSeconds));
    postVideoRef.current.currentTime = nextTime;
    setVideoSeekFeedback({ dir: deltaSeconds < 0 ? 'back' : 'forward', id: Date.now() });
    setTimeout(() => {
      setVideoSeekFeedback(null);
    }, 700);
  };

  const [burstingReaction, setBurstingReaction] = useState<{ emoji: string; particles: string[] } | null>(null);
  const burstTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [liveViewerCount, setLiveViewerCount] = useState(() => 142 + Math.floor(Math.random() * 90));
  const [commentSortOrder, setCommentSortOrder] = useState<'top' | 'recent' | 'oldest'>('top');

  // Self-destruct live countdown
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(() => {
    if (!post.expiresAt) return null;
    return Math.max(0, Math.floor((new Date(post.expiresAt).getTime() - Date.now()) / 1000));
  });

  useEffect(() => {
    if (!post.expiresAt) {
      setRemainingSeconds(null);
      return;
    }
    const updateRemaining = () => {
      const diff = Math.max(0, Math.floor((new Date(post.expiresAt!).getTime() - Date.now()) / 1000));
      setRemainingSeconds(diff);
    };
    updateRemaining();
    const interval = window.setInterval(updateRemaining, 1000);
    return () => window.clearInterval(interval);
  }, [post.expiresAt]);

  const formatRemainingTime = (seconds: number) => {
    if (seconds <= 0) return language === 'bn' ? 'মুছে ফেলা হচ্ছে...' : 'Expiring...';
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins < 60) return `${mins}m ${secs}s`;
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    if (hours < 24) return `${hours}h ${remMins}m`;
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  };

  // Precise formatted date/time tooltip (e.g., 'October 24, 2026 at 4:30 PM')
  const getPreciseFormattedDate = (createdAt: string) => {
    let dateObj = new Date(createdAt);
    if (isNaN(dateObj.getTime())) {
      const now = Date.now();
      if (createdAt.includes('m ago') || createdAt.includes('মিনিট আগে')) {
        const mins = parseInt(createdAt, 10) || 15;
        dateObj = new Date(now - mins * 60 * 1000);
      } else if (createdAt.includes('h ago') || createdAt.includes('ঘণ্টা আগে') || createdAt.includes('ঘন্টা আগে')) {
        const hrs = parseInt(createdAt, 10) || 2;
        dateObj = new Date(now - hrs * 60 * 60 * 1000);
      } else if (createdAt.includes('d ago') || createdAt.includes('দিন আগে')) {
        const days = parseInt(createdAt, 10) || 1;
        dateObj = new Date(now - days * 24 * 60 * 60 * 1000);
      } else if (createdAt === 'Just now' || createdAt === 'এইমাত্র') {
        dateObj = new Date();
      } else {
        const idTimestampMatch = post.id.match(/\d{10,13}/);
        if (idTimestampMatch) {
          dateObj = new Date(parseInt(idTimestampMatch[0], 10));
        } else {
          dateObj = new Date();
        }
      }
    }

    const monthNamesEn = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    const month = monthNamesEn[dateObj.getMonth()];
    const day = dateObj.getDate();
    const year = dateObj.getFullYear();

    let hours = dateObj.getHours();
    const minutes = dateObj.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutesStr = minutes < 10 ? `0${minutes}` : `${minutes}`;

    return `${month} ${day}, ${year} at ${hours}:${minutesStr} ${ampm}`;
  };

  // Sorted Comments List (Top, Recent, Oldest)
  const sortedComments = useMemo(() => {
    if (!post.comments || post.comments.length === 0) return [];
    const list = [...post.comments];
    if (commentSortOrder === 'top') {
      return list.sort((a, b) => {
        const likesA = (a.likesCount || 0) + Object.values(a.reactions || {}).reduce((s, c) => s + c, 0);
        const likesB = (b.likesCount || 0) + Object.values(b.reactions || {}).reduce((s, c) => s + c, 0);
        return likesB - likesA;
      });
    } else if (commentSortOrder === 'recent') {
      return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (commentSortOrder === 'oldest') {
      return list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
    return list;
  }, [post.comments, commentSortOrder]);

  const triggerReactionBurst = (type: ReactionType) => {
    if (burstTimeoutRef.current) clearTimeout(burstTimeoutRef.current);
    const burstData = REACTION_BURSTS[type] || REACTION_BURSTS.like;
    setBurstingReaction(burstData);
    burstTimeoutRef.current = setTimeout(() => {
      setBurstingReaction(null);
    }, 850);
  };

  const popoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hoverDelayTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const longPressTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const longPressTriggeredRef = useRef<boolean>(false);
  const commentPopoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Active reaction for currently logged-in account (strictly per-user ID isolated and safe against null currentUser)
  const activeUserReaction: ReactionType | null =
    (post.userReactions && currentUser?.id && post.userReactions[currentUser.id]) ||
    post.userReaction ||
    null;

  const safeReactions: Partial<Record<ReactionType, number>> = post.reactions || {
    like: 0,
    love: 0,
    care: 0,
    haha: 0,
    wow: 0,
    sad: 0,
    angry: 0,
  };

  const totalReactions = Object.values(safeReactions).reduce(
    (sum, count) => sum + (typeof count === 'number' ? count : 0),
    0,
  );

  const activeReactionObj = REACTIONS.find((r) => r.type === activeUserReaction);

  const handleCommentMouseEnter = (id: string) => {
    if (commentPopoverTimeoutRef.current) clearTimeout(commentPopoverTimeoutRef.current);
    setActiveCommentReactionPicker(id);
  };

  const handleCommentMouseLeave = () => {
    commentPopoverTimeoutRef.current = setTimeout(() => {
      setActiveCommentReactionPicker(null);
    }, 350);
  };

  const getTopReactionsList = (
    reactions?: Partial<Record<ReactionType, number>>,
    userReaction?: ReactionType | null,
  ) => {
    const counts: { type: ReactionType; count: number }[] = [];
    if (reactions) {
      Object.entries(reactions).forEach(([type, cnt]) => {
        if ((cnt || 0) > 0) {
          counts.push({ type: type as ReactionType, count: cnt || 0 });
        }
      });
    }
    counts.sort((a, b) => b.count - a.count);
    const top = counts.map((c) => c.type);
    if (userReaction && !top.includes(userReaction)) {
      top.unshift(userReaction);
    }
    return top.length > 0 ? top.slice(0, 3) : userReaction ? [userReaction] : [];
  };

  // Hover delay (220ms) before opening reaction bar, and 320ms grace period before closing
  const handleMouseEnter = () => {
    if (popoverTimeoutRef.current) clearTimeout(popoverTimeoutRef.current);
    if (hoverDelayTimeoutRef.current) clearTimeout(hoverDelayTimeoutRef.current);
    hoverDelayTimeoutRef.current = setTimeout(() => {
      setShowReactionsPopover(true);
    }, 220);
  };

  const handleMouseLeave = () => {
    if (hoverDelayTimeoutRef.current) clearTimeout(hoverDelayTimeoutRef.current);
    popoverTimeoutRef.current = setTimeout(() => {
      setShowReactionsPopover(false);
      setHoveredReaction(null);
    }, 320);
  };

  // Mobile / Touch Long-Press (350ms) mechanism for reaction menu
  const handleTouchStartReaction = () => {
    longPressTriggeredRef.current = false;
    if (longPressTimeoutRef.current) clearTimeout(longPressTimeoutRef.current);
    longPressTimeoutRef.current = setTimeout(() => {
      longPressTriggeredRef.current = true;
      setShowReactionsPopover(true);
    }, 350);
  };

  const handleTouchEndReaction = () => {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
    }
  };

  const handleSelectReaction = (type: ReactionType) => {
    triggerReactionBurst(type);
    reactToPost(post.id, type);
    setShowReactionsPopover(false);
    setHoveredReaction(null);
  };

  const handleQuickLikeClick = () => {
    if (longPressTriggeredRef.current) {
      longPressTriggeredRef.current = false;
      return;
    }
    if (activeUserReaction) {
      reactToPost(post.id, activeUserReaction); // toggles off
    } else {
      triggerReactionBurst('like');
      reactToPost(post.id, 'like');
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addComment(post.id, commentText);
    setCommentText('');
    setShowComments(true);
  };

  const handleAddReply = (e: React.FormEvent, commentId: string) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    addComment(post.id, replyText, commentId);
    setReplyText('');
    setReplyingToCommentId(null);
  };

  const handleCopyLink = () => {
    navigator.clipboard?.writeText?.(window.location.href);
    showToast(t.linkCopied);
    setIsMenuOpen(false);
  };

  return (
    <article className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 mb-4 overflow-hidden transition-colors">
      {/* Pinned Post Indicator */}
      {post.isPinned && (
        <div className="px-4 pt-2.5 pb-1 flex items-center gap-1.5 text-[11px] font-bold text-blue-600 dark:text-blue-400 border-b border-slate-100 dark:border-slate-800/60 bg-blue-50/40 dark:bg-blue-950/20">
          <Pin className="w-3.5 h-3.5 fill-current" />
          <span>{language === 'bn' ? 'পিন করা পোস্ট' : 'Pinned Post'}</span>
        </div>
      )}

      {/* Scheduled Post Author Preview Banner */}
      {post.scheduledFor && new Date(post.scheduledFor).getTime() > Date.now() && (
        <div className="px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border-b border-blue-200 dark:border-blue-800 flex items-center justify-between text-xs text-blue-800 dark:text-blue-300 font-medium">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>
              {language === 'bn'
                ? `⏰ শিডিউল করা পোস্ট: ${new Date(post.scheduledFor).toLocaleString()} এ প্রকাশিত হবে (শুধুমাত্র আপনার প্রিভিউ)`
                : `⏰ Scheduled Post: Scheduled for ${new Date(post.scheduledFor).toLocaleString()} (Author preview)`}
            </span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white shadow-xs">
            {language === 'bn' ? 'শিডিউল্ড' : 'Scheduled'}
          </span>
        </div>
      )}

      {/* Self-Destruct Expiring Post Banner */}
      {post.expiresAt && remainingSeconds !== null && (
        <div className="px-4 py-2 bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-rose-500/15 dark:from-amber-950/40 dark:via-orange-950/40 dark:to-rose-950/40 border-b border-amber-300 dark:border-amber-800/80 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200 font-semibold">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500 animate-pulse shrink-0" />
            <span>
              {language === 'bn'
                ? `💥 স্বয়ংক্রিয় ধ্বংসশীল পোস্ট: আর মাত্র ${formatRemainingTime(remainingSeconds)} পর মুছে যাবে`
                : `💥 Self-Destruct Post: Deletes automatically in ${formatRemainingTime(remainingSeconds)}`}
            </span>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-600 text-white flex items-center gap-1 shadow-xs">
            <Hourglass className="w-3 h-3 animate-spin" />
            {formatRemainingTime(remainingSeconds)}
          </span>
        </div>
      )}

      {/* Post Header */}
      <div className="p-4 pb-2 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => viewUserProfile(post.author)}
            className="cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full shrink-0"
          >
            <img
              src={post.author.avatar}
              alt={post.author.name}
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-full object-cover hover:opacity-90 transition-opacity"
            />
          </button>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => viewUserProfile(post.author)}
                className="font-bold text-sm text-slate-900 dark:text-slate-100 hover:underline cursor-pointer text-left"
              >
                {language === 'bn' ? post.author.nameBn || post.author.name : post.author.name}
              </button>
              {post.author.isVerified && (
                <span className="text-blue-500 text-xs" title="Verified Account">
                  ✓
                </span>
              )}
              {post.author?.id && currentUser?.id && post.author.id !== currentUser.id && (
                <>
                  <span className="text-slate-300 dark:text-slate-600 text-xs">·</span>
                  <button
                    type="button"
                    onClick={() => toggleFollowUser(post.author.id)}
                    className={`text-xs font-bold cursor-pointer transition-colors ${
                      isFollowingUser(post.author.id)
                        ? 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                        : 'text-[#1877F2] dark:text-blue-400 hover:underline'
                    }`}
                  >
                    {isFollowingUser(post.author.id)
                      ? language === 'bn'
                        ? 'ফলো করছেন'
                        : 'Following'
                      : language === 'bn'
                      ? '+ ফলো করুন'
                      : '+ Follow'}
                  </button>
                </>
              )}
              {post.groupName && (
                <>
                  <span className="text-slate-400 text-xs">▸</span>
                  <button
                    type="button"
                    onClick={() => post.groupId && enterGroup(post.groupId)}
                    className="inline-flex items-center gap-1 font-bold text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    <UsersIcon className="w-3 h-3" />
                    <span>{post.groupName}</span>
                  </button>
                </>
              )}
              {post.isLive && (
                <button
                  type="button"
                  onClick={() => setIsLiveWatchOpen(true)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold uppercase tracking-wider animate-pulse cursor-pointer"
                  title={language === 'bn' ? 'লাইভ রুমে যোগ দিন' : 'Join Live Room'}
                >
                  <Radio className="w-2.5 h-2.5" />
                  {language === 'bn' ? 'লাইভ' : 'LIVE'}
                </button>
              )}
              {post.feeling && (
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {language === 'bn' ? post.feeling.labelBn : post.feeling.labelEn}
                </span>
              )}
              {post.location && (
                <span className="inline-flex items-center gap-0.5 text-xs text-slate-500 dark:text-slate-400">
                  <MapPin className="w-3 h-3 text-rose-500" />
                  <span>{post.location}</span>
                </span>
              )}
            </div>

            {/* Timestamp & Privacy Indicator Icon (Public, Friends, Only Me) */}
            {/* Timestamp with precise formatted date/time tooltip on hover & Privacy Indicator */}
            <div className="relative flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              <div className="relative group inline-flex items-center">
                <span
                  tabIndex={0}
                  className="cursor-pointer hover:underline hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                >
                  {post.createdAt}
                </span>

                {/* Floating precise date/time tooltip (e.g. October 24, 2026 at 4:30 PM) */}
                <div className="absolute left-0 bottom-full mb-1.5 hidden group-hover:flex group-focus:flex items-center px-2.5 py-1 text-[11px] font-semibold text-white bg-slate-900/95 dark:bg-slate-800 backdrop-blur-md rounded-lg shadow-xl whitespace-nowrap z-50 pointer-events-none border border-slate-700/60 animate-in fade-in zoom-in-95 duration-150">
                  <span>{getPreciseFormattedDate(post.createdAt)}</span>
                  <div className="absolute top-full left-3 border-4 border-transparent border-t-slate-900/95 dark:border-t-slate-800" />
                </div>
              </div>

              <span aria-hidden="true">·</span>

              <div className="relative inline-flex items-center">
                <button
                  type="button"
                  onClick={() => {
                    if (post.author.id === currentUser.id) {
                      setIsPrivacyMenuOpen((prev) => !prev);
                    }
                  }}
                  title={
                    post.privacy === 'public'
                      ? language === 'bn'
                        ? 'পাবলিক — যে কেউ দেখতে পারবে'
                        : 'Public — Anyone on Bandhan can view'
                      : post.privacy === 'friends'
                      ? language === 'bn'
                        ? 'বন্ধুদের জন্য — শুধুমাত্র বন্ধুরা দেখতে পারবে'
                        : 'Friends — Only your friends can view'
                      : language === 'bn'
                      ? 'শুধুমাত্র আমি — প্রাইভেট পোস্ট'
                      : 'Only Me — Visible only to you'
                  }
                  className={`inline-flex items-center gap-1 text-[11px] font-medium rounded-md px-1 py-0.5 transition-colors ${
                    post.author.id === currentUser.id
                      ? 'hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-slate-600 dark:text-slate-300'
                      : 'cursor-default text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {post.privacy === 'public' && (
                    <>
                      <Globe className="w-3.5 h-3.5 text-blue-500" />
                      <span>{language === 'bn' ? 'পাবলিক' : 'Public'}</span>
                    </>
                  )}
                  {post.privacy === 'friends' && (
                    <>
                      <UsersIcon className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{language === 'bn' ? 'বন্ধুরা' : 'Friends'}</span>
                    </>
                  )}
                  {post.privacy === 'only_me' && (
                    <>
                      <Lock className="w-3.5 h-3.5 text-amber-500" />
                      <span>{language === 'bn' ? 'শুধু আমি' : 'Only Me'}</span>
                    </>
                  )}
                  {post.author.id === currentUser.id && (
                    <ChevronDown className="w-3 h-3 opacity-70" />
                  )}
                </button>

                {/* Interactive Privacy Switcher Dropdown for Own Posts */}
                {isPrivacyMenuOpen && post.author.id === currentUser.id && (
                  <div className="absolute left-0 top-6 z-30 w-44 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1">
                    {(
                      [
                        {
                          id: 'public',
                          icon: Globe,
                          color: 'text-blue-500',
                          labelEn: 'Public (Anyone)',
                          labelBn: 'পাবলিক (সবার জন্য)',
                        },
                        {
                          id: 'friends',
                          icon: UsersIcon,
                          color: 'text-emerald-500',
                          labelEn: 'Friends Only',
                          labelBn: 'শুধু বন্ধুদের জন্য',
                        },
                        {
                          id: 'only_me',
                          icon: Lock,
                          color: 'text-amber-500',
                          labelEn: 'Only Me (Private)',
                          labelBn: 'শুধুমাত্র আমি',
                        },
                      ] as const
                    ).map((opt) => {
                      const IconComp = opt.icon;
                      const isSelected = post.privacy === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            updatePostPrivacy(post.id, opt.id);
                            setIsPrivacyMenuOpen(false);
                          }}
                          className={`w-full px-3 py-1.5 text-xs flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer ${
                            isSelected
                              ? 'font-bold text-blue-600 dark:text-blue-400'
                              : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <IconComp className={`w-3.5 h-3.5 ${opt.color}`} />
                            <span>{language === 'bn' ? opt.labelBn : opt.labelEn}</span>
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Author Post Insights Button & Quick Bookmark & Post Options Menu */}
        <div className="relative flex items-center gap-1.5">
          {post.author.id === currentUser.id && (
            <button
              type="button"
              onClick={() => setIsInsightsOpen(true)}
              title={
                language === 'bn'
                  ? 'পোস্টের ইনসাইটস ও ইন্টারঅ্যাকশন চার্ট দেখুন'
                  : 'View Post Insights & peak interaction times'
              }
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-lg border border-blue-200 dark:border-blue-800 transition-all cursor-pointer"
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {language === 'bn' ? 'ইনসাইটস' : 'Insights'}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => toggleSavePost(post.id)}
            title={post.isSaved ? t.unsavePost : t.savePost}
            className={`p-1.5 rounded-full transition-colors cursor-pointer ${
              post.isSaved
                ? 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40'
                : 'text-slate-400 hover:text-purple-600 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${post.isSaved ? 'fill-current' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 top-8 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 z-30">
              {post.author.id === currentUser.id && (
                <button
                  type="button"
                  onClick={() => {
                    setIsInsightsOpen(true);
                    setIsMenuOpen(false);
                  }}
                  className="w-full px-3 py-2 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 flex items-center gap-2.5 text-left cursor-pointer border-b border-slate-100 dark:border-slate-800/60"
                >
                  <BarChart2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>
                    {language === 'bn' ? 'ইনসাইটস দেখুন (Insights)' : 'View Insights'}
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  togglePinPost(post.id);
                  setIsMenuOpen(false);
                }}
                className="w-full px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 text-left cursor-pointer"
              >
                <Pin className="w-4 h-4 text-blue-500" />
                <span>
                  {post.isPinned
                    ? language === 'bn'
                      ? 'পিন সরান'
                      : 'Unpin Post'
                    : language === 'bn'
                    ? 'ফিডে পিন করুন'
                    : 'Pin Post'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  toggleSavePost(post.id);
                  setIsMenuOpen(false);
                }}
                className="w-full px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 text-left cursor-pointer"
              >
                <Bookmark className="w-4 h-4 text-purple-500" />
                <span>{post.isSaved ? t.unsavePost : t.savePost}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsShareModalOpen(true);
                  setIsMenuOpen(false);
                }}
                className="w-full px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 text-left cursor-pointer"
              >
                <Share2 className="w-4 h-4 text-emerald-500" />
                <span>{language === 'bn' ? 'পোস্ট শেয়ার করুন...' : 'Share Post...'}</span>
              </button>

              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 text-left cursor-pointer"
              >
                <Copy className="w-4 h-4 text-blue-500" />
                <span>{t.copyLink}</span>
              </button>

              {post.author.id !== currentUser.id && (
                <button
                  type="button"
                  onClick={() => {
                    blockUser(post.author.id);
                    setIsMenuOpen(false);
                  }}
                  className="w-full px-3 py-2 text-xs font-semibold text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 flex items-center gap-2.5 text-left cursor-pointer"
                >
                  <Ban className="w-4 h-4 text-amber-600" />
                  <span>
                    {language === 'bn'
                      ? `${post.author.nameBn || post.author.name}-কে ব্লক করুন`
                      : `Block ${post.author.name}`}
                  </span>
                </button>
              )}

              {post.author.id === currentUser.id && (
                <>
                  <button
                    type="button"
                    onClick={() => setIsSelfDestructMenuOpen(!isSelfDestructMenuOpen)}
                    className="w-full px-3 py-2 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 flex items-center justify-between text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Hourglass className="w-4 h-4 text-amber-500" />
                      <span>{language === 'bn' ? 'স্বয়ংক্রিয় ধ্বংস টাইমার' : 'Self-Destruct Timer'}</span>
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                      {post.expiresAt ? (language === 'bn' ? 'চালু' : 'Active') : (language === 'bn' ? 'বন্ধ' : 'Off')}
                    </span>
                  </button>

                  {isSelfDestructMenuOpen && (
                    <div className="bg-amber-50/70 dark:bg-amber-950/40 p-2 space-y-1 border-y border-amber-200 dark:border-amber-800">
                      <p className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase">
                        {language === 'bn' ? 'ধ্বংসের সময় নির্বাচন করুন:' : 'Set Duration:'}
                      </p>
                      <div className="grid grid-cols-2 gap-1 text-[11px]">
                        {[
                          { mins: 1, labelBn: '১ মিনিট (টেস্ট)', labelEn: '1 Min (Test)' },
                          { mins: 5, labelBn: '৫ মিনিট', labelEn: '5 Mins' },
                          { mins: 60, labelBn: '১ ঘণ্টা', labelEn: '1 Hour' },
                          { mins: 1440, labelBn: '২৪ ঘণ্টা', labelEn: '24 Hours' },
                        ].map((preset) => (
                          <button
                            key={preset.mins}
                            type="button"
                            onClick={() => {
                              setPostSelfDestructTimer(post.id, preset.mins);
                              setIsSelfDestructMenuOpen(false);
                              setIsMenuOpen(false);
                            }}
                            className="px-2 py-1 bg-white dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-900 rounded font-semibold text-slate-700 dark:text-slate-200 text-center border border-amber-200/60 cursor-pointer"
                          >
                            {language === 'bn' ? preset.labelBn : preset.labelEn}
                          </button>
                        ))}
                      </div>
                      {post.expiresAt && (
                        <button
                          type="button"
                          onClick={() => {
                            setPostSelfDestructTimer(post.id, null);
                            setIsSelfDestructMenuOpen(false);
                            setIsMenuOpen(false);
                          }}
                          className="w-full text-center text-[10px] font-bold text-rose-600 hover:underline py-0.5 cursor-pointer"
                        >
                          {language === 'bn' ? 'টাইমার বাতিল করুন' : 'Remove Timer'}
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}

              {post.author.id === currentUser.id && (
                <button
                  type="button"
                  onClick={() => {
                    deletePost(post.id);
                    setIsMenuOpen(false);
                  }}
                  className="w-full px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2.5 text-left cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{t.deletePost}</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Post Text & Styled Background Content */}
      {post.gradientBg ? (
        <div
          className={`w-full min-h-[200px] p-8 my-2 bg-gradient-to-br ${post.gradientBg} flex items-center justify-center text-center`}
        >
          <p className="text-white text-lg sm:text-xl font-bold leading-relaxed max-w-xl drop-shadow-md">
            {post.content}
          </p>
        </div>
      ) : (
        <div className="px-4 py-2 text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line">
          {post.content}
        </div>
      )}

      {/* Post Media / Image or Video */}
      {isVideoPost && resolvedVideoSrc ? (
        <div className="mt-2 bg-black relative rounded-2xl overflow-hidden group select-none">
          {!videoError ? (
            <>
              <video
                ref={postVideoRef}
                src={resolvedVideoSrc}
                controls
                playsInline
                preload="metadata"
                onError={() => {
                  console.warn('Video failed to load in post, offering reload / live room');
                  setVideoError(true);
                }}
                className="w-full max-h-[540px] object-contain"
              />

              {/* 5-Second Rewind & Fast-Forward Control Bar (ভিডিও ৫ সেকেন্ড করে টানার ফিচার) */}
              <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => seekVideoBySeconds(-5)}
                  className="px-2.5 py-1 rounded-full bg-slate-900/85 hover:bg-slate-900 text-white text-[11px] font-bold backdrop-blur-md border border-white/20 flex items-center gap-1 transition-all shadow-md active:scale-95 cursor-pointer"
                  title={language === 'bn' ? '৫ সেকেন্ড পিছিয়ে যান (-৫ সে.)' : 'Rewind 5 seconds (-5s)'}
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                  <span>-5s</span>
                </button>
                <button
                  type="button"
                  onClick={() => seekVideoBySeconds(5)}
                  className="px-2.5 py-1 rounded-full bg-slate-900/85 hover:bg-slate-900 text-white text-[11px] font-bold backdrop-blur-md border border-white/20 flex items-center gap-1 transition-all shadow-md active:scale-95 cursor-pointer"
                  title={language === 'bn' ? '৫ সেকেন্ড এগিয়ে যান (+৫ সে.)' : 'Skip forward 5 seconds (+5s)'}
                >
                  <span>+5s</span>
                  <RotateCw className="w-3.5 h-3.5 text-emerald-400" />
                </button>
              </div>

              {/* Floating Ripple Badge on Seeking +/- 5s */}
              {videoSeekFeedback && (
                <div
                  className={`pointer-events-none absolute top-1/2 -translate-y-1/2 z-30 flex items-center justify-center animate-in zoom-in-75 fade-in duration-150 ${
                    videoSeekFeedback.dir === 'back' ? 'left-8' : 'right-8'
                  }`}
                >
                  <div className="px-3 py-2 rounded-2xl bg-black/85 text-white backdrop-blur-md border border-white/30 flex items-center gap-2 shadow-2xl font-black text-sm">
                    {videoSeekFeedback.dir === 'back' ? (
                      <>
                        <RotateCcw className="w-4 h-4 text-amber-400" />
                        <span>-5 Seconds</span>
                      </>
                    ) : (
                      <>
                        <span>+5 Seconds</span>
                        <RotateCw className="w-4 h-4 text-emerald-400" />
                      </>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="w-full min-h-[220px] bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-white space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-blue-500 shadow-lg">
                <Play className="w-6 h-6 fill-current" />
              </div>
              <div>
                <p className="font-bold text-sm text-slate-100">
                  {language === 'bn' ? 'ভিডিও প্লেয়ার' : 'Video Player'}
                </p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  {language === 'bn'
                    ? 'ভিডিওটি পুনরায় লোড করতে নিচের বাটনে চাপ দিন'
                    : 'Click reload to retry video playback'}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setVideoError(false);
                    setTimeout(() => {
                      if (postVideoRef.current) {
                        postVideoRef.current.load();
                        postVideoRef.current.play().catch(() => {});
                      }
                    }, 50);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer border border-slate-700"
                >
                  {language === 'bn' ? 'পুনরায় চেষ্টা করুন' : 'Retry'}
                </button>
                {post.isLive && (
                  <button
                    type="button"
                    onClick={() => setIsLiveWatchOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer flex items-center gap-1.5"
                  >
                    <Radio className="w-3.5 h-3.5" />
                    <span>{language === 'bn' ? 'লাইভ রুমে দেখুন' : 'Watch in Live Room'}</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      ) : post.isLive ? (
        <div
          onClick={() => setIsLiveWatchOpen(true)}
          className="mt-2 mx-4 rounded-2xl overflow-hidden bg-gradient-to-r from-red-600/90 via-rose-700 to-slate-900 p-4 text-white flex items-center justify-between gap-3 cursor-pointer hover:opacity-95 transition-opacity shadow-md"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0 animate-pulse">
              <Radio className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-extrabold uppercase tracking-wider text-rose-100">
                {language === 'bn' ? '🔴 লাইভ ব্রডকাস্ট' : '🔴 Live Broadcast'}
              </p>
              <p className="text-xs text-white/90 truncate">
                {language === 'bn'
                  ? 'সরাসরি লাইভ স্ট্রিম ও কমেন্ট রুমে যোগ দিতে ট্যাপ করুন'
                  : 'Tap to join the live stream and real-time chat room'}
              </p>
            </div>
          </div>
          <span className="px-3 py-1.5 rounded-xl bg-white text-red-600 text-xs font-black shrink-0">
            {language === 'bn' ? 'লাইভ দেখুন' : 'Watch Live'}
          </span>
        </div>
      ) : post.image ? (
        <div className="mt-2 bg-slate-100 dark:bg-slate-950">
          <img
            src={post.image}
            alt="Post media"
            referrerPolicy="no-referrer"
            className="w-full max-h-[540px] object-cover"
          />
        </div>
      ) : null}

      {/* Interactive Poll Display */}
      {post.poll && (
        <div className="mx-4 my-2.5 p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/40 dark:from-slate-800/80 dark:to-blue-950/20 border border-slate-200 dark:border-slate-700/80 shadow-xs">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <BarChart2 className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
                {post.poll.question}
              </h4>
            </div>
            {post.poll.isClosed ? (
              <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                {language === 'bn' ? 'বন্ধ' : 'Closed'}
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                {language === 'bn' ? 'সক্রিয়' : 'Active'}
              </span>
            )}
          </div>

          {/* Poll Options with Progress Fill */}
          {(() => {
            const totalVotes = post.poll.options.reduce((sum, opt) => sum + opt.votes.length, 0);
            const userVotedOptionId = post.poll.options.find((opt) => opt.votes.includes(currentUser.id))?.id;

            return (
              <div className="space-y-2">
                {post.poll.options.map((opt) => {
                  const optVotes = opt.votes.length;
                  const percent = totalVotes > 0 ? Math.round((optVotes / totalVotes) * 100) : 0;
                  const isSelected = opt.id === userVotedOptionId;

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => votePoll(post.id, opt.id)}
                      className={`group relative w-full overflow-hidden rounded-xl border p-3 text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 shadow-xs ring-1 ring-blue-500/40'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      {/* Animated Progress Fill Bar */}
                      <div
                        className={`absolute top-0 bottom-0 left-0 transition-all duration-500 ${
                          isSelected
                            ? 'bg-blue-200/50 dark:bg-blue-900/40'
                            : 'bg-slate-100/80 dark:bg-slate-800/60'
                        }`}
                        style={{ width: `${percent}%` }}
                      />

                      <div className="relative z-10 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                              isSelected
                                ? 'border-blue-600 bg-blue-600 text-white'
                                : 'border-slate-300 dark:border-slate-600 group-hover:border-blue-400'
                            }`}
                          >
                            {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                          <span
                            className={`text-xs font-semibold truncate ${
                              isSelected
                                ? 'text-blue-950 dark:text-blue-100 font-bold'
                                : 'text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {opt.text}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            {percent}%
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">
                            ({optVotes})
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}

                {/* Poll Footer */}
                <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>
                    {language === 'bn'
                      ? `মোট ভোট: ${totalVotes} টি`
                      : `${totalVotes} total ${totalVotes === 1 ? 'vote' : 'votes'}`}
                    {userVotedOptionId && (
                      <span className="ml-1 text-blue-600 dark:text-blue-400 font-semibold">
                        • {language === 'bn' ? 'ভোট দিয়েছেন' : 'Voted'}
                      </span>
                    )}
                  </span>
                  {post.poll.expiresAt && (
                    <span className="flex items-center gap-1 text-[10px]">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {new Date(post.poll.expiresAt).getTime() > Date.now()
                        ? language === 'bn'
                          ? `বাকি: ${Math.ceil((new Date(post.poll.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60))} ঘণ্টা`
                          : `${Math.ceil((new Date(post.poll.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60))}h left`
                        : language === 'bn'
                        ? 'মেয়াদ শেষ'
                        : 'Ended'}
                    </span>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Reaction and Engagement Stats Bar */}
      <div className="px-4 py-2.5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1.5">
          {totalReactions > 0 && (
            <div className="flex items-center -space-x-1">
              {getTopReactionsList(safeReactions, activeUserReaction).map((rType) => {
                const rMeta = REACTIONS.find((item) => item.type === rType);
                return (
                  <span
                    key={rType}
                    className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs ring-2 ring-white dark:ring-slate-900 shadow-2xs"
                  >
                    {rMeta?.emoji || '👍'}
                  </span>
                );
              })}
            </div>
          )}
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {totalReactions > 0 ? totalReactions : ''}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {(post.comments?.length || 0) > 0 && (
            <button
              onClick={() => setShowComments(!showComments)}
              className="hover:underline cursor-pointer"
            >
              {post.comments?.length || 0} {t.comment}
            </button>
          )}
          {post.sharesCount > 0 && (
            <span>
              {post.sharesCount} {t.share}
            </span>
          )}
        </div>
      </div>

      {/* Hairline Divider */}
      <div className="h-px bg-slate-100 dark:bg-slate-800 mx-4" />

      {/* Action Buttons: Like / Comment / Share */}
      <div className="relative px-2 py-1 flex items-center justify-between">
        {/* Like Button with Hover-Delay & Touch Long-Press Animated Emoji Popover */}
        <div
          className="relative flex-1"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStartReaction}
          onTouchEnd={handleTouchEndReaction}
        >
          {/* Animated Emoji Reactions Floating Dock */}
          {showReactionsPopover && (
            <div
              onMouseEnter={() => {
                if (popoverTimeoutRef.current) clearTimeout(popoverTimeoutRef.current);
              }}
              onMouseLeave={handleMouseLeave}
              className="absolute -top-14 left-1 sm:left-2 z-40 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md rounded-full shadow-2xl border border-slate-200/90 dark:border-slate-700 px-2.5 py-1.5 flex items-center gap-1.5 sm:gap-2 animate-in fade-in zoom-in-90 slide-in-from-bottom-2 duration-200"
            >
              {REACTIONS.map((r, idx) => {
                const isHovered = hoveredReaction === r.type;
                const isCurrent = activeUserReaction === r.type;
                return (
                  <button
                    key={r.type}
                    type="button"
                    onMouseEnter={() => setHoveredReaction(r.type)}
                    onMouseLeave={() => setHoveredReaction(null)}
                    onClick={() => handleSelectReaction(r.type)}
                    style={{ animationDelay: `${idx * 35}ms` }}
                    className={`relative group flex flex-col items-center justify-center p-1 cursor-pointer transition-all duration-200 ease-out ${
                      isHovered
                        ? 'scale-140 -translate-y-2.5'
                        : isCurrent
                        ? 'scale-115 -translate-y-1 ring-2 ring-blue-500/40 rounded-full'
                        : 'hover:scale-135 hover:-translate-y-2'
                    }`}
                  >
                    {/* Floating Reaction Name Pill on Hover */}
                    <span
                      className={`pointer-events-none absolute -top-7 px-2 py-0.5 rounded-full bg-slate-900/90 text-white text-[10px] font-bold whitespace-nowrap shadow-md transition-opacity duration-150 ${
                        isHovered ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      {language === 'bn' ? r.labelBn : r.labelEn}
                    </span>
                    <span className="text-2xl sm:text-[26px] leading-none select-none inline-block animate-bounce">
                      {r.emoji}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Framer Motion Reaction Pop-up Effect when user selects or clicks reaction (Like, Love, Haha, Wow, Sad, Angry) */}
          <AnimatePresence>
            {burstingReaction && (
              <div className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center">
                {/* Central Floating Reaction Emoji with Framer Motion Bounce & Float */}
                <motion.div
                  initial={{ scale: 0.2, opacity: 0, y: 15 }}
                  animate={{
                    scale: [0.2, 1.9, 1.6],
                    opacity: [0, 1, 0],
                    y: [15, -36, -55],
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.85, ease: 'easeOut', times: [0, 0.45, 1] }}
                  className="text-4xl sm:text-5xl drop-shadow-xl select-none"
                >
                  {burstingReaction.emoji}
                </motion.div>
                {/* Surrounding Floating Sparkles & Reaction Particles */}
                {[
                  { dx: -38, dy: -32, delay: 0.02 },
                  { dx: 38, dy: -36, delay: 0.05 },
                  { dx: -22, dy: -50, delay: 0.08 },
                  { dx: 24, dy: -48, delay: 0.04 },
                  { dx: 0, dy: -60, delay: 0.06 },
                ].map((p, idx) => (
                  <motion.span
                    key={idx}
                    initial={{ x: 0, y: 0, scale: 0.3, opacity: 1 }}
                    animate={{
                      x: p.dx,
                      y: p.dy,
                      scale: [0.3, 1.35, 0.8],
                      opacity: [1, 1, 0],
                      rotate: [0, idx % 2 === 0 ? 20 : -20],
                    }}
                    transition={{ duration: 0.78, delay: p.delay, ease: 'easeOut' }}
                    className="absolute text-xl select-none pointer-events-none"
                  >
                    {burstingReaction.particles[idx % burstingReaction.particles.length]}
                  </motion.span>
                ))}
              </div>
            )}
          </AnimatePresence>

          <button
            type="button"
            onClick={handleQuickLikeClick}
            className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-xs sm:text-sm font-semibold cursor-pointer select-none ${
              burstingReaction ? 'scale-110' : ''
            } ${
              activeReactionObj
                ? activeReactionObj.color
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            {activeReactionObj ? (
              <>
                <span className={`text-base transition-transform ${burstingReaction ? 'scale-125' : ''}`}>
                  {activeReactionObj.emoji}
                </span>
                <span>{language === 'bn' ? activeReactionObj.labelBn : activeReactionObj.labelEn}</span>
              </>
            ) : (
              <>
                <Heart className={`w-4 h-4 transition-transform ${burstingReaction ? 'scale-125 text-rose-500 fill-rose-500' : ''}`} />
                <span>{t.like}</span>
              </>
            )}
          </button>
        </div>

        {/* Comment Button */}
        <button
          type="button"
          onClick={() => setShowComments(!showComments)}
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 cursor-pointer"
        >
          <MessageCircle className="w-4 h-4" />
          <span>{t.comment}</span>
        </button>

        {/* Share Button */}
        <button
          type="button"
          onClick={() => setIsShareModalOpen(true)}
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 cursor-pointer"
        >
          <Share2 className="w-4 h-4" />
          <span>{t.share}</span>
        </button>
      </div>

      {/* Comments Thread Section */}
      {showComments && (
        <div className="p-4 pt-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
          {/* Add New Comment input */}
          <form onSubmit={handleAddComment} className="space-y-2">
            <div className="flex items-center gap-2">
              <img
                src={currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                alt={currentUser?.name || 'User'}
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-full object-cover shrink-0"
              />
              <div className="relative flex-1">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={
                    post.isLive
                      ? language === 'bn'
                        ? 'লাইভ স্ট্রিমে কমেন্ট করুন...'
                        : 'Write a live comment...'
                      : t.writeComment
                  }
                  className="w-full pl-4 pr-16 py-2 bg-slate-100 dark:bg-slate-800 rounded-full text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setIsCommentEmojiPickerOpen((prev) => !prev)}
                    className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                      isCommentEmojiPickerOpen
                        ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/60'
                        : 'text-slate-400 hover:text-amber-500 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                    }`}
                    title={language === 'bn' ? 'ইমোজি পিকার' : 'Emoji Picker'}
                  >
                    <Smile className="w-4 h-4" />
                  </button>
                  <button
                    type="submit"
                    disabled={!commentText.trim()}
                    className="p-1.5 rounded-full text-blue-600 disabled:opacity-30 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Interactive Comment Emoji Picker Drawer */}
            {isCommentEmojiPickerOpen && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-3 shadow-xl border border-slate-200 dark:border-slate-700 z-30 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-100 dark:border-slate-700">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    <span>😊</span>
                    <span>
                      {language === 'bn'
                        ? 'সোশ্যাল ইমোজি পিকার — কমেন্টে যুক্ত করুন'
                        : 'Emoji Picker — Social Expression'}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsCommentEmojiPickerOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-10 gap-1 max-h-36 overflow-y-auto pr-1">
                  {SOCIAL_COMMENT_EMOJIS.map((emoji, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setCommentText((prev) => prev + emoji);
                      }}
                      className="text-lg p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 hover:scale-125 transition-transform flex items-center justify-center cursor-pointer select-none"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {/* Quick Emoji Comment Bar */}
            <div className="flex items-center gap-1.5 pl-10 overflow-x-auto no-scrollbar">
              {['❤️ দারুণ!', '🔥 অসাধারণ!', '👏 অভিনন্দন!', '😍 খুব সুন্দর', '👍 সহমত'].map(
                (quickText) => (
                  <button
                    key={quickText}
                    type="button"
                    onClick={() => addComment(post.id, quickText)}
                    className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-[11px] font-medium text-slate-600 dark:text-slate-300 shrink-0 cursor-pointer transition-colors"
                  >
                    {quickText}
                  </button>
                ),
              )}
            </div>
          </form>

          {/* Comments Sort Bar with 'Newest', 'Oldest', and 'Most Relevant' */}
          {(post.comments?.length || 0) > 1 && (
            <div className="flex items-center justify-between py-1.5 px-1 border-b border-slate-100 dark:border-slate-800 text-xs">
              <span className="font-semibold text-slate-500 dark:text-slate-400 text-[11px]">
                {language === 'bn'
                  ? `মন্তব্য সাজান (${post.comments?.length || 0})`
                  : `Sort comments (${post.comments?.length || 0})`}
              </span>
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[11px]">
                <button
                  type="button"
                  onClick={() => setCommentSortOrder('top')}
                  className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                    commentSortOrder === 'top'
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                  title={language === 'bn' ? 'সবচেয়ে প্রাসঙ্গিক কমেন্টগুলো আগে দেখাবে' : 'Shows top engaged comments first'}
                >
                  {language === 'bn' ? 'সবচেয়ে প্রাসঙ্গিক' : 'Most Relevant'}
                </button>
                <button
                  type="button"
                  onClick={() => setCommentSortOrder('recent')}
                  className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                    commentSortOrder === 'recent'
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                  title={language === 'bn' ? 'নতুন কমেন্টগুলো আগে দেখাবে' : 'Shows newest comments first'}
                >
                  {language === 'bn' ? 'নতুন (Newest)' : 'Newest'}
                </button>
                <button
                  type="button"
                  onClick={() => setCommentSortOrder('oldest')}
                  className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                    commentSortOrder === 'oldest'
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                  title={language === 'bn' ? 'পুরোনো কমেন্টগুলো আগে দেখাবে' : 'Shows oldest comments first'}
                >
                  {language === 'bn' ? 'পুরোনো (Oldest)' : 'Oldest'}
                </button>
              </div>
            </div>
          )}

          {/* Comments List */}
          <div className="space-y-3 pt-2">
            {sortedComments.map((comment) => {
              const myCommentReaction = (comment.userReactions && currentUser?.id && comment.userReactions[currentUser.id]) || (currentUser?.id && comment.author?.id === currentUser.id && comment.userReaction ? comment.userReaction : null);
              const isCommentLikedByMe = Boolean(myCommentReaction || (currentUser?.id && comment.author?.id === currentUser.id && comment.isLiked));
              const activeCommentReaction = REACTIONS.find((r) => r.type === myCommentReaction);
              const topCommentReactions = getTopReactionsList(comment.reactions, myCommentReaction);
              const totalCommentReactions = (comment.userReactions && Object.keys(comment.userReactions).length) || comment.likesCount || 0;

              return (
                <div key={comment.id} className="space-y-2">
                  <div className="flex items-start gap-2.5">
                    <img
                      src={comment.author?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                      alt={comment.author?.name || 'User'}
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 rounded-full object-cover shrink-0 mt-0.5"
                    />
                    <div className="flex-1">
                      {/* Comment bubble container */}
                      <div className="relative inline-block max-w-full">
                        <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl px-3.5 py-2 inline-block max-w-full">
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100 hover:underline cursor-pointer">
                            {language === 'bn'
                              ? comment.author?.nameBn || comment.author?.name || 'ব্যবহারকারী'
                              : comment.author?.name || 'User'}
                          </p>
                          <p className="text-xs text-slate-800 dark:text-slate-200 mt-0.5 whitespace-pre-line">
                            {comment.content}
                          </p>
                        </div>

                        {/* Comment Reactions Badge */}
                        {totalCommentReactions > 0 && (
                          <button
                            type="button"
                            onClick={() => likeComment(post.id, comment.id)}
                            className="absolute -bottom-2 right-2 bg-white dark:bg-slate-700 shadow-sm border border-slate-200 dark:border-slate-600 rounded-full px-1.5 py-0.5 flex items-center gap-1 text-[10px] text-slate-700 dark:text-slate-200 z-10 cursor-pointer hover:scale-105 transition-transform"
                            title={`${totalCommentReactions} ${totalCommentReactions === 1 ? 'like' : 'likes'}`}
                          >
                            <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
                            <span className="font-bold ml-0.5">{totalCommentReactions}</span>
                          </button>
                        )}
                      </div>

                      {/* Comment Actions Toolbar */}
                      <div className="flex items-center gap-2.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-1 pl-1">
                        {/* Direct Heart Like Button with Count */}
                        <button
                          type="button"
                          onClick={() => likeComment(post.id, comment.id)}
                          className={`flex items-center gap-1 py-0.5 px-2 rounded-full transition-all cursor-pointer ${
                            isCommentLikedByMe
                              ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold ring-1 ring-rose-200 dark:ring-rose-800/60'
                              : 'hover:bg-slate-200/60 dark:hover:bg-slate-700/60 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400'
                          }`}
                          title={isCommentLikedByMe ? (language === 'bn' ? 'লাইক প্রত্যাহার' : 'Unlike') : (language === 'bn' ? 'লাইক করুন' : 'Like comment')}
                        >
                          <Heart
                            className={`w-3.5 h-3.5 transition-transform active:scale-125 ${
                              isCommentLikedByMe
                                ? 'fill-rose-500 text-rose-500'
                                : ''
                            }`}
                          />
                          <span>
                            {isCommentLikedByMe
                              ? language === 'bn' ? 'পছন্দ হয়েছে' : 'Liked'
                              : t.like}
                          </span>
                          {totalCommentReactions > 0 && (
                            <span className="font-bold text-[10px] ml-0.5 px-1.5 py-0.2 rounded-full bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50">
                              {totalCommentReactions}
                            </span>
                          )}
                        </button>

                        {/* Reaction Trigger with Popover */}
                        <div
                          className="relative"
                          onMouseEnter={() => handleCommentMouseEnter(comment.id)}
                          onMouseLeave={handleCommentMouseLeave}
                        >
                          {/* Floating Reaction Palette Popover */}
                          {activeCommentReactionPicker === comment.id && (
                            <div className="absolute -top-11 left-0 z-40 bg-white dark:bg-slate-800 rounded-full shadow-2xl border border-slate-200 dark:border-slate-700 px-2 py-1 flex items-center gap-1 animate-in fade-in zoom-in-95 duration-150">
                              {REACTIONS.map((r) => (
                                <button
                                  key={r.type}
                                  type="button"
                                  onClick={() => {
                                    reactToComment(post.id, comment.id, r.type);
                                    setActiveCommentReactionPicker(null);
                                  }}
                                  className="text-lg hover:scale-135 active:scale-95 transition-transform p-0.5 cursor-pointer"
                                  title={language === 'bn' ? r.labelBn : r.labelEn}
                                >
                                  {r.emoji}
                                </button>
                              ))}
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              if (comment.userReaction) {
                                reactToComment(post.id, comment.id, comment.userReaction);
                              } else {
                                reactToComment(post.id, comment.id, 'like');
                              }
                            }}
                            className={`hover:underline cursor-pointer flex items-center gap-1 px-1.5 py-0.5 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-700/50 ${
                              activeCommentReaction
                                ? `${activeCommentReaction.color} font-bold`
                                : 'hover:text-slate-700 dark:hover:text-slate-200'
                            }`}
                          >
                            {activeCommentReaction ? (
                              <>
                                <span>{activeCommentReaction.emoji}</span>
                                <span>
                                  {language === 'bn'
                                    ? activeCommentReaction.labelBn
                                    : activeCommentReaction.labelEn}
                                </span>
                              </>
                            ) : (
                              <Smile className="w-3.5 h-3.5 opacity-60 hover:opacity-100" />
                            )}
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setReplyingToCommentId(
                              replyingToCommentId === comment.id ? null : comment.id,
                            )
                          }
                          className="hover:underline hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                        >
                          {t.reply}
                        </button>
                        {currentUser?.id && ((comment.author?.id === currentUser.id) || (post.author?.id === currentUser.id)) && (
                          <button
                            type="button"
                            onClick={() => deleteComment(post.id, comment.id)}
                            className="hover:underline text-red-500 cursor-pointer"
                          >
                            {language === 'bn' ? 'মুছুন' : 'Delete'}
                          </button>
                        )}
                        <span className="text-[10px] text-slate-400">{comment.createdAt}</span>
                      </div>

                      {/* Reply input if active */}
                      {replyingToCommentId === comment.id && (
                        <div className="space-y-1.5 mt-2 pl-2">
                          <form
                            onSubmit={(e) => handleAddReply(e, comment.id)}
                            className="flex items-center gap-2"
                          >
                            <CornerDownRight className="w-4 h-4 text-slate-400 shrink-0" />
                            <div className="relative flex-1">
                              <input
                                type="text"
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder={`${t.reply}...`}
                                className="w-full pl-3 pr-8 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 rounded-full text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={() => setIsReplyEmojiPickerOpen((p) => !p)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-500 cursor-pointer"
                              >
                                <Smile className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <button
                              type="submit"
                              disabled={!replyText.trim()}
                              className="text-xs font-bold text-blue-600 disabled:opacity-40 cursor-pointer"
                            >
                              {language === 'bn' ? 'পাঠান' : 'Reply'}
                            </button>
                          </form>
                          {isReplyEmojiPickerOpen && (
                            <div className="bg-white dark:bg-slate-800 rounded-xl p-2 shadow-lg border border-slate-200 dark:border-slate-700 max-h-28 overflow-y-auto grid grid-cols-8 gap-1">
                              {SOCIAL_COMMENT_EMOJIS.slice(0, 32).map((emoji, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => setReplyText((p) => p + emoji)}
                                  className="text-base p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded cursor-pointer"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Nested replies */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="space-y-2 mt-2 pl-4 border-l-2 border-slate-200 dark:border-slate-700">
                          {comment.replies.map((reply) => {
                            const activeReplyReaction = REACTIONS.find(
                              (r) => r.type === reply.userReaction,
                            );
                            const myReplyReaction = (reply.userReactions && currentUser?.id && reply.userReactions[currentUser.id]) || (currentUser?.id && reply.author?.id === currentUser.id && reply.userReaction ? reply.userReaction : null);
                            const isReplyLikedByMe = Boolean(myReplyReaction || (currentUser?.id && reply.author?.id === currentUser.id && reply.isLiked));
                            const topReplyReactions = getTopReactionsList(
                              reply.reactions,
                              myReplyReaction,
                            );
                            const totalReplyReactions = (reply.userReactions && Object.keys(reply.userReactions).length) || reply.likesCount || 0;

                            return (
                              <div key={reply.id} className="flex items-start gap-2">
                                <img
                                  src={reply.author?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                                  alt={reply.author?.name || 'User'}
                                  referrerPolicy="no-referrer"
                                  className="w-6 h-6 rounded-full object-cover shrink-0 mt-0.5"
                                />
                                <div className="flex-1">
                                  {/* Reply bubble */}
                                  <div className="relative inline-block max-w-full">
                                    <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl px-3 py-1.5 inline-block">
                                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 mr-1.5">
                                        {language === 'bn'
                                          ? reply.author?.nameBn || reply.author?.name || 'ব্যবহারকারী'
                                          : reply.author?.name || 'User'}
                                      </span>
                                      <span className="text-xs text-slate-800 dark:text-slate-200">
                                        {reply.content}
                                      </span>
                                    </div>

                                    {/* Reply Reactions Badge */}
                                    {totalReplyReactions > 0 && (
                                      <button
                                        type="button"
                                        onClick={() => likeComment(post.id, comment.id, reply.id)}
                                        className="absolute -bottom-2 right-1 bg-white dark:bg-slate-700 shadow-sm border border-slate-200 dark:border-slate-600 rounded-full px-1.5 py-0.5 flex items-center gap-0.5 text-[9px] text-slate-700 dark:text-slate-200 z-10 cursor-pointer hover:scale-105 transition-transform"
                                      >
                                        <Heart className="w-2.5 h-2.5 fill-rose-500 text-rose-500" />
                                        <span className="font-semibold ml-0.5">
                                          {totalReplyReactions}
                                        </span>
                                      </button>
                                    )}
                                  </div>

                                  {/* Reply Actions */}
                                  <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 pl-1 mt-1">
                                    {/* Direct Heart Like Button for Reply */}
                                    <button
                                      type="button"
                                      onClick={() => likeComment(post.id, comment.id, reply.id)}
                                      className={`flex items-center gap-1 py-0.5 px-2 rounded-full transition-all cursor-pointer ${
                                        isReplyLikedByMe
                                          ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold ring-1 ring-rose-200 dark:ring-rose-800/60'
                                          : 'hover:bg-slate-200/60 dark:hover:bg-slate-700/60 text-slate-600 dark:text-slate-400 hover:text-rose-600'
                                      }`}
                                    >
                                      <Heart
                                        className={`w-3 h-3 transition-transform active:scale-125 ${
                                          isReplyLikedByMe
                                            ? 'fill-rose-500 text-rose-500'
                                            : ''
                                        }`}
                                      />
                                      <span>
                                        {isReplyLikedByMe
                                          ? language === 'bn' ? 'পছন্দ হয়েছে' : 'Liked'
                                          : t.like}
                                      </span>
                                      {totalReplyReactions > 0 && (
                                        <span className="font-bold text-[9px] ml-0.5 px-1 rounded-full bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400">
                                          {totalReplyReactions}
                                        </span>
                                      )}
                                    </button>

                                    <span className="text-[10px] text-slate-400">{reply.createdAt}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Share Modal */}
      <ShareModal
        post={post}
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />

      {/* Post Insights & Analytics Modal (Recharts) */}
      <PostInsightsModal
        post={post}
        isOpen={isInsightsOpen}
        onClose={() => setIsInsightsOpen(false)}
      />

      {/* Live Broadcast Watch Modal */}
      <LiveWatchModal
        isOpen={isLiveWatchOpen}
        onClose={() => setIsLiveWatchOpen(false)}
        post={post}
      />
    </article>
  );
};

import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Share2,
  Send,
  Sparkles,
  BookOpen,
  Globe,
  ExternalLink,
} from 'lucide-react';
import { Post } from '../types';
import { useApp } from '../context/AppContext';

interface ShareModalProps {
  post: Post;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ post, isOpen, onClose }) => {
  const { sharePost, sharePostToStory, language, t, showToast } = useApp();
  const [isCopied, setIsCopied] = useState(false);
  const [userShareCaption, setUserShareCaption] = useState('');

  if (!isOpen) return null;

  const postUrl = `${window.location.origin}/#post-${post.id}`;
  const shareText = `Check out this post by ${post.author.name} on Bandhan Social: "${post.content.slice(0, 80)}${post.content.length > 80 ? '...' : ''}"`;

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(postUrl);
      } else {
        const input = document.createElement('input');
        input.value = postUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setIsCopied(true);
      showToast(t.linkCopiedSuccess || t.linkCopied);
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      showToast(t.linkCopied);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Post by ${post.author.name} on Bandhan`,
          text: shareText,
          url: postUrl,
        });
        showToast(language === 'bn' ? 'সফলভাবে শেয়ার করা হয়েছে!' : 'Shared successfully!');
        onClose();
      } catch {
        // User cancelled or share failed
      }
    } else {
      handleCopyLink();
    }
  };

  const handleShareToFeed = () => {
    sharePost(post.id);
    onClose();
  };

  const handleShareToStory = () => {
    sharePostToStory(post.id);
    onClose();
  };

  const openExternal = (platformUrl: string) => {
    window.open(platformUrl, '_blank', 'noopener,noreferrer');
    showToast(language === 'bn' ? 'শেয়ারিং পেজ খোলা হয়েছে' : 'Opened share dialog');
  };

  const socialPlatforms = [
    {
      name: 'WhatsApp',
      iconBg: 'bg-[#25D366]',
      iconEmoji: '💬',
      url: `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${postUrl}`)}`,
    },
    {
      name: 'Facebook',
      iconBg: 'bg-[#1877F2]',
      iconEmoji: '🌐',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`,
    },
    {
      name: 'X (Twitter)',
      iconBg: 'bg-black dark:bg-slate-800',
      iconEmoji: '🐦',
      url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(shareText)}`,
    },
    {
      name: 'Telegram',
      iconBg: 'bg-[#229ED9]',
      iconEmoji: '✈️',
      url: `https://t.me/share/url?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(shareText)}`,
    },
    {
      name: 'LinkedIn',
      iconBg: 'bg-[#0A66C2]',
      iconEmoji: '💼',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`,
    },
    {
      name: 'Email',
      iconBg: 'bg-rose-500',
      iconEmoji: '✉️',
      url: `mailto:?subject=${encodeURIComponent(`Post by ${post.author.name} on Bandhan`)}&body=${encodeURIComponent(`${shareText}\n\nRead full post: ${postUrl}`)}`,
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {t.shareModalTitle || (language === 'bn' ? 'পোস্ট শেয়ার করুন' : 'Share Post')}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Post Snippet Preview Card */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex gap-3 items-center">
            <img
              src={post.author.avatar}
              alt={post.author.name}
              className="w-11 h-11 rounded-full object-cover shrink-0 border border-slate-300 dark:border-slate-600"
            />
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                {language === 'bn' ? post.author.nameBn || post.author.name : post.author.name}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mt-0.5">
                {post.content || (language === 'bn' ? 'ফটো পোস্ট' : 'Photo post')}
              </p>
            </div>
            {post.image && (
              <img
                src={post.image}
                alt="Post thumbnail"
                className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-700"
              />
            )}
          </div>

          {/* Quick Actions (Share to Feed & Share to Story) */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={handleShareToFeed}
              className="flex items-center justify-center gap-2 py-3 px-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{t.shareToFeedNow || (language === 'bn' ? 'টাইমলাইনে শেয়ার' : 'Share to Feed')}</span>
            </button>

            <button
              onClick={handleShareToStory}
              className="flex items-center justify-center gap-2 py-3 px-3 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-xs font-bold shadow-md shadow-pink-500/20 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              <span>{t.shareToStoryNow || (language === 'bn' ? 'স্টোরিতে শেয়ার' : 'Share to Story')}</span>
            </button>
          </div>

          {/* Copy Post Link Section */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>{t.copyPostLink || (language === 'bn' ? 'পোস্টের লিঙ্ক কপি করুন' : 'Copy Post Link')}</span>
              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                >
                  <Share2 className="w-3 h-3" />
                  <span>{language === 'bn' ? 'ডিভাইস শেয়ার' : 'Device Share'}</span>
                </button>
              )}
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-2 text-xs text-slate-600 dark:text-slate-300 truncate border border-slate-200 dark:border-slate-700 font-mono">
                {postUrl}
              </div>
              <button
                type="button"
                onClick={handleCopyLink}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isCopied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-900 hover:bg-black dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white text-white'
                }`}
              >
                {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{isCopied ? (language === 'bn' ? 'কপি হয়েছে!' : 'Copied!') : (language === 'bn' ? 'কপি' : 'Copy')}</span>
              </button>
            </div>
          </div>

          {/* Share to External Social Platforms */}
          <div className="space-y-2 pt-2">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {t.shareExternalApps || (language === 'bn' ? 'অন্যান্য অ্যাপে শেয়ার করুন' : 'Share to External Platforms')}
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
              {socialPlatforms.map((platform) => (
                <button
                  key={platform.name}
                  onClick={() => openExternal(platform.url)}
                  className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-transform hover:scale-105 group cursor-pointer"
                  title={`Share on ${platform.name}`}
                >
                  <div
                    className={`w-11 h-11 rounded-2xl ${platform.iconBg} text-white flex items-center justify-center text-lg shadow-md transition-shadow group-hover:shadow-lg`}
                  >
                    {platform.iconEmoji}
                  </div>
                  <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate max-w-full">
                    {platform.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-950/70 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-300 dark:hover:bg-slate-700 cursor-pointer"
          >
            {t.confirm || (language === 'bn' ? 'বন্ধ করুন' : 'Close')}
          </button>
        </div>
      </div>
    </div>
  );
};

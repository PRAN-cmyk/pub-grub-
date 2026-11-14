import React, { useState } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  ThumbsUp,
  Heart,
  MessageCircle,
  UserPlus,
  Users,
  Calendar,
  Sparkles,
  X,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AppNotification } from '../types';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

type FilterTab = 'all' | 'unread' | 'interactions' | 'requests';

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose }) => {
  const {
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    toggleNotificationRead,
    deleteNotification,
    clearAllNotifications,
    friendRequests,
    acceptFriendRequest,
    declineFriendRequest,
    viewUserProfile,
    setActiveTab,
    language,
    t,
  } = useApp();

  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'unread') return !n.isRead;
    if (activeFilter === 'interactions') return n.type === 'reaction' || n.type === 'comment' || n.type === 'mention';
    if (activeFilter === 'requests') return n.type === 'friend_request';
    return true;
  });

  const getNotificationIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'reaction':
        return (
          <span className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[11px] shadow-sm">
            ❤️
          </span>
        );
      case 'comment':
        return (
          <span className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] shadow-sm">
            💬
          </span>
        );
      case 'friend_request':
        return (
          <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] shadow-sm">
            👥
          </span>
        );
      case 'group':
        return (
          <span className="w-5 h-5 rounded-full bg-purple-500 text-white flex items-center justify-center text-[10px] shadow-sm">
            🌐
          </span>
        );
      default:
        return (
          <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] shadow-sm">
            🔔
          </span>
        );
    }
  };

  const handleNotificationClick = (n: AppNotification) => {
    if (!n.isRead) {
      markNotificationRead(n.id);
    }
    if (n.type === 'friend_request') {
      setActiveTab('friends');
      onClose();
    } else if (n.type === 'group') {
      setActiveTab('groups');
      onClose();
    } else if (n.postId) {
      setActiveTab('feed');
      onClose();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      viewUserProfile(n.sender);
      onClose();
    }
  };

  return (
    <div className="fixed sm:absolute right-2 sm:right-0 top-14 sm:top-11 w-[calc(100vw-1rem)] max-w-[360px] sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-3.5 z-50 animate-in fade-in zoom-in-95 duration-150">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <span>{t.notificationCenter || 'Notification Center'}</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-blue-600 text-white">
                  {unreadCount}
                </span>
              )}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              onClick={markAllNotificationsRead}
              title={t.markAllAsRead}
              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-xs flex items-center gap-1"
            >
              <CheckCheck className="w-4 h-4" />
              <span className="hidden sm:inline text-[11px] font-semibold">{t.markAllAsRead}</span>
            </button>
          )}

          {notifications.length > 0 && (
            <button
              onClick={clearAllNotifications}
              title={t.clearAll || 'Clear all'}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 pt-2 pb-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'all', labelEn: 'All', labelBn: 'সকল', count: notifications.length },
          { id: 'unread', labelEn: 'Unread', labelBn: 'অপঠিত', count: unreadCount },
          { id: 'interactions', labelEn: 'Interactions', labelBn: 'ইন্টারেকশন' },
          { id: 'requests', labelEn: 'Requests', labelBn: 'রিকোয়েস্ট' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id as FilterTab)}
            className={`px-3 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer shrink-0 ${
              activeFilter === tab.id
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {language === 'bn' ? tab.labelBn : tab.labelEn}
            {tab.count !== undefined && tab.count > 0 && (
              <span
                className={`ml-1 px-1 rounded-full text-[10px] ${
                  activeFilter === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="mt-1 space-y-1.5 max-h-88 overflow-y-auto pr-1">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-8 px-4 text-slate-400">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-xs font-medium">
              {activeFilter === 'unread'
                ? language === 'bn'
                  ? 'কোনো অপঠিত নোটিফিকেশন নেই'
                  : 'No unread notifications'
                : activeFilter === 'interactions'
                ? language === 'bn'
                  ? 'কোনো ইন্টারেকশন পাওয়া যায়নি'
                  : 'No interaction notifications yet'
                : activeFilter === 'requests'
                ? language === 'bn'
                  ? 'কোনো ফ্রেন্ড রিকোয়েস্ট নোটিফিকেশন নেই'
                  : 'No friend request notifications'
                : t.noNotifications}
            </p>
          </div>
        ) : (
          filteredNotifications.map((n) => {
            // Check if there is an active matching friend request
            const matchingReq = n.type === 'friend_request'
              ? friendRequests.find((req) => req.user.id === n.sender.id)
              : null;

            return (
              <div
                key={n.id}
                className={`group relative flex items-start gap-3 p-2.5 rounded-xl transition-all cursor-pointer ${
                  n.isRead
                    ? 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    : 'bg-blue-50/80 dark:bg-blue-950/40 border-l-3 border-blue-600'
                }`}
                onClick={() => handleNotificationClick(n)}
              >
                {/* Avatar with type badge overlay */}
                <div className="relative shrink-0 mt-0.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      viewUserProfile(n.sender);
                      onClose();
                    }}
                    className="block rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <img
                      src={n.sender.avatar}
                      alt={n.sender.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 hover:opacity-90"
                    />
                  </button>
                  <div className="absolute -bottom-1 -right-1">
                    {getNotificationIcon(n.type)}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-800 dark:text-slate-200 leading-snug">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        viewUserProfile(n.sender);
                        onClose();
                      }}
                      className="font-bold text-slate-900 dark:text-slate-100 hover:underline inline text-left"
                    >
                      {language === 'bn' ? n.sender.nameBn || n.sender.name : n.sender.name}
                    </button>{' '}
                    <span>{language === 'bn' ? n.textBn : n.textEn}</span>
                  </p>

                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] text-slate-400">{n.timestamp}</span>
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                    )}
                  </div>

                  {/* Inline Friend Request Actions */}
                  {matchingReq && (
                    <div className="flex items-center gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => acceptFriendRequest(matchingReq.id)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
                      >
                        <Check className="w-3 h-3" />
                        <span>{t.confirm}</span>
                      </button>
                      <button
                        onClick={() => declineFriendRequest(matchingReq.id)}
                        className="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                        <span>{t.delete}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Hover Actions: Toggle Read / Delete */}
                <div
                  className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 self-center shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => toggleNotificationRead(n.id)}
                    title={n.isRead ? t.markAsUnread || 'Mark as unread' : t.markAsRead || 'Mark as read'}
                    className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-800 transition-colors"
                  >
                    {n.isRead ? <EyeOff className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => deleteNotification(n.id)}
                    title="Delete"
                    className="p-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-white dark:hover:bg-slate-800 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

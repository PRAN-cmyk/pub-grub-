import React, { useState } from 'react';
import {
  MessageSquare,
  Check,
  X,
  UserPlus,
  Search,
  Phone,
  Video,
  UserCheck,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { createAvatarUrl } from '../data/mockData';
import { User } from '../types';

export const FriendsView: React.FC = () => {
  const {
    currentUser,
    profiles = [],
    friendRequests = [],
    acceptFriendRequest,
    declineFriendRequest,
    sentFriendRequestIds = [],
    sendFriendRequest,
    cancelFriendRequest,
    contacts = [],
    openChatWith,
    startCall,
    viewUserProfile,
    isFollowingUser,
    toggleFollowUser,
    isMyStatusOnline,
    toggleMyOnlineStatus,
    setActiveTab,
    language,
    t,
  } = useApp();

  const [search, setSearch] = useState('');
  const [subFilter, setSubFilter] = useState<'all' | 'online' | 'followers'>('all');

  // Real platform users who are not yet added as friends (no fake engaged/fake suggestions)
  const discoverableUsers: User[] = profiles.filter(
    (p) => p.id !== currentUser.id && !contacts.some((c) => c.id === p.id),
  );

  const filteredContacts = contacts.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.nameBn && c.nameBn.includes(search));
    if (!matchesSearch) return false;
    if (subFilter === 'online') return c.isOnline !== false;
    if (subFilter === 'followers') return isFollowingUser(c.id);
    return true;
  });

  const onlineContactsCount = contacts.filter((c) => c.isOnline !== false).length;

  return (
    <div className="max-w-5xl mx-auto py-4 px-2 space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 flex-wrap">
              <span>{t.friends}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-semibold">
                {contacts.length} {language === 'bn' ? 'জন বন্ধু' : 'Connected'}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {onlineContactsCount} {language === 'bn' ? 'অনলাইন' : 'Online'}
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {language === 'bn'
                ? 'বন্ধু ও ফলোয়ার পরিচালনা করুন, কে অনলাইনে আছে দেখুন এবং অডিও/ভিডিও কলে কথা বলুন'
                : 'Manage friends & followers, check live online status, and start audio or video calls'}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* My Online Status Toggle */}
            <button
              type="button"
              onClick={toggleMyOnlineStatus}
              className={`px-3 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 cursor-pointer border transition-colors ${
                isMyStatusOnline
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isMyStatusOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                }`}
              />
              <span>
                {language === 'bn'
                  ? isMyStatusOnline
                    ? 'আমার স্ট্যাটাস: অনলাইন'
                    : 'আমার স্ট্যাটাস: অফলাইন'
                  : isMyStatusOnline
                  ? 'My Status: Online'
                  : 'My Status: Offline'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('groups')}
              className="px-3.5 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>
                {language === 'bn' ? 'গুগল চ্যাট ও ভিডিও রুম' : 'Google Chat & Video'}
              </span>
            </button>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={language === 'bn' ? 'বন্ধু বা ফলোয়ার খুঁজুন...' : 'Search Friends...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-full border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100 w-full sm:w-52"
              />
            </div>
          </div>
        </div>

        {/* Filter Pills: All Friends, Online Now, Followers & Following */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setSubFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
              subFilter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            {language === 'bn' ? `সব বন্ধু (${contacts.length})` : `All Friends (${contacts.length})`}
          </button>
          <button
            type="button"
            onClick={() => setSubFilter('online')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5 ${
              subFilter === 'online'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>
              {language === 'bn'
                ? `অনলাইনে আছেন (${onlineContactsCount})`
                : `Online Now (${onlineContactsCount})`}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setSubFilter('followers')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5 ${
              subFilter === 'followers'
                ? 'bg-indigo-600 text-white'
                : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>
              {language === 'bn'
                ? `ফলোয়ার ও ফলোয়িং (${currentUser.followersCount || 1250} ফলোয়ার • ${contacts.filter((c) => isFollowingUser(c.id)).length} ফলো করছেন)`
                : `Followers (${currentUser.followersCount || 1250}) • Following (${contacts.filter((c) => isFollowingUser(c.id)).length})`}
            </span>
          </button>
        </div>
      </div>

      {/* Incoming Friend Requests Section */}
      {friendRequests.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            {t.friendRequests} ({friendRequests.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {friendRequests.map((req) => (
              <div
                key={req.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col justify-between"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative shrink-0">
                    <img
                      src={req.user.avatar}
                      alt={req.user.name}
                      referrerPolicy="no-referrer"
                      onClick={() => viewUserProfile(req.user)}
                      className="w-12 h-12 rounded-full object-cover cursor-pointer"
                    />
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
                  </div>
                  <div>
                    <h4
                      onClick={() => viewUserProfile(req.user)}
                      className="text-sm font-bold text-slate-900 dark:text-slate-100 hover:underline cursor-pointer"
                    >
                      {language === 'bn' ? req.user.nameBn || req.user.name : req.user.name}
                    </h4>
                    <p className="text-xs text-slate-400">
                      {req.mutualFriends} {t.mutualFriends}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => acceptFriendRequest(req.id)}
                    className="py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{t.confirm}</span>
                  </button>
                  <button
                    onClick={() => declineFriendRequest(req.id)}
                    className="py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>{t.delete}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Real Platform Members (Send Friend Requests & Follow) */}
      {discoverableUsers.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            {language === 'bn' ? 'সদস্যদের ফ্রেন্ড রিকোয়েস্ট পাঠান' : 'Connect with Members'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {discoverableUsers.map((sug) => {
              const isRequested = sentFriendRequestIds.includes(sug.id);
              const isOnline = sug.isOnline !== false;
              return (
                <div
                  key={sug.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col justify-between"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="relative shrink-0">
                      <img
                        src={sug.avatar}
                        alt={sug.name}
                        referrerPolicy="no-referrer"
                        onClick={() => viewUserProfile(sug)}
                        className="w-12 h-12 rounded-full object-cover cursor-pointer"
                      />
                      <span
                        className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white dark:border-slate-900 rounded-full ${
                          isOnline ? 'bg-emerald-500' : 'bg-slate-400'
                        }`}
                      />
                    </div>
                    <div>
                      <h4
                        onClick={() => viewUserProfile(sug)}
                        className="text-sm font-bold text-slate-900 dark:text-slate-100 hover:underline cursor-pointer"
                      >
                        {language === 'bn' ? sug.nameBn : sug.name}
                      </h4>
                      <p className="text-xs text-slate-400">
                        {sug.followersCount} {language === 'bn' ? 'ফলোয়ার' : 'followers'} •{' '}
                        {isOnline
                          ? language === 'bn'
                            ? 'অনলাইন'
                            : 'Online'
                          : sug.lastSeen || 'Offline'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {isRequested ? (
                      <button
                        type="button"
                        onClick={() => cancelFriendRequest(sug.id)}
                        className="py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 flex items-center justify-center gap-1 cursor-pointer transition-all"
                      >
                        <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{t.requested}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => sendFriendRequest(sug)}
                        className="py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center justify-center gap-1 cursor-pointer transition-all"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>{t.addFriend}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => toggleFollowUser(sug.id)}
                      className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-all ${
                        isFollowingUser(sug.id)
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      {isFollowingUser(sug.id) ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>{language === 'bn' ? 'ফলো করছেন' : 'Following'}</span>
                        </>
                      ) : (
                        <span>{language === 'bn' ? '+ ফলো করুন' : '+ Follow'}</span>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Connected Friends List with Online Indicator, Follow Toggle, Audio/Video Call & Messenger */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
          {language === 'bn' ? 'আপনার বন্ধু ও ফলোয়ার তালিকা' : 'Your Friends & Followers'} (
          {filteredContacts.length})
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filteredContacts.map((friend) => {
            const isOnline = friend.isOnline !== false;
            const following = isFollowingUser(friend.id);
            return (
              <div
                key={friend.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col justify-between gap-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div
                    onClick={() => viewUserProfile(friend)}
                    className="flex items-center gap-3 min-w-0 cursor-pointer"
                  >
                    <div className="relative shrink-0">
                      <img
                        src={friend.avatar}
                        alt={friend.name}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <span
                        className={`absolute bottom-0 right-0 w-3.5 h-3.5 border-2 border-white dark:border-slate-900 rounded-full ${
                          isOnline ? 'bg-emerald-500' : 'bg-slate-400'
                        }`}
                      />
                    </div>
                    <div className="truncate">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate hover:underline">
                        {language === 'bn' ? friend.nameBn || friend.name : friend.name}
                      </h4>
                      <p
                        className={`text-[11px] font-semibold truncate ${
                          isOnline
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        {isOnline
                          ? language === 'bn'
                            ? '● এখন অনলাইনে আছেন'
                            : '● Online now'
                          : `${language === 'bn' ? 'অফলাইন' : 'Offline'} • ${
                              friend.lastSeen || '1h ago'
                            }`}
                      </p>
                    </div>
                  </div>

                  {/* Quick Audio Call, Video Call & Chat Buttons */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => startCall(friend, 'audio')}
                      className="p-2 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-600 dark:text-emerald-400 rounded-xl transition-colors cursor-pointer"
                      title={language === 'bn' ? 'অডিও কল' : 'Audio Call'}
                    >
                      <Phone className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => startCall(friend, 'video')}
                      className="p-2 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900 text-purple-600 dark:text-purple-400 rounded-xl transition-colors cursor-pointer"
                      title={language === 'bn' ? 'ভিডিও কল' : 'Video Call'}
                    >
                      <Video className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openChatWith(friend)}
                      className="p-2 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-600 dark:text-purple-400 rounded-xl transition-colors cursor-pointer"
                      title={t.messenger}
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Follower / Following Toggle Bar */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    {friend.followersCount || 340} {language === 'bn' ? 'জন ফলোয়ার' : 'followers'}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleFollowUser(friend.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                      following
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {following ? (
                      <>
                        <Check className="w-3 h-3" />
                        <span>{language === 'bn' ? 'ফলো করছেন' : 'Following'}</span>
                      </>
                    ) : (
                      <span>{language === 'bn' ? '+ ফলো করুন' : '+ Follow'}</span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

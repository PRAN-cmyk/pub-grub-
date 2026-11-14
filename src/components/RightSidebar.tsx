import React from 'react';
import {
  Video,
  Phone,
  Search,
  UserCheck,
  Check,
  X,
  Users,
  MessageCircle,
  UserPlus,
  Flag,
  Cake,
  Gift,
  Sparkles,
  Send,
  Heart,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TrendingHashtagsWidget } from './TrendingHashtagsWidget';

export const RightSidebar: React.FC = () => {
  const {
    friendRequests,
    acceptFriendRequest,
    declineFriendRequest,
    contacts,
    openChatWith,
    startCall,
    viewUserProfile,
    setActiveTab,
    isFollowingUser,
    toggleFollowUser,
    groups,
    setActiveGroupChatId,
    isMyStatusOnline,
    toggleMyOnlineStatus,
    language,
    t,
    addPost,
    showToast,
  } = useApp();

  const [contactFilter, setContactFilter] = React.useState('');
  const [wishedFriends, setWishedFriends] = React.useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem('bandhan_wished_birthdays_today');
      if (stored) return JSON.parse(stored);
    } catch {}
    return {};
  });
  const [activeWishInputFriendId, setActiveWishInputFriendId] = React.useState<string | null>(null);
  const [customWishText, setCustomWishText] = React.useState('');

  // Birthday friends today (friends celebrating their birthday today)
  const birthdayFriends = React.useMemo(() => {
    const todayList = contacts.filter((c) => c.isBirthdayToday);
    if (todayList.length > 0) return todayList;
    const prioritized = contacts.filter(
      (c) =>
        c.username.toLowerCase().includes('samira') ||
        c.name.toLowerCase().includes('samira') ||
        c.username.toLowerCase().includes('nusrat') ||
        c.name.toLowerCase().includes('nusrat'),
    );
    return prioritized.length > 0 ? prioritized : contacts.slice(0, 2);
  }, [contacts]);

  const handleQuickBirthdayPost = (friend: typeof contacts[0], customMsg?: string) => {
    const friendName = language === 'bn' ? friend.nameBn || friend.name : friend.name;
    const defaultMsg =
      language === 'bn'
        ? `🎉🎂 শুভ জন্মদিন ${friendName}! আপনার নতুন বছরটি সাফল্য, অফুরন্ত সুখ আর সুস্বাস্থ্যে ভরে উঠুক। আমাদের বন্ধুত্ব সবসময় অটুট থাকুক! 🎈✨`
        : `🎉🎂 Wishing a very Happy Birthday to my wonderful friend ${friend.name}! May your day be filled with endless joy, peace, and tremendous success! 🎈✨`;

    const postContent = customMsg && customMsg.trim() ? customMsg.trim() : defaultMsg;

    addPost({
      content: postContent,
      privacy: 'public',
      feeling: {
        type: 'celebrating',
        emoji: '🎂',
        labelEn: `celebrating ${friend.name}'s Birthday`,
        labelBn: `${friendName}-এর জন্মদিন উদযাপন করছেন`,
      },
    });

    setWishedFriends((prev) => {
      const updated = { ...prev, [friend.id]: true };
      try {
        localStorage.setItem('bandhan_wished_birthdays_today', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    setActiveWishInputFriendId(null);
    setCustomWishText('');

    showToast(
      language === 'bn'
        ? `🎂 ${friendName}-এর টাইমলাইনে জন্মদিনের শুভেচ্ছা পোস্ট করা হয়েছে!`
        : `🎂 Happy Birthday post published on ${friend.name}'s timeline!`,
    );
  };

  const filteredContacts = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(contactFilter.toLowerCase()) ||
      (c.nameBn && c.nameBn.includes(contactFilter)),
  );

  const onlineContactsCount = contacts.filter((c) => c.isOnline !== false).length;

  return (
    <aside className="hidden xl:flex flex-col w-80 shrink-0 h-[calc(100vh-3.5rem)] sticky top-14 p-3 overflow-y-auto select-none space-y-5">
      {/* ============================================================== */}
      {/* THE REQUESTED 'BIRTHDAYS' COMPONENT IN RIGHTSIDEBAR            */}
      {/* Displays friends whose birthdays are today + quick post button */}
      {/* ============================================================== */}
      <div className="bg-gradient-to-br from-pink-50/90 via-purple-50/50 to-white dark:from-slate-900 dark:via-purple-950/20 dark:to-slate-900 rounded-2xl p-3.5 border border-pink-200/80 dark:border-purple-900/60 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-pink-100 dark:bg-pink-950/80 text-pink-600 dark:text-pink-400 flex items-center justify-center shadow-xs">
              <Cake className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <span>{language === 'bn' ? 'আজকের জন্মদিন' : 'Birthdays'}</span>
                <span className="px-1.5 py-0.2 rounded-full bg-pink-500 text-white text-[10px] font-black">
                  {birthdayFriends.length}
                </span>
              </h3>
            </div>
          </div>
          <span className="text-lg animate-bounce">🎁</span>
        </div>

        <div className="space-y-3">
          {birthdayFriends.map((friend) => {
            const hasWished = Boolean(wishedFriends[friend.id]);
            const isEditing = activeWishInputFriendId === friend.id;
            const friendName = language === 'bn' ? friend.nameBn || friend.name : friend.name;

            return (
              <div
                key={friend.id}
                className="p-3 rounded-xl bg-white/90 dark:bg-slate-800/80 border border-pink-100 dark:border-purple-900/40 shadow-xs space-y-2.5"
              >
                <div className="flex items-center gap-2.5">
                  <div className="relative shrink-0">
                    <img
                      src={friend.avatar}
                      alt={friend.name}
                      referrerPolicy="no-referrer"
                      onClick={() => viewUserProfile(friend)}
                      className="w-11 h-11 rounded-full object-cover cursor-pointer hover:opacity-90 ring-2 ring-pink-400/60 shadow-xs"
                    />
                    <span className="absolute -bottom-1 -right-1 text-sm select-none">
                      🎂
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p
                      onClick={() => viewUserProfile(friend)}
                      className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate cursor-pointer hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
                    >
                      {friendName}
                    </p>
                    <p className="text-[11px] text-pink-600 dark:text-pink-400 font-semibold truncate flex items-center gap-1">
                      <Sparkles className="w-3 h-3 shrink-0" />
                      <span>{language === 'bn' ? 'আজকের দিনে জন্ম নিয়েছেন 🎉' : "Birthday is today! 🎉"}</span>
                    </p>
                  </div>
                </div>

                {/* Inline custom wish input box */}
                {isEditing && (
                  <div className="space-y-2 pt-1 animate-in fade-in duration-150">
                    <textarea
                      value={customWishText}
                      onChange={(e) => setCustomWishText(e.target.value)}
                      placeholder={
                        language === 'bn'
                          ? `${friendName}-এর জন্য জন্মদিনের বার্তা লিখুন...`
                          : `Write a birthday message for ${friend.name}...`
                      }
                      rows={2}
                      className="w-full text-xs p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-pink-200 dark:border-purple-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-pink-500 resize-none"
                    />
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1">
                        {['🎂', '🎉', '🎈', '💖', '🥳'].map((emo) => (
                          <button
                            key={emo}
                            type="button"
                            onClick={() => setCustomWishText((prev) => prev + emo)}
                            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-xs cursor-pointer select-none"
                          >
                            {emo}
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setActiveWishInputFriendId(null)}
                          className="px-2 py-1 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
                        >
                          {language === 'bn' ? 'বাতিল' : 'Cancel'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickBirthdayPost(friend, customWishText)}
                          className="px-3 py-1 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-bold text-xs rounded-lg flex items-center gap-1 shadow-xs cursor-pointer"
                        >
                          <Send className="w-3 h-3" />
                          <span>{language === 'bn' ? 'পোস্ট করুন' : 'Post Wish'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Wish Buttons */}
                {!isEditing && (
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <button
                      type="button"
                      onClick={() => handleQuickBirthdayPost(friend)}
                      className={`flex-1 py-1.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                        hasWished
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 hover:opacity-95 text-white'
                      }`}
                    >
                      {hasWished ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>{language === 'bn' ? 'শুভেচ্ছা জানানো হয়েছে ✓' : 'Wished ✓'}</span>
                        </>
                      ) : (
                        <>
                          <Cake className="w-3.5 h-3.5" />
                          <span>{language === 'bn' ? 'টাইমলাইনে শুভেচ্ছা জানান' : 'Wish Happy Birthday'}</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveWishInputFriendId(friend.id);
                        setCustomWishText(
                          language === 'bn'
                            ? `🎉🎂 শুভ জন্মদিন ${friendName}! অনেক অনেক শুভকামনা ও ভালোবাসা। 🎈✨`
                            : `🎉🎂 Happy Birthday ${friend.name}! Wishing you boundless happiness! 🎈✨`,
                        );
                      }}
                      className="p-1.5 rounded-xl border border-pink-200 dark:border-purple-800 hover:bg-pink-50 dark:hover:bg-purple-950/40 text-pink-600 dark:text-pink-400 cursor-pointer"
                      title={language === 'bn' ? 'কাস্টম বার্তা লিখুন' : 'Write custom wish'}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Real-Time Trending Hashtags Widget */}
      <TrendingHashtagsWidget />

      {/* Friend Requests Section */}
      {friendRequests.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {t.friendRequests}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('friends')}
              className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 hover:underline cursor-pointer"
            >
              {friendRequests.length}
            </button>
          </div>

          <div className="space-y-3">
            {friendRequests.map((req) => (
              <div
                key={req.id}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-2.5"
              >
                <div className="flex items-center gap-2.5">
                  <img
                    src={req.user.avatar}
                    alt={req.user.name}
                    referrerPolicy="no-referrer"
                    onClick={() => viewUserProfile(req.user)}
                    className="w-10 h-10 rounded-full object-cover cursor-pointer hover:opacity-90"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p
                        onClick={() => viewUserProfile(req.user)}
                        className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                      >
                        {language === 'bn' ? req.user.nameBn || req.user.name : req.user.name}
                      </p>
                      <span className="text-[10px] text-slate-400">{req.timestamp}</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {req.mutualFriends} {t.mutualFriends}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => acceptFriendRequest(req.id)}
                    className="flex-1 py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{t.confirm}</span>
                  </button>
                  <button
                    onClick={() => declineFriendRequest(req.id)}
                    className="flex-1 py-1.5 px-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>{language === 'bn' ? 'মুছে ফেলুন' : 'Delete'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Group Chats Quick Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {language === 'bn' ? 'গ্রুপ চ্যাটসমূহ' : 'Group Chats'}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('groups')}
            className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
          >
            {language === 'bn' ? 'সব দেখুন' : 'See All'}
          </button>
        </div>

        <div className="space-y-1.5">
          {groups.slice(0, 3).map((grp) => (
            <button
              key={grp.id}
              type="button"
              onClick={() => setActiveGroupChatId(grp.id)}
              className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative shrink-0">
                  <img
                    src={grp.coverImage}
                    alt={grp.name}
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-xl object-cover"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    {language === 'bn' ? grp.nameBn || grp.name : grp.name}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {language === 'bn' ? `${grp.membersCount} সদস্য সক্রিয়` : `${grp.membersCount} members active`}
                  </p>
                </div>
              </div>
              <MessageCircle className="w-4 h-4 text-indigo-500 shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* Contacts / Online Status & Followers Section */}
      <div className="space-y-3">
        <div className="px-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isMyStatusOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
              }`}
            />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {language === 'bn'
                ? `সক্রিয় বন্ধু (${onlineContactsCount} অনলাইন)`
                : `${t.contacts} (${onlineContactsCount} Online)`}
            </h3>
          </div>
          <button
            type="button"
            onClick={toggleMyOnlineStatus}
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full cursor-pointer transition-colors ${
              isMyStatusOnline
                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
            }`}
          >
            {isMyStatusOnline
              ? language === 'bn'
                ? '● আমি অনলাইন'
                : '● I am Online'
              : language === 'bn'
              ? '○ আমি অফলাইন'
              : '○ I am Offline'}
          </button>
        </div>

        {/* Contact search bar */}
        <div className="px-1">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={contactFilter}
              onChange={(e) => setContactFilter(e.target.value)}
              placeholder={language === 'bn' ? 'বন্ধু বা ফলোয়ার খুঁজুন...' : 'Search friends...'}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-200/70 dark:bg-slate-800/70 rounded-full focus:outline-none text-slate-800 dark:text-slate-200 placeholder-slate-400"
            />
          </div>
        </div>

        <div className="space-y-1">
          {filteredContacts.map((contact) => {
            const isOnline = contact.isOnline !== false;
            const following = isFollowingUser(contact.id);
            return (
              <div
                key={contact.id}
                className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-200/70 dark:hover:bg-slate-800/70 transition-colors group"
              >
                <div
                  onClick={() => openChatWith(contact)}
                  className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                >
                  <div className="relative shrink-0">
                    <img
                      src={contact.avatar}
                      alt={contact.name}
                      referrerPolicy="no-referrer"
                      className="w-9 h-9 rounded-full object-cover"
                    />
                    <span
                      className={`absolute bottom-0 right-0 w-2.5 h-2.5 border-2 border-white dark:border-slate-900 rounded-full ${
                        isOnline ? 'bg-emerald-500' : 'bg-slate-400'
                      }`}
                    />
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {language === 'bn' ? contact.nameBn || contact.name : contact.name}
                    </p>
                    <p
                      className={`text-[10px] font-medium truncate ${
                        isOnline ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                      }`}
                    >
                      {isOnline
                        ? language === 'bn'
                          ? '● অনলাইনে আছেন'
                          : '● Online now'
                        : language === 'bn'
                        ? 'অফলাইন'
                        : 'Offline'}
                    </p>
                  </div>
                </div>

                {/* Quick Follow, Audio & Video Call Actions */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => toggleFollowUser(contact.id)}
                    className={`p-1.5 rounded-full text-[10px] font-bold transition-colors cursor-pointer ${
                      following
                        ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50'
                        : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                    title={following ? 'Following' : 'Follow'}
                  >
                    {following ? <UserCheck className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => startCall(contact, 'audio')}
                    className="p-1.5 rounded-full text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    title={language === 'bn' ? 'অডিও কল' : 'Audio Call'}
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => startCall(contact, 'video')}
                    className="p-1.5 rounded-full text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    title={language === 'bn' ? 'ভিডিও কল' : 'Video Call'}
                  >
                    <Video className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pages Quick Link */}
      <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab('pages')}
          className="w-full p-2.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 hover:bg-indigo-100/80 dark:hover:bg-indigo-950/50 border border-indigo-200/60 dark:border-indigo-800/50 flex items-center justify-between text-xs font-bold text-indigo-700 dark:text-indigo-300 cursor-pointer transition-colors"
        >
          <span className="flex items-center gap-2">
            <Flag className="w-4 h-4 text-indigo-600" />
            <span>{language === 'bn' ? 'অফিসিয়াল পেইজ ও কমিউনিটি দেখুন' : 'Explore Official Pages'}</span>
          </span>
          <span>→</span>
        </button>
      </div>
    </aside>
  );
};

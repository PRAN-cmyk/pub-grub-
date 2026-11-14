import React from 'react';
import {
  Users,
  Bookmark,
  Tv,
  Store,
  Clock,
  Gamepad2,
  ChevronRight,
  PlusCircle,
  Sparkles,
  UserPlus,
  Flag,
  Settings,
  Music2,
  Video,
  ShieldCheck,
  Mail,
  HardDrive,
  GraduationCap,
  Lightbulb,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MainTab } from '../types';

export const LeftSidebar: React.FC = () => {
  const {
    currentUser,
    viewingUser,
    viewUserProfile,
    activeTab,
    setActiveTab,
    setIsCreatePostOpen,
    setIsCreateReelOpen,
    setIsAudioLibraryOpen,
    setIsAccountSecurityOpen,
    groups = [],
    pages = [],
    posts = [],
    enterGroup,
    friendRequests = [],
    audioLibrary = [],
    workspaceSubTab,
    setWorkspaceSubTab,
    language,
    t,
    showToast,
  } = useApp();

  const savedPostsCount = posts.filter((p) => p.isSaved).length;

  const handleShortcutClick = (tab: MainTab, messageBn?: string, messageEn?: string) => {
    setActiveTab(tab);
    if (messageBn && messageEn) {
      showToast(language === 'bn' ? messageBn : messageEn);
    }
  };

  return (
    <aside className="hidden lg:flex flex-col w-72 shrink-0 h-[calc(100vh-3.5rem)] sticky top-14 p-3 overflow-y-auto select-none">
      <div className="space-y-1">
        {/* Current User Profile Card */}
        <button
          onClick={() => viewUserProfile(null)}
          className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-colors cursor-pointer ${
            activeTab === 'profile' && !viewingUser
              ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400'
              : 'hover:bg-slate-200/70 dark:hover:bg-slate-800/70 text-slate-900 dark:text-slate-100'
          }`}
        >
          <div className="relative">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              referrerPolicy="no-referrer"
              className="w-9 h-9 rounded-full object-cover ring-2 ring-blue-500/30"
            />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
          </div>
          <div className="text-left min-w-0">
            <p className="font-semibold text-sm truncate">
              {language === 'bn' ? currentUser.nameBn || currentUser.name : currentUser.name}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {currentUser.city || currentUser.location || 'Dhaka, Bangladesh'}
            </p>
          </div>
        </button>

        {/* Friends & Followers */}
        <button
          onClick={() => setActiveTab('friends')}
          className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-colors cursor-pointer ${
            activeTab === 'friends'
              ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400'
              : 'hover:bg-slate-200/70 dark:hover:bg-slate-800/70 text-slate-800 dark:text-slate-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <span className="font-medium text-sm">
              {language === 'bn' ? 'বন্ধু ও ফলোয়ার' : 'Friends & Followers'}
            </span>
          </div>
          {friendRequests.length > 0 && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-500 text-white">
              {friendRequests.length}
            </span>
          )}
        </button>

        {/* Official Pages */}
        <button
          onClick={() => setActiveTab('pages')}
          className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-colors cursor-pointer ${
            activeTab === 'pages'
              ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400'
              : 'hover:bg-slate-200/70 dark:hover:bg-slate-800/70 text-slate-800 dark:text-slate-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Flag className="w-5 h-5" />
            </div>
            <span className="font-medium text-sm">
              {language === 'bn' ? 'পেইজসমূহ (Pages)' : 'Official Pages'}
            </span>
          </div>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400">
            {pages.length}
          </span>
        </button>

        {/* Groups & Google Chat / Video Hub */}
        <button
          onClick={() => setActiveTab('groups')}
          className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-colors cursor-pointer ${
            activeTab === 'groups'
              ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400'
              : 'hover:bg-slate-200/70 dark:hover:bg-slate-800/70 text-slate-800 dark:text-slate-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div className="text-left">
              <span className="font-medium text-sm block leading-tight">{t.groups}</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                {language === 'bn' ? 'গুগল চ্যাট ও ভিডিও যুক্ত' : 'Google Chat & Video'}
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        {/* Reels & Video Hub */}
        <button
          onClick={() => setActiveTab('watch')}
          className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-colors cursor-pointer ${
            activeTab === 'watch'
              ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400'
              : 'hover:bg-slate-200/70 dark:hover:bg-slate-800/70 text-slate-800 dark:text-slate-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Tv className="w-5 h-5" />
            </div>
            <div className="text-left">
              <span className="font-medium text-sm block leading-tight">{t.watch}</span>
              <span className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold">
                {language === 'bn' ? 'শর্ট ভিডিও ও রিলস' : 'Shorts & Reels'}
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        {/* Marketplace */}
        <button
          onClick={() => setActiveTab('marketplace')}
          className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-colors cursor-pointer ${
            activeTab === 'marketplace'
              ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400'
              : 'hover:bg-slate-200/70 dark:hover:bg-slate-800/70 text-slate-800 dark:text-slate-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
            <span className="font-medium text-sm">{t.marketplace}</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        {/* Gaming & Playroom */}
        <button
          onClick={() => setActiveTab('gaming')}
          className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-colors cursor-pointer ${
            activeTab === 'gaming'
              ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400'
              : 'hover:bg-slate-200/70 dark:hover:bg-slate-800/70 text-slate-800 dark:text-slate-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div className="text-left">
              <span className="font-medium text-sm block leading-tight">
                {language === 'bn' ? 'গেম জোন ও প্লে-রুম' : 'Gaming & Playroom'}
              </span>
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                {language === 'bn' ? 'দাবা, লুডু, স্নেক ও মাল্টিপ্লেয়ার' : 'Chess, Ludo, Snake & PvP'}
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        {/* Saved Posts */}
        <button
          onClick={() => setActiveTab('saved')}
          className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-colors cursor-pointer ${
            activeTab === 'saved'
              ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400'
              : 'hover:bg-slate-200/70 dark:hover:bg-slate-800/70 text-slate-800 dark:text-slate-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Bookmark className="w-5 h-5" />
            </div>
            <span className="font-medium text-sm">
              {language === 'bn' ? 'সংরক্ষিত পোস্ট' : 'Saved Posts'}
            </span>
          </div>
          {savedPostsCount > 0 && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400">
              {savedPostsCount}
            </span>
          )}
        </button>

        {/* Gmail & Inbox */}
        <button
          onClick={() => {
            setActiveTab('drive');
            setWorkspaceSubTab('gmail');
          }}
          className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-colors cursor-pointer ${
            activeTab === 'drive' && workspaceSubTab === 'gmail'
              ? 'bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400'
              : 'hover:bg-slate-200/70 dark:hover:bg-slate-800/70 text-slate-800 dark:text-slate-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <div className="text-left">
              <span className="font-medium text-sm block leading-tight">
                {language === 'bn' ? 'জি-মেইল (Gmail Inbox)' : 'Gmail & Inbox'}
              </span>
              <span className="text-[10px] text-red-600 dark:text-red-400 font-semibold">
                Google Workspace
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        {/* Google Drive & Cloud */}
        <button
          onClick={() => {
            setActiveTab('drive');
            setWorkspaceSubTab('drive');
          }}
          className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-colors cursor-pointer ${
            activeTab === 'drive' && workspaceSubTab === 'drive'
              ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400'
              : 'hover:bg-slate-200/70 dark:hover:bg-slate-800/70 text-slate-800 dark:text-slate-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <HardDrive className="w-5 h-5" />
            </div>
            <div className="text-left">
              <span className="font-medium text-sm block leading-tight">
                {language === 'bn' ? 'গুগল ড্রাইভ ও ফাইল' : 'Google Drive & Cloud'}
              </span>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
                Firebase & Backup
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        {/* Google Classroom */}
        <button
          onClick={() => setActiveTab('classroom')}
          className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-colors cursor-pointer ${
            activeTab === 'classroom'
              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 font-bold'
              : 'hover:bg-slate-200/70 dark:hover:bg-slate-800/70 text-slate-800 dark:text-slate-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="text-left">
              <span className="font-medium text-sm block leading-tight">
                {language === 'bn' ? 'গুগল ক্লাসরুম' : 'Google Classroom'}
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                {language === 'bn' ? 'কোর্স ও পড়ালেখা' : 'Courses & Studies'}
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        {/* Google Keep & Personal Notes */}
        <button
          onClick={() => setActiveTab('keep')}
          className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-colors cursor-pointer ${
            activeTab === 'keep'
              ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 font-bold'
              : 'hover:bg-slate-200/70 dark:hover:bg-slate-800/70 text-slate-800 dark:text-slate-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div className="text-left">
              <span className="font-medium text-sm block leading-tight">
                {language === 'bn' ? 'গুগল কিপ ও নোটস' : 'Google Keep & Notes'}
              </span>
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                {language === 'bn' ? 'আইডিয়া, চেকলিস্ট ও টাস্ক' : 'Ideas, Lists & Cloud Sync'}
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        {/* Settings, Copyright Law & Account Delete */}
        <button
          onClick={() => setIsAccountSecurityOpen(true)}
          className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-200/70 dark:hover:bg-slate-800/70 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div className="text-left">
              <span className="font-medium text-sm block leading-tight">
                {language === 'bn' ? 'সেটিংস ও একাউন্ট' : 'Settings & Account'}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                {language === 'bn' ? 'প্রাইভেসি, কপিরাইট ও ডিলিট' : 'Privacy, Copyright & Delete'}
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        {/* Memories */}
        <button
          onClick={() =>
            handleShortcutClick(
              'feed',
              'স্মৃতিসমূহ ফিল্টার করা হয়েছে!',
              'Showing your cherished memories!',
            )
          }
          className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-200/70 dark:hover:bg-slate-800/70 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <span className="font-medium text-sm">
              {language === 'bn' ? 'স্মৃতিসমূহ' : 'Memories'}
            </span>
          </div>
        </button>

        {/* Action Buttons */}
        <div className="pt-2 space-y-2">
          <button
            onClick={() => setIsCreatePostOpen(true)}
            className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t.createPost}</span>
          </button>

          <button
            onClick={() => setIsCreateReelOpen(true)}
            className="w-full flex items-center justify-center gap-2 p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 font-semibold text-xs border border-rose-200 dark:border-rose-800/60 transition-all cursor-pointer"
          >
            <Video className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'নতুন রিল তৈরি করুন' : 'Create New Reel'}</span>
          </button>
        </div>
      </div>

      <hr className="my-4 border-slate-200 dark:border-slate-800" />

      {/* Shortcuts Section */}
      <div className="space-y-2">
        <div className="px-2 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {language === 'bn' ? 'আপনার শর্টকাট' : 'Your Shortcuts'}
          </h3>
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
        </div>

        {groups.slice(0, 3).map((group) => (
          <button
            key={group.id}
            onClick={() => enterGroup(group.id)}
            className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-slate-200/70 dark:hover:bg-slate-800/70 transition-colors cursor-pointer text-left"
          >
            <img
              src={group.coverImage}
              alt={group.name}
              referrerPolicy="no-referrer"
              className="w-9 h-9 rounded-xl object-cover shrink-0"
            />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                {language === 'bn' ? group.nameBn || group.name : group.name}
              </p>
              <p className="text-[11px] text-slate-400">
                {group.membersCount.toLocaleString()} {t.members}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Footer Copyright Law & Privacy */}
      <div className="mt-auto pt-6 px-2 text-[11px] text-slate-400 dark:text-slate-500 space-y-1">
        <button
          type="button"
          onClick={() => setIsAccountSecurityOpen(true)}
          className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold hover:underline cursor-pointer"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>
            {language === 'bn'
              ? 'কপিরাইট আইন ও প্রাইভেসি নীতিমালা'
              : 'Copyright Law & Privacy Policy'}
          </span>
        </button>
        <p>© 2026 Bandhan (বন্ধন) • All Audio & Media Copyright Protected</p>
      </div>
    </aside>
  );
};

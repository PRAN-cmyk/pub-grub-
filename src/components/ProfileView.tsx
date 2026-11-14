import React, { useState, useMemo } from 'react';
import {
  Camera,
  Edit3,
  MapPin,
  Briefcase,
  Calendar,
  Users,
  Grid,
  List,
  Image as ImageIcon,
  Check,
  X,
  Ban,
  ShieldAlert,
  ShieldCheck,
  MessageCircle,
  ArrowLeft,
  AlertTriangle,
  Phone,
  Video,
  UserPlus,
  UserCheck,
  Lock,
  Film,
  LogOut,
  Bookmark,
  Settings,
  Heart,
  Search,
  Share2,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Globe,
  HeartHandshake,
  Sparkles,
  Plus,
  User,
  KeyRound,
  Eye,
  EyeOff,
  FolderPlus,
  Folder,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PostCard } from './PostCard';
import { CreatePostBox } from './CreatePostBox';
import { sampleUsers, createAvatarUrl } from '../data/mockData';
import { User as UserType, Post } from '../types';
import { fileToDataUrl } from '../utils/storage';

const PRESET_AVATARS = [
  createAvatarUrl('Tanvir Hasan', '#1877F2', '#ffffff'),
  createAvatarUrl('Samira Khan', '#db2777', '#ffffff'),
  createAvatarUrl('Arafat Hossain', '#059669', '#ffffff'),
  createAvatarUrl('Nusrat Jahan', '#7c3aed', '#ffffff'),
  createAvatarUrl('Mahmudul Hasan', '#ea580c', '#ffffff'),
  createAvatarUrl('Fatima Zahra', '#0d9488', '#ffffff'),
];

export const ProfileView: React.FC = () => {
  const {
    currentUser,
    updateUser,
    profiles,
    createNewProfile,
    switchProfile,
    posts,
    stories,
    reels,
    contacts,
    language,
    t,
    showToast,
    blockedUserIds,
    blockUser,
    unblockUser,
    isUserBlocked,
    viewingUser,
    viewUserProfile,
    openChatWith,
    startCall,
    sendFriendRequest,
    sentFriendRequestIds,
    followingUserIds,
    isFollowingUser,
    toggleFollowUser,
    setIsCreateStoryOpen,
    logout,
    albums,
    createAlbum,
    deleteAlbum,
    addPhotoToAlbum,
    removePhotoFromAlbum,
  } = useApp();

  const isOwnProfile = !viewingUser || viewingUser.id === currentUser.id;
  const profileUser: UserType = isOwnProfile
    ? currentUser
    : profiles.find((p) => p.id === viewingUser.id) || viewingUser;
  const isBlocked = !isOwnProfile && isUserBlocked(profileUser.id);

  // Tabs
  const [activeSubTab, setActiveSubTab] = useState<
    'posts' | 'saved' | 'videos' | 'photos' | 'albums' | 'about' | 'friends' | 'blocked'
  >('posts');

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accountModalTab, setAccountModalTab] = useState<'switch' | 'create'>('switch');

  // Photo Lightbox state
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Albums State
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [isCreateAlbumModalOpen, setIsCreateAlbumModalOpen] = useState(false);
  const [newAlbumTitle, setNewAlbumTitle] = useState('');
  const [newAlbumTitleBn, setNewAlbumTitleBn] = useState('');
  const [newAlbumDesc, setNewAlbumDesc] = useState('');
  const [isAddPhotoModalOpen, setIsAddPhotoModalOpen] = useState(false);
  const [albumPhotoInputUrl, setAlbumPhotoInputUrl] = useState('');

  // Profile posts view preferences
  const [postViewMode, setPostViewMode] = useState<'list' | 'grid'>('list');
  const [postMediaTypeFilter, setPostMediaTypeFilter] = useState<'all' | 'photos' | 'videos'>('all');
  const [postSortOrder, setPostSortOrder] = useState<'newest' | 'oldest' | 'popular'>('newest');
  const [postSearchQuery, setPostSearchQuery] = useState('');

  // Edit Profile form fields
  const [name, setName] = useState(currentUser.name);
  const [nameBn, setNameBn] = useState(currentUser.nameBn || '');
  const [bio, setBio] = useState(currentUser.bio || '');
  const [bioBn, setBioBn] = useState(currentUser.bioBn || '');
  const [city, setCity] = useState(currentUser.city || '');
  const [workplace, setWorkplace] = useState(currentUser.workplace || '');
  const [education, setEducation] = useState(currentUser.education || '');
  const [website, setWebsite] = useState(currentUser.website || '');
  const [relationship, setRelationship] = useState(currentUser.relationship || '');
  const [hobbies, setHobbies] = useState(currentUser.hobbies || '');
  const [editAvatarPreview, setEditAvatarPreview] = useState(currentUser.avatar);
  const [editCoverPreview, setEditCoverPreview] = useState(currentUser.coverImage || '');

  // Create Account Form state (inside Account Modal)
  const [newAccName, setNewAccName] = useState('');
  const [newAccNameBn, setNewAccNameBn] = useState('');
  const [newAccUsername, setNewAccUsername] = useState('');
  const [newAccEmailOrPhone, setNewAccEmailOrPhone] = useState('');
  const [newAccBio, setNewAccBio] = useState('');
  const [newAccCity, setNewAccCity] = useState('Dhaka, Bangladesh');
  const [newAccWorkplace, setNewAccWorkplace] = useState('Bandhan Creator');
  const [newAccPin, setNewAccPin] = useState('');
  const [newAccAvatar, setNewAccAvatar] = useState('');
  const [newAccCover, setNewAccCover] = useState('');
  const [showNewAccPin, setShowNewAccPin] = useState(false);

  // Quick PIN switch state
  const [lockedUserId, setLockedUserId] = useState<string | null>(null);
  const [quickPinInput, setQuickPinInput] = useState('');

  // Filter posts authored by the profile user
  const rawUserPosts = useMemo(
    () =>
      posts.filter(
        (p) =>
          p.author.id === profileUser.id ||
          (isOwnProfile && (p.author.id === currentUser.id || p.author.username === currentUser.username)),
      ),
    [posts, profileUser.id, isOwnProfile, currentUser.id, currentUser.username],
  );

  // Process user posts with filtering, search, and sorting
  const filteredUserPosts = useMemo(() => {
    let result = [...rawUserPosts];

    // Media filter
    if (postMediaTypeFilter === 'photos') {
      result = result.filter((p) => Boolean(p.image && !p.video));
    } else if (postMediaTypeFilter === 'videos') {
      result = result.filter((p) => Boolean(p.video || (p.image && p.image.startsWith('data:video'))));
    }

    // Search query filter
    if (postSearchQuery.trim()) {
      const q = postSearchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.content.toLowerCase().includes(q) ||
          (p.groupName && p.groupName.toLowerCase().includes(q)),
      );
    }

    // Sort order
    if (postSortOrder === 'oldest') {
      result.reverse();
    } else if (postSortOrder === 'popular') {
      result.sort((a, b) => {
        const reactionsA = Object.values(a.reactions || {}).reduce((s, c) => s + (c || 0), 0);
        const reactionsB = Object.values(b.reactions || {}).reduce((s, c) => s + (c || 0), 0);
        return reactionsB + (b.comments?.length || 0) - (reactionsA + (a.comments?.length || 0));
      });
    }

    return result;
  }, [rawUserPosts, postMediaTypeFilter, postSearchQuery, postSortOrder]);

  // Bookmarked / Saved posts
  const savedPosts = useMemo(() => posts.filter((p) => p.isSaved), [posts]);

  // Collect all photos from posts, stories
  const userPhotos = useMemo(() => {
    const list: string[] = [];
    rawUserPosts.forEach((p) => {
      if (p.image && !p.image.startsWith('data:video')) list.push(p.image);
    });
    stories.forEach((s) => {
      if (s.author.id === profileUser.id && s.mediaType === 'image' && s.mediaUrl) {
        list.push(s.mediaUrl);
      }
    });
    return Array.from(new Set(list));
  }, [rawUserPosts, stories, profileUser.id]);

  // Photo Albums for this profile
  const userAlbums = useMemo(() => {
    return albums.filter((a) => a.userId === profileUser.id || a.isSystem);
  }, [albums, profileUser.id]);

  // Collect all videos from posts, reels, stories
  const userPostVideos = useMemo(
    () => rawUserPosts.filter((p) => p.video),
    [rawUserPosts],
  );
  const userReels = useMemo(
    () =>
      reels.filter(
        (r) =>
          r.author.id === profileUser.id ||
          (isOwnProfile && (r.author.id === currentUser.id || r.author.username === currentUser.username)),
      ),
    [reels, profileUser.id, isOwnProfile, currentUser.id, currentUser.username],
  );
  const userStoryVideos = useMemo(
    () =>
      stories.filter(
        (s) => s.author.id === profileUser.id && (s.videoUrl || s.mediaType === 'video'),
      ),
    [stories, profileUser.id],
  );
  const totalUserVideosCount =
    userPostVideos.length + userReels.length + userStoryVideos.length;

  // Resolve blocked user objects
  const allKnownUsers: Record<string, UserType> = useMemo(() => {
    const map: Record<string, UserType> = {
      ...sampleUsers,
      [currentUser.id]: currentUser,
    };
    posts.forEach((p) => {
      if (!map[p.author.id]) map[p.author.id] = p.author;
    });
    profiles.forEach((p) => {
      if (!map[p.id]) map[p.id] = p;
    });
    return map;
  }, [currentUser, posts, profiles]);

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = await fileToDataUrl(file);
      updateUser({ avatar: url });
      setEditAvatarPreview(url);
      showToast(
        language === 'bn'
          ? '✅ প্রোফাইল ছবি পরিবর্তন ও সংরক্ষিত হয়েছে!'
          : '✅ Profile picture updated!',
      );
    }
  };

  const handleCoverFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = await fileToDataUrl(file);
      updateUser({ coverImage: url });
      setEditCoverPreview(url);
      showToast(
        language === 'bn'
          ? '✅ কভার ছবি পরিবর্তন ও সংরক্ষিত হয়েছে!'
          : '✅ Cover photo updated!',
      );
    }
  };

  const handleOpenEditModal = () => {
    setName(currentUser.name);
    setNameBn(currentUser.nameBn || '');
    setBio(currentUser.bio || '');
    setBioBn(currentUser.bioBn || '');
    setCity(currentUser.city || '');
    setWorkplace(currentUser.workplace || '');
    setEducation(currentUser.education || '');
    setWebsite(currentUser.website || '');
    setRelationship(currentUser.relationship || '');
    setHobbies(currentUser.hobbies || '');
    setEditAvatarPreview(currentUser.avatar);
    setEditCoverPreview(currentUser.coverImage || '');
    setIsEditModalOpen(true);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({
      name: name.trim(),
      nameBn: nameBn.trim() || undefined,
      bio: bio.trim(),
      bioBn: bioBn.trim() || undefined,
      city: city.trim(),
      workplace: workplace.trim(),
      education: education.trim() || undefined,
      website: website.trim() || undefined,
      relationship: relationship.trim() || undefined,
      hobbies: hobbies.trim() || undefined,
      avatar: editAvatarPreview,
      coverImage: editCoverPreview || undefined,
    });
    setIsEditModalOpen(false);
    showToast(
      language === 'bn'
        ? '🎉 প্রোফাইল তথ্য সফলভাবে সংরক্ষিত হয়েছে!'
        : '🎉 Profile updated successfully!',
    );
  };

  const handleConfirmBlock = () => {
    blockUser(profileUser.id);
    setIsBlockModalOpen(false);
  };

  // Create Account from inside modal
  const handleCreateAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccName.trim()) {
      showToast(language === 'bn' ? 'নাম প্রদান করুন' : 'Please provide a name');
      return;
    }

    const cleanUsername =
      newAccUsername.trim().toLowerCase().replace(/\s+/g, '_') ||
      newAccName.trim().toLowerCase().replace(/\s+/g, '_') + '_' + Math.floor(100 + Math.random() * 899);

    const isEmail = newAccEmailOrPhone.includes('@');

    createNewProfile({
      name: newAccName.trim(),
      nameBn: newAccNameBn.trim() || newAccName.trim(),
      username: cleanUsername,
      email: isEmail ? newAccEmailOrPhone.trim() : undefined,
      phone: !isEmail && newAccEmailOrPhone.trim() ? newAccEmailOrPhone.trim() : undefined,
      bio: newAccBio.trim() || 'Bandhan Verified Social Creator ✨',
      city: newAccCity.trim() || 'Dhaka, Bangladesh',
      workplace: newAccWorkplace.trim() || 'Bandhan Creator',
      avatar: newAccAvatar || undefined,
      coverImage: newAccCover || undefined,
      pin: newAccPin.trim() || undefined,
    });

    setIsAccountModalOpen(false);
    setNewAccName('');
    setNewAccNameBn('');
    setNewAccUsername('');
    setNewAccEmailOrPhone('');
    setNewAccBio('');
    setNewAccPin('');
    setNewAccAvatar('');
    setNewAccCover('');
  };

  const handleSwitchAccountClick = (userId: string, hasPin: boolean) => {
    if (hasPin) {
      setLockedUserId(userId);
      setQuickPinInput('');
      return;
    }
    const ok = switchProfile(userId);
    if (ok) setIsAccountModalOpen(false);
  };

  const handleUnlockPinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lockedUserId) return;
    const ok = switchProfile(lockedUserId, quickPinInput);
    if (ok) {
      setLockedUserId(null);
      setQuickPinInput('');
      setIsAccountModalOpen(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      {/* Return to My Profile navigation when viewing another user */}
      {!isOwnProfile && (
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => viewUserProfile(null)}
            className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'আমার প্রোফাইলে ফিরুন' : 'Back to My Profile'}</span>
          </button>

          {isBlocked && (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" />
              {t.blocked}
            </span>
          )}
        </div>
      )}

      {/* Blocked Alert Banner if user is currently blocked */}
      {isBlocked && (
        <div className="mb-4 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {language === 'bn' ? 'এই ইউজারটি ব্লক করা আছে' : 'You have blocked this user'}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                {language === 'bn'
                  ? 'এই ইউজারের পোস্ট, স্টোরি এবং সকল কন্টেন্ট আপনার ফিড থেকে সম্পূর্ণ গোপন রাখা হয়েছে।'
                  : 'Their posts, stories, and content are completely hidden across your feed and platform.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => unblockUser(profileUser.id)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm cursor-pointer shrink-0 flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{t.unblockUser}</span>
          </button>
        </div>
      )}

      {/* Header Container (Cover & Avatar) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mb-4">
        {/* Cover Photo */}
        <div className="relative h-48 sm:h-72 w-full bg-slate-200 dark:bg-slate-800">
          {profileUser.coverImage ? (
            <img
              src={profileUser.coverImage}
              alt="Cover"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 flex items-end justify-start p-6">
              <span className="text-white/40 text-xs font-bold uppercase tracking-wider">
                Bandhan Social Network
              </span>
            </div>
          )}

          {/* Change Cover button (Only for own profile) */}
          {isOwnProfile && (
            <label className="absolute bottom-4 right-4 px-3.5 py-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer shadow-md hover:bg-white dark:hover:bg-slate-900 transition-colors">
              <Camera className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="hidden sm:inline">
                {language === 'bn' ? 'কভার পরিবর্তন' : 'Edit Cover Photo'}
              </span>
              <input type="file" accept="image/*" onChange={handleCoverFile} className="hidden" />
            </label>
          )}
        </div>

        {/* Profile Info Row */}
        <div className="px-6 pb-4">
          <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between -mt-16 sm:-mt-20 gap-4 mb-4">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
              {/* Profile Avatar */}
              <div className="relative group shrink-0">
                <img
                  src={profileUser.avatar}
                  alt={profileUser.name}
                  referrerPolicy="no-referrer"
                  className="w-32 h-32 sm:w-36 sm:h-36 rounded-full border-4 border-white dark:border-slate-900 object-cover shadow-xl bg-white dark:bg-slate-800"
                />
                <span className="absolute bottom-3 right-3 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 shadow-sm" />

                {isOwnProfile && (
                  <label
                    title={language === 'bn' ? 'প্রোফাইল ছবি পরিবর্তন' : 'Change Profile Picture'}
                    className="absolute bottom-1 right-1 p-2.5 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-700 dark:text-slate-200 shadow-lg border border-slate-300 dark:border-slate-700 cursor-pointer hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  >
                    <Camera className="w-4 h-4" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarFile}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Name & Stats */}
              <div className="mb-2">
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                    {language === 'bn' ? profileUser.nameBn || profileUser.name : profileUser.name}
                  </h1>
                  {profileUser.isVerified && (
                    <span
                      className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-white font-bold text-xs shadow-xs"
                      title="Verified Creator"
                    >
                      ✓
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  @{profileUser.username} · {profileUser.friendsCount || 0} {t.friends} ·{' '}
                  {profileUser.followersCount || 0} Followers
                </p>

                {profileUser.workplace && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 flex items-center justify-center sm:justify-start gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span>{profileUser.workplace}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Profile Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap justify-center">
              {isOwnProfile ? (
                <>
                  <button
                    type="button"
                    onClick={() => setIsCreateStoryOpen(true)}
                    className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{language === 'bn' ? 'স্টোরি যোগ করুন' : 'Add to Story'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenEditModal}
                    className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>{t.editProfile}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAccountModalTab('switch');
                      setIsAccountModalOpen(true);
                    }}
                    className="px-3 py-2 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                    title={language === 'bn' ? 'অ্যাকাউন্ট পরিবর্তন বা নতুন অ্যাকাউন্ট খুলুন' : 'Switch or Add Account'}
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{language === 'bn' ? 'অ্যাকাউন্ট সুইচ' : 'Switch Account'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={logout}
                    className="px-3 py-2 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border border-red-200 dark:border-red-900/50"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{language === 'bn' ? 'লগআউট' : 'Log Out'}</span>
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2 flex-wrap justify-center">
                  {/* Follow Button */}
                  <button
                    type="button"
                    onClick={() => toggleFollowUser(profileUser.id)}
                    className={`px-3.5 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer ${
                      isFollowingUser(profileUser.id)
                        ? 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                        : 'bg-[#1877F2] hover:bg-blue-700 text-white'
                    }`}
                  >
                    {isFollowingUser(profileUser.id) ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{language === 'bn' ? 'ফলো করছেন' : 'Following'}</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>{language === 'bn' ? 'ফলো করুন' : 'Follow'}</span>
                      </>
                    )}
                  </button>

                  {/* Add Friend Button */}
                  {!contacts.some((c) => c.id === profileUser.id) && (
                    <button
                      type="button"
                      onClick={() => sendFriendRequest(profileUser)}
                      disabled={sentFriendRequestIds.includes(profileUser.id)}
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white disabled:text-slate-500 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                    >
                      {sentFriendRequestIds.includes(profileUser.id) ? (
                        <>
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>{t.requested}</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>{t.addFriend}</span>
                        </>
                      )}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => openChatWith(profileUser)}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>{language === 'bn' ? 'মেসেজ' : 'Message'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => startCall(profileUser, 'audio')}
                    className="p-2 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-200 dark:border-emerald-800 cursor-pointer"
                    title={language === 'bn' ? 'অডিও কল' : 'Audio Call'}
                  >
                    <Phone className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => startCall(profileUser, 'video')}
                    className="p-2 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 text-purple-600 dark:text-purple-400 rounded-xl border border-purple-200 dark:border-purple-800 cursor-pointer"
                    title={language === 'bn' ? 'ভিডিও কল' : 'Video Call'}
                  >
                    <Video className="w-4 h-4" />
                  </button>

                  {isBlocked ? (
                    <button
                      type="button"
                      onClick={() => unblockUser(profileUser.id)}
                      className="px-3 py-2 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border border-emerald-200 dark:border-emerald-800"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{t.unblockUser}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsBlockModalOpen(true)}
                      className="px-3 py-2 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border border-red-200 dark:border-red-900/40"
                      title={t.blockUser}
                    >
                      <Ban className="w-3.5 h-3.5 text-red-500" />
                      <span>{t.blockUser}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Bio text */}
          {profileUser.bio && (
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3 sm:p-4 mb-4 border border-slate-100 dark:border-slate-800">
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 text-center sm:text-left leading-relaxed">
                {language === 'bn' ? profileUser.bioBn || profileUser.bio : profileUser.bio}
              </p>
            </div>
          )}

          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-1.5 border-t border-slate-100 dark:border-slate-800 pt-3 overflow-x-auto no-scrollbar">
            {[
              {
                id: 'posts',
                labelEn: `Posts (${rawUserPosts.length})`,
                labelBn: `পোস্ট (${rawUserPosts.length})`,
              },
              ...(isOwnProfile
                ? [
                    {
                      id: 'saved',
                      labelEn: `Saved (${savedPosts.length})`,
                      labelBn: `সংরক্ষিত (${savedPosts.length})`,
                    },
                  ]
                : []),
              {
                id: 'videos',
                labelEn: `Videos & Reels (${totalUserVideosCount})`,
                labelBn: `ভিডিও ও রিলস (${totalUserVideosCount})`,
              },
              {
                id: 'photos',
                labelEn: `Photos (${userPhotos.length})`,
                labelBn: `ছবি (${userPhotos.length})`,
              },
              {
                id: 'albums',
                labelEn: `Albums (${userAlbums.length})`,
                labelBn: `অ্যালবাম (${userAlbums.length})`,
              },
              { id: 'about', labelEn: 'About', labelBn: 'পরিচিতি' },
              { id: 'friends', labelEn: 'Friends & Followers', labelBn: 'বন্ধু ও ফলোয়ার' },
              ...(isOwnProfile
                ? [
                    {
                      id: 'blocked',
                      labelEn: `Blocked (${blockedUserIds.length})`,
                      labelBn: `ব্লক করা (${blockedUserIds.length})`,
                    },
                  ]
                : []),
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0 ${
                  activeSubTab === tab.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {language === 'bn' ? tab.labelBn : tab.labelEn}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SubTab: Saved Posts */}
      {isOwnProfile && activeSubTab === 'saved' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Bookmark className="w-5 h-5 fill-current" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  {language === 'bn' ? 'সংরক্ষিত পোস্টসমূহ (Saved Posts)' : 'Saved Posts'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {language === 'bn'
                    ? 'ফিড থেকে আপনার বুকমার্ক ও সেভ করে রাখা সকল পোস্ট এখানে সংরক্ষিত আছে'
                    : 'Bookmarks you have added from your feed are saved here'}
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
              {savedPosts.length} {language === 'bn' ? 'টি পোস্ট' : 'saved'}
            </span>
          </div>

          {savedPosts.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 border border-slate-200 dark:border-slate-800 text-center shadow-sm">
              <Bookmark className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {language === 'bn' ? 'এখনও কোনো পোস্ট বুকমার্ক করা হয়নি' : 'No saved posts yet'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                {language === 'bn'
                  ? 'ফিডের যেকোনো পোস্টের ডানপাশের বুকমার্ক আইকনে ক্লিক করলে পোস্টটি এখানে জমা থাকবে।'
                  : 'Click the bookmark icon on any post in your feed to see it saved here.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {savedPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* SubTab: Blocked Users list */}
      {isOwnProfile && activeSubTab === 'blocked' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Ban className="w-5 h-5 text-red-500" />
                <span>{t.blockedUsersList}</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {language === 'bn'
                  ? 'এই ইউজাররা ব্লক থাকায় তাদের কোনো পোস্ট বা কন্টেন্ট আপনার ফিডে দৃশ্যমান হবে না।'
                  : 'Users you have blocked cannot interact with you, and their content is completely hidden.'}
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {blockedUserIds.length}
            </span>
          </div>

          {blockedUserIds.length === 0 ? (
            <div className="text-center py-12 px-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {t.noBlockedUsers}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                {language === 'bn'
                  ? 'আপনি এখনও কোনো ব্যবহারকারীকে ব্লক করেননি। কমিউনিটির সবার কন্টেন্ট আপনার ফিডে দৃশ্যমান।'
                  : 'You have not blocked anyone yet. All community updates are visible.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {blockedUserIds.map((userId) => {
                const user = allKnownUsers[userId] || {
                  id: userId,
                  name: 'Blocked User',
                  nameBn: 'ব্লক করা ইউজার',
                  username: 'blocked_user',
                  avatar: createAvatarUrl('Blocked User', '#64748b', '#ffffff'),
                  followersCount: 0,
                  friendsCount: 0,
                };

                return (
                  <div key={userId} className="py-3.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        referrerPolicy="no-referrer"
                        className="w-11 h-11 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                      />
                      <div className="truncate">
                        <p className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                          {language === 'bn' ? user.nameBn || user.name : user.name}
                        </p>
                        <p className="text-xs text-slate-400 truncate">
                          {language === 'bn' ? 'ফিড থেকে লুকানো' : 'Hidden from feed and interactions'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => unblockUser(userId)}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 text-xs font-semibold rounded-xl transition-colors cursor-pointer shrink-0 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{t.unblockUser}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SubTab: Posts (Display Posts on Profile Page) */}
      {activeSubTab === 'posts' && (
        <>
          {isBlocked ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 text-center shadow-sm">
              <Ban className="w-10 h-10 text-red-500 mx-auto mb-3 opacity-60" />
              <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
                {language === 'bn' ? 'পোস্টগুলো দেখতে পাচ্ছেন না' : 'Posts are hidden'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                {language === 'bn'
                  ? 'এই ইউজারটি ব্লক করা থাকায় তার পোস্টগুলো লুকানো রয়েছে।'
                  : 'Because this user is blocked, their posts and activity are hidden from view.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Left Intro Card & Quick Details */}
              <div className="md:col-span-1 space-y-4">
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3.5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                      {language === 'bn' ? 'সংক্ষিপ্ত তথ্য (Intro)' : 'Intro'}
                    </h3>
                    {isOwnProfile && (
                      <button
                        type="button"
                        onClick={handleOpenEditModal}
                        className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                      >
                        {language === 'bn' ? 'এডিট' : 'Edit'}
                      </button>
                    )}
                  </div>

                  {profileUser.workplace && (
                    <div className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                      <Briefcase className="w-4 h-4 text-blue-500 shrink-0" />
                      <span>
                        {t.worksAt} <strong>{profileUser.workplace}</strong>
                      </span>
                    </div>
                  )}

                  {profileUser.education && (
                    <div className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                      <GraduationCap className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span>
                        {language === 'bn' ? 'পড়াশোনা করেছেন' : 'Studied at'}{' '}
                        <strong>{profileUser.education}</strong>
                      </span>
                    </div>
                  )}

                  {profileUser.city && (
                    <div className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                      <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>
                        {t.livesIn} <strong>{profileUser.city}</strong>
                      </span>
                    </div>
                  )}

                  {profileUser.relationship && (
                    <div className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                      <HeartHandshake className="w-4 h-4 text-pink-500 shrink-0" />
                      <span>{profileUser.relationship}</span>
                    </div>
                  )}

                  {profileUser.website && (
                    <div className="flex items-center gap-2.5 text-xs text-blue-600 dark:text-blue-400">
                      <Globe className="w-4 h-4 shrink-0" />
                      <a
                        href={
                          profileUser.website.startsWith('http')
                            ? profileUser.website
                            : `https://${profileUser.website}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="truncate hover:underline"
                      >
                        {profileUser.website}
                      </a>
                    </div>
                  )}

                  <div className="flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400">
                    <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{profileUser.joinedDate || 'Joined Bandhan 2024'}</span>
                  </div>

                  {profileUser.hobbies && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        {language === 'bn' ? 'শখ ও আগ্রহ' : 'Hobbies & Interests'}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {profileUser.hobbies.split(',').map((hob, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-[10px] font-semibold border border-blue-200 dark:border-blue-900"
                          >
                            {hob.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Photos Preview Widget */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center justify-between mb-2.5">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-pink-500" />
                      <span>{language === 'bn' ? 'ছবিসমূহ' : 'Photos'}</span>
                      <span className="text-xs text-slate-400">({userPhotos.length})</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveSubTab('photos')}
                      className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer"
                    >
                      {language === 'bn' ? 'সব দেখুন' : 'See all'}
                    </button>
                  </div>
                  {userPhotos.length === 0 ? (
                    <p className="text-xs text-slate-400 py-3 text-center">
                      {language === 'bn' ? 'কোনো ছবি আপলোড করা হয়নি' : 'No photos shared yet'}
                    </p>
                  ) : (
                    <div className="grid grid-cols-3 gap-1.5 rounded-xl overflow-hidden">
                      {userPhotos.slice(0, 6).map((img, i) => (
                        <div
                          key={i}
                          onClick={() => setLightboxIndex(i)}
                          className="aspect-square cursor-pointer overflow-hidden group relative"
                        >
                          <img
                            src={img}
                            alt="Photo"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Friends Preview Widget */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center justify-between mb-2.5">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-emerald-500" />
                      <span>{language === 'bn' ? 'বন্ধুরা' : 'Friends'}</span>
                      <span className="text-xs text-slate-400">({contacts.length})</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveSubTab('friends')}
                      className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer"
                    >
                      {language === 'bn' ? 'সব দেখুন' : 'See all'}
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {contacts.slice(0, 6).map((c) => (
                      <div
                        key={c.id}
                        onClick={() => viewUserProfile(c)}
                        className="cursor-pointer group flex flex-col items-center text-center"
                      >
                        <img
                          src={c.avatar}
                          alt={c.name}
                          referrerPolicy="no-referrer"
                          className="w-14 h-14 rounded-xl object-cover shadow-xs group-hover:opacity-90 transition-opacity"
                        />
                        <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate w-full mt-1">
                          {c.name.split(' ')[0]}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Feed Stream (Display User Posts) */}
              <div className="md:col-span-2 space-y-4">
                {/* On own profile, show create post box */}
                {isOwnProfile && <CreatePostBox />}

                {/* Post Controls Header: Filters, Search & View Mode */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-2.5">
                  {/* Left: Filter buttons */}
                  <div className="flex items-center gap-1">
                    {[
                      { id: 'all', label: language === 'bn' ? 'সব পোস্ট' : 'All' },
                      { id: 'photos', label: language === 'bn' ? 'ছবি' : 'Photos' },
                      { id: 'videos', label: language === 'bn' ? 'ভিডিও' : 'Videos' },
                    ].map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setPostMediaTypeFilter(f.id as any)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          postMediaTypeFilter === f.id
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  {/* Right: Search, Sort and View Mode */}
                  <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end">
                    {/* Search inside user's posts */}
                    <div className="relative flex-1 sm:w-44">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={postSearchQuery}
                        onChange={(e) => setPostSearchQuery(e.target.value)}
                        placeholder={language === 'bn' ? 'পোস্টে খুঁজুন...' : 'Search posts...'}
                        className="w-full pl-8 pr-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-xs rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      {postSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setPostSearchQuery('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* Sort Order Selector */}
                    <select
                      value={postSortOrder}
                      onChange={(e) => setPostSortOrder(e.target.value as any)}
                      className="px-2 py-1.5 bg-slate-100 dark:bg-slate-800 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer border-0"
                    >
                      <option value="newest">{language === 'bn' ? 'নতুন আগে' : 'Newest'}</option>
                      <option value="oldest">{language === 'bn' ? 'পুরনো আগে' : 'Oldest'}</option>
                      <option value="popular">{language === 'bn' ? 'জনপ্রিয়' : 'Popular'}</option>
                    </select>

                    {/* Toggle View Mode: List vs Grid */}
                    <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setPostViewMode('list')}
                        title="List View"
                        className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                          postViewMode === 'list'
                            ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        <List className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPostViewMode('grid')}
                        title="Grid View"
                        className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                          postViewMode === 'grid'
                            ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        <Grid className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Posts Rendering: List View or Grid View */}
                {filteredUserPosts.length === 0 ? (
                  <div className="bg-white dark:bg-slate-900 rounded-2xl p-10 border border-slate-200 dark:border-slate-800 text-center shadow-sm">
                    <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center mx-auto mb-3">
                      <Edit3 className="w-6 h-6" />
                    </div>
                    <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
                      {language === 'bn'
                        ? postSearchQuery
                          ? 'কোনো পোস্টের সাথে মিল পাওয়া যায়নি'
                          : 'এখনও কোনো পোস্ট প্রকাশিত হয়নি'
                        : postSearchQuery
                        ? 'No posts matched your query'
                        : 'No posts published yet'}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                      {isOwnProfile
                        ? language === 'bn'
                          ? 'উপরের বক্সে স্ট্যাটাস লিখে বা ছবি যুক্ত করে আপনার প্রথম পোস্টটি প্রকাশ করুন!'
                          : 'Share your thoughts, photos, or updates to publish your first post!'
                        : language === 'bn'
                        ? 'এই প্রোফাইলে এই মুহূর্তে কোনো পোস্ট দৃশ্যমান নেই।'
                        : 'No visible posts on this profile at the moment.'}
                    </p>
                  </div>
                ) : postViewMode === 'list' ? (
                  <div className="space-y-4">
                    {filteredUserPosts.map((post) => (
                      <PostCard key={post.id} post={post} />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {filteredUserPosts.map((post) => {
                      const totalReactions = Object.values(post.reactions || {}).reduce(
                        (sum, c) => sum + (c || 0),
                        0,
                      );
                      return (
                        <div
                          key={post.id}
                          className="group relative aspect-square rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 flex flex-col justify-between shadow-xs cursor-pointer"
                        >
                          {post.image ? (
                            <img
                              src={post.image}
                              alt="Post preview"
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          ) : post.video ? (
                            <video
                              src={post.video}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full p-4 flex items-center justify-center bg-gradient-to-br from-blue-500/10 to-indigo-500/10 text-center">
                              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 line-clamp-4">
                                "{post.content}"
                              </p>
                            </div>
                          )}

                          {/* Hover Overlay with Stats */}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white font-bold text-xs">
                            <span className="flex items-center gap-1">
                              <Heart className="w-4 h-4 fill-white" />
                              {totalReactions}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageCircle className="w-4 h-4 fill-white" />
                              {post.comments?.length || 0}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* SubTab: About */}
      {activeSubTab === 'about' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-slate-100">
                {t.about}{' '}
                {language === 'bn' ? profileUser.nameBn || profileUser.name : profileUser.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {language === 'bn' ? 'ব্যবহারকারীর বিস্তারিত পরিচিতি ও তথ্য' : 'Detailed overview & profile information'}
              </p>
            </div>

            {isOwnProfile && (
              <button
                type="button"
                onClick={handleOpenEditModal}
                className="px-3.5 py-1.5 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{language === 'bn' ? 'তথ্য পরিবর্তন' : 'Edit Information'}</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Work & Education */}
            <div className="space-y-4 bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200/70 dark:border-slate-800">
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-blue-600" />
                <span>{language === 'bn' ? 'কর্মক্ষেত্র ও শিক্ষা' : 'Work & Education'}</span>
              </h4>

              <div className="space-y-3 text-xs">
                <div>
                  <p className="text-slate-400 font-semibold">{t.worksAt}</p>
                  <p className="text-slate-900 dark:text-slate-100 font-bold mt-0.5">
                    {profileUser.workplace || 'Bandhan Network Creator'}
                  </p>
                </div>

                <div>
                  <p className="text-slate-400 font-semibold">{language === 'bn' ? 'শিক্ষা প্রতিষ্ঠান' : 'College / University'}</p>
                  <p className="text-slate-900 dark:text-slate-100 font-bold mt-0.5">
                    {profileUser.education || 'University of Dhaka'}
                  </p>
                </div>
              </div>
            </div>

            {/* Places Lived */}
            <div className="space-y-4 bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200/70 dark:border-slate-800">
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-rose-600" />
                <span>{language === 'bn' ? 'বসবাস ও শহর' : 'Places Lived'}</span>
              </h4>

              <div className="space-y-3 text-xs">
                <div>
                  <p className="text-slate-400 font-semibold">{t.livesIn}</p>
                  <p className="text-slate-900 dark:text-slate-100 font-bold mt-0.5">
                    {profileUser.city || 'Dhaka, Bangladesh'}
                  </p>
                </div>

                <div>
                  <p className="text-slate-400 font-semibold">{language === 'bn' ? 'যোগদানের তারিখ' : 'Member Since'}</p>
                  <p className="text-slate-900 dark:text-slate-100 font-bold mt-0.5">
                    {profileUser.joinedDate || 'March 2024'}
                  </p>
                </div>
              </div>
            </div>

            {/* Contact & Web */}
            <div className="space-y-4 bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200/70 dark:border-slate-800">
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-600" />
                <span>{language === 'bn' ? 'যোগাযোগ ও সোশ্যাল লিঙ্ক' : 'Contact & Social Links'}</span>
              </h4>

              <div className="space-y-3 text-xs">
                <div>
                  <p className="text-slate-400 font-semibold">Username</p>
                  <p className="text-slate-900 dark:text-slate-100 font-bold mt-0.5">
                    @{profileUser.username}
                  </p>
                </div>

                {profileUser.email && (
                  <div>
                    <p className="text-slate-400 font-semibold">Email</p>
                    <p className="text-slate-900 dark:text-slate-100 font-bold mt-0.5">
                      {profileUser.email}
                    </p>
                  </div>
                )}

                {profileUser.website && (
                  <div>
                    <p className="text-slate-400 font-semibold">{language === 'bn' ? 'ওয়েবসাইট' : 'Website'}</p>
                    <a
                      href={
                        profileUser.website.startsWith('http')
                          ? profileUser.website
                          : `https://${profileUser.website}`
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 dark:text-blue-400 font-bold mt-0.5 block hover:underline"
                    >
                      {profileUser.website}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Family & Relationship */}
            <div className="space-y-4 bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200/70 dark:border-slate-800">
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <HeartHandshake className="w-4 h-4 text-pink-600" />
                <span>{language === 'bn' ? 'সম্পর্ক ও পরিবার' : 'Relationship & Family'}</span>
              </h4>

              <div className="space-y-3 text-xs">
                <div>
                  <p className="text-slate-400 font-semibold">{language === 'bn' ? 'সম্পর্কের অবস্থা' : 'Relationship Status'}</p>
                  <p className="text-slate-900 dark:text-slate-100 font-bold mt-0.5">
                    {profileUser.relationship || (language === 'bn' ? 'তথ্য গোপন' : 'Not specified')}
                  </p>
                </div>

                {profileUser.hobbies && (
                  <div>
                    <p className="text-slate-400 font-semibold">{language === 'bn' ? 'শখ ও আগ্রহ' : 'Hobbies & Interests'}</p>
                    <p className="text-slate-900 dark:text-slate-100 font-bold mt-0.5">
                      {profileUser.hobbies}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SubTab: Friends & Followers */}
      {activeSubTab === 'friends' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-slate-100">
                {language === 'bn'
                  ? `বন্ধু ও ফলোয়ার তালিকা (${contacts.length})`
                  : `Friends & Followers (${contacts.length})`}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {language === 'bn'
                  ? `ফলো করছেন: ${followingUserIds.length} জন • ফলোয়ার: ${profileUser.followersCount || 0} জন`
                  : `Following: ${followingUserIds.length} • Followers: ${profileUser.followersCount || 0}`}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {contacts.map((c, idx) => {
              const following = isFollowingUser(c.id);
              const isOnline = idx % 3 !== 2;
              return (
                <div
                  key={c.id}
                  className="flex items-center justify-between gap-2 p-3.5 bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-200/70 dark:border-slate-800"
                >
                  <div
                    onClick={() => viewUserProfile(c)}
                    className="flex items-center gap-3 min-w-0 cursor-pointer"
                  >
                    <div className="relative shrink-0">
                      <img
                        src={c.avatar}
                        alt={c.name}
                        referrerPolicy="no-referrer"
                        className="w-11 h-11 rounded-full object-cover"
                      />
                      <span
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${
                          isOnline ? 'bg-emerald-500' : 'bg-slate-400'
                        }`}
                      />
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate hover:underline">
                        {language === 'bn' ? c.nameBn || c.name : c.name}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {isOnline
                          ? language === 'bn'
                            ? '🟢 অনলাইন'
                            : '🟢 Online'
                          : c.city || 'Bandhan User'}
                      </p>
                    </div>
                  </div>

                  {c.id !== currentUser.id && (
                    <button
                      type="button"
                      onClick={() => toggleFollowUser(c.id)}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold shrink-0 cursor-pointer transition-colors ${
                        following
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {following
                        ? language === 'bn'
                          ? 'ফলোয়িং'
                          : 'Following'
                        : language === 'bn'
                        ? '+ ফলো'
                        : '+ Follow'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SubTab: Videos & Reels */}
      {activeSubTab === 'videos' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Film className="w-5 h-5 text-blue-600" />
              <span>
                {language === 'bn'
                  ? `${profileUser.nameBn || profileUser.name}-এর সকল ভিডিও ও রিলস (${totalUserVideosCount})`
                  : `${profileUser.name}'s Videos & Reels (${totalUserVideosCount})`}
              </span>
            </h3>
          </div>

          {totalUserVideosCount === 0 ? (
            <p className="text-xs text-slate-400 text-center py-10">
              {language === 'bn'
                ? 'এই প্রোফাইলে এখনও কোনো ভিডিও বা রিল আপলোড করা হয়নি।'
                : 'No videos or reels uploaded on this profile yet.'}
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {userPostVideos.map((vp) => (
                <div
                  key={vp.id}
                  className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-black flex flex-col"
                >
                  <video
                    src={vp.video}
                    controls
                    className="w-full aspect-video object-contain bg-black"
                  />
                  <div className="p-3 bg-white dark:bg-slate-900">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-2">
                      {vp.content || (language === 'bn' ? 'ভিডিও পোস্ট' : 'Video Post')}
                    </p>
                    {vp.groupName && (
                      <span className="inline-block mt-1 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                        ▸ {vp.groupName}
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {userReels.map((reel) => (
                <div
                  key={reel.id}
                  className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-black flex flex-col"
                >
                  {reel.videoUrl ? (
                    <video
                      src={reel.videoUrl}
                      poster={reel.posterUrl}
                      controls
                      className="w-full aspect-video object-contain bg-black"
                    />
                  ) : (
                    <img
                      src={reel.posterUrl}
                      alt={reel.description}
                      className="w-full aspect-video object-cover"
                    />
                  )}
                  <div className="p-3 bg-white dark:bg-slate-900">
                    <span className="inline-block px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-bold mb-1">
                      🎬 Reel
                    </span>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-2">
                      {reel.description}
                    </p>
                  </div>
                </div>
              ))}

              {userStoryVideos.map((st) => (
                <div
                  key={st.id}
                  className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-black flex flex-col"
                >
                  <video
                    src={st.videoUrl || st.mediaUrl}
                    controls
                    className="w-full aspect-video object-contain bg-black"
                  />
                  <div className="p-3 bg-white dark:bg-slate-900">
                    <span className="inline-block px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-bold mb-1">
                      ⏳ 24h Story Video
                    </span>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                      {st.text || 'Story Video'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SubTab: Photos */}
      {activeSubTab === 'photos' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-pink-500" />
              <span>
                {language === 'bn' ? `সব ছবি (${userPhotos.length})` : `All Photos (${userPhotos.length})`}
              </span>
            </h3>
          </div>

          {userPhotos.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-10">
              {language === 'bn' ? 'কোনো ছবি পাওয়া যায়নি' : 'No photos available'}
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {userPhotos.map((img, i) => (
                <div
                  key={i}
                  onClick={() => setLightboxIndex(i)}
                  className="aspect-square rounded-2xl overflow-hidden shadow-xs cursor-pointer group relative"
                >
                  <img
                    src={img}
                    alt="User photo"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <Eye className="w-6 h-6" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SubTab: Albums */}
      {activeSubTab === 'albums' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Folder className="w-5 h-5 text-indigo-500" />
                <span>
                  {language === 'bn'
                    ? `ফটো অ্যালবামসমূহ (${userAlbums.length})`
                    : `Photo Albums (${userAlbums.length})`}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {language === 'bn'
                  ? 'আপনার আপলোডকৃত ছবিগুলোকে কাস্টম নামে সাজিয়ে রাখুন'
                  : 'Categorize and organize your uploaded photos into custom-named albums'}
              </p>
            </div>

            {isOwnProfile && (
              <button
                type="button"
                onClick={() => setIsCreateAlbumModalOpen(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <FolderPlus className="w-4 h-4" />
                <span>{language === 'bn' ? '+ নতুন অ্যালবাম তৈরি করুন' : '+ Create New Album'}</span>
              </button>
            )}
          </div>

          {/* Active Album Detail View OR Album Grid */}
          {selectedAlbumId ? (
            (() => {
              const currentAlbum = userAlbums.find((a) => a.id === selectedAlbumId);
              if (!currentAlbum) {
                return (
                  <div className="text-center py-10">
                    <p className="text-sm text-slate-400">
                      {language === 'bn' ? 'অ্যালবামটি পাওয়া যায়নি।' : 'Album not found.'}
                    </p>
                    <button
                      type="button"
                      onClick={() => setSelectedAlbumId(null)}
                      className="mt-3 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold text-blue-600 cursor-pointer"
                    >
                      {language === 'bn' ? 'ফিরে যান' : 'Go back'}
                    </button>
                  </div>
                );
              }

              return (
                <div className="space-y-6 animate-in fade-in duration-200">
                  {/* Album Detail Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setSelectedAlbumId(null)}
                        className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                        title={language === 'bn' ? 'সকল অ্যালবামে ফিরুন' : 'Back to albums'}
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                            {language === 'bn' ? currentAlbum.titleBn || currentAlbum.title : currentAlbum.title}
                          </h4>
                          {currentAlbum.isSystem && (
                            <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                              {language === 'bn' ? 'ডিফল্ট' : 'Default'}
                            </span>
                          )}
                        </div>
                        {currentAlbum.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {currentAlbum.description}
                          </p>
                        )}
                        <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">
                          {language === 'bn'
                            ? `মোট ${currentAlbum.photos.length} টি ছবি`
                            : `${currentAlbum.photos.length} photos`}
                        </p>
                      </div>
                    </div>

                    {isOwnProfile && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsAddPhotoModalOpen(true)}
                          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                        >
                          <Plus className="w-4 h-4" />
                          <span>{language === 'bn' ? 'ছবি যোগ করুন' : 'Add Photos'}</span>
                        </button>
                        {!currentAlbum.isSystem && (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(language === 'bn' ? 'আপনি কি নিশ্চিত এই অ্যালবামটি মুছে ফেলতে চান?' : 'Are you sure you want to delete this album?')) {
                                deleteAlbum(currentAlbum.id);
                                setSelectedAlbumId(null);
                              }
                            }}
                            className="px-3 py-2 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl cursor-pointer transition-colors"
                          >
                            {language === 'bn' ? 'অ্যালবাম মুছুন' : 'Delete Album'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Album Photos Grid */}
                  {currentAlbum.photos.length === 0 ? (
                    <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
                      <Folder className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        {language === 'bn' ? 'এই অ্যালবামে এখনও কোনো ছবি নেই' : 'No photos in this album yet'}
                      </p>
                      <p className="text-xs text-slate-400 mt-1 mb-4">
                        {language === 'bn'
                          ? 'আপনার পছন্দসই ছবি যোগ করে অ্যালবামটি সাজিয়ে তুলুন।'
                          : 'Add your favorite uploaded photos to this album.'}
                      </p>
                      {isOwnProfile && (
                        <button
                          type="button"
                          onClick={() => setIsAddPhotoModalOpen(true)}
                          className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 cursor-pointer"
                        >
                          {language === 'bn' ? '+ ছবি যোগ করুন' : '+ Add Photos'}
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {currentAlbum.photos.map((photoUrl, photoIdx) => (
                        <div
                          key={photoIdx}
                          className="aspect-square rounded-2xl overflow-hidden shadow-xs relative group bg-slate-100 dark:bg-slate-800"
                        >
                          <img
                            src={photoUrl}
                            alt="Album Photo"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform cursor-pointer"
                            onClick={() => {
                              const idx = userPhotos.indexOf(photoUrl);
                              if (idx !== -1) setLightboxIndex(idx);
                              else {
                                setLightboxIndex(0);
                              }
                            }}
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white pointer-events-none">
                            <Eye className="w-5 h-5 pointer-events-auto cursor-pointer" />
                          </div>
                          {isOwnProfile && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removePhotoFromAlbum(currentAlbum.id, photoUrl);
                              }}
                              className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-md"
                              title={language === 'bn' ? 'অ্যালবাম থেকে ছবি সরান' : 'Remove from album'}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()
          ) : (
            /* Album Grid List */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {userAlbums.map((album) => (
                <div
                  key={album.id}
                  onClick={() => setSelectedAlbumId(album.id)}
                  className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden hover:border-indigo-400 dark:hover:border-indigo-600 transition-all hover:shadow-md cursor-pointer group flex flex-col"
                >
                  <div className="aspect-video w-full bg-slate-200 dark:bg-slate-700 relative overflow-hidden">
                    {album.coverUrl || album.photos[0] ? (
                      <img
                        src={album.coverUrl || album.photos[0]}
                        alt={album.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                        <Folder className="w-10 h-10 mb-1" />
                        <span className="text-xs">{language === 'bn' ? 'খালি অ্যালবাম' : 'Empty album'}</span>
                      </div>
                    )}
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-xs text-white text-[11px] font-bold flex items-center gap-1">
                      <ImageIcon className="w-3 h-3" />
                      <span>{album.photos.length}</span>
                    </div>
                  </div>
                  <div className="p-3.5 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {language === 'bn' ? album.titleBn || album.title : album.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {album.photos.length}{' '}
                        {language === 'bn' ? 'টি ছবি' : album.photos.length === 1 ? 'photo' : 'photos'}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      {language === 'bn' ? 'দেখুন ▸' : 'View ▸'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Create Album Modal */}
          {isCreateAlbumModalOpen && (
            <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h4 className="font-extrabold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <FolderPlus className="w-5 h-5 text-indigo-600" />
                    <span>{language === 'bn' ? 'নতুন ফটো অ্যালবাম তৈরি' : 'Create New Photo Album'}</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => setIsCreateAlbumModalOpen(false)}
                    className="p-1 rounded-full text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      {language === 'bn' ? 'অ্যালবামের নাম (English):' : 'Album Name (English):'}
                    </label>
                    <input
                      type="text"
                      value={newAlbumTitle}
                      onChange={(e) => setNewAlbumTitle(e.target.value)}
                      placeholder="e.g. Cox's Bazar Trip, Family, Memories"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      {language === 'bn' ? 'অ্যালবামের নাম (বাংলা):' : 'Album Name (Bangla):'}
                    </label>
                    <input
                      type="text"
                      value={newAlbumTitleBn}
                      onChange={(e) => setNewAlbumTitleBn(e.target.value)}
                      placeholder="যেমন: কক্সবাজার ভ্রমণ, পরিবার, সুন্দর স্মৃতি"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      {language === 'bn' ? 'বিবরণ (ঐচ্ছিক):' : 'Description (Optional):'}
                    </label>
                    <textarea
                      value={newAlbumDesc}
                      onChange={(e) => setNewAlbumDesc(e.target.value)}
                      rows={2}
                      placeholder={language === 'bn' ? 'এই অ্যালবামের ছবির বিবরণ...' : 'Describe what these photos are about...'}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsCreateAlbumModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                  >
                    {language === 'bn' ? 'বাতিল' : 'Cancel'}
                  </button>
                  <button
                    type="button"
                    disabled={!newAlbumTitle.trim() && !newAlbumTitleBn.trim()}
                    onClick={() => {
                      const finalTitle = newAlbumTitle.trim() || newAlbumTitleBn.trim();
                      const created = createAlbum({
                        userId: currentUser.id,
                        title: finalTitle,
                        titleBn: newAlbumTitleBn.trim() || finalTitle,
                        description: newAlbumDesc.trim() || undefined,
                        photos: [],
                        isSystem: false,
                      });
                      setIsCreateAlbumModalOpen(false);
                      setNewAlbumTitle('');
                      setNewAlbumTitleBn('');
                      setNewAlbumDesc('');
                      setSelectedAlbumId(created.id);
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-bold rounded-xl cursor-pointer shadow-sm"
                  >
                    {language === 'bn' ? 'অ্যালবাম তৈরি করুন' : 'Create Album'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Add Photo to Album Modal */}
          {isAddPhotoModalOpen && selectedAlbumId && (
            <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in zoom-in-95 max-h-[85vh] flex flex-col">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h4 className="font-extrabold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-indigo-600" />
                    <span>{language === 'bn' ? 'অ্যালবামে ছবি যোগ করুন' : 'Add Photo to Album'}</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => setIsAddPhotoModalOpen(false)}
                    className="p-1 rounded-full text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4 overflow-y-auto pr-1 flex-1">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      {language === 'bn' ? 'নতুন ছবির লিঙ্ক বা ডেটা URL:' : 'Photo URL or Data Link:'}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={albumPhotoInputUrl}
                        onChange={(e) => setAlbumPhotoInputUrl(e.target.value)}
                        placeholder="https://images.unsplash.com/..."
                        className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        type="button"
                        disabled={!albumPhotoInputUrl.trim()}
                        onClick={() => {
                          if (albumPhotoInputUrl.trim()) {
                            addPhotoToAlbum(selectedAlbumId, albumPhotoInputUrl.trim());
                            setAlbumPhotoInputUrl('');
                            setIsAddPhotoModalOpen(false);
                          }
                        }}
                        className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-40 cursor-pointer"
                      >
                        {language === 'bn' ? 'যুক্ত করুন' : 'Add'}
                      </button>
                    </div>
                  </div>

                  {userPhotos.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                        {language === 'bn'
                          ? 'অথবা আপনার পূর্বে আপলোডকৃত ছবি থেকে সিলেক্ট করুন:'
                          : 'Or pick from your existing uploaded photos:'}
                      </p>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {userPhotos.map((photoUrl, pIdx) => {
                          const currentAlbum = userAlbums.find((a) => a.id === selectedAlbumId);
                          const isAlreadyInAlbum = currentAlbum?.photos.includes(photoUrl);
                          return (
                            <div
                              key={pIdx}
                              onClick={() => {
                                if (isAlreadyInAlbum) {
                                  removePhotoFromAlbum(selectedAlbumId, photoUrl);
                                } else {
                                  addPhotoToAlbum(selectedAlbumId, photoUrl);
                                }
                              }}
                              className={`aspect-square rounded-xl overflow-hidden relative cursor-pointer border-2 transition-all ${
                                isAlreadyInAlbum
                                  ? 'border-indigo-600 ring-2 ring-indigo-500/30'
                                  : 'border-transparent hover:border-slate-300'
                              }`}
                            >
                              <img
                                src={photoUrl}
                                alt="Pick photo"
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                              {isAlreadyInAlbum && (
                                <div className="absolute inset-0 bg-indigo-600/40 flex items-center justify-center text-white">
                                  <Check className="w-5 h-5 font-bold" />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsAddPhotoModalOpen(false)}
                    className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 cursor-pointer"
                  >
                    {language === 'bn' ? 'সম্পন্ন' : 'Done'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Photo Lightbox Modal */}
      {lightboxIndex !== null && (
        <div className="fixed inset-0 z-70 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            className="absolute top-4 right-4 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer z-10"
          >
            <X className="w-6 h-6" />
          </button>

          {userPhotos.length > 1 && (
            <>
              <button
                type="button"
                onClick={() =>
                  setLightboxIndex((prev) =>
                    prev !== null ? (prev - 1 + userPhotos.length) % userPhotos.length : 0,
                  )
                }
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <button
                type="button"
                onClick={() =>
                  setLightboxIndex((prev) =>
                    prev !== null ? (prev + 1) % userPhotos.length : 0,
                  )
                }
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          <div className="max-w-4xl max-h-[85vh] flex flex-col items-center">
            <img
              src={userPhotos[lightboxIndex]}
              alt="Lightbox view"
              className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl"
            />
            <p className="text-white/70 text-xs font-semibold mt-3">
              {lightboxIndex + 1} / {userPhotos.length}
            </p>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-blue-600" />
                <span>{t.editProfile}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Scrollable */}
            <form onSubmit={handleSaveProfile} className="p-6 space-y-5 text-xs overflow-y-auto">
              {/* Profile & Cover Images Live Edit Section */}
              <div className="space-y-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                  {language === 'bn' ? 'প্রোফাইল ও কভার ছবি' : 'Profile & Cover Images'}
                </p>

                {/* Avatar Row */}
                <div className="flex items-center gap-4">
                  <div className="relative shrink-0">
                    <img
                      src={editAvatarPreview}
                      alt="Avatar preview"
                      className="w-16 h-16 rounded-full object-cover border-2 border-blue-500 shadow-md"
                    />
                    <label className="absolute bottom-0 right-0 p-1.5 bg-blue-600 text-white rounded-full cursor-pointer shadow-md hover:bg-blue-700">
                      <Camera className="w-3.5 h-3.5" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const f = e.target.files?.[0];
                          if (f) {
                            const u = await fileToDataUrl(f);
                            setEditAvatarPreview(u);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                      {language === 'bn' ? 'প্রোফাইল ছবি পরিবর্তন' : 'Change Profile Avatar'}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {language === 'bn' ? 'ফাইল সিলেক্ট করুন অথবা নিচের প্রিসেট থেকে পছন্দ করুন' : 'Select an image or choose from presets below'}
                    </p>
                    {/* Preset Avatars */}
                    <div className="flex items-center gap-1.5 mt-2">
                      {PRESET_AVATARS.map((av, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setEditAvatarPreview(av)}
                          className="w-6 h-6 rounded-full overflow-hidden border border-slate-200 hover:ring-2 hover:ring-blue-500 cursor-pointer"
                        >
                          <img src={av} alt="Preset" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Cover Preview Row */}
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs mb-1.5">
                    {language === 'bn' ? 'কভার ছবি' : 'Cover Photo'}
                  </p>
                  <div className="relative h-24 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800">
                    {editCoverPreview ? (
                      <img
                        src={editCoverPreview}
                        alt="Cover preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-r from-blue-600 to-indigo-600" />
                    )}
                    <label className="absolute bottom-2 right-2 px-3 py-1 bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-slate-200 rounded-xl text-[11px] font-bold flex items-center gap-1 shadow cursor-pointer">
                      <Camera className="w-3.5 h-3.5 text-blue-600" />
                      <span>{language === 'bn' ? 'আপলোড' : 'Upload'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const f = e.target.files?.[0];
                          if (f) {
                            const u = await fileToDataUrl(f);
                            setEditCoverPreview(u);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Basic Name Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name (English) *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    পূর্ণ নাম (বাংলায়)
                  </label>
                  <input
                    type="text"
                    value={nameBn}
                    onChange={(e) => setNameBn(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
              </div>

              {/* Bio Field with Char Counter */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">
                    Bio / নিজের সম্পর্কে কিছু লিখুন
                  </label>
                  <span className="text-[10px] text-slate-400">
                    {bio.length}/160
                  </span>
                </div>
                <textarea
                  value={bio}
                  maxLength={160}
                  onChange={(e) => setBio(e.target.value)}
                  rows={2}
                  placeholder={language === 'bn' ? 'আপনার পরিচিতি, শখ বা স্লোগান লিখুন...' : 'Describe yourself in a few words...'}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-medium"
                />
              </div>

              {/* City and Workplace */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.livesIn} (City)
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Dhaka, Bangladesh"
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.worksAt} (Profession / Workplace)
                  </label>
                  <input
                    type="text"
                    value={workplace}
                    onChange={(e) => setWorkplace(e.target.value)}
                    placeholder="Software Engineer, Creative Studio"
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
              </div>

              {/* Education and Website */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'bn' ? 'শিক্ষা প্রতিষ্ঠান' : 'College / University'}
                  </label>
                  <input
                    type="text"
                    value={education}
                    onChange={(e) => setEducation(e.target.value)}
                    placeholder="University of Dhaka"
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'bn' ? 'ওয়েবসাইট / সোশ্যাল লিংক' : 'Website / Link'}
                  </label>
                  <input
                    type="text"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://mywebsite.com"
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
              </div>

              {/* Relationship and Hobbies */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'bn' ? 'সম্পর্কের অবস্থা' : 'Relationship Status'}
                  </label>
                  <select
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer border-0"
                  >
                    <option value="">{language === 'bn' ? 'নির্বাচন করুন' : 'Select status'}</option>
                    <option value="Single">{language === 'bn' ? 'সিঙ্গেল (Single)' : 'Single'}</option>
                    <option value="In a relationship">{language === 'bn' ? 'ইন আ রিলেশনশিপ' : 'In a relationship'}</option>
                    <option value="Married">{language === 'bn' ? 'বিবাহিত (Married)' : 'Married'}</option>
                    <option value="Engaged">{language === 'bn' ? 'বাগদান সম্পন্ন' : 'Engaged'}</option>
                    <option value="It's complicated">{language === 'bn' ? 'ইটস কমপ্লিকেটেড' : "It's complicated"}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'bn' ? 'শখ (কমা দিয়ে আলাদা করুন)' : 'Hobbies (Comma separated)'}
                  </label>
                  <input
                    type="text"
                    value={hobbies}
                    onChange={(e) => setHobbies(e.target.value)}
                    placeholder="Photography, Traveling, Coding"
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
              </div>

              {/* Save / Cancel buttons */}
              <div className="pt-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-md cursor-pointer transition-colors"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Switch Account & Create New Account Modal */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                    {language === 'bn' ? 'অ্যাকাউন্ট ব্যবস্থাপনা' : 'Account Management'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {language === 'bn' ? 'অ্যাকাউন্ট পরিবর্তন করুন বা নতুন অ্যাকাউন্ট তৈরি করুন' : 'Switch between profiles or create a new account'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsAccountModalOpen(false);
                  setLockedUserId(null);
                }}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab Selector: Switch vs Create */}
            <div className="flex items-center border-b border-slate-200 dark:border-slate-800 px-6 pt-2">
              <button
                type="button"
                onClick={() => setAccountModalTab('switch')}
                className={`flex-1 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                  accountModalTab === 'switch'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {language === 'bn'
                  ? `একাউন্টে সুইচ করুন (${profiles.length})`
                  : `Switch Account (${profiles.length})`}
              </button>

              <button
                type="button"
                onClick={() => setAccountModalTab('create')}
                className={`flex-1 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                  accountModalTab === 'create'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {language === 'bn' ? '+ নতুন অ্যাকাউন্ট খুলুন' : '+ Create Account'}
              </button>
            </div>

            {/* Tab 1: Switch Account */}
            {accountModalTab === 'switch' && (
              <div className="p-6 space-y-4 overflow-y-auto">
                {lockedUserId ? (
                  <form onSubmit={handleUnlockPinSubmit} className="space-y-4 py-2">
                    <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-900/50 flex items-center gap-3">
                      <Lock className="w-5 h-5 text-amber-600" />
                      <div>
                        <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                          {language === 'bn' ? 'অ্যাকাউন্ট পিন প্রবেশ করান' : 'Account is Protected by PIN'}
                        </p>
                        <p className="text-[11px] text-amber-700 dark:text-amber-300">
                          {language === 'bn' ? 'লগইন করতে আপনার পিন কোড লিখুন' : 'Enter your security PIN to switch to this account'}
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        PIN / Password
                      </label>
                      <input
                        type="password"
                        value={quickPinInput}
                        onChange={(e) => setQuickPinInput(e.target.value)}
                        placeholder="Enter 4-digit PIN"
                        autoFocus
                        className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setLockedUserId(null);
                          setQuickPinInput('');
                        }}
                        className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
                      >
                        {t.cancel}
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-blue-700 shadow-md"
                      >
                        {language === 'bn' ? 'আনলক ও সুইচ' : 'Unlock & Switch'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-2">
                    {profiles.map((p) => {
                      const isCurrent = p.id === currentUser.id;
                      return (
                        <div
                          key={p.id}
                          onClick={() => handleSwitchAccountClick(p.id, Boolean(p.pinHash))}
                          className={`p-3 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition-all border ${
                            isCurrent
                              ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900'
                              : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/70 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={p.avatar}
                              alt={p.name}
                              referrerPolicy="no-referrer"
                              className="w-11 h-11 rounded-full object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                            />
                            <div className="truncate">
                              <div className="flex items-center gap-1.5">
                                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                                  {language === 'bn' ? p.nameBn || p.name : p.name}
                                </p>
                                {p.pinHash && (
                                  <span title="PIN Protected">
                                    <Lock className="w-3 h-3 text-amber-500" />
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400 truncate">
                                @{p.username} · {p.city || 'Bandhan User'}
                              </p>
                            </div>
                          </div>

                          {isCurrent ? (
                            <span className="px-2.5 py-1 rounded-full bg-blue-600 text-white text-[10px] font-extrabold shrink-0">
                              Active
                            </span>
                          ) : (
                            <button
                              type="button"
                              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold shrink-0 shadow-xs border border-slate-200 dark:border-slate-600"
                            >
                              {language === 'bn' ? 'সুইচ' : 'Switch'}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Create New Account Form */}
            {accountModalTab === 'create' && (
              <form onSubmit={handleCreateAccountSubmit} className="p-6 space-y-4 overflow-y-auto text-xs">
                {/* Avatar Selection */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {language === 'bn' ? 'প্রোফাইল ছবি' : 'Profile Picture'}
                  </label>
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        newAccAvatar ||
                        createAvatarUrl(newAccName || 'New User', '#1877F2', '#ffffff')
                      }
                      alt="Preview"
                      className="w-12 h-12 rounded-full object-cover border-2 border-blue-500 shrink-0"
                    />
                    <label className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl font-bold cursor-pointer hover:bg-slate-200 transition-colors">
                      <span>{language === 'bn' ? 'ছবি আপলোড করুন' : 'Upload Photo'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const f = e.target.files?.[0];
                          if (f) {
                            const u = await fileToDataUrl(f);
                            setNewAccAvatar(u);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Full Name (English) *
                    </label>
                    <input
                      type="text"
                      value={newAccName}
                      onChange={(e) => setNewAccName(e.target.value)}
                      placeholder="e.g. Shakib Ahmed"
                      className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      পূর্ণ নাম (বাংলায়)
                    </label>
                    <input
                      type="text"
                      value={newAccNameBn}
                      onChange={(e) => setNewAccNameBn(e.target.value)}
                      placeholder="উদাঃ সাকিব আহমেদ"
                      className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Username (ইউজারনেম)
                    </label>
                    <input
                      type="text"
                      value={newAccUsername}
                      onChange={(e) => setNewAccUsername(e.target.value)}
                      placeholder="shakib_ahmed"
                      className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Email or Mobile Phone
                    </label>
                    <input
                      type="text"
                      value={newAccEmailOrPhone}
                      onChange={(e) => setNewAccEmailOrPhone(e.target.value)}
                      placeholder="email@example.com / 01700000000"
                      className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Bio (পরিচিতি)
                  </label>
                  <input
                    type="text"
                    value={newAccBio}
                    onChange={(e) => setNewAccBio(e.target.value)}
                    placeholder="Tech enthusiast & Traveler ✈️"
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Password / Security PIN (ঐচ্ছিক)
                  </label>
                  <div className="relative">
                    <input
                      type={showNewAccPin ? 'text' : 'password'}
                      value={newAccPin}
                      onChange={(e) => setNewAccPin(e.target.value)}
                      placeholder="৪ ডিজিটের পিন বা পাসওয়ার্ড"
                      className="w-full px-3 py-2 pr-9 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewAccPin(!showNewAccPin)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    >
                      {showNewAccPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setAccountModalTab('switch')}
                    className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl cursor-pointer"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-md cursor-pointer transition-colors"
                  >
                    {language === 'bn' ? 'অ্যাকাউন্ট তৈরি করুন' : 'Create Account'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Block Confirmation Modal */}
      {isBlockModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden p-5">
            <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/50 text-red-600 flex items-center justify-center mb-3">
              <Ban className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {t.blockConfirmTitle} {language === 'bn' ? profileUser.nameBn || profileUser.name : profileUser.name}?
            </h3>

            <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
              {t.blockConfirmDesc}
            </p>

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsBlockModalOpen(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={handleConfirmBlock}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>{t.blockUser}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

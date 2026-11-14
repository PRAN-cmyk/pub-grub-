import React, { useState } from 'react';
import {
  Video,
  Image as ImageIcon,
  Camera,
  Smile,
  X,
  Globe,
  Users,
  Lock,
  Palette,
  Check,
  MapPin,
  GraduationCap,
  Calendar,
  Clock,
  ChevronDown,
  Shield,
  Hourglass,
  Flame,
  Radio,
  BarChart2,
  Cloud,
  Loader2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CameraCaptureModal } from './CameraCaptureModal';
import { LiveStreamModal } from './LiveStreamModal';
import { CreatePoll } from './CreatePoll';
import { CloudinarySettingsModal } from './CloudinarySettingsModal';
import { PollData } from '../types';
import { fileToDataUrl } from '../utils/storage';
import { uploadMediaToCloudinary, isVideoFile as checkIsVideoFile } from '../utils/cloudinary';

const POPULAR_LOCATIONS = [
  'Dhaka, Bangladesh',
  'Sylhet Tea Gardens',
  "Cox's Bazar Sea Beach",
  'Chattogram, Bangladesh',
  'Sajek Valley, Rangamati',
  'Rajshahi, Bangladesh',
];

const POST_GRADIENTS = [
  'from-blue-600 via-indigo-600 to-violet-700',
  'from-rose-500 via-pink-600 to-purple-600',
  'from-amber-500 via-orange-600 to-red-600',
  'from-emerald-500 via-teal-600 to-cyan-700',
  'from-purple-600 via-pink-500 to-amber-400',
  'from-slate-900 via-purple-950 to-slate-900',
];

interface CreatePostBoxProps {
  groupId?: string;
  groupName?: string;
}

export const CreatePostBox: React.FC<CreatePostBoxProps> = ({ groupId, groupName }) => {
  const {
    currentUser,
    isCreatePostOpen,
    setIsCreatePostOpen,
    setIsCreateStoryOpen,
    setIsCreateReelOpen,
    addPost,
    setActiveTab,
    language,
    t,
    showToast,
  } = useApp();

  const [content, setContent] = useState('');
  const [selectedGradient, setSelectedGradient] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [privacy, setPrivacy] = useState<'public' | 'friends' | 'only_me'>('public');
  const [isPrivacyDropdownOpen, setIsPrivacyDropdownOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [selectedFeeling, setSelectedFeeling] = useState<{
    type: string;
    emoji: string;
    labelEn: string;
    labelBn: string;
  } | null>(null);
  const [isFeelingPickerOpen, setIsFeelingPickerOpen] = useState(false);
  const [isGradientPickerOpen, setIsGradientPickerOpen] = useState(false);
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<string | null>(null);
  const [isSelfDestructOpen, setIsSelfDestructOpen] = useState(false);
  const [selfDestructMinutes, setSelfDestructMinutes] = useState<number | null>(null);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [isLiveStreamModalOpen, setIsLiveStreamModalOpen] = useState(false);
  const [pollData, setPollData] = useState<PollData | null>(null);
  const [isCreatePollOpen, setIsCreatePollOpen] = useState(false);
  const [isCloudinaryModalOpen, setIsCloudinaryModalOpen] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const setQuickSchedule = (hoursAhead: number) => {
    const d = new Date(Date.now() + hoursAhead * 60 * 60 * 1000);
    const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setScheduledDate(localIso);
  };

  const handlePhotoCaptured = (dataUrl: string) => {
    setPhotoPreview(dataUrl);
    setSelectedGradient(null);
    setIsCreatePostOpen(true);
    showToast(
      language === 'bn'
        ? 'ক্যামেরা থেকে ছবি সফলভাবে যুক্ত হয়েছে!'
        : 'Photo captured and attached to post!',
    );
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVid = checkIsVideoFile(file);

    // Immediate local Object URL preview for zero lag
    const instantPreview = URL.createObjectURL(file);
    if (isVid) {
      setVideoPreview(instantPreview);
      setPhotoPreview(null);
    } else {
      setPhotoPreview(instantPreview);
      setVideoPreview(null);
    }
    setSelectedGradient(null);
    setIsCreatePostOpen(true);
    setIsUploadingMedia(true);
    setUploadProgress(12);

    try {
      // Direct Cloudinary Free Tier REST upload with live progress tracking
      const uploadResult = await uploadMediaToCloudinary(file, {
        onProgress: (percent) => setUploadProgress(percent),
      });

      if (isVid) {
        setVideoPreview(uploadResult.secureUrl);
        showToast(
          language === 'bn'
            ? `ক্লাউডিনারি ফ্রি-টিয়ার: ভিডিও (${(file.size / (1024 * 1024)).toFixed(1)} MB) সফলভাবে সিডিএন-এ আপলোড হয়েছে!`
            : `Cloudinary Free Tier: Video (${(file.size / (1024 * 1024)).toFixed(1)} MB) uploaded to CDN!`,
        );
      } else {
        setPhotoPreview(uploadResult.secureUrl);
        showToast(
          language === 'bn'
            ? 'ক্লাউডিনারি সিডিএন-এ ছবি সফলভাবে আপলোড হয়েছে!'
            : 'Photo uploaded to Cloudinary Free CDN!',
        );
      }
    } catch {
      // uploadMediaToCloudinary already safely falls back to local storage
      const fallbackUrl = await fileToDataUrl(file);
      if (isVid) {
        setVideoPreview(fallbackUrl);
      } else {
        setPhotoPreview(fallbackUrl);
      }
      showToast(
        language === 'bn'
          ? 'মিডিয়া লোকাল ড্রাইভে ব্যাকআপ হিসেবে সংরক্ষিত হয়েছে'
          : 'Media saved with local fallback',
      );
    } finally {
      setIsUploadingMedia(false);
    }
    e.target.value = '';
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !photoPreview && !videoPreview && !isLiveMode && !pollData) return;

    const expiresAt = selfDestructMinutes
      ? new Date(Date.now() + selfDestructMinutes * 60 * 1000).toISOString()
      : undefined;

    addPost({
      content:
        content.trim() ||
        (isLiveMode
          ? language === 'bn'
            ? '🔴 সরাসরি লাইভ সম্প্রচার করছি! সবাই যুক্ত হোন এবং কমেন্ট করুন।'
            : '🔴 Streaming Live right now! Join and comment below.'
          : pollData
          ? language === 'bn'
            ? '📊 নতুন মতামত জরিপ (Community Poll)'
            : '📊 Community Poll'
          : ''),
      image: photoPreview || undefined,
      video: videoPreview || undefined,
      mediaType: videoPreview ? 'video' : photoPreview ? 'image' : undefined,
      gradientBg: selectedGradient || undefined,
      privacy: isLiveMode ? 'public' : privacy,
      feeling: selectedFeeling || undefined,
      location: selectedLocation || undefined,
      isLive: isLiveMode || undefined,
      scheduledFor: scheduledDate || undefined,
      expiresAt,
      selfDestructDuration: selfDestructMinutes || undefined,
      groupId,
      groupName,
      poll: pollData || undefined,
    });

    // Reset state
    setContent('');
    setPhotoPreview(null);
    setVideoPreview(null);
    setSelectedGradient(null);
    setSelectedFeeling(null);
    setSelectedLocation(null);
    setIsLiveMode(false);
    setScheduledDate(null);
    setIsScheduleOpen(false);
    setSelfDestructMinutes(null);
    setIsSelfDestructOpen(false);
    setPollData(null);
    setIsCreatePollOpen(false);
    setIsCreatePostOpen(false);
  };

  return (
    <>
      {/* Inline Quick Box */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-3.5 mb-4">
        <div className="flex items-center gap-3">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            referrerPolicy="no-referrer"
            className="w-10 h-10 rounded-full object-cover shrink-0"
          />
          <button
            type="button"
            onClick={() => setIsCreatePostOpen(true)}
            className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 text-left px-4 py-2.5 rounded-full text-slate-500 dark:text-slate-400 text-sm transition-colors cursor-pointer truncate"
          >
            {t.whatsOnYourMind.replace('{name}', (currentUser?.name || 'User').split(' ')[0])}
          </button>
        </div>

        <div className="h-px bg-slate-100 dark:bg-slate-800 my-3" />

        <div className="flex items-center justify-between text-xs sm:text-sm font-semibold gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('classroom')}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            title={language === 'bn' ? 'গুগল ক্লাসরুম' : 'Google Classroom'}
          >
            <GraduationCap className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="truncate">{language === 'bn' ? 'ক্লাসরুম' : 'Classroom'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCreateStoryOpen(true)}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            title={t.createStory}
          >
            <span className="text-base leading-none">📖</span>
            <span className="truncate">{t.story || (language === 'bn' ? 'স্টোরি' : 'Story')}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCreateReelOpen(true)}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            title={t.createReel || (language === 'bn' ? 'রিল তৈরি করুন' : 'Create Reel')}
          >
            <span className="text-base leading-none">🎬</span>
            <span className="truncate">{t.reel || (language === 'bn' ? 'রিল' : 'Reel')}</span>
          </button>

          <label
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            title={language === 'bn' ? 'যেকোনো সাইজের ছবি বা ভিডিও আপলোড করুন' : 'Upload any size photo or video'}
          >
            <ImageIcon className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="truncate">{t.photoVideo}</span>
            <input
              type="file"
              accept="image/*,video/*,.mp4,.mov,.webm,.mkv,.avi"
              onChange={handlePhotoSelect}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={() => {
              setIsCreatePostOpen(true);
              setIsFeelingPickerOpen(true);
            }}
            className="flex-1 hidden sm:flex items-center justify-center gap-1.5 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
          >
            <Smile className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="truncate">{t.feelingActivity}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsCreatePostOpen(true);
              setIsCreatePollOpen(true);
            }}
            className="flex-1 hidden sm:flex items-center justify-center gap-1.5 py-1.5 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-700 dark:text-blue-400 transition-colors cursor-pointer"
            title={language === 'bn' ? 'মতামত জরিপ / পোল তৈরি করুন' : 'Create Poll'}
          >
            <BarChart2 className="w-4 h-4 text-blue-500 shrink-0" />
            <span className="truncate">{language === 'bn' ? 'পোল' : 'Poll'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsCreatePostOpen(true);
              setIsSelfDestructOpen(true);
              if (!selfDestructMinutes) setSelfDestructMinutes(60);
            }}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-700 dark:text-amber-400 transition-colors cursor-pointer"
            title={language === 'bn' ? 'স্বয়ংক্রিয় ধ্বংস পোস্ট (Self-Destruct)' : 'Self-Destruct Post'}
          >
            <Hourglass className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="truncate">{language === 'bn' ? 'ধ্বংস টাইমার' : 'Self-destruct'}</span>
          </button>
        </div>
      </div>

      {/* Full Facebook-style Composer Modal */}
      {isCreatePostOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="relative px-4 py-3 border-b border-slate-200 dark:border-slate-800 text-center">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                {groupName ? `${t.createPost} • ${groupName}` : t.createPost}
              </h3>
              <button
                type="button"
                onClick={() => setIsCreatePostOpen(false)}
                className="absolute right-3 top-3 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Author info & Audience dropdown */}
            <div className="p-4 flex items-center gap-3">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                referrerPolicy="no-referrer"
                className="w-11 h-11 rounded-full object-cover"
              />
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    {language === 'bn' ? currentUser.nameBn || currentUser.name : currentUser.name}
                  </span>
                  {isLiveMode && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-bold uppercase">
                      <Radio className="w-2.5 h-2.5" />
                      {language === 'bn' ? 'লাইভ' : 'LIVE'}
                    </span>
                  )}
                  {selectedFeeling && (
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      — {selectedFeeling.emoji}{' '}
                      {language === 'bn' ? selectedFeeling.labelBn : selectedFeeling.labelEn}
                    </span>
                  )}
                  {selectedLocation && (
                    <span className="inline-flex items-center gap-0.5 text-xs text-rose-600 dark:text-rose-400 font-medium">
                      <MapPin className="w-3 h-3" />
                      {selectedLocation}
                    </span>
                  )}
                </div>

                {/* Privacy Audience Control Dropdown Menu */}
                <div className="relative flex items-center gap-1 mt-1">
                  <button
                    type="button"
                    onClick={() => setIsPrivacyDropdownOpen((prev) => !prev)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 shadow-xs"
                    title={language === 'bn' ? 'পোস্টের গোপনীয়তা নির্বাচন করুন (ড্রপডাউন)' : 'Select post privacy (Dropdown)'}
                  >
                    {privacy === 'public' && (
                      <>
                        <Globe className="w-3.5 h-3.5 text-blue-500" />
                        <span>{t.public}</span>
                      </>
                    )}
                    {privacy === 'friends' && (
                      <>
                        <Users className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{t.friendsOnly}</span>
                      </>
                    )}
                    {privacy === 'only_me' && (
                      <>
                        <Lock className="w-3.5 h-3.5 text-amber-500" />
                        <span>{t.onlyMe}</span>
                      </>
                    )}
                    <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isPrivacyDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Inline Privacy Settings Dropdown Menu */}
                  {isPrivacyDropdownOpen && (
                    <div className="absolute left-0 top-full mt-1.5 z-40 w-60 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 py-1.5 animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {language === 'bn' ? 'কাকে পোস্টটি দেখাবেন?' : 'Who can see your post?'}
                      </div>
                      {[
                        {
                          id: 'public',
                          icon: Globe,
                          color: 'text-blue-500',
                          labelEn: 'Public (Anyone)',
                          labelBn: 'পাবলিক (সবার জন্য)',
                          descEn: 'Visible to everyone on Bandhan',
                          descBn: 'প্ল্যাটফর্মের সবাই পোস্টটি দেখতে পারবে',
                        },
                        {
                          id: 'friends',
                          icon: Users,
                          color: 'text-emerald-500',
                          labelEn: 'Friends Only',
                          labelBn: 'শুধু বন্ধুদের জন্য',
                          descEn: 'Visible only to your friends',
                          descBn: 'শুধুমাত্র আপনার ফ্রেন্ডলিস্টের বন্ধুরা দেখবে',
                        },
                        {
                          id: 'only_me',
                          icon: Lock,
                          color: 'text-amber-500',
                          labelEn: 'Only Me (Private)',
                          labelBn: 'শুধুমাত্র আমি (গোপন)',
                          descEn: 'Visible only to you on your profile',
                          descBn: 'শুধু আপনি ছাড়া আর কেউ দেখতে পাবে না',
                        },
                      ].map((opt) => {
                        const IconComp = opt.icon;
                        const isSelected = privacy === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => {
                              setPrivacy(opt.id as 'public' | 'friends' | 'only_me');
                              setIsPrivacyDropdownOpen(false);
                            }}
                            className={`w-full px-3 py-2 text-left flex items-start gap-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-blue-50/70 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold'
                                : 'text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <IconComp className={`w-4 h-4 mt-0.5 shrink-0 ${opt.color}`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold">
                                  {language === 'bn' ? opt.labelBn : opt.labelEn}
                                </span>
                                {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                              </div>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                                {language === 'bn' ? opt.descBn : opt.descEn}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Textarea Area */}
            <div className="px-4 flex-1 overflow-y-auto max-h-96">
              {selectedGradient ? (
                <div
                  className={`w-full min-h-[180px] p-6 rounded-2xl bg-gradient-to-br ${selectedGradient} flex items-center justify-center text-center`}
                >
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={t.whatsOnYourMind.replace('{name}', currentUser.name.split(' ')[0])}
                    className="w-full bg-transparent text-white font-bold text-xl placeholder-white/70 text-center focus:outline-none resize-none"
                    rows={4}
                    autoFocus
                  />
                </div>
              ) : (
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={t.whatsOnYourMind.replace('{name}', currentUser.name.split(' ')[0])}
                  className="w-full text-base text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none resize-none min-h-[110px]"
                  rows={4}
                  autoFocus
                />
              )}

              {/* Live Broadcast Preview Box when isLiveMode is active */}
              {isLiveMode && (
                <div className="mt-2 rounded-2xl overflow-hidden bg-slate-950 border border-red-500/50 p-3.5 text-white relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[11px] font-extrabold animate-pulse">
                      <Radio className="w-3 h-3" />
                      {language === 'bn'
                        ? 'পাবলিক লাইভ স্ট্রিম (সবাই দেখতে পাবে)'
                        : 'Public Live Stream (Everyone Can Watch)'}
                    </span>
                    <span className="text-[11px] text-emerald-400 font-semibold">
                      🌐 {language === 'bn' ? 'লাইভ কমেন্ট চালু' : 'Live Comments Enabled'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    {language === 'bn'
                      ? 'আপনি লাইভ শুরু করলে নিউজফিডের সবাই সরাসরি আপনার লাইভ দেখতে ও কমেন্ট করতে পারবে।'
                      : 'Once you go live, everyone on the feed will be able to watch and comment in real time.'}
                  </p>
                </div>
              )}

              {/* Attached Photo or Video Preview */}
              {photoPreview && (
                <div className="relative mt-2 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                  <img
                    src={photoPreview}
                    alt="Upload Preview"
                    referrerPolicy="no-referrer"
                    className="w-full max-h-64 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setPhotoPreview(null)}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {videoPreview && (
                <div className="relative mt-2 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-black">
                  <video
                    src={videoPreview}
                    controls
                    playsInline
                    className="w-full max-h-64 object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => setVideoPreview(null)}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Cloudinary Live Upload Progress & Free-Tier CDN Bar */}
              {isUploadingMedia && (
                <div className="mt-2.5 p-3 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/60 dark:to-indigo-950/50 border border-blue-200 dark:border-blue-800/80 space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs font-semibold text-blue-900 dark:text-blue-200">
                    <span className="flex items-center gap-1.5">
                      <Cloud className="w-4 h-4 text-blue-600 animate-pulse" />
                      <span>
                        {language === 'bn'
                          ? 'ক্লাউডিনারি ফ্রি-টিয়ার আপলোড ও অপ্টিমাইজ হচ্ছে...'
                          : 'Cloudinary Free Tier Upload & Fast CDN...'}
                      </span>
                    </span>
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                      {uploadProgress}%
                    </span>
                  </div>
                  <div className="w-full bg-blue-200/80 dark:bg-blue-900/60 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 h-1.5 rounded-full transition-all duration-200 ease-out"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-blue-600 dark:text-blue-400">
                    <span>
                      {language === 'bn'
                        ? '✓ নো ক্রেডিট কার্ড / নো বিলিং রিকোয়ার্ড'
                        : '✓ 100% Free • No billing / credit card'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsCloudinaryModalOpen(true)}
                      className="underline font-bold hover:text-blue-800 cursor-pointer"
                    >
                      {language === 'bn' ? 'সেটিংস' : 'Settings'}
                    </button>
                  </div>
                </div>
              )}

              {/* Gradient Palette Row */}
              {isGradientPickerOpen && (
                <div className="mt-3 p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-center gap-2 overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setSelectedGradient(null)}
                    className={`w-8 h-8 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 flex items-center justify-center shrink-0 cursor-pointer ${
                      selectedGradient === null ? 'ring-2 ring-blue-500' : ''
                    }`}
                    title="Plain text"
                  >
                    <span className="text-xs">Aa</span>
                  </button>
                  {POST_GRADIENTS.map((g, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSelectedGradient(g);
                        setPhotoPreview(null);
                      }}
                      className={`w-8 h-8 rounded-lg bg-gradient-to-br ${g} shrink-0 cursor-pointer transition-transform ${
                        selectedGradient === g ? 'ring-2 ring-blue-500 scale-105' : 'hover:scale-105'
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* Feeling Picker Popup */}
              {isFeelingPickerOpen && (
                <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      {language === 'bn' ? 'অনুভূতি নির্বাচন করুন' : 'How are you feeling?'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsFeelingPickerOpen(false)}
                      className="text-xs text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { type: 'happy', emoji: '😊', labelEn: 'feeling happy', labelBn: 'আনন্দিত' },
                      { type: 'loved', emoji: '🥰', labelEn: 'feeling loved', labelBn: 'ভালোবাসাময়' },
                      { type: 'excited', emoji: '🚀', labelEn: 'feeling excited', labelBn: 'উত্তেজিত' },
                      { type: 'blessed', emoji: '🤲', labelEn: 'feeling blessed', labelBn: 'কৃতজ্ঞ' },
                      { type: 'relaxed', emoji: '☕', labelEn: 'feeling relaxed', labelBn: 'শান্ত' },
                      { type: 'eating', emoji: '🍕', labelEn: 'eating delicious food', labelBn: 'খাচ্ছি' },
                    ].map((f) => (
                      <button
                        key={f.type}
                        type="button"
                        onClick={() => {
                          setSelectedFeeling(f);
                          setIsFeelingPickerOpen(false);
                        }}
                        className="flex items-center gap-2 p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200 text-left cursor-pointer"
                      >
                        <span className="text-base">{f.emoji}</span>
                        <span>{language === 'bn' ? f.labelBn : f.labelEn}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {/* Location Picker Popup */}
              {isLocationPickerOpen && (
                <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      {language === 'bn' ? 'লোকেশন চেক-ইন নির্বাচন করুন' : 'Check in at a location'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsLocationPickerOpen(false)}
                      className="text-xs text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {POPULAR_LOCATIONS.map((loc) => (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => {
                          setSelectedLocation(loc);
                          setIsLocationPickerOpen(false);
                        }}
                        className="flex items-center gap-1.5 p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200 text-left cursor-pointer truncate"
                      >
                        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span className="truncate">{loc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Poll Creator Component */}
              {isCreatePollOpen && (
                <div className="mt-3">
                  <CreatePoll
                    initialPoll={pollData}
                    onSave={(savedPoll) => {
                      setPollData(savedPoll);
                      setIsCreatePollOpen(false);
                      showToast(
                        language === 'bn'
                          ? '📊 মতামত জরিপ (Poll) সংযুক্ত করা হয়েছে!'
                          : '📊 Poll attached to post!',
                      );
                    }}
                    onCancel={() => setIsCreatePollOpen(false)}
                  />
                </div>
              )}

              {/* Poll Preview Chip if attached and creator is closed */}
              {pollData && !isCreatePollOpen && (
                <div className="mt-3 p-3.5 rounded-2xl bg-blue-50/90 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 shadow-xs">
                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-blue-200/60 dark:border-blue-800/60">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-blue-600 text-white">
                        <BarChart2 className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-blue-900 dark:text-blue-200">
                        {language === 'bn' ? 'সংযুক্ত মতামত জরিপ' : 'Attached Poll'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setIsCreatePollOpen(true)}
                        className="px-2.5 py-1 text-xs font-bold text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-lg transition-colors cursor-pointer"
                      >
                        {language === 'bn' ? 'এডিট' : 'Edit'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPollData(null)}
                        className="px-2.5 py-1 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/60 rounded-lg transition-colors cursor-pointer"
                      >
                        {language === 'bn' ? 'মুছুন' : 'Remove'}
                      </button>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">
                    {pollData.question}
                  </p>
                  <div className="space-y-1.5">
                    {pollData.options.map((opt, i) => (
                      <div
                        key={opt.id || i}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-blue-100 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 font-medium"
                      >
                        <span className="w-5 h-5 rounded-full border-2 border-blue-500/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-[10px]">
                          {i + 1}
                        </span>
                        <span className="truncate">{opt.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions Bar */}
            <div className="p-4 pt-2">
              <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 mb-3">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {language === 'bn' ? 'পোস্টে যুক্ত করুন:' : 'Add to your post:'}
                </span>
                <div className="flex items-center gap-1">
                  {/* Photo or Video upload trigger */}
                  <label
                    title={t.photoVideo}
                    className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-emerald-500 cursor-pointer"
                  >
                    <ImageIcon className="w-5 h-5" />
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={handlePhotoSelect}
                      className="hidden"
                    />
                  </label>

                  {/* Camera photo capture trigger */}
                  <button
                    type="button"
                    title={t.takePhoto}
                    onClick={() => setIsCameraModalOpen(true)}
                    className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-500 cursor-pointer"
                  >
                    <Camera className="w-5 h-5" />
                  </button>

                  {/* Check-in Location toggle */}
                  <button
                    type="button"
                    title={language === 'bn' ? 'লোকেশন চেক-ইন' : 'Check in'}
                    onClick={() => setIsLocationPickerOpen(!isLocationPickerOpen)}
                    className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-rose-500 cursor-pointer"
                  >
                    <MapPin className="w-5 h-5" />
                  </button>

                  {/* Live broadcast studio trigger */}
                  <button
                    type="button"
                    title={language === 'bn' ? 'লাইভ ভিডিও স্টুডিও' : 'Live Video Studio'}
                    onClick={() => {
                      setIsCreatePostOpen(false);
                      setIsLiveStreamModalOpen(true);
                    }}
                    className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-red-500 cursor-pointer"
                  >
                    <Radio className="w-5 h-5 animate-pulse" />
                  </button>

                  {/* Gradient toggle */}
                  <button
                    type="button"
                    title={t.chooseBackground}
                    onClick={() => setIsGradientPickerOpen(!isGradientPickerOpen)}
                    className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-purple-500 cursor-pointer"
                  >
                    <Palette className="w-5 h-5" />
                  </button>

                  {/* Feeling toggle */}
                  <button
                    type="button"
                    title={t.feelingActivity}
                    onClick={() => setIsFeelingPickerOpen(!isFeelingPickerOpen)}
                    className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-amber-500 cursor-pointer"
                  >
                    <Smile className="w-5 h-5" />
                  </button>

                  {/* Schedule Post Toggle */}
                  <button
                    type="button"
                    title={language === 'bn' ? 'পোস্ট শিডিউল করুন' : 'Schedule post'}
                    onClick={() => setIsScheduleOpen(!isScheduleOpen)}
                    className={`p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer ${
                      scheduledDate ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600' : 'text-indigo-500'
                    }`}
                  >
                    <Calendar className="w-5 h-5" />
                  </button>

                  {/* Self-Destruct Timer Toggle */}
                  <button
                    type="button"
                    title={language === 'bn' ? 'স্বয়ংক্রিয় ধ্বংস টাইমার (Self-destruct timer)' : 'Self-destruct timer'}
                    onClick={() => setIsSelfDestructOpen(!isSelfDestructOpen)}
                    className={`p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer ${
                      selfDestructMinutes ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 font-bold' : 'text-amber-500'
                    }`}
                  >
                    <Hourglass className="w-5 h-5" />
                  </button>

                  {/* Poll Toggle */}
                  <button
                    type="button"
                    title={language === 'bn' ? 'মতামত জরিপ / পোল তৈরি করুন' : 'Create a poll'}
                    onClick={() => setIsCreatePollOpen(!isCreatePollOpen)}
                    className={`p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer ${
                      pollData ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-600 font-bold' : 'text-blue-500'
                    }`}
                  >
                    <BarChart2 className="w-5 h-5" />
                  </button>

                  {/* Cloudinary Free Media Storage Status & Config */}
                  <button
                    type="button"
                    title={
                      language === 'bn'
                        ? 'ক্লাউডিনারি ফ্রি মিডিয়া সেটিংস (কোন কার্ড লাগবে না)'
                        : 'Cloudinary Free Media Storage (No credit card required)'
                    }
                    onClick={() => setIsCloudinaryModalOpen(true)}
                    className="p-2 rounded-full hover:bg-blue-50 dark:hover:bg-blue-950/60 text-blue-600 dark:text-blue-400 cursor-pointer"
                  >
                    <Cloud className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Schedule Post Configuration Box */}
              {(isScheduleOpen || scheduledDate) && (
                <div className="mb-3 p-3 bg-indigo-50/80 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-800/80">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-indigo-800 dark:text-indigo-300 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      {language === 'bn' ? 'পোস্টের সময় নির্ধারণ (Schedule Post)' : 'Schedule Post for Later'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsScheduleOpen(false)}
                      className="text-xs text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                    {language === 'bn'
                      ? 'ভবিষ্যতের যে তারিখ ও সময়ে পোস্টটি ফিডে প্রকাশিত হবে তা নির্বাচন করুন:'
                      : 'Pick a future date and time for this post to appear on the feed:'}
                  </p>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-2">
                    <input
                      type="datetime-local"
                      value={scheduledDate || ''}
                      min={new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
                      onChange={(e) => setScheduledDate(e.target.value || null)}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {scheduledDate && (
                      <button
                        type="button"
                        onClick={() => setScheduledDate(null)}
                        className="px-2.5 py-1 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer font-semibold transition-colors"
                      >
                        {language === 'bn' ? 'শিডিউল বাতিল' : 'Clear Schedule'}
                      </button>
                    )}
                  </div>

                  {/* Quick Presets */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {language === 'bn' ? 'সহজ নির্বাচন:' : 'Quick:'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuickSchedule(1)}
                      className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-[11px] font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                    >
                      +1 {language === 'bn' ? 'ঘণ্টা পর' : 'Hour'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickSchedule(4)}
                      className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-[11px] font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                    >
                      +4 {language === 'bn' ? 'ঘণ্টা পর' : 'Hours'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickSchedule(24)}
                      className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-[11px] font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                    >
                      {language === 'bn' ? 'আগামীকাল' : 'Tomorrow'}
                    </button>
                  </div>
                </div>
              )}

              {/* Self-Destruct Timer Configuration Box */}
              {(isSelfDestructOpen || selfDestructMinutes) && (
                <div className="mb-3 p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30 rounded-xl border border-amber-300 dark:border-amber-800">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
                      {language === 'bn' ? 'পোস্ট স্বয়ংক্রিয় ধ্বংস (Self-Destruct Timer)' : 'Self-Destruct Post Timer'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsSelfDestructOpen(false)}
                      className="text-xs text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-[11px] text-amber-800 dark:text-amber-300 mb-2">
                    {language === 'bn'
                      ? 'নির্ধারিত সময় পার হলে এই পোস্টটি ফিড থেকে সম্পূর্ণ স্বয়ংক্রিয়ভাবে মুছে যাবে:'
                      : 'After the selected duration, this post will automatically be deleted from the feed forever:'}
                  </p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[
                      { mins: 1, labelBn: '১ মিনিট (টেস্ট)', labelEn: '1 Min (Test)' },
                      { mins: 5, labelBn: '৫ মিনিট', labelEn: '5 Mins' },
                      { mins: 60, labelBn: '১ ঘণ্টা', labelEn: '1 Hour' },
                      { mins: 1440, labelBn: '২৪ ঘণ্টা', labelEn: '24 Hours' },
                      { mins: 10080, labelBn: '৭ দিন', labelEn: '7 Days' },
                    ].map((preset) => {
                      const isSelected = selfDestructMinutes === preset.mins;
                      return (
                        <button
                          key={preset.mins}
                          type="button"
                          onClick={() => setSelfDestructMinutes(isSelected ? null : preset.mins)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-amber-600 text-white shadow-sm shadow-amber-500/30'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-amber-200 dark:border-amber-800/80 hover:bg-amber-100 dark:hover:bg-amber-900/40'
                          }`}
                        >
                          {language === 'bn' ? preset.labelBn : preset.labelEn}
                        </button>
                      );
                    })}
                    {selfDestructMinutes && (
                      <button
                        type="button"
                        onClick={() => setSelfDestructMinutes(null)}
                        className="px-2 py-1 text-xs text-rose-600 hover:underline font-bold cursor-pointer"
                      >
                        {language === 'bn' ? 'টাইমার বাতিল' : 'Disable'}
                      </button>
                    )}
                  </div>
                  {selfDestructMinutes && (
                    <div className="mt-2 text-[11px] font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-1.5 bg-amber-100/70 dark:bg-amber-950/60 p-1.5 rounded-lg border border-amber-300/50">
                      <Hourglass className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                      <span>
                        {language === 'bn'
                          ? `পোস্টটি প্রকাশের ${selfDestructMinutes < 60 ? `${selfDestructMinutes} মিনিট` : selfDestructMinutes < 1440 ? `${Math.round(selfDestructMinutes / 60)} ঘণ্টা` : `${Math.round(selfDestructMinutes / 1440)} দিন`} পর স্বয়ংক্রিয়ভাবে মুছে যাবে।`
                          : `Post will self-destruct ${selfDestructMinutes < 60 ? `${selfDestructMinutes} minutes` : selfDestructMinutes < 1440 ? `${Math.round(selfDestructMinutes / 60)} hours` : `${Math.round(selfDestructMinutes / 1440)} days`} after publishing.`}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Submit Post Button */}
              <button
                type="button"
                onClick={handleCreatePost}
                disabled={(!content.trim() && !photoPreview && !videoPreview && !isLiveMode && !pollData) || isUploadingMedia}
                className={`w-full py-2.5 px-4 font-bold text-sm rounded-xl shadow-md cursor-pointer transition-all disabled:opacity-50 text-white flex items-center justify-center gap-2 ${
                  isUploadingMedia
                    ? 'bg-blue-500 cursor-not-allowed'
                    : isLiveMode
                    ? 'bg-red-600 hover:bg-red-700'
                    : scheduledDate
                    ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isUploadingMedia ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>
                      {language === 'bn'
                        ? `ক্লাউডিনারিতে আপলোড হচ্ছে (${uploadProgress}%)...`
                        : `Uploading to Cloudinary Free CDN (${uploadProgress}%)...`}
                    </span>
                  </>
                ) : isLiveMode ? (
                  language === 'bn' ? (
                    '🔴 সরাসরি লাইভ শুরু করুন (সবাই দেখতে পাবে)'
                  ) : (
                    '🔴 Go Live Now (Visible to Everyone)'
                  )
                ) : scheduledDate ? (
                  <>
                    <Clock className="w-4 h-4" />
                    <span>
                      {language === 'bn'
                        ? `পোস্ট শিডিউল করুন (${new Date(scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`
                        : `Schedule Post (${new Date(scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`}
                    </span>
                  </>
                ) : (
                  t.post
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Control Modal */}
      {isPrivacyModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                    {language === 'bn' ? 'পোস্টের গোপনীয়তা নির্বাচন করুন' : 'Select Post Audience'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {language === 'bn' ? 'কে আপনার পোস্ট দেখতে পারবে?' : 'Who can see your post on Bandhan?'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPrivacyModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-2.5">
              {[
                {
                  key: 'public',
                  icon: Globe,
                  color: 'text-blue-500',
                  bgColor: 'bg-blue-50 dark:bg-blue-950/40',
                  titleEn: 'Public',
                  titleBn: 'পাবলিক (উন্মুক্ত)',
                  descEn: 'Anyone on or off Bandhan. Your post will be visible to everyone and can be shared.',
                  descBn: 'বান্ধনে বা ইন্টারনেটে যে কেউ দেখতে পারবে এবং নিউজফিডে প্রদর্শিত হবে।',
                },
                {
                  key: 'friends',
                  icon: Users,
                  color: 'text-emerald-500',
                  bgColor: 'bg-emerald-50 dark:bg-emerald-950/40',
                  titleEn: 'Friends',
                  titleBn: 'বান্ধনের বন্ধুরা',
                  descEn: 'Only your friends on Bandhan can view this post. Strangers will not see it.',
                  descBn: 'শুধুমাত্র আপনার ফ্রেন্ডলিস্টে থাকা বন্ধুরা এই পোস্টটি দেখতে পারবেন।',
                },
                {
                  key: 'only_me',
                  icon: Lock,
                  color: 'text-amber-500',
                  bgColor: 'bg-amber-50 dark:bg-amber-950/40',
                  titleEn: 'Only Me',
                  titleBn: 'শুধুমাত্র আমি (প্রাইভেট)',
                  descEn: 'Only you can see this post. Completely private and safe in your profile archive.',
                  descBn: 'শুধুমাত্র আপনি দেখতে পারবেন। অন্য কোন ব্যক্তি এটি দেখতে পারবে না।',
                },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = privacy === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      setPrivacy(item.key as any);
                    }}
                    className={`w-full p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className={`p-2.5 rounded-xl ${item.bgColor} ${item.color} shrink-0 mt-0.5`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                          {language === 'bn' ? item.titleBn : item.titleEn}
                        </span>
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'border-blue-600 bg-blue-600 text-white'
                              : 'border-slate-300 dark:border-slate-700'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        {language === 'bn' ? item.descBn : item.descEn}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsPrivacyModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-sm"
              >
                {language === 'bn' ? 'সম্পন্ন (Save)' : 'Done'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onPhotoCaptured={handlePhotoCaptured}
      />

      {/* Live Stream Broadcasting Studio Modal */}
      <LiveStreamModal
        isOpen={isLiveStreamModalOpen}
        onClose={() => setIsLiveStreamModalOpen(false)}
        groupId={groupId}
        groupName={groupName}
      />

      {/* Cloudinary Free Media Storage Modal */}
      <CloudinarySettingsModal
        isOpen={isCloudinaryModalOpen}
        onClose={() => setIsCloudinaryModalOpen(false)}
      />
    </>
  );
};

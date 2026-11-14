import React, { useState, useEffect } from 'react';
import {
  X,
  Music2,
  Upload,
  Film,
  Check,
  Disc3,
  ShieldCheck,
  Cloud,
  Loader2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { fileToDataUrl } from '../utils/storage';
import { uploadMediaToCloudinary, isVideoFile as checkIsVideoFile } from '../utils/cloudinary';
import { CloudinarySettingsModal } from './CloudinarySettingsModal';

const SAMPLE_REEL_VIDEOS = [
  {
    title: 'Dhaka Sunset & Rain Vibes',
    poster: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=800&auto=format&fit=crop&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    audio: 'Anupam Roy - Tomake Bujhina Priyo 🎵',
  },
  {
    title: 'Cox’s Bazar Beach Waves',
    poster: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    audio: 'Habib Wahid - Hridoyer Kotha 🌊',
  },
  {
    title: 'Coffee & Code Morning',
    poster: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    audio: 'Lofi Chill Beats - Bandhan Sessions 🎧',
  },
  {
    title: 'Street Food in Old Dhaka',
    poster: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoy.mp4',
    audio: 'Shironamhin - Abar Hashimukh ✨',
  },
];

export const CreateReelModal: React.FC = () => {
  const {
    isCreateReelOpen,
    setIsCreateReelOpen,
    addReel,
    currentUser,
    language,
    t,
    showToast,
  } = useApp();

  const [description, setDescription] = useState('');
  const [songTitle, setSongTitle] = useState('Bandhan Original Audio 🎵');
  const [posterUrl, setPosterUrl] = useState(SAMPLE_REEL_VIDEOS[0].poster);
  const [videoUrl, setVideoUrl] = useState<string | undefined>(SAMPLE_REEL_VIDEOS[0].videoUrl);
  const [videoPreviewName, setVideoPreviewName] = useState<string | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isUploadingCloudinary, setIsUploadingCloudinary] = useState(false);
  const [cloudinaryProgress, setCloudinaryProgress] = useState(0);
  const [isCloudinaryModalOpen, setIsCloudinaryModalOpen] = useState(false);

  useEffect(() => {
    if (isCreateReelOpen) {
      try {
        const picked = localStorage.getItem('bandhan_selected_audio');
        if (picked) {
          setSongTitle(picked);
          localStorage.removeItem('bandhan_selected_audio');
        }
      } catch {
        // ignore
      }
    }
  }, [isCreateReelOpen]);

  const handleVideoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoPreviewName(file.name);
    setIsProcessingFile(true);
    setIsUploadingCloudinary(true);
    setCloudinaryProgress(15);

    const isVid = checkIsVideoFile(file);
    const instantLocalUrl = URL.createObjectURL(file);

    // Instant local preview for zero waiting
    if (isVid) {
      setVideoUrl(instantLocalUrl);
    } else {
      setPosterUrl(instantLocalUrl);
      setVideoUrl(undefined);
    }

    try {
      const result = await uploadMediaToCloudinary(file, {
        onProgress: (p) => setCloudinaryProgress(p),
      });

      if (isVid) {
        setVideoUrl(result.secureUrl);
        showToast(
          language === 'bn'
            ? `ক্লাউডিনারি ফ্রি-টিয়ার: রিল ভিডিও (${(file.size / (1024 * 1024)).toFixed(1)} MB) সফলভাবে সিডিএন-এ আপলোড হয়েছে!`
            : `Cloudinary Free Tier: Reel video (${(file.size / (1024 * 1024)).toFixed(1)} MB) uploaded to fast CDN!`,
        );
      } else {
        setPosterUrl(result.secureUrl);
        setVideoUrl(undefined);
        showToast(
          language === 'bn'
            ? 'ক্লাউডিনারি সিডিএন-এ ছবি সফলভাবে আপলোড হয়েছে!'
            : 'Photo uploaded to Cloudinary Free CDN!',
        );
      }
      setVideoPreviewName(`${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB)`);
    } catch {
      const fallbackUrl = await fileToDataUrl(file);
      if (isVid) {
        setVideoUrl(fallbackUrl);
      } else {
        setPosterUrl(fallbackUrl);
        setVideoUrl(undefined);
      }
      showToast(
        language === 'bn'
          ? 'মিডিয়া লোকাল ড্রাইভে ব্যাকআপ হিসেবে সংরক্ষিত হয়েছে'
          : 'Video saved with local fallback',
      );
    } finally {
      setIsProcessingFile(false);
      setIsUploadingCloudinary(false);
    }
  };

  const handleSelectSample = (sample: typeof SAMPLE_REEL_VIDEOS[0]) => {
    setPosterUrl(sample.poster);
    setVideoUrl(sample.videoUrl);
    setSongTitle(sample.audio);
    setVideoPreviewName(null);
    if (!description) {
      setDescription(sample.title);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() && !posterUrl && !videoUrl) return;

    addReel({
      description: description.trim() || (language === 'bn' ? 'নতুন রিল ভিডিও ✨' : 'New Reel Video ✨'),
      posterUrl: posterUrl || SAMPLE_REEL_VIDEOS[0].poster,
      videoUrl: videoUrl,
      songTitle: songTitle.trim() || 'Original Audio',
    });

    // Reset and close
    setDescription('');
    setVideoUrl(SAMPLE_REEL_VIDEOS[0].videoUrl);
    setVideoPreviewName(null);
  };

  if (!isCreateReelOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={() => setIsCreateReelOpen(false)}
    >
      <div
        className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col md:flex-row max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left column: form inputs */}
        <div className="w-full md:w-1/2 p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 overflow-y-auto">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/40 text-rose-600 flex items-center justify-center">
                  <Film className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {t.createReel || (language === 'bn' ? 'রিল ভিডিও আপলোড করুন' : 'Create & Upload Reel')}
                </h3>
              </div>
              <button
                onClick={() => setIsCreateReelOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video File Upload */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  {t.selectVideo || (language === 'bn' ? 'ডিভাইস থেকে রিল ভিডিও বা ক্লিপ আপলোড করুন' : 'Upload Video or Clip from Device')}
                </label>
                <button
                  type="button"
                  onClick={() => setIsCloudinaryModalOpen(true)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  <Cloud className="w-3.5 h-3.5" />
                  <span>{language === 'bn' ? 'ক্লাউডিনারি ফ্রি টিয়ার' : 'Cloudinary Free Tier'}</span>
                </button>
              </div>

              <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-rose-500 rounded-2xl p-4 bg-slate-50 dark:bg-slate-800/60 cursor-pointer transition-colors">
                <Upload className="w-6 h-6 text-rose-500 mb-1" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 text-center">
                  {isProcessingFile
                    ? language === 'bn'
                      ? 'ভিডিও প্রসেস ও আপলোড হচ্ছে...'
                      : 'Processing video...'
                    : videoPreviewName
                    ? videoPreviewName
                    : language === 'bn'
                    ? 'ভিডিও ফাইল নির্বাচন করুন (ক্লাউডিনারি ফ্রি সিডিএন)'
                    : 'Choose video file (Cloudinary Free CDN)'}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">
                  MP4, MOV, WebM, MKV (No credit card or billing needed)
                </span>
                <input
                  type="file"
                  accept="video/*,image/*"
                  onChange={handleVideoSelect}
                  className="hidden"
                />
              </label>

              {/* Cloudinary Live Upload Progress */}
              {isUploadingCloudinary && (
                <div className="mt-2.5 p-3 rounded-2xl bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950/40 dark:to-pink-950/30 border border-rose-200 dark:border-rose-800/60 space-y-1.5 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs font-semibold text-rose-950 dark:text-rose-200">
                    <span className="flex items-center gap-1.5">
                      <Cloud className="w-4 h-4 text-rose-600 animate-pulse" />
                      <span>
                        {language === 'bn'
                          ? 'ক্লাউডিনারিতে রিল ভিডিও আপলোড হচ্ছে...'
                          : 'Uploading Reel to Cloudinary CDN...'}
                      </span>
                    </span>
                    <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                      {cloudinaryProgress}%
                    </span>
                  </div>
                  <div className="w-full bg-rose-200/80 dark:bg-rose-900/50 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-rose-500 to-pink-600 h-1.5 rounded-full transition-all duration-200 ease-out"
                      style={{ width: `${cloudinaryProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Choose Preset Clip if not uploaded */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                {language === 'bn' ? 'অথবা নমুনা রিল ভিডিও নির্বাচন করুন' : 'Or choose preset reel clip'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {SAMPLE_REEL_VIDEOS.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSample(sample)}
                    className={`relative rounded-xl overflow-hidden border-2 text-left p-1.5 flex items-center gap-2 cursor-pointer transition-all ${
                      posterUrl === sample.poster && !videoPreviewName
                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 ring-1 ring-rose-500'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-400'
                    }`}
                  >
                    <img
                      src={sample.poster}
                      alt={sample.title}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                    <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 line-clamp-2 leading-tight">
                      {sample.title}
                    </span>
                    {posterUrl === sample.poster && !videoPreviewName && (
                      <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Caption / Description */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {t.reelCaption || (language === 'bn' ? 'রিলের বর্ণনা ও হ্যাশট্যাগ' : 'Caption & Hashtags')}
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={
                  language === 'bn'
                    ? 'আপনার রিল সম্পর্কে কিছু লিখুন... #Bandhan #Dhaka #Viral'
                    : 'Write a catchy caption... #Bandhan #Trending #Viral'
                }
                rows={2}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-rose-500 resize-none"
              />
            </div>

            {/* Song title */}
            <div className="mb-3 space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Music2 className="w-3.5 h-3.5 text-rose-500" />
                  <span>{t.reelAudio || (language === 'bn' ? 'অডিও বা ব্যাকগ্রাউন্ড মিউজিক' : 'Audio Track / Music')}</span>
                </span>
              </label>
              <input
                type="text"
                value={songTitle}
                onChange={(e) => setSongTitle(e.target.value)}
                placeholder={language === 'bn' ? 'অডিও বা গানের নাম লিখুন...' : 'Song or Audio name'}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-rose-500"
              />

              {/* Quick Audio Preset Tags */}
              <div>
                <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1 mb-1">
                  <Disc3 className="w-3 h-3" />
                  <span>{language === 'bn' ? 'জনপ্রিয় অডিও ট্যাগ:' : 'Popular audio tags:'}</span>
                </p>
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                  {[
                    'Bandhan Original Audio 🎵',
                    'Acoustic Nature Calm 🍃',
                    'Lo-Fi Chill Beats 🎧',
                    'Bangla Folk Instrumental 🪕',
                    'Electronic Vibes ⚡',
                  ].map((track) => (
                    <button
                      key={track}
                      type="button"
                      onClick={() => setSongTitle(track)}
                      className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium border cursor-pointer transition-colors ${
                        songTitle === track
                          ? 'bg-rose-500 text-white border-rose-500'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-rose-400'
                      }`}
                    >
                      🎵 {track}
                    </button>
                  ))}
                </div>
              </div>

              {/* Copyright Law Notice */}
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1.5 rounded-lg border border-emerald-200/60 dark:border-emerald-800/50">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {language === 'bn'
                    ? 'কপিরাইট আইন দ্বারা সুরক্ষিত • রিলটির অরিজিনাল অডিও আপনার নামে রেজিস্টার থাকবে।'
                    : 'Protected under Copyright Law • Original audio will be credited to your profile.'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-4">
            <button
              type="button"
              onClick={() => setIsCreateReelOpen(false)}
              className="flex-1 py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold rounded-xl cursor-pointer"
            >
              {t.cancel}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isProcessingFile || isUploadingCloudinary || (!posterUrl && !description && !videoUrl)}
              className="flex-1 py-2.5 px-4 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 disabled:opacity-40 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-2"
            >
              {isUploadingCloudinary ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>
                    {language === 'bn'
                      ? `আপলোড হচ্ছে (${cloudinaryProgress}%)...`
                      : `Uploading Reel (${cloudinaryProgress}%)...`}
                  </span>
                </>
              ) : (
                t.publishReel || (language === 'bn' ? 'রিল প্রকাশ করুন' : 'Publish Reel')
              )}
            </button>
          </div>
        </div>

        {/* Right column: 9:16 vertical reel live preview */}
        <div className="w-full md:w-1/2 bg-slate-950 p-6 flex flex-col items-center justify-center relative">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            {language === 'bn' ? 'রিল প্রিভিউ' : 'Reel Preview'}
          </p>
          <div className="w-52 aspect-[9/15] rounded-3xl overflow-hidden shadow-2xl relative border-2 border-slate-700 flex flex-col justify-between bg-black">
            {videoUrl ? (
              <video
                src={videoUrl}
                poster={posterUrl}
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <img
                src={posterUrl}
                alt="Preview poster"
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}

            {/* Gradient Scrims */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/30 pointer-events-none" />

            {/* Reel badge */}
            <div className="relative z-10 p-3 flex justify-between items-center">
              <span className="text-[10px] font-bold text-white bg-black/50 backdrop-blur px-2 py-0.5 rounded-full uppercase">
                Reel
              </span>
            </div>

            {/* Reel info bottom */}
            <div className="relative z-10 p-3 space-y-1.5 text-white">
              <div className="flex items-center gap-1.5">
                <img
                  src={currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                  alt={currentUser?.name || 'User'}
                  className="w-6 h-6 rounded-full border border-white/50 object-cover"
                />
                <span className="text-xs font-bold truncate">{currentUser?.name || 'User'}</span>
              </div>
              <p className="text-[11px] line-clamp-2 drop-shadow">
                {description || (language === 'bn' ? 'ক্যাপশন এখানে দেখাবে...' : 'Caption will appear here...')}
              </p>
              <div className="flex items-center gap-1 text-[10px] text-slate-300 font-medium">
                <Music2 className="w-3 h-3 animate-spin text-rose-400" />
                <span className="truncate">{songTitle}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cloudinary Free Media Storage Configuration Modal */}
      <CloudinarySettingsModal
        isOpen={isCloudinaryModalOpen}
        onClose={() => setIsCloudinaryModalOpen(false)}
      />
    </div>
  );
};

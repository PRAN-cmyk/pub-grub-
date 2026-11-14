import React, { useState, useEffect } from 'react';
import { X, Image as ImageIcon, Video, Type, Check, Upload, Volume2, VolumeX, Music2, Disc3, ShieldCheck, Cloud, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { fileToDataUrl } from '../utils/storage';
import { uploadMediaToCloudinary, isVideoFile as checkIsVideoFile } from '../utils/cloudinary';
import { CloudinarySettingsModal } from './CloudinarySettingsModal';

const GRADIENTS = [
  'from-blue-600 via-indigo-600 to-purple-700',
  'from-rose-500 via-pink-600 to-purple-600',
  'from-amber-500 via-orange-600 to-red-600',
  'from-emerald-500 via-teal-600 to-cyan-700',
  'from-violet-600 via-purple-700 to-indigo-900',
  'from-slate-800 via-slate-900 to-black',
];

const SAMPLE_VIDEO_STORIES = [
  {
    title: 'Ocean Waves Clip 🌊',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  },
  {
    title: 'Forest Sunlight 🌲',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  },
];

export const CreateStoryModal: React.FC = () => {
  const {
    isCreateStoryOpen,
    setIsCreateStoryOpen,
    addStory,
    audioLibrary,
    currentUser,
    language,
    t,
    showToast,
    setIsAudioLibraryOpen,
  } = useApp();
  const [mode, setMode] = useState<'text' | 'photo' | 'video'>('text');
  const [text, setText] = useState('');
  const [audioTitle, setAudioTitle] = useState(() => `${currentUser?.name || 'Bandhan'} - Story Audio 🎵`);
  const [audioArtist, setAudioArtist] = useState(() => currentUser?.name || 'Bandhan Music');
  const [audioUrl, setAudioUrl] = useState<string | undefined>(undefined);
  const [selectedGradient, setSelectedGradient] = useState(GRADIENTS[0]);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [videoFileName, setVideoFileName] = useState<string | null>(null);
  const [isPreviewMuted, setIsPreviewMuted] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingCloudinary, setIsUploadingCloudinary] = useState(false);
  const [cloudinaryProgress, setCloudinaryProgress] = useState(0);
  const [isCloudinaryModalOpen, setIsCloudinaryModalOpen] = useState(false);

  useEffect(() => {
    if (isCreateStoryOpen) {
      try {
        const picked = localStorage.getItem('bandhan_selected_audio');
        if (picked) {
          setAudioTitle(picked);
          const found = audioLibrary.find((a) => a.title === picked);
          if (found) {
            setAudioArtist(found.artist || currentUser?.name || 'Bandhan Music');
            setAudioUrl(found.audioUrl || found.videoUrl);
          }
          localStorage.removeItem('bandhan_selected_audio');
        }
      } catch {
        // ignore
      }
    }
  }, [isCreateStoryOpen, audioLibrary, currentUser]);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setIsUploadingCloudinary(true);
    setCloudinaryProgress(15);

    const isVid = checkIsVideoFile(file);
    const instantLocalUrl = URL.createObjectURL(file);

    if (isVid) {
      setVideoPreview(instantLocalUrl);
      setVideoFileName(`${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB)`);
      setMode('video');
    } else {
      setPhotoPreview(instantLocalUrl);
      setMode('photo');
    }

    try {
      const result = await uploadMediaToCloudinary(file, {
        onProgress: (p) => setCloudinaryProgress(p),
      });

      if (isVid) {
        setVideoPreview(result.secureUrl);
        showToast(
          language === 'bn'
            ? `ক্লাউডিনারি: ভিডিও (${(file.size / (1024 * 1024)).toFixed(1)} MB) সফলভাবে সিডিএন-এ আপলোড হয়েছে!`
            : `Cloudinary Free Tier: Video (${(file.size / (1024 * 1024)).toFixed(1)} MB) uploaded to CDN!`,
        );
      } else {
        setPhotoPreview(result.secureUrl);
        showToast(
          language === 'bn'
            ? 'ক্লাউডিনারি সিডিএন-এ ছবি সফলভাবে আপলোড হয়েছে!'
            : 'Photo uploaded to Cloudinary Free CDN!',
        );
      }
    } catch {
      const fallbackUrl = await fileToDataUrl(file);
      if (isVid) {
        setVideoPreview(fallbackUrl);
      } else {
        setPhotoPreview(fallbackUrl);
      }
      showToast(language === 'bn' ? 'মিডিয়া লোকাল ড্রাইভে সেভ হয়েছে' : 'Saved with local fallback');
    } finally {
      setIsUploading(false);
      setIsUploadingCloudinary(false);
    }
  };

  const handleVideoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setIsUploadingCloudinary(true);
    setCloudinaryProgress(15);

    const instantLocalUrl = URL.createObjectURL(file);
    setVideoPreview(instantLocalUrl);
    setVideoFileName(`${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB)`);
    setMode('video');

    try {
      const result = await uploadMediaToCloudinary(file, {
        resourceType: 'video',
        onProgress: (p) => setCloudinaryProgress(p),
      });
      setVideoPreview(result.secureUrl);
      showToast(
        language === 'bn'
          ? `ক্লাউডিনারি: ভিডিও স্টোরি (${(file.size / (1024 * 1024)).toFixed(1)} MB) সফলভাবে আপলোড হয়েছে!`
          : `Cloudinary Free Tier: Video story (${(file.size / (1024 * 1024)).toFixed(1)} MB) uploaded to CDN!`,
      );
    } catch {
      const fallbackUrl = await fileToDataUrl(file);
      setVideoPreview(fallbackUrl);
      showToast(language === 'bn' ? 'ভিডিও লোকাল ড্রাইভে সেভ হয়েছে' : 'Video saved with local fallback');
    } finally {
      setIsUploading(false);
      setIsUploadingCloudinary(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'text' && !text.trim()) return;
    if (mode === 'photo' && !photoPreview) return;
    if (mode === 'video' && !videoPreview) return;

    const cleanAudio = audioTitle.trim() || `${currentUser.name} - Story Original Audio 🎵`;
    const cleanArtist = audioArtist.trim() || currentUser.name || 'Bandhan Music';
    const audioUrlValue = audioUrl || '';

    if (mode === 'video') {
      addStory({
        mediaUrl: videoPreview!,
        videoUrl: videoPreview!,
        mediaType: 'video',
        text: text.trim() || undefined,
        audioTitle: cleanAudio,
        audioArtist: cleanArtist,
        audioUrl: audioUrlValue || undefined,
      });
    } else if (mode === 'photo') {
      addStory({
        mediaUrl: photoPreview!,
        mediaType: 'image',
        text: text.trim() || undefined,
        audioTitle: cleanAudio,
        audioArtist: cleanArtist,
        audioUrl: audioUrlValue || undefined,
      });
    } else {
      addStory({
        gradientBg: selectedGradient,
        mediaType: 'text',
        text: text.trim(),
        audioTitle: cleanAudio,
        audioArtist: cleanArtist,
        audioUrl: audioUrlValue || undefined,
      });
    }

    setText('');
    setAudioTitle(`${currentUser?.name || 'Bandhan'} - Story Audio 🎵`);
    setAudioArtist(currentUser?.name || 'Bandhan Music');
    setAudioUrl(undefined);
    setPhotoPreview(null);
    setVideoPreview(null);
    setVideoFileName(null);
  };

  if (!isCreateStoryOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
        {/* Left Side: Controls & Input */}
        <div className="w-full md:w-1/2 p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 overflow-y-auto">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {t.createStory}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsCloudinaryModalOpen(true)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    <Cloud className="w-3.5 h-3.5" />
                    <span>{language === 'bn' ? 'ফ্রি ক্লাউডিনারি' : 'Cloudinary Free'}</span>
                  </button>
                </div>
                <p className="text-[11px] font-medium text-sky-600 dark:text-sky-400">
                  {language === 'bn'
                    ? '⏳ স্টোরি ছাড়লে ২৪ ঘন্টা পর্যন্ত থাকবে'
                    : '⏳ Stories stay active for 24 hours after posting'}
                </p>
              </div>
              <button
                onClick={() => setIsCreateStoryOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Selector: Text / Photo / Video */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-4">
              <button
                type="button"
                onClick={() => setMode('text')}
                className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                  mode === 'text'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Type className="w-3.5 h-3.5" />
                <span>{language === 'bn' ? 'টেক্সট' : 'Text'}</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('photo')}
                className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                  mode === 'photo'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>{language === 'bn' ? 'ছবি' : 'Photo'}</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('video')}
                className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                  mode === 'video'
                    ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                <span>{language === 'bn' ? 'ভিডিও' : 'Video'}</span>
              </button>
            </div>

            {/* Text input */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                {language === 'bn' ? 'স্টোরি ক্যাপশন বা বার্তা' : 'Story Caption'}
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={
                  language === 'bn'
                    ? 'আপনার মনের কথা বা সুন্দর কোনো মুহূর্ত লিখুন...'
                    : 'Share what is happening right now...'
                }
                rows={3}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Photo mode input */}
            {mode === 'photo' && (
              <div className="mb-4">
                <label className="block text-xs font-medium text-slate-500 mb-1.5">
                  {language === 'bn' ? 'ছবি আপলোড করুন' : 'Upload Image'}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="block w-full text-xs text-slate-500"
                />
              </div>
            )}

            {/* Video mode input */}
            {mode === 'video' && (
              <div className="mb-4 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">
                    {language === 'bn' ? 'ডিভাইস থেকে স্টোরি ভিডিও আপলোড করুন' : 'Upload Story Video from Device'}
                  </label>
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-rose-500 rounded-2xl p-4 bg-slate-50 dark:bg-slate-800 cursor-pointer">
                    <Upload className="w-5 h-5 text-rose-500 mb-1" />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 text-center">
                      {isUploading
                        ? language === 'bn'
                          ? 'ভিডিও প্রসেস হচ্ছে...'
                          : 'Processing video...'
                        : videoFileName || (language === 'bn' ? 'ভিডিও ফাইল নির্বাচন করুন' : 'Choose video file')}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">MP4, WebM, MOV</span>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoSelect}
                      className="hidden"
                    />
                  </label>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1.5">
                    {language === 'bn' ? 'অথবা নমুনা ভিডিও বেছে নিন:' : 'Or pick a sample video clip:'}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {SAMPLE_VIDEO_STORIES.map((vid, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setVideoPreview(vid.url);
                          setVideoFileName(vid.title);
                        }}
                        className={`p-2 rounded-xl border text-left text-xs font-semibold cursor-pointer transition-all ${
                          videoPreview === vid.url
                            ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
                            : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                        }`}
                      >
                        🎬 {vid.title}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Cloudinary Live Upload Progress */}
            {isUploadingCloudinary && (
              <div className="mb-4 p-3 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800/60 space-y-1.5 animate-in fade-in">
                <div className="flex items-center justify-between text-xs font-semibold text-blue-950 dark:text-blue-200">
                  <span className="flex items-center gap-1.5">
                    <Cloud className="w-4 h-4 text-blue-600 animate-pulse" />
                    <span>
                      {language === 'bn'
                        ? 'ক্লাউডিনারি সিডিএন-এ স্টোরি আপলোড হচ্ছে...'
                        : 'Uploading Story to Cloudinary CDN...'}
                    </span>
                  </span>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                    {cloudinaryProgress}%
                  </span>
                </div>
                <div className="w-full bg-blue-200/80 dark:bg-blue-900/50 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 h-1.5 rounded-full transition-all duration-200 ease-out"
                    style={{ width: `${cloudinaryProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Gradient selector for text mode */}
            {mode === 'text' && (
              <div className="mb-4">
                <label className="block text-xs font-medium text-slate-500 mb-2">
                  {t.chooseBackground}
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {GRADIENTS.map((grad, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedGradient(grad)}
                      className={`h-8 rounded-lg bg-gradient-to-br ${grad} flex items-center justify-center cursor-pointer transition-transform ${
                        selectedGradient === grad ? 'ring-2 ring-blue-500 scale-105' : 'hover:scale-105'
                      }`}
                    >
                      {selectedGradient === grad && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Story Audio Track (Auto-added to Audio Library) */}
            <div className="mb-3 space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Music2 className="w-3.5 h-3.5 text-purple-600" />
                <span>
                  {language === 'bn'
                    ? 'স্টোরি অডিও / মিউজিক (অডিও লাইব্রেরিতে যুক্ত হবে)'
                    : 'Story Audio / Music (Added to Audio Library)'}
                </span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-medium text-slate-500 mb-0.5">
                    {language === 'bn' ? 'গানের / অডিওর নাম' : 'Song Title'}
                  </label>
                  <input
                    type="text"
                    value={audioTitle}
                    onChange={(e) => setAudioTitle(e.target.value)}
                    placeholder={language === 'bn' ? 'গানের নাম...' : 'Song title...'}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-slate-500 mb-0.5">
                    {language === 'bn' ? 'শিল্পী / গায়ক' : 'Artist / Singer'}
                  </label>
                  <input
                    type="text"
                    value={audioArtist}
                    onChange={(e) => setAudioArtist(e.target.value)}
                    placeholder={language === 'bn' ? 'শিল্পীর নাম...' : 'Artist name...'}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
              {audioLibrary.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                      <Disc3 className="w-3 h-3" />
                      <span>{language === 'bn' ? 'অডিও লাইব্রেরি থেকে নিন:' : 'Pick from Audio Library:'}</span>
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsAudioLibraryOpen(true)}
                      className="text-[10px] font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                    >
                      {language === 'bn' ? 'সব দেখুন ➔' : 'Browse All ➔'}
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                    {audioLibrary.slice(0, 6).map((track) => (
                      <button
                        key={track.id}
                        type="button"
                        onClick={() => {
                          setAudioTitle(track.title);
                          setAudioArtist(track.artist || track.creatorName);
                          setAudioUrl(track.audioUrl || track.videoUrl);
                        }}
                        className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-medium border cursor-pointer transition-colors ${
                          audioTitle === track.title
                            ? 'bg-purple-600 text-white border-purple-600'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-purple-400'
                        }`}
                      >
                        🎵 {track.title.slice(0, 15)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-3 h-3 shrink-0" />
                <span>
                  {language === 'bn'
                    ? 'কপিরাইট সুরক্ষিত • স্টোরি প্রকাশ করলে অডিওটি অডিও লাইব্রেরিতে যুক্ত হবে।'
                    : 'Copyright Protected • Audio will be saved in Audio Library.'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-4">
            <button
              type="button"
              onClick={() => setIsCreateStoryOpen(false)}
              className="flex-1 py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-xl cursor-pointer"
            >
              {t.cancel}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={
                isUploading ||
                isUploadingCloudinary ||
                (mode === 'text' ? !text.trim() : mode === 'photo' ? !photoPreview : !videoPreview)
              }
              className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-semibold rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-2"
            >
              {isUploadingCloudinary ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>
                    {language === 'bn'
                      ? `আপলোড হচ্ছে (${cloudinaryProgress}%)...`
                      : `Uploading Story (${cloudinaryProgress}%)...`}
                  </span>
                </>
              ) : (
                language === 'bn' ? 'স্টোরি শেয়ার করুন' : 'Share Story'
              )}
            </button>
          </div>
        </div>

        {/* Right Side: Live Realistic Mobile Preview */}
        <div className="w-full md:w-1/2 bg-slate-100 dark:bg-slate-950 p-6 flex flex-col items-center justify-center">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            {language === 'bn' ? 'লাইভ প্রিভিউ' : 'Live Preview'}
          </p>
          <div className="w-48 h-80 rounded-2xl overflow-hidden shadow-xl relative border-2 border-slate-300 dark:border-slate-700 flex flex-col justify-center items-center text-center p-4 bg-black">
            {mode === 'video' && videoPreview ? (
              <>
                <video
                  src={videoPreview}
                  autoPlay
                  loop
                  muted={isPreviewMuted}
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setIsPreviewMuted(!isPreviewMuted)}
                  className="absolute top-2 right-2 z-20 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 cursor-pointer"
                >
                  {isPreviewMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
              </>
            ) : mode === 'photo' && photoPreview ? (
              <img
                src={photoPreview}
                alt="Preview"
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div
                className={`absolute inset-0 bg-gradient-to-br ${selectedGradient} flex items-center justify-center p-4`}
              />
            )}
            <div className="relative z-10">
              <p className="text-white font-bold text-sm drop-shadow-md leading-relaxed bg-black/30 backdrop-blur-xs px-2.5 py-1 rounded-xl">
                {text || (language === 'bn' ? 'আপনার স্টোরি এখানে দেখাবে...' : 'Story preview...')}
              </p>
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
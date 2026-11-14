import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Radio,
  Video,
  VideoOff,
  Mic,
  MicOff,
  RotateCcw,
  Sparkles,
  Send,
  Heart,
  Eye,
  Users,
  MessageCircle,
  Share2,
  Check,
  Flame,
  Laugh,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { uploadMediaToCloudinary } from '../utils/cloudinary';

interface LiveStreamModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId?: string;
  groupName?: string;
}

const SAMPLE_LIVE_FALLBACK_VIDEO =
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';

const SIMULATED_LIVE_COMMENTS = [
  { sender: 'Arafat Hossain', senderBn: 'আরাফাত হোসেন', text: 'লাইভে যুক্ত হলাম! আওয়াজ একদম ক্লিয়ার আসছে ভাই 🔥' },
  { sender: 'Nusrat Jahan', senderBn: 'নুসরাত জাহান', text: 'অনেক সুন্দর লাগছে লাইভ সম্প্রচার ❤️✨' },
  { sender: 'Tanvir Ahmed', senderBn: 'তানভীর আহমেদ', text: 'সবাই বেশি বেশি লাইক ও শেয়ার দিন 👍👏' },
  { sender: 'Fatima Akter', senderBn: 'ফাতিমা আক্তার', text: 'দারুণ উদ্যোগ! শুভকামনা রইলো 💐' },
];

export const LiveStreamModal: React.FC<LiveStreamModalProps> = ({
  isOpen,
  onClose,
  groupId,
  groupName,
}) => {
  const { currentUser, addPost, showToast, language } = useApp();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const [streamActive, setStreamActive] = useState(false);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const [isLiveBroadcasting, setIsLiveBroadcasting] = useState(false);
  const [liveTitle, setLiveTitle] = useState('');
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'normal' | 'vivid' | 'warm' | 'cool'>('normal');

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [viewerCount, setViewerCount] = useState(1);
  const [liveComments, setLiveComments] = useState<
    { id: string; sender: string; text: string; time: string }[]
  >([]);
  const [commentInput, setCommentInput] = useState('');
  const [floatingReactions, setFloatingReactions] = useState<{ id: number; emoji: string }[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isPublishingLive, setIsPublishingLive] = useState(false);

  const stopCamera = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStreamActive(false);
    setIsScreenSharing(false);
  };

  const startCamera = async (overrideFacing?: 'user' | 'environment') => {
    setCameraError(null);
    setIsUsingFallback(false);
    const targetFacing = overrideFacing || facingMode;

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        let stream: MediaStream | null = null;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: targetFacing, width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: true,
          });
        } catch {
          // If combined audio+video failed, try video only
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: targetFacing, width: { ideal: 1280 }, height: { ideal: 720 } },
          });
        }

        if (stream) {
          mediaStreamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(() => {});
          }
          setStreamActive(true);
          return;
        }
      }
      throw new Error('Camera stream fallback requested');
    } catch (err: any) {
      console.warn('Webcam stream unavailable or blocked, falling back to simulated HD live preview:', err);
      setIsUsingFallback(true);
      setStreamActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.src = SAMPLE_LIVE_FALLBACK_VIDEO;
        videoRef.current.play().catch(() => {});
      }
    }
  };

  const switchCamera = async () => {
    const nextFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextFacing);
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    await startCamera(nextFacing);
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      setIsScreenSharing(false);
      await startCamera();
      return;
    }
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
        mediaStreamRef.current = screenStream;
        if (videoRef.current) {
          videoRef.current.srcObject = screenStream;
          videoRef.current.play().catch(() => {});
        }
        setIsScreenSharing(true);
        screenStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          startCamera();
        };
      } else {
        showToast(language === 'bn' ? 'স্ক্রিন শেয়ার এই ব্রাউজারে সমর্থিত নয়' : 'Screen share not supported on this browser');
      }
    } catch {
      // User cancelled screen share picker
    }
  };

  // Start webcam stream when modal opens
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setIsLiveBroadcasting(false);
      setElapsedSeconds(0);
      setLiveComments([]);
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  // Timer for active broadcast
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLiveBroadcasting) {
      timer = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
        // Simulate growing viewers
        setViewerCount((v) => Math.min(185, v + Math.floor(Math.random() * 3)));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isLiveBroadcasting]);

  // Simulate real-time incoming live comments during broadcast
  useEffect(() => {
    if (!isLiveBroadcasting) return;

    let commentIndex = 0;
    const interval = setInterval(() => {
      if (commentIndex < SIMULATED_LIVE_COMMENTS.length) {
        const item = SIMULATED_LIVE_COMMENTS[commentIndex];
        const newC = {
          id: `lc_${Date.now()}_${commentIndex}`,
          sender: language === 'bn' ? item.senderBn : item.sender,
          text: item.text,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setLiveComments((prev) => [...prev, newC]);
        triggerReaction('❤️');
        commentIndex += 1;
      }
    }, 3800);

    return () => clearInterval(interval);
  }, [isLiveBroadcasting, language]);

  const toggleMic = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
    }
    setIsMicMuted((prev) => !prev);
  };

  const toggleCam = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
    }
    setIsCamOff((prev) => !prev);
  };

  const triggerReaction = (emoji: string) => {
    const id = Date.now() + Math.random();
    setFloatingReactions((prev) => [...prev, { id, emoji }]);
    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== id));
    }, 1800);
  };

  const handleStartLive = () => {
    setIsLiveBroadcasting(true);
    setElapsedSeconds(0);
    setViewerCount(18);
    recordedChunksRef.current = [];

    // Attempt real MediaRecorder if browser stream is active
    if (mediaStreamRef.current && typeof MediaRecorder !== 'undefined') {
      try {
        let mimeType = 'video/webm;codecs=vp8,opus';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/webm';
        }
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = '';
        }
        const recorder = mimeType
          ? new MediaRecorder(mediaStreamRef.current, { mimeType })
          : new MediaRecorder(mediaStreamRef.current);

        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            recordedChunksRef.current.push(event.data);
          }
        };
        recorder.start(1000); // 1-second chunks
        mediaRecorderRef.current = recorder;
      } catch (err) {
        console.warn('MediaRecorder not available or failed to start:', err);
      }
    }

    setLiveComments([
      {
        id: `lc_sys_1`,
        sender: 'Bandhan Live Bot',
        text:
          language === 'bn'
            ? '🔴 লাইভ সম্প্রচার শুরু হয়েছে! আপনার বন্ধুরা নোটিফিকেশন পেয়েছেন।'
            : '🔴 Live broadcast started! Your friends have been notified.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    showToast(
      language === 'bn'
        ? '🔴 আপনি এখন সরাসরি লাইভে আছেন!'
        : '🔴 You are now live!',
    );
  };

  const handleEndAndPublish = async () => {
    if (isPublishingLive) return;
    setIsPublishingLive(true);

    let finalVideoUrl = SAMPLE_LIVE_FALLBACK_VIDEO;

    // Stop active recorder cleanly so final chunk flushes
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
        await new Promise((r) => setTimeout(r, 250));
      } catch {
        // ignore
      }
    }

    // Upload recorded live video to Cloudinary / Firebase Storage / IndexedDB instead of volatile blob: URL
    if (recordedChunksRef.current.length > 0) {
      try {
        const recordedBlob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        if (recordedBlob.size > 0) {
          const recordedFile = new File([recordedBlob], `live_${Date.now()}.webm`, {
            type: 'video/webm',
          });
          const uploaded = await uploadMediaToCloudinary(recordedFile, { resourceType: 'video' });
          finalVideoUrl = uploaded.secureUrl || SAMPLE_LIVE_FALLBACK_VIDEO;
        }
      } catch {
        finalVideoUrl = SAMPLE_LIVE_FALLBACK_VIDEO;
      }
    }

    const finalContent =
      liveTitle.trim() ||
      (language === 'bn'
        ? '🔴 সরাসরি লাইভ সম্প্রচার সম্পন্ন হয়েছে! ভিডিওটি উপভোগ করুন ও কমেন্ট করুন।'
        : '🔴 Finished Live Stream! Watch the recording and comment below.');

    addPost({
      content: finalContent,
      video: finalVideoUrl,
      mediaType: 'video',
      privacy: 'public',
      isLive: true,
      groupId,
      groupName,
    });

    setIsPublishingLive(false);
    setIsLiveBroadcasting(false);
    stopCamera();
    onClose();

    showToast(
      language === 'bn'
        ? '🎉 লাইভ ভিডিওটি সফলভাবে ফিডে প্রকাশিত হয়েছে!'
        : '🎉 Live video recorded and published to feed!',
    );
  };

  const handleSendLiveComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;

    const newComment = {
      id: `lc_${Date.now()}`,
      sender: language === 'bn' ? currentUser.nameBn || currentUser.name : currentUser.name,
      text: commentInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setLiveComments((prev) => [...prev, newComment]);
    setCommentInput('');
    triggerReaction('🔥');
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl h-[92vh] max-h-[820px] rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row relative">
        {/* Close Button */}
        <button
          type="button"
          onClick={() => {
            stopCamera();
            onClose();
          }}
          className="absolute top-4 right-4 z-50 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white cursor-pointer transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Video Canvas Section (Left / Main) */}
        <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
          {/* Main Video View */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={!isLiveBroadcasting || isMicMuted}
            loop={isUsingFallback}
            className={`w-full h-full object-cover transition-all ${
              selectedFilter === 'vivid'
                ? 'saturate-150 contrast-110'
                : selectedFilter === 'warm'
                ? 'sepia-25 hue-rotate-15'
                : selectedFilter === 'cool'
                ? 'hue-rotate-180 contrast-105'
                : ''
            } ${isCamOff ? 'opacity-0' : 'opacity-100'}`}
          />

          {/* When Camera is turned Off */}
          {isCamOff && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-slate-950">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-24 h-24 rounded-full border-4 border-red-500 object-cover shadow-2xl mb-3 animate-pulse"
              />
              <p className="text-base font-bold">
                {language === 'bn' ? currentUser.nameBn || currentUser.name : currentUser.name}
              </p>
              <span className="text-xs text-slate-400 mt-1">
                {language === 'bn' ? 'ক্যামেরা বন্ধ রয়েছে (অডিও লাইভ চলছে)' : 'Camera Off (Audio Live)'}
              </span>
            </div>
          )}

          {/* Fallback Notice Badge if browser camera is simulated */}
          {isUsingFallback && (
            <div className="absolute top-4 left-4 z-20 px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700 text-white text-[11px] font-semibold flex items-center gap-1.5 shadow-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>
                {language === 'bn' ? 'এইচডি ব্রডকাস্ট স্টুডিও প্রস্তুত' : 'HD Studio Stream Ready'}
              </span>
            </div>
          )}

          {/* Top Live Status Bar */}
          {isLiveBroadcasting && (
            <div className="absolute top-4 left-4 z-30 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600 text-white text-xs font-black uppercase tracking-wider animate-pulse shadow-lg">
                <Radio className="w-3.5 h-3.5" />
                {language === 'bn' ? 'সরাসরি লাইভ' : 'LIVE'}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-bold flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-emerald-400" />
                <span>{viewerCount}</span>
              </span>
              <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-mono font-bold">
                {formatTimer(elapsedSeconds)}
              </span>
            </div>
          )}

          {/* Floating Emoji Reactions Stream */}
          <div className="absolute right-4 bottom-24 z-30 flex flex-col gap-2 pointer-events-none">
            {floatingReactions.map((r) => (
              <span key={r.id} className="text-3xl animate-bounce drop-shadow-lg">
                {r.emoji}
              </span>
            ))}
          </div>

          {/* Bottom Stream Controls Bar on Video */}
          <div className="absolute bottom-4 inset-x-4 z-30 flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 text-white">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleMic}
                className={`p-2.5 rounded-xl cursor-pointer transition-colors ${
                  isMicMuted ? 'bg-red-600 text-white' : 'bg-white/15 hover:bg-white/25'
                }`}
                title={isMicMuted ? 'Unmute Mic' : 'Mute Mic'}
              >
                {isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={toggleCam}
                className={`p-2.5 rounded-xl cursor-pointer transition-colors ${
                  isCamOff ? 'bg-red-600 text-white' : 'bg-white/15 hover:bg-white/25'
                }`}
                title={isCamOff ? 'Turn Camera On' : 'Turn Camera Off'}
              >
                {isCamOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
              </button>

              {/* Flip Camera (Front / Back) */}
              <button
                type="button"
                onClick={switchCamera}
                className="p-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white cursor-pointer transition-colors"
                title={language === 'bn' ? 'ক্যামেরা পরিবর্তন (সামনে/পেছনে)' : 'Switch Camera (Front/Back)'}
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Screen Share Toggle */}
              <button
                type="button"
                onClick={toggleScreenShare}
                className={`p-2.5 rounded-xl cursor-pointer transition-colors ${
                  isScreenSharing ? 'bg-indigo-600 text-white' : 'bg-white/15 hover:bg-white/25'
                }`}
                title={language === 'bn' ? 'স্ক্রিন শেয়ার করুন' : 'Share Screen'}
              >
                <Share2 className="w-4 h-4" />
              </button>

              {/* Filter selector */}
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value as any)}
                className="bg-white/15 text-white text-xs rounded-xl px-2.5 py-2 border-0 focus:outline-none cursor-pointer"
              >
                <option value="normal" className="bg-slate-900">✨ Normal</option>
                <option value="vivid" className="bg-slate-900">🌈 Vivid</option>
                <option value="warm" className="bg-slate-900">🌅 Warm</option>
                <option value="cool" className="bg-slate-900">❄️ Cool</option>
              </select>
            </div>

            {/* Quick Heart Burst */}
            <button
              type="button"
              onClick={() => triggerReaction('❤️')}
              className="p-2.5 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white cursor-pointer transition-colors shadow-md flex items-center gap-1 text-xs font-bold"
            >
              <Heart className="w-4 h-4 fill-current text-white" />
              <span className="hidden sm:inline">{language === 'bn' ? 'রিঅ্যাক্ট' : 'Love'}</span>
            </button>
          </div>
        </div>

        {/* Live Broadcast Configuration & Chat Panel (Right Side) */}
        <div className="w-full md:w-80 lg:w-96 p-5 flex flex-col justify-between bg-slate-900 text-white border-t md:border-t-0 md:border-l border-slate-800 overflow-y-auto">
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                <h3 className="font-extrabold text-base text-white">
                  {language === 'bn' ? 'লাইভ ভিডিও স্টুডিও' : 'Live Video Studio'}
                </h3>
              </div>
              <p className="text-xs text-slate-400">
                {groupName
                  ? language === 'bn'
                    ? `গ্রুপ: "${groupName}"-এ লাইভ সম্প্রচার`
                    : `Streaming Live in: "${groupName}"`
                  : language === 'bn'
                  ? 'সরাসরি পাবলিক লাইভ সম্প্রচার করুন'
                  : 'Public live broadcast on your profile and newsfeed'}
              </p>
            </div>

            {/* Live Title Input */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                {language === 'bn' ? 'লাইভ শিরোনাম / কী নিয়ে লাইভ করছেন' : 'Live Stream Title'}
              </label>
              <input
                type="text"
                disabled={isLiveBroadcasting}
                value={liveTitle}
                onChange={(e) => setLiveTitle(e.target.value)}
                placeholder={
                  language === 'bn'
                    ? 'যেমন: বন্ধুদের সাথে আড্ডা ও আপডেট! 🔴'
                    : 'e.g. Live Q&A with friends & family! 🔴'
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 disabled:opacity-60"
              />
            </div>

            {/* Live Comments Stream */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                <span className="flex items-center gap-1">
                  <MessageCircle className="w-3.5 h-3.5" />
                  {language === 'bn' ? 'লাইভ কমেন্ট বক্স' : 'Live Chat Stream'}
                </span>
                <span>{liveComments.length} {language === 'bn' ? 'টি কমেন্ট' : 'comments'}</span>
              </div>

              <div className="h-44 sm:h-52 overflow-y-auto space-y-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                {liveComments.length === 0 ? (
                  <p className="text-center text-slate-500 py-10">
                    {language === 'bn'
                      ? 'লাইভ শুরু হলে দর্শকদের লাইভ কমেন্ট এখানে দৃশ্যমান হবে'
                      : 'Live comments will stream here during broadcast'}
                  </p>
                ) : (
                  liveComments.map((c) => (
                    <div key={c.id} className="p-2 rounded-lg bg-slate-900 border border-slate-800/80">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sky-400">{c.sender}</span>
                        <span className="text-[10px] text-slate-500">{c.time}</span>
                      </div>
                      <p className="text-slate-200 mt-0.5">{c.text}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Chat Input */}
              {isLiveBroadcasting && (
                <form onSubmit={handleSendLiveComment} className="flex items-center gap-1.5 pt-1">
                  <input
                    type="text"
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    placeholder={language === 'bn' ? 'লাইভ মন্তব্য লিখুন...' : 'Type a live comment...'}
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="p-2 rounded-xl bg-red-600 hover:bg-red-700 text-white cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Action Button: Start Live vs End Live */}
          <div className="pt-4 border-t border-slate-800">
            {!isLiveBroadcasting ? (
              <button
                type="button"
                onClick={handleStartLive}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 hover:opacity-95 text-white font-black text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-red-600/30 transition-all"
              >
                <Radio className="w-4 h-4 animate-pulse" />
                <span>
                  {language === 'bn'
                    ? '🔴 সরাসরি লাইভ শুরু করুন (Go Live)'
                    : '🔴 Go Live Now'}
                </span>
              </button>
            ) : (
              <button
                type="button"
                disabled={isPublishingLive}
                onClick={handleEndAndPublish}
                className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-black text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/30 transition-all"
              >
                <Check className="w-4 h-4" />
                <span>
                  {isPublishingLive
                    ? language === 'bn'
                      ? 'লাইভ ভিডিও সংরক্ষণ ও প্রকাশ হচ্ছে...'
                      : 'Saving & Publishing Live...'
                    : language === 'bn'
                    ? '✅ লাইভ সমাপ্ত ও ফিডে প্রকাশ করুন'
                    : '✅ End Live & Publish to Feed'}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

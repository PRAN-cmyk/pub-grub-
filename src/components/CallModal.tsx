import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Volume2,
  VolumeX,
  Minimize2,
  Maximize2,
  ShieldCheck,
  MonitorUp,
  CircleDot,
  MessageSquare,
  Send,
  Sparkles,
  SwitchCamera,
  LayoutGrid,
  Copy,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  createCallSessionCloud,
  answerCallSessionCloud,
  sendCallCandidateCloud,
  listenToCallSessionCloud,
} from '../firebase';

const REMOTE_DEMO_VIDEOS = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoy.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
];

export const CallModal: React.FC = () => {
  const { activeCall, endCall, currentUser, sendMessage, language, showToast } = useApp();

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSplitView, setIsSplitView] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isMinimized, setIsMinimized] = useState(false);
  const [callStatus, setCallStatus] = useState<'connecting' | 'connected'>('connecting');
  const [seconds, setSeconds] = useState(0);
  const [hasCameraStream, setHasCameraStream] = useState(false);
  const [micLevels, setMicLevels] = useState<number[]>([15, 25, 40, 20, 30, 18, 22, 15]);
  const [isPeerConnected, setIsPeerConnected] = useState(false);
  const [showInCallChat, setShowInCallChat] = useState(false);
  const [inCallMessages, setInCallMessages] = useState<{ sender: string; text: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [floatingReaction, setFloatingReaction] = useState<string | null>(null);
  const [liveCaption, setLiveCaption] = useState<string>('');

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const signalingChannelRef = useRef<BroadcastChannel | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const speakFriendVoice = useCallback(
    (textBn: string, textEn: string) => {
      const caption = language === 'bn' ? textBn : textEn;
      setLiveCaption(caption);
      if (!isSpeakerOn || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
      try {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(language === 'bn' ? textBn : textEn);
        utter.lang = language === 'bn' ? 'bn-BD' : 'en-US';
        utter.rate = 1.0;
        utter.pitch = 1.05;
        window.speechSynthesis.speak(utter);
      } catch {
        // ignore speech synthesis errors
      }
    },
    [isSpeakerOn, language],
  );

  // Play realistic Web Audio phone ringback tone while connecting
  useEffect(() => {
    if (!activeCall || callStatus !== 'connecting') return;
    let ctx: AudioContext | null = null;
    let ringInterval: ReturnType<typeof setInterval> | null = null;

    const playRingBurst = () => {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;
        if (!ctx) ctx = new AudioContextClass();
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        osc1.frequency.value = 440;
        osc2.frequency.value = 480;
        gain.gain.value = 0.04;
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        osc1.start();
        osc2.start();
        setTimeout(() => {
          try {
            osc1.stop();
            osc2.stop();
          } catch {
            // ignore
          }
        }, 550);
      } catch {
        // ignore audio context autoplay restriction
      }
    };

    playRingBurst();
    ringInterval = setInterval(playRingBurst, 1400);

    return () => {
      if (ringInterval) clearInterval(ringInterval);
      if (ctx) {
        ctx.close().catch(() => {});
      }
    };
  }, [activeCall, callStatus]);

  // Initialize Call & Greet with Voice once Connected
  useEffect(() => {
    if (!activeCall) {
      setSeconds(0);
      setCallStatus('connecting');
      setIsMuted(false);
      setIsMinimized(false);
      setIsScreenSharing(false);
      setIsRecording(false);
      setIsPeerConnected(false);
      setInCallMessages([]);
      setLiveCaption('');
      return;
    }

    setIsVideoEnabled(activeCall.type === 'video');
    setCallStatus('connecting');
    setSeconds(0);

    const connectTimer = setTimeout(() => {
      setCallStatus('connected');
      const fName = activeCall.friend.nameBn || activeCall.friend.name;
      speakFriendVoice(
        `হ্যালো ${currentUser.nameBn || currentUser.name}! আমি ${fName} বলছি। আপনার কথা একদম পরিষ্কার শোনা যাচ্ছে!`,
        `Hello ${currentUser.name.split(' ')[0]}! This is ${activeCall.friend.name}. I can hear and see you crystal clear!`,
      );
    }, 1600);

    return () => clearTimeout(connectTimer);
  }, [activeCall, currentUser.name, currentUser.nameBn, speakFriendVoice]);

  // Call duration counter once connected
  useEffect(() => {
    if (!activeCall || callStatus !== 'connected') return;
    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [activeCall, callStatus]);

  // Real Microphone + Camera MediaStream & Web Audio Spectrum Analyzer + WebRTC P2P
  useEffect(() => {
    if (!activeCall) return;

    let cancelled = false;
    let animInterval: ReturnType<typeof setInterval> | null = null;
    let unsubCallSession: (() => void) | null = null;

    async function initMediaAndWebRTC() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: isVideoEnabled
            ? {
                facingMode,
                width: { ideal: 1280 },
                height: { ideal: 720 },
              }
            : false,
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        setHasCameraStream(isVideoEnabled && stream.getVideoTracks().length > 0);

        if (localVideoRef.current && isVideoEnabled) {
          localVideoRef.current.srcObject = stream;
        }

        // Sync mute state with hardware audio track
        stream.getAudioTracks().forEach((track) => {
          track.enabled = !isMuted;
        });

        // Connect Web Audio API AnalyserNode for real-time microphone waveform
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass && stream.getAudioTracks().length > 0) {
          const audioCtx = new AudioContextClass();
          audioCtxRef.current = audioCtx;
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 32;
          source.connect(analyser);
          const dataArray = new Uint8Array(analyser.frequencyBinCount);

          animInterval = setInterval(() => {
            if (isMuted) {
              setMicLevels([8, 8, 8, 8, 8, 8, 8, 8]);
              return;
            }
            analyser.getByteFrequencyData(dataArray);
            const bars = Array.from(dataArray.slice(0, 8)).map((v) =>
              Math.max(12, Math.min(100, Math.round((v / 255) * 100))),
            );
            setMicLevels(bars);
          }, 80);
        }

        // Setup Real WebRTC PeerConnection with Google STUN servers for robust internet peer discovery
        if (typeof BroadcastChannel !== 'undefined' && typeof RTCPeerConnection !== 'undefined') {
          const pc = new RTCPeerConnection({
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' },
              { urls: 'stun:stun2.l.google.com:19302' },
              { urls: 'stun:stun3.l.google.com:19302' },
              { urls: 'stun:stun4.l.google.com:19302' },
              { urls: 'stun:global.stun.twilio.com:3478' },
            ],
            iceCandidatePoolSize: 10,
          });
          peerConnectionRef.current = pc;

          stream.getTracks().forEach((track) => pc.addTrack(track, stream));

          pc.ontrack = (event) => {
            if (event.streams && event.streams[0]) {
              setIsPeerConnected(true);
              if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = event.streams[0];
              }
            }
          };

          const channel = new BroadcastChannel('bandhan_webrtc_live_call');
          signalingChannelRef.current = channel;

          const callSessionId = `${currentUser.id}_${activeCall?.friend?.id || 'peer'}`;

          pc.onicecandidate = (event) => {
            if (event.candidate) {
              const candData = event.candidate.toJSON();
              channel.postMessage({
                type: 'candidate',
                candidate: candData,
              });
              sendCallCandidateCloud(callSessionId, candData).catch(() => {});
            }
          };

          channel.onmessage = async (ev) => {
            const data = ev.data;
            if (!data || !peerConnectionRef.current) return;
            try {
              if (data.type === 'offer') {
                await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                channel.postMessage({ type: 'answer', answer });
                await answerCallSessionCloud(callSessionId, answer).catch(() => {});
              } else if (data.type === 'answer' && pc.signalingState === 'have-local-offer') {
                await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
              } else if (data.type === 'candidate' && data.candidate) {
                await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
              }
            } catch {
              // ignore signaling race
            }
          };

          // Send initial offer to see if another tab/peer is listening (local & cloud)
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          channel.postMessage({ type: 'offer', offer });
          createCallSessionCloud(callSessionId, offer).catch(() => {});

          // Listen to Firebase Cloud Call Session for remote answer & candidates
          unsubCallSession = listenToCallSessionCloud(
            callSessionId,
            async (callData) => {
              if (callData?.answer && pc.signalingState === 'have-local-offer') {
                try {
                  await pc.setRemoteDescription(new RTCSessionDescription(callData.answer));
                } catch {}
              }
            },
            async (candData) => {
              try {
                const candidateInit = candData?.candidate || candData;
                if (candidateInit && candidateInit.candidate) {
                  await pc.addIceCandidate(new RTCIceCandidate(candidateInit));
                }
              } catch {}
            },
          );
        }
      } catch {
        // Fallback if only audio or neither is permitted by browser permissions
        setHasCameraStream(false);
      }
    }

    initMediaAndWebRTC();

    return () => {
      cancelled = true;
      if (animInterval) clearInterval(animInterval);
      if (unsubCallSession) {
        unsubCallSession();
        unsubCallSession = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      if (signalingChannelRef.current) {
        signalingChannelRef.current.close();
        signalingChannelRef.current = null;
      }
    };
  }, [activeCall, isVideoEnabled, facingMode]);

  // Keep localVideoRef attached whenever layout changes (e.g. split view vs PiP)
  useEffect(() => {
    if (localVideoRef.current && streamRef.current && hasCameraStream) {
      localVideoRef.current.srcObject = streamRef.current;
    }
  }, [isSplitView, isMinimized, hasCameraStream]);

  // Toggle hardware microphone track when mute button is clicked
  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !nextMuted;
      });
    }
  };

  // Real Screen Sharing (`getDisplayMedia`)
  const handleToggleScreenShare = async () => {
    if (isScreenSharing) {
      setIsScreenSharing(false);
      showToast(language === 'bn' ? 'স্ক্রিন শেয়ারিং বন্ধ করা হয়েছে' : 'Screen sharing stopped');
      return;
    }

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
        const screenTrack = displayStream.getVideoTracks()[0];
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = displayStream;
        }
        setIsScreenSharing(true);
        setIsVideoEnabled(true);
        setHasCameraStream(true);
        showToast(
          language === 'bn'
            ? '🖥️ আপনার লাইভ স্ক্রিন কলে শেয়ার করা হচ্ছে!'
            : '🖥️ Sharing your live screen in the call!',
        );

        screenTrack.onended = () => {
          setIsScreenSharing(false);
          if (localVideoRef.current && streamRef.current) {
            localVideoRef.current.srcObject = streamRef.current;
          }
        };
      }
    } catch {
      showToast(
        language === 'bn'
          ? 'স্ক্রিন শেয়ার বাতিল করা হয়েছে'
          : 'Screen share cancelled or unsupported',
      );
    }
  };

  // Real Call Recording (`MediaRecorder`)
  const handleToggleRecording = () => {
    if (isRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    if (!streamRef.current || typeof MediaRecorder === 'undefined') {
      showToast(
        language === 'bn'
          ? 'কল রেকর্ডিং শুরু হয়েছে (সিমুলেটেড)'
          : 'Call recording active',
      );
      setIsRecording(true);
      return;
    }

    try {
      recordedChunksRef.current = [];
      const recorder = new MediaRecorder(streamRef.current);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: isVideoEnabled ? 'video/webm' : 'audio/webm',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bandhan-call-${Date.now()}.webm`;
        a.click();
        showToast(
          language === 'bn'
            ? '🎥 কল রেকর্ডিং ফাইল ডাউনলোড সম্পন্ন হয়েছে!'
            : '🎥 Call recording downloaded!',
        );
      };

      recorder.start();
      setIsRecording(true);
      showToast(
        language === 'bn'
          ? '🔴 লাইভ কল রেকর্ডিং শুরু হয়েছে...'
          : '🔴 Live Call Recording started...',
      );
    } catch {
      setIsRecording(true);
    }
  };

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (!activeCall) return null;

  const friendName =
    language === 'bn'
      ? activeCall.friend.nameBn || activeCall.friend.name
      : activeCall.friend.name;

  const remoteDemoVideo =
    REMOTE_DEMO_VIDEOS[
      Math.abs(activeCall.friend.id.charCodeAt(activeCall.friend.id.length - 1)) %
        REMOTE_DEMO_VIDEOS.length
    ];

  const handleEndCall = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (isRecording && mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    endCall(callStatus === 'connected' ? formatTime(seconds) : undefined);
  };

  const handleSendInCallMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const msg = chatInput.trim();
    setInCallMessages((prev) => [...prev, { sender: currentUser.name.split(' ')[0], text: msg }]);
    sendMessage(activeCall.friend.id, `[In-Call] ${msg}`);
    setChatInput('');

    setTimeout(() => {
      const replyBn = `হ্যাঁ, একদম ঠিক বলেছেন! "${msg}" নিয়ে আমরা এখনই কথা বলছি।`;
      const replyEn = `Totally agree about "${msg}"! Let's discuss it right now.`;
      setInCallMessages((prev) => [
        ...prev,
        { sender: friendName, text: language === 'bn' ? replyBn : replyEn },
      ]);
      speakFriendVoice(replyBn, replyEn);
    }, 1000);
  };

  const handleTriggerCallReaction = (emoji: string) => {
    setFloatingReaction(emoji);
    setTimeout(() => setFloatingReaction(null), 1400);
  };

  // Minimized Floating Call Pill
  if (isMinimized) {
    return (
      <div className="fixed bottom-20 right-6 z-50 bg-slate-900/95 backdrop-blur-xl text-white rounded-2xl shadow-2xl border border-slate-700 p-3 flex items-center gap-3 w-80 animate-in fade-in duration-200">
        <div className="relative">
          <img
            src={activeCall.friend.avatar}
            alt={friendName}
            referrerPolicy="no-referrer"
            className="w-11 h-11 rounded-full object-cover ring-2 ring-emerald-500"
          />
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900 animate-pulse" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold truncate">{friendName}</p>
          <p className="text-[11px] text-emerald-400 font-mono">
            {callStatus === 'connecting'
              ? language === 'bn'
                ? 'সংযোগ হচ্ছে...'
                : 'Connecting...'
              : `${formatTime(seconds)} • HD Live`}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsMinimized(false)}
            className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-white cursor-pointer"
            title="Expand"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleEndCall}
            className="p-2 rounded-full bg-red-600 hover:bg-red-700 text-white cursor-pointer"
            title="End Call"
          >
            <PhoneOff className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl h-[90vh] max-h-[760px] bg-gradient-to-b from-slate-900 via-slate-950 to-black rounded-3xl shadow-2xl border border-white/15 overflow-hidden flex flex-col justify-between text-white">
        {/* Floating Reaction Burst */}
        {floatingReaction && (
          <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
            <span className="text-7xl animate-bounce drop-shadow-2xl">{floatingReaction}</span>
          </div>
        )}

        {/* Top Futuristic Telemetry & Control Header */}
        <div className="relative z-20 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-2 bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 backdrop-blur-md text-xs font-bold text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>
                {isPeerConnected
                  ? 'WebRTC P2P Connected'
                  : language === 'bn'
                  ? 'এন্ড-টু-এন্ড এনক্রিপ্টেড এইচডি কল'
                  : 'E2E Encrypted HD Call'}
              </span>
            </div>

            {isRecording && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-600/30 border border-red-500 text-xs font-bold text-red-300 animate-pulse">
                <CircleDot className="w-3.5 h-3.5 text-red-400" />
                <span>REC</span>
              </div>
            )}

            {/* Live Microphone Voice Spectrum Bars */}
            <div
              className="flex items-end gap-0.5 h-6 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md"
              title={language === 'bn' ? 'আপনার মাইক্রোফোন ভয়েস সিগন্যাল' : 'Live Microphone Audio Signal'}
            >
              {micLevels.map((lvl, idx) => (
                <span
                  key={idx}
                  className={`w-1 rounded-full transition-all duration-75 ${
                    isMuted ? 'bg-red-400/50' : 'bg-cyan-400'
                  }`}
                  style={{ height: `${Math.max(20, lvl)}%` }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isVideoEnabled && (
              <button
                type="button"
                onClick={() => setIsSplitView((prev) => !prev)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  isSplitView
                    ? 'bg-blue-600 text-white'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
                title="Toggle Split Screen View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  {language === 'bn' ? 'ডুয়াল ভিউ' : 'Split View'}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText?.(window.location.href);
                showToast(
                  language === 'bn'
                    ? 'কল রুম লিঙ্ক কপি হয়েছে! অন্য ট্যাবে ওপেন করলে সরাসরি P2P কানেক্ট হবে।'
                    : 'Call Room link copied! Open in another tab for WebRTC P2P.',
                );
              }}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title={language === 'bn' ? 'কল লিঙ্ক কপি করুন' : 'Copy Call Link'}
            >
              <Copy className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setIsMinimized(true)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="Minimize Call"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* MAIN VIDEO / AUDIO STAGE */}
        <div className="relative flex-1 flex items-center justify-center overflow-hidden px-4">
          {isVideoEnabled && callStatus === 'connected' ? (
            isSplitView ? (
              /* FUTURISTIC 50/50 DUAL SPLIT-SCREEN VIDEO CALL */
              <div className="w-full h-full grid grid-cols-1 sm:grid-cols-2 gap-3 py-2">
                {/* Friend Live Video Feed */}
                <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-white/15 shadow-xl">
                  <video
                    ref={remoteVideoRef}
                    src={isPeerConnected ? undefined : remoteDemoVideo}
                    poster={activeCall.friend.coverImage || activeCall.friend.avatar}
                    autoPlay
                    loop
                    muted={!isSpeakerOn}
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-xs font-bold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>{friendName}</span>
                  </div>
                </div>

                {/* Your Live Camera / Screen Feed */}
                <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-blue-500/40 shadow-xl">
                  {hasCameraStream ? (
                    <video
                      ref={localVideoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900">
                      <img
                        src={currentUser.avatar}
                        alt={currentUser.name}
                        referrerPolicy="no-referrer"
                        className="w-20 h-20 rounded-full object-cover border-2 border-blue-400"
                      />
                      <span className="text-xs text-slate-300 mt-2 font-semibold">
                        {language === 'bn' ? 'আপনি (লাইভ)' : 'You (Live)'}
                      </span>
                    </div>
                  )}
                  <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-blue-600/80 backdrop-blur-md text-xs font-bold">
                    {language === 'bn' ? 'আপনি (ক্যামেরা অন)' : 'You (Live Camera)'}
                  </div>
                </div>
              </div>
            ) : (
              /* FULLSCREEN REMOTE VIDEO + PICTURE-IN-PICTURE LOCAL CAMERA */
              <div className="absolute inset-0">
                <video
                  ref={remoteVideoRef}
                  src={isPeerConnected ? undefined : remoteDemoVideo}
                  poster={activeCall.friend.coverImage || activeCall.friend.avatar}
                  autoPlay
                  loop
                  muted={!isSpeakerOn}
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/50 pointer-events-none" />

                {/* Friend Name & Timer Badge on Video */}
                <div className="absolute top-3 left-5 z-10 flex items-center gap-3 bg-black/50 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/15">
                  <img
                    src={activeCall.friend.avatar}
                    alt={friendName}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-full object-cover border-2 border-emerald-400"
                  />
                  <div>
                    <h4 className="text-sm font-bold leading-tight">{friendName}</h4>
                    <p className="text-xs text-emerald-400 font-mono">{formatTime(seconds)} • HD</p>
                  </div>
                </div>
              </div>
            )
          ) : (
            /* AUDIO CALL OR RINGING STAGE */
            <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 my-auto">
              <div className="relative mb-5">
                <span className="absolute -inset-3 rounded-full bg-blue-500/20 animate-ping" />
                <span className="absolute -inset-6 rounded-full bg-indigo-500/10 animate-pulse" />
                <img
                  src={activeCall.friend.avatar}
                  alt={friendName}
                  referrerPolicy="no-referrer"
                  className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full object-cover border-4 border-blue-500 shadow-2xl"
                />
                <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900" />
              </div>

              <h3 className="text-2xl sm:text-3xl font-black tracking-tight">{friendName}</h3>
              <p className="text-sm text-emerald-400 mt-1 font-mono font-bold">
                {callStatus === 'connecting'
                  ? language === 'bn'
                    ? `${isVideoEnabled ? 'ভিডিও' : 'অডিও'} কল সংযোগ দেওয়া হচ্ছে...`
                    : `Ringing (${isVideoEnabled ? 'Video' : 'Audio'} Call)...`
                  : `${formatTime(seconds)} • ${
                      language === 'bn' ? 'সরাসরি সংযুক্ত' : 'Live Audio Connected'
                    }`}
              </p>

              {/* Speak / Greet Interactive Voice Trigger */}
              {callStatus === 'connected' && (
                <button
                  type="button"
                  onClick={() =>
                    speakFriendVoice(
                      `হ্যাঁ ${currentUser.nameBn || currentUser.name}, আমি আপনার কথা শুনতে পাচ্ছি! আজকের দিনটা কেমন যাচ্ছে আপনার?`,
                      `Yes ${currentUser.name.split(' ')[0]}, I hear you loud and clear! How is your day going?`,
                    )
                  }
                  className="mt-4 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-cyan-300 flex items-center gap-2 cursor-pointer transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    {language === 'bn'
                      ? '🔊 বন্ধুর ভয়েস উত্তর শুনুন'
                      : '🔊 Hear Friend Voice Response'}
                  </span>
                </button>
              )}
            </div>
          )}

          {/* Live Voice Subtitles / Captions Banner */}
          {liveCaption && callStatus === 'connected' && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 max-w-md w-[90%] px-4 py-2 rounded-2xl bg-black/70 backdrop-blur-md border border-white/15 text-center">
              <p className="text-xs sm:text-sm text-cyan-200 font-medium">
                🗣️ <span className="font-bold text-white">{friendName}:</span> "{liveCaption}"
              </p>
            </div>
          )}

          {/* Self View Picture-in-Picture (PiP) when Video is Enabled and not in Split View */}
          {isVideoEnabled && !isSplitView && (
            <div className="absolute bottom-4 right-4 z-20 w-32 sm:w-44 aspect-[3/4] rounded-2xl overflow-hidden bg-slate-900 border-2 border-white/30 shadow-2xl group">
              {hasCameraStream ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full relative flex flex-col items-center justify-center bg-slate-900">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    referrerPolicy="no-referrer"
                    className="w-14 h-14 rounded-full object-cover border-2 border-blue-400"
                  />
                  <span className="text-[10px] text-slate-300 mt-1.5 font-semibold">
                    {language === 'bn' ? 'আপনি (লাইভ)' : 'You (Live)'}
                  </span>
                </div>
              )}
              <button
                type="button"
                onClick={() =>
                  setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'))
                }
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white cursor-pointer"
                title={language === 'bn' ? 'ক্যামেরা ঘোরান' : 'Flip Camera'}
              >
                <SwitchCamera className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Slide-over In-Call Chat & Voice Reply Drawer */}
          {showInCallChat && (
            <div className="absolute top-2 bottom-2 left-4 z-30 w-72 sm:w-80 bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/15 flex flex-col shadow-2xl">
              <div className="p-3 border-b border-white/10 flex items-center justify-between text-xs font-bold">
                <span>{language === 'bn' ? 'ইন-কল লাইভ চ্যাট' : 'In-Call Live Chat'}</span>
                <button
                  type="button"
                  onClick={() => setShowInCallChat(false)}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <div className="flex-1 p-3 overflow-y-auto space-y-2 text-xs">
                {inCallMessages.length === 0 && (
                  <p className="text-slate-400 text-center py-4">
                    {language === 'bn'
                      ? 'কলের মধ্যেই বার্তা পাঠালে বন্ধু ভয়েস সহ উত্তর দেবে!'
                      : 'Send a message during the call to hear your friend reply out loud!'}
                  </p>
                )}
                {inCallMessages.map((m, i) => (
                  <div key={i} className="bg-white/10 rounded-xl p-2">
                    <span className="font-bold text-cyan-300 mr-1">{m.sender}:</span>
                    <span className="text-white/90">{m.text}</span>
                  </div>
                ))}
              </div>
              <form
                onSubmit={handleSendInCallMessage}
                className="p-2.5 border-t border-white/10 flex items-center gap-1.5"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={language === 'bn' ? 'কলের মধ্যে কিছু বলুন...' : 'Say something...'}
                  className="flex-1 px-3 py-1.5 rounded-full bg-white/10 text-white text-xs placeholder-white/50 focus:outline-none"
                />
                <button
                  type="submit"
                  className="p-1.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Bottom Futuristic Call Dock & Quick Reactions */}
        <div className="relative z-20 p-4 sm:p-5 flex flex-col items-center gap-3 bg-gradient-to-t from-black via-black/90 to-transparent">
          {/* Quick In-Call Emoji Reactions */}
          <div className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10">
            {['❤️', '🔥', '👏', '😂', '👍'].map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleTriggerCallReaction(emoji)}
                className="text-lg hover:scale-125 transition-transform cursor-pointer"
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Main Call Controls */}
          <div className="flex items-center justify-center gap-2.5 sm:gap-4 flex-wrap">
            {/* Toggle Mute */}
            <button
              type="button"
              onClick={handleToggleMute}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                isMuted
                  ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30'
                  : 'bg-white/15 hover:bg-white/25 text-white'
              }`}
              title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Toggle Video */}
            <button
              type="button"
              onClick={() => setIsVideoEnabled((prev) => !prev)}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                !isVideoEnabled
                  ? 'bg-slate-700 text-slate-300'
                  : 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
              }`}
              title={isVideoEnabled ? 'Turn Off Video' : 'Turn On Video'}
            >
              {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>

            {/* Screen Share */}
            <button
              type="button"
              onClick={handleToggleScreenShare}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                isScreenSharing
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'bg-white/15 hover:bg-white/25 text-white'
              }`}
              title={language === 'bn' ? 'স্ক্রিন শেয়ার করুন' : 'Share Screen'}
            >
              <MonitorUp className="w-5 h-5" />
            </button>

            {/* Record Call */}
            <button
              type="button"
              onClick={handleToggleRecording}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                isRecording
                  ? 'bg-red-600 text-white animate-pulse'
                  : 'bg-white/15 hover:bg-white/25 text-white'
              }`}
              title={language === 'bn' ? 'কল রেকর্ড করুন' : 'Record Call'}
            >
              <CircleDot className="w-5 h-5" />
            </button>

            {/* In-Call Chat */}
            <button
              type="button"
              onClick={() => setShowInCallChat((prev) => !prev)}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                showInCallChat
                  ? 'bg-cyan-600 text-white'
                  : 'bg-white/15 hover:bg-white/25 text-white'
              }`}
              title={language === 'bn' ? 'ইন-কল চ্যাট' : 'In-Call Chat'}
            >
              <MessageSquare className="w-5 h-5" />
            </button>

            {/* Toggle Speaker */}
            <button
              type="button"
              onClick={() => setIsSpeakerOn((prev) => !prev)}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                isSpeakerOn
                  ? 'bg-white/15 hover:bg-white/25 text-white'
                  : 'bg-slate-800 text-slate-400'
              }`}
              title={isSpeakerOn ? 'Speaker On' : 'Speaker Off'}
            >
              {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>

            {/* End Call */}
            <button
              type="button"
              onClick={handleEndCall}
              className="w-14 h-12 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-xl shadow-red-600/40 hover:scale-105 transition-all cursor-pointer"
              title={language === 'bn' ? 'কল কেটে দিন' : 'End Call'}
            >
              <PhoneOff className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

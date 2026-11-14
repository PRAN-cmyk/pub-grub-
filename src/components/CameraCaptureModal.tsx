import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, X, Check, RotateCcw, AlertCircle, Upload } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoCaptured: (dataUrl: string) => void;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onPhotoCaptured,
}) => {
  const { language, t } = useApp();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isLoadingCamera, setIsLoadingCamera] = useState<boolean>(true);
  const [isShutterFlashing, setIsShutterFlashing] = useState<boolean>(false);

  // Stop active media stream tracks
  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  // Start camera stream
  const startCamera = useCallback(async (facing: 'user' | 'environment') => {
    setIsLoadingCamera(true);
    setCameraError(null);
    setCapturedPhoto(null);

    // Stop existing stream first
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('navigator.mediaDevices not supported');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(() => {
          // Play was interrupted or auto-play restriction
        });
      }
      setIsLoadingCamera(false);
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      setIsLoadingCamera(false);
      setCameraError(
        language === 'bn'
          ? 'ক্যামেরা চালু করা সম্ভব হয়নি। ডিভাইস পারমিশন চেক করুন অথবা নিচের বাটন দিয়ে সরাসরি ক্যামেরা থেকে ছবি তুলুন।'
          : 'Unable to access device camera. Please check camera permissions or use the direct camera upload button below.',
      );
    }
  }, [language, stream]);

  // Initialize camera when modal opens
  useEffect(() => {
    if (isOpen) {
      setCapturedPhoto(null);
      startCamera(cameraFacing);
    } else {
      stopStream();
    }

    return () => {
      stopStream();
    };
  }, [isOpen, cameraFacing]);

  // Handle capture shutter click
  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Trigger visual shutter flash
    setIsShutterFlashing(true);
    setTimeout(() => setIsShutterFlashing(false), 200);

    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // If front camera, flip horizontally for natural mirror feel
    if (cameraFacing === 'user') {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, width, height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedPhoto(dataUrl);

    // Pause video track while previewing
    if (stream) {
      stream.getVideoTracks().forEach((track) => {
        track.enabled = false;
      });
    }
  };

  // Retake photo
  const handleRetake = () => {
    setCapturedPhoto(null);
    if (stream) {
      stream.getVideoTracks().forEach((track) => {
        track.enabled = true;
      });
    } else {
      startCamera(cameraFacing);
    }
  };

  // Confirm photo attach
  const handleConfirmPhoto = () => {
    if (capturedPhoto) {
      onPhotoCaptured(capturedPhoto);
      stopStream();
      onClose();
    }
  };

  // Toggle front/back camera
  const handleToggleFacing = () => {
    const nextFacing = cameraFacing === 'user' ? 'environment' : 'user';
    setCameraFacing(nextFacing);
  };

  // Fallback direct camera file input change
  const handleDirectFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setCapturedPhoto(result);
        setCameraError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 text-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-slate-700/60 flex flex-col max-h-[95vh] relative animate-in fade-in zoom-in-95 duration-200">
        {/* Hidden Canvas for capture rendering */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Hidden native camera capture input as robust universal fallback */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleDirectFileInput}
          className="hidden"
        />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900/90 border-b border-slate-800 z-10">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue-400" />
            <span className="font-semibold text-sm sm:text-base text-slate-100">
              {language === 'bn' ? 'ক্যামেরা দিয়ে ছবি তুলুন' : 'Take Photo with Camera'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              stopStream();
              onClose();
            }}
            className="p-1.5 rounded-full text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
            title={t.cancel}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Viewfinder / Photo Area */}
        <div className="relative flex-1 bg-black min-h-[320px] max-h-[520px] flex items-center justify-center overflow-hidden">
          {/* Flash animation */}
          {isShutterFlashing && (
            <div className="absolute inset-0 bg-white z-30 opacity-90 transition-opacity duration-150" />
          )}

          {capturedPhoto ? (
            /* Snapshot Preview */
            <div className="relative w-full h-full flex items-center justify-center bg-black">
              <img
                src={capturedPhoto}
                alt="Captured Snapshot"
                className="w-full h-full object-contain max-h-[460px]"
              />
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-xs font-semibold px-3 py-1 rounded-full text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                <span>{language === 'bn' ? 'ছবি সম্পন্ন হয়েছে' : 'Photo Captured'}</span>
              </div>
            </div>
          ) : cameraError ? (
            /* Error & Fallback UI */
            <div className="p-6 text-center max-w-sm space-y-4">
              <div className="w-14 h-14 rounded-full bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
                <AlertCircle className="w-7 h-7" />
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {cameraError}
              </p>
              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all"
                >
                  <Upload className="w-4 h-4" />
                  <span>
                    {language === 'bn'
                      ? 'ডিভাইসের ক্যামেরা অ্যাপ খুলুন'
                      : 'Open Device Camera App'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => startCamera(cameraFacing)}
                  className="w-full py-2 px-3 text-xs text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  {language === 'bn' ? 'পুনরায় চেষ্টা করুন' : 'Retry Permission'}
                </button>
              </div>
            </div>
          ) : (
            /* Live Camera Video Viewfinder */
            <div className="relative w-full h-full flex items-center justify-center">
              {isLoadingCamera && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 gap-2">
                  <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
                  <span className="text-xs text-slate-300">
                    {language === 'bn' ? 'ক্যামেরা শুরু হচ্ছে...' : 'Initializing camera...'}
                  </span>
                </div>
              )}

              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover min-h-[320px] max-h-[460px] ${
                  cameraFacing === 'user' ? '-scale-x-100' : ''
                }`}
              />

              {/* Viewfinder Target Framing Overlay */}
              <div className="pointer-events-none absolute inset-6 border border-white/20 rounded-2xl flex flex-col justify-between p-3">
                <div className="flex justify-between">
                  <div className="w-4 h-4 border-t-2 border-l-2 border-white/70 rounded-tl" />
                  <div className="w-4 h-4 border-t-2 border-r-2 border-white/70 rounded-tr" />
                </div>
                <div className="flex justify-between">
                  <div className="w-4 h-4 border-b-2 border-l-2 border-white/70 rounded-bl" />
                  <div className="w-4 h-4 border-b-2 border-r-2 border-white/70 rounded-br" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Camera Controls Footer */}
        <div className="p-4 bg-slate-900 border-t border-slate-800">
          {capturedPhoto ? (
            /* Review Actions */
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleRetake}
                className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{t.retake}</span>
              </button>

              <button
                type="button"
                onClick={handleConfirmPhoto}
                className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-600/30 transition-colors"
              >
                <Check className="w-4 h-4" />
                <span>{t.usePhoto}</span>
              </button>
            </div>
          ) : (
            /* Active Live Capture Controls */
            <div className="flex items-center justify-between px-2">
              {/* Native device file fallback trigger */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-3 text-slate-400 hover:text-slate-200 bg-slate-800/80 hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
                title={language === 'bn' ? 'ফাইল/ডিভাইস থেকে' : 'Device Camera / Gallery'}
              >
                <Upload className="w-5 h-5" />
              </button>

              {/* Big Shutter Button */}
              <button
                type="button"
                onClick={handleCapture}
                disabled={isLoadingCamera || !!cameraError}
                className="w-16 h-16 rounded-full border-4 border-white bg-white/20 active:scale-95 disabled:opacity-40 hover:bg-white/30 flex items-center justify-center transition-all cursor-pointer p-1 shadow-xl"
                title={t.capturePhoto}
              >
                <div className="w-12 h-12 rounded-full bg-white transition-transform group-active:scale-90" />
              </button>

              {/* Flip camera facing button */}
              <button
                type="button"
                onClick={handleToggleFacing}
                disabled={isLoadingCamera || !!cameraError}
                className="p-3 text-slate-400 hover:text-slate-200 bg-slate-800/80 hover:bg-slate-800 rounded-full transition-colors cursor-pointer disabled:opacity-40"
                title={t.switchCamera}
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  X,
  Cloud,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Zap,
  Film,
  ExternalLink,
  Save,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';
import {
  getCloudinaryConfig,
  saveCloudinaryConfig,
  resetCloudinaryConfig,
} from '../utils/cloudinary';
import { useApp } from '../context/AppContext';

interface CloudinarySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CloudinarySettingsModal: React.FC<CloudinarySettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { language, showToast } = useApp();
  const initialConfig = getCloudinaryConfig();

  const [cloudName, setCloudName] = useState(initialConfig.cloudName);
  const [uploadPreset, setUploadPreset] = useState(initialConfig.uploadPreset);
  const [apiKey, setApiKey] = useState(initialConfig.apiKey || '');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cloudName.trim() || !uploadPreset.trim()) {
      showToast(
        language === 'bn'
          ? 'ক্লাউড নেম ও আপলোড প্রিসেট পূরণ করুন'
          : 'Please enter both Cloud Name and Upload Preset',
      );
      return;
    }
    saveCloudinaryConfig(cloudName.trim(), uploadPreset.trim(), apiKey.trim());
    showToast(
      language === 'bn'
        ? 'ক্লাউডিনারি কনফিগারেশন সফলভাবে সংরক্ষিত হয়েছে!'
        : 'Cloudinary configuration saved successfully!',
    );
    onClose();
  };

  const handleResetToDefault = () => {
    resetCloudinaryConfig();
    const defaults = getCloudinaryConfig();
    setCloudName(defaults.cloudName);
    setUploadPreset(defaults.uploadPreset);
    setApiKey('');
    setTestResult(null);
    showToast(
      language === 'bn'
        ? 'ডিফল্ট ফ্রি-টিয়ার কনফিগারেশন রিস্টোর করা হয়েছে'
        : 'Restored default free-tier Cloudinary setup',
    );
  };

  const testConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      // Test ping to Cloudinary API with small transparent 1px PNG blob
      const base64Data =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const res = await fetch(base64Data);
      const blob = await res.blob();
      const testFile = new File([blob], 'test_ping.png', { type: 'image/png' });

      const formData = new FormData();
      formData.append('file', testFile);
      formData.append('upload_preset', uploadPreset.trim());

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName.trim()}/image/upload`,
        {
          method: 'POST',
          body: formData,
        },
      );

      if (response.ok) {
        setTestResult({
          success: true,
          message:
            language === 'bn'
              ? 'সংযোগ সফল! আপনার ক্লাউডিনারিতে ভিডিও ও মিডিয়া সরাসরি আপলোড হবে।'
              : 'Connection successful! Cloudinary is ready for direct video & media streaming.',
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        setTestResult({
          success: false,
          message:
            errorData.error?.message ||
            (language === 'bn'
              ? 'সংযোগ ব্যর্থ হয়েছে। অনুগ্রহ করে ক্লাউড নেম এবং আনসাইনড প্রিসেট সঠিক কিনা পরীক্ষা করুন।'
              : 'Connection failed. Please check your Cloud Name and Unsigned Upload Preset.'),
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message:
          err.message ||
          (language === 'bn'
            ? 'ইন্টারনেট বা নেটওয়ার্ক সংযোগে সমস্যা হয়েছে।'
            : 'Network connection error during ping.'),
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-violet-600/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base sm:text-lg flex items-center gap-2">
                <span>Cloudinary Media Engine</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                  Free Tier (No Card)
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'bn'
                  ? 'কোন ক্রেডিট কার্ড বা বিলিং ছাড়াই ভিডিও ও ছবি ফ্রি ক্লাউড স্টোরেজ'
                  : 'Free video & media storage with zero credit card or billing'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Free Tier Feature Highlights */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 text-center">
              <div className="w-8 h-8 mx-auto rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-1.5">
                <Film className="w-4 h-4" />
              </div>
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                HD Video
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                Smooth Streaming
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 text-center">
              <div className="w-8 h-8 mx-auto rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-1.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                100% Free
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                No Credit Card
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 text-center">
              <div className="w-8 h-8 mx-auto rounded-xl bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center mb-1.5">
                <Zap className="w-4 h-4" />
              </div>
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Auto Fallback
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                IndexedDB Native
              </div>
            </div>
          </div>

          {/* Test Status Banner */}
          {testResult && (
            <div
              className={`p-3.5 rounded-2xl border text-xs flex items-start gap-2.5 ${
                testResult.success
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 font-medium">{testResult.message}</div>
            </div>
          )}

          {/* Settings Form */}
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {language === 'bn' ? 'ক্লাউডিনারি ক্লাউড নেম (Cloud Name)' : 'Cloudinary Cloud Name'}
              </label>
              <input
                type="text"
                value={cloudName}
                onChange={(e) => setCloudName(e.target.value)}
                placeholder="e.g. dkhpt0h9z or my-cloud"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {language === 'bn'
                  ? 'আনসাইনড আপলোড প্রিসেট (Unsigned Upload Preset)'
                  : 'Unsigned Upload Preset'}
              </label>
              <input
                type="text"
                value={uploadPreset}
                onChange={(e) => setUploadPreset(e.target.value)}
                placeholder="e.g. bandhan_unsigned or ml_default"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                {language === 'bn'
                  ? 'ক্লাউডিনারি ড্যাশবোর্ড > Settings > Upload > Add upload preset > Signing Mode: Unsigned নির্বাচন করুন।'
                  : 'In Cloudinary: Settings > Upload > Add upload preset > Set Signing Mode to Unsigned.'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {language === 'bn' ? 'ঐচ্ছিক এপিআই কি (API Key - Optional)' : 'API Key (Optional)'}
              </label>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Optional"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={testConnection}
                disabled={isTesting}
                className="flex-1 py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                <span>
                  {isTesting
                    ? language === 'bn'
                      ? 'টেস্ট হচ্ছে...'
                      : 'Testing...'
                    : language === 'bn'
                    ? 'কানেকশন টেস্ট করুন'
                    : 'Test Connection'}
                </span>
              </button>

              <button
                type="button"
                onClick={handleResetToDefault}
                className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1.5 cursor-pointer"
                title="Reset to default free cloud"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{language === 'bn' ? 'ডিফল্ট' : 'Default'}</span>
              </button>
            </div>

            {/* Save Button */}
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
            >
              <Save className="w-4 h-4" />
              <span>{language === 'bn' ? 'কনফিগারেশন সংরক্ষণ করুন' : 'Save Cloudinary Setup'}</span>
            </button>
          </form>

          {/* Quick Help Link */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>
              {language === 'bn'
                ? 'ক্লাউডিনারিতে একাউন্ট নেই? ১ মিনিটে ফ্রিতে খুলুন'
                : 'Need a free Cloudinary account? Takes 1 minute'}
            </span>
            <a
              href="https://cloudinary.com/users/register_free"
              target="_blank"
              rel="noreferrer"
              className="font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <span>{language === 'bn' ? 'ফ্রি সাইনআপ' : 'Free Sign Up'}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { X, Sparkles, Shield, Gamepad2, Film, Users, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import pbLogo from '../assets/images/pb_logo_welcome_1792197575329.jpg';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onClose }) => {
  const { language, currentUser, setIsAccountSecurityOpen } = useApp();
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleDismiss = () => {
    if (dontShowAgain) {
      try {
        localStorage.setItem('bandhan_welcome_v1', 'dismissed');
      } catch {}
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3.5 sm:p-4 select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-slate-950 via-slate-900 to-black rounded-3xl border border-amber-500/30 shadow-[0_0_50px_rgba(217,119,6,0.25)] overflow-hidden text-center flex flex-col max-h-[92vh]">
        {/* Top Gold Corner Accents */}
        <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-amber-400/60 rounded-tl-3xl pointer-events-none" />
        <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-amber-400/60 rounded-tr-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-amber-400/60 rounded-bl-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-amber-400/60 rounded-br-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-4 right-4 z-20 p-2 text-slate-400 hover:text-amber-400 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Body Content */}
        <div className="p-6 sm:p-8 overflow-y-auto no-scrollbar space-y-5">
          {/* Logo Showcase with Gold Glow */}
          <div className="relative mx-auto w-32 h-32 sm:w-36 sm:h-36 rounded-2xl overflow-hidden shadow-2xl border-2 border-amber-400/50 p-1 bg-gradient-to-tr from-amber-600/30 via-slate-900 to-amber-500/30 group">
            <img
              src={pbLogo}
              alt="Phoenix & Blade Logo"
              className="w-full h-full object-cover rounded-xl transform group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
          </div>

          {/* WELCOME Title */}
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold tracking-widest uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>PHOENIX & BLADE</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500 drop-shadow-sm pt-1">
              WELCOME friend
            </h2>
            <p className="text-sm font-semibold text-amber-200/90">
              {language === 'bn'
                ? `স্বাগতম বন্ধু! বন্ধন সোশ্যাল নেটওয়ার্কে আপনাকে আন্তরিক অভিনন্দন`
                : `Welcome friend to Bandhan Social Network`}
            </p>
          </div>

          {/* Quick Platform Pillars */}
          <div className="grid grid-cols-2 gap-2.5 text-left pt-2">
            <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-start gap-2.5">
              <div className="p-1.5 rounded-lg bg-blue-500/15 text-blue-400 shrink-0">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">
                  {language === 'bn' ? 'সুরক্ষিত একাউন্ট' : 'Secure Vault'}
                </p>
                <p className="text-[10px] text-slate-400 leading-tight mt-0.5">
                  {language === 'bn' ? 'পিন লক ও নিজস্ব প্রাইভেসি' : 'Encrypted multi-profile'}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-start gap-2.5">
              <div className="p-1.5 rounded-lg bg-purple-500/15 text-purple-400 shrink-0">
                <Film className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">
                  {language === 'bn' ? 'স্টোরি ও রিল' : 'Stories & Music'}
                </p>
                <p className="text-[10px] text-slate-400 leading-tight mt-0.5">
                  {language === 'bn' ? 'মিউজিক ট্যাগ ও লাইভ রিঅ্যাক্ট' : 'Floating reactions & audio'}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-start gap-2.5">
              <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 shrink-0">
                <Gamepad2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">
                  {language === 'bn' ? 'এআই গেমিং হাব' : 'AI Gaming Hub'}
                </p>
                <p className="text-[10px] text-slate-400 leading-tight mt-0.5">
                  {language === 'bn' ? 'চেস, কানেক্ট ৪, লুডো ও স্নেক' : 'Real-time games with AI'}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-start gap-2.5">
              <div className="p-1.5 rounded-lg bg-rose-500/15 text-rose-400 shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">
                  {language === 'bn' ? 'প্রকৃত বন্ধুত্ব' : 'Pure Social'}
                </p>
                <p className="text-[10px] text-slate-400 leading-tight mt-0.5">
                  {language === 'bn' ? 'নো ফেইক স্প্যাম, ১০০% রিয়েল' : 'No fake bot clutter'}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={handleDismiss}
              className="w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-black text-sm tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>{language === 'bn' ? 'প্ল্যাটফর্মে প্রবেশ করুন' : 'Start Exploring Bandhan'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                setIsAccountSecurityOpen(true);
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-bold transition-colors cursor-pointer border border-white/10"
            >
              {language === 'bn'
                ? 'একাউন্ট সিকিউরিটি ও প্রোফাইল সেটিংস দেখুন'
                : 'Account Security & Profile Vault Settings'}
            </button>
          </div>

          {/* Don't show again toggle */}
          <div className="flex items-center justify-center gap-2 text-xs text-slate-400 pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="rounded border-slate-700 bg-slate-800 text-amber-500 focus:ring-amber-500 focus:ring-offset-slate-900 w-3.5 h-3.5 cursor-pointer"
              />
              <span>
                {language === 'bn'
                  ? 'পরবর্তীতে স্বয়ংক্রিয়ভাবে দেখাবেন না'
                  : 'Do not show automatically next time'}
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  Lock,
  UserPlus,
  LogIn,
  Camera,
  ShieldCheck,
  Sun,
  Moon,
  KeyRound,
  X,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { fileToDataUrl } from '../utils/storage';

export const AuthScreen: React.FC = () => {
  const {
    profiles,
    loginAccount,
    switchProfile,
    createNewProfile,
    resetAccountPasswordOrPin,
    signInWithGoogleAccount,
    signInWithEmail,
    registerWithEmail,
    sendPasswordReset,
    language,
    setLanguage,
    isDarkMode,
    toggleDarkMode,
  } = useApp();

  const [mode, setMode] = useState<'login' | 'signup'>('login');

  // Login form state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  // Quick card PIN unlock state
  const [selectedLockedUserId, setSelectedLockedUserId] = useState<string | null>(null);
  const [quickPin, setQuickPin] = useState('');

  // Forgot PIN / Password state
  const [isForgotPinOpen, setIsForgotPinOpen] = useState(false);
  const [forgotPinTargetUserId, setForgotPinTargetUserId] = useState<string | null>(null);
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [newResetPin, setNewResetPin] = useState('');

  // Sign Up form state (Facebook-style registration)
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nameBn, setNameBn] = useState('');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [username, setUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [city, setCity] = useState('Dhaka, Bangladesh');
  const [workplace, setWorkplace] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [coverUrl, setCoverUrl] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) return;
    if (identifier.includes('@') && password.trim()) {
      const ok = await signInWithEmail(identifier.trim(), password.trim());
      if (ok) return;
    }
    loginAccount(identifier, password);
  };

  const handleQuickAccountClick = (userId: string, hasPin: boolean) => {
    if (hasPin) {
      setSelectedLockedUserId(userId);
      setQuickPin('');
      return;
    }
    switchProfile(userId);
  };

  const handleQuickPinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLockedUserId) return;
    const ok = switchProfile(selectedLockedUserId, quickPin);
    if (ok) {
      setSelectedLockedUserId(null);
      setQuickPin('');
    }
  };

  const handleResetPinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const target = forgotPinTargetUserId || resetIdentifier.trim();
    if (!target) return;
    if (!newResetPin.trim()) return;

    const ok = resetAccountPasswordOrPin(target, newResetPin.trim());
    if (ok) {
      const targetUser = profiles.find(
        (p) =>
          p.id === target ||
          p.username.toLowerCase() === target.toLowerCase() ||
          p.email?.toLowerCase() === target.toLowerCase() ||
          p.phone === target,
      );
      if (targetUser) {
        switchProfile(targetUser.id, newResetPin.trim());
      }
      setIsForgotPinOpen(false);
      setNewResetPin('');
      setResetIdentifier('');
      setForgotPinTargetUserId(null);
      setSelectedLockedUserId(null);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await fileToDataUrl(file);
    setAvatarUrl(url);
    e.target.value = '';
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await fileToDataUrl(file);
    setCoverUrl(url);
    e.target.value = '';
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    if (!fullName) return;

    const isEmail = emailOrPhone.includes('@');
    if (isEmail && newPassword.trim()) {
      const ok = await registerWithEmail(
        emailOrPhone.trim(),
        newPassword.trim(),
        fullName,
        nameBn.trim() || fullName,
      );
      if (ok) return;
    }

    const cleanUser =
      username.trim() ||
      firstName.trim().toLowerCase().replace(/\s+/g, '_') +
        '_' +
        Math.floor(100 + Math.random() * 899);

    createNewProfile({
      name: fullName,
      nameBn: nameBn.trim() || fullName,
      username: cleanUser,
      email: isEmail ? emailOrPhone.trim() : undefined,
      phone: !isEmail && emailOrPhone.trim() ? emailOrPhone.trim() : undefined,
      city: city.trim() || 'Dhaka, Bangladesh',
      workplace: workplace.trim() || 'Bandhan Creator',
      bio: bio.trim() || 'New on Bandhan Social Network ✨',
      avatar: avatarUrl || undefined,
      coverImage: coverUrl || undefined,
      pin: newPassword.trim() || undefined,
    });
  };

  const lockedProfile = profiles.find((p) => p.id === selectedLockedUserId);

  return (
    <div className="min-h-screen bg-[#f0f2f5] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between transition-colors">
      {/* Top Bar */}
      <header className="w-full max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-[#1877F2] flex items-center justify-center text-white font-black text-xl shadow-sm">
            b
          </div>
          <span className="font-extrabold text-xl tracking-tight text-[#1877F2]">
            bandhan
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setLanguage(language === 'bn' ? 'en' : 'bn')}
            className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold cursor-pointer"
          >
            {language === 'bn' ? 'English' : 'বাংলা'}
          </button>
          <button
            type="button"
            onClick={toggleDarkMode}
            className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer"
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>
        </div>
      </header>

      {/* Main Facebook-style Two-Column Auth Container */}
      <main className="w-full max-w-6xl mx-auto px-4 py-6 md:py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Brand + Recent Logins */}
        <div className="lg:col-span-7 space-y-6">
          <div>
            {/* WELCOME friend Logo Emblem */}
            <div className="inline-flex items-center gap-3.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-xl shadow-blue-500/25 border border-white/20 mb-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shadow-inner border border-white/30 shrink-0">
                🤝
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-200 block leading-tight">
                  {language === 'bn' ? 'স্বাগতম প্রিয় বন্ধু' : 'HELLO &'}
                </span>
                <span className="text-xl sm:text-2xl font-black tracking-tight leading-none">
                  WELCOME friend
                </span>
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1877F2] tracking-tight">
              {language === 'bn' ? 'বন্ধন (Bandhan)' : 'bandhan'}
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-2 max-w-xl leading-relaxed">
              {language === 'bn'
                ? 'বন্ধন আপনাকে বন্ধুদের সাথে যুক্ত থাকতে, ছবি ও বড় ভিডিও শেয়ার করতে এবং কন্টেন্ট থেকে উপার্জন করতে সাহায্য করে।'
                : 'Bandhan helps you connect with friends, share photos & full-length HD videos, and monetize your content.'}
            </p>
          </div>

          {/* Saved Accounts / Recent Logins */}
          <div className="space-y-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {language === 'bn' ? 'সাম্প্রতিক লগইনসমূহ' : 'Recent Logins'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'bn'
                  ? 'আপনার অ্যাকাউন্টে প্রবেশ করতে ছবির ওপর ক্লিক করুন অথবা নতুন অ্যাকাউন্ট খুলুন'
                  : 'Click your picture to log in immediately or add a new account'}
              </p>
            </div>

            {selectedLockedUserId && lockedProfile && (
              <form
                onSubmit={handleQuickPinSubmit}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-blue-500 shadow-lg max-w-md space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={lockedProfile.avatar}
                      alt={lockedProfile.name}
                      className="w-9 h-9 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {language === 'bn'
                          ? lockedProfile.nameBn || lockedProfile.name
                          : lockedProfile.name}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {language === 'bn' ? 'পাসওয়ার্ড / পিন দিন' : 'Enter Password / PIN'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedLockedUserId(null)}
                    className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    required
                    autoFocus
                    value={quickPin}
                    onChange={(e) => setQuickPin(e.target.value)}
                    placeholder="••••"
                    className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#1877F2] hover:bg-blue-700 text-white text-xs font-bold cursor-pointer"
                  >
                    {language === 'bn' ? 'লগইন' : 'Log In'}
                  </button>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotPinTargetUserId(lockedProfile.id);
                      setIsForgotPinOpen(true);
                    }}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    {language === 'bn' ? '🔑 পিন মনে নেই? পিন ফরগেট মারুন' : '🔑 Forgot PIN? Reset PIN'}
                  </button>
                </div>
              </form>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {profiles.map((prof) => (
                <button
                  key={prof.id}
                  type="button"
                  onClick={() => handleQuickAccountClick(prof.id, Boolean(prof.pinHash))}
                  className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-md hover:border-blue-500 transition-all text-center flex flex-col cursor-pointer"
                >
                  <div className="w-full aspect-square bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
                    <img
                      src={prof.avatar}
                      alt={prof.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {prof.pinHash && (
                      <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/70 text-emerald-400 flex items-center justify-center">
                        <KeyRound className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate">
                      {language === 'bn' ? prof.nameBn || prof.name : prof.name}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      @{prof.username}
                    </p>
                  </div>
                </button>
              ))}

              {/* Add Account Card */}
              <button
                type="button"
                onClick={() => setMode('signup')}
                className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-dashed border-blue-300 dark:border-blue-800 hover:border-blue-500 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col items-center justify-center p-4 min-h-[160px] cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#1877F2] flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <UserPlus className="w-6 h-6" />
                </div>
                <span className="font-bold text-xs sm:text-sm text-[#1877F2]">
                  {language === 'bn' ? 'নতুন অ্যাকাউন্ট খুলুন' : 'Add Account'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Facebook-Style Login Box OR Sign-Up Box */}
        <div className="lg:col-span-5 w-full max-w-md mx-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6">
            {mode === 'login' ? (
              <div className="space-y-4">
                <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                  <div>
                    <input
                      type="text"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder={
                        language === 'bn'
                          ? 'ইউজারনেম, ইমেইল, ফোন নম্বর বা নাম (যেমন: pranto_dev)'
                          : 'Username, email, phone or name (e.g. pranto_dev)'
                      }
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#1877F2]"
                    />
                  </div>

                  <div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={
                        language === 'bn'
                          ? 'পাসওয়ার্ড বা গোপন পিন (যদি দেয়া থাকে)'
                          : 'Password or Security PIN (if set)'
                      }
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#1877F2]"
                    />
                  </div>

                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setForgotPinTargetUserId(null);
                        setResetIdentifier(identifier);
                        setIsForgotPinOpen(true);
                      }}
                      className="text-xs font-semibold text-[#1877F2] hover:underline cursor-pointer"
                    >
                      {language === 'bn' ? 'পাসওয়ার্ড বা পিন ভুলে গেছেন?' : 'Forgotten password or PIN?'}
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-[#1877F2] hover:bg-blue-700 text-white font-extrabold text-base shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <LogIn className="w-5 h-5" />
                    <span>{language === 'bn' ? 'লগইন করুন' : 'Log In'}</span>
                  </button>
                </form>

                {/* Official Sign in with Google (Firebase Auth + Google Drive OAuth) */}
                <button
                  type="button"
                  onClick={() => signInWithGoogleAccount()}
                  className="gsi-material-button w-full py-2.5 px-4 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-sm border border-slate-300 dark:border-slate-700 shadow-xs flex items-center justify-center gap-3 cursor-pointer transition-all"
                >
                  <div className="gsi-material-button-icon w-5 h-5 shrink-0">
                    <svg
                      version="1.1"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 48 48"
                      style={{ display: 'block' }}
                    >
                      <path
                        fill="#EA4335"
                        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                      />
                      <path
                        fill="#4285F4"
                        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                      />
                      <path
                        fill="#34A853"
                        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                      />
                      <path fill="none" d="M0 0h48v48H0z" />
                    </svg>
                  </div>
                  <span className="gsi-material-button-contents">Sign in with Google</span>
                </button>

                <div className="text-center">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {language === 'bn'
                      ? 'উপরে থাকা যেকোনো প্রোফাইল কার্ডে ক্লিক করেও সরাসরি ঢুকতে পারবেন'
                      : 'Or click any saved account card on the left for instant login'}
                  </span>
                </div>

                <div className="h-px bg-slate-200 dark:bg-slate-800 my-2" />

                <div className="pt-1 text-center">
                  <button
                    type="button"
                    onClick={() => setMode('signup')}
                    className="px-6 py-3 rounded-xl bg-[#42b72a] hover:bg-[#36a420] text-white font-extrabold text-sm sm:text-base shadow-md transition-colors cursor-pointer inline-flex items-center gap-2"
                  >
                    <UserPlus className="w-5 h-5" />
                    <span>
                      {language === 'bn'
                        ? 'নতুন অ্যাকাউন্ট তৈরি করুন'
                        : 'Create new account'}
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              /* FACEBOOK-STYLE SIGN UP FORM */
              <form onSubmit={handleSignUpSubmit} className="space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                      {language === 'bn' ? 'নতুন অ্যাকাউন্ট খুলুন' : 'Sign Up'}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {language === 'bn'
                        ? 'এটি দ্রুত, সহজ এবং সম্পূর্ণ এনক্রিপ্টেড।'
                        : 'It is quick, easy, and encrypted.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder={language === 'bn' ? 'প্রথম নাম *' : 'First name *'}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm"
                  />
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder={language === 'bn' ? 'পদবি' : 'Surname'}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm"
                  />
                </div>

                <input
                  type="text"
                  value={nameBn}
                  onChange={(e) => setNameBn(e.target.value)}
                  placeholder={
                    language === 'bn'
                      ? 'বাংলায় নাম (ঐচ্ছিক, যেমন: সাকিব আল হাসান)'
                      : 'Name in Bangla (optional)'
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm"
                />

                <input
                  type="text"
                  required
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  placeholder={
                    language === 'bn'
                      ? 'মোবাইল নম্বর অথবা ইমেইল এড্রেস *'
                      : 'Mobile number or email address *'
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm"
                />

                <div className="grid grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={language === 'bn' ? 'ইউজারনেম (@username)' : 'Username'}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm"
                  />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={language === 'bn' ? 'নতুন পাসওয়ার্ড / পিন' : 'New password / PIN'}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder={language === 'bn' ? 'শহর (যেমন: Dhaka)' : 'City'}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs"
                  />
                  <input
                    type="text"
                    value={workplace}
                    onChange={(e) => setWorkplace(e.target.value)}
                    placeholder={language === 'bn' ? 'পেশা বা প্রতিষ্ঠান' : 'Workplace / School'}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs"
                  />
                </div>

                <input
                  type="text"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder={language === 'bn' ? 'সংক্ষিপ্ত বায়ো লিখুন...' : 'Short bio...'}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs"
                />

                {/* Profile & Cover Photo Upload */}
                <div className="grid grid-cols-2 gap-2.5">
                  <label className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold cursor-pointer border border-slate-200 dark:border-slate-700">
                    <Camera className="w-4 h-4 text-blue-600" />
                    <span>
                      {avatarUrl
                        ? language === 'bn'
                          ? '✓ প্রোফাইল ছবি যুক্ত'
                          : '✓ Photo Added'
                        : language === 'bn'
                        ? 'প্রোফাইল ছবি দিন'
                        : 'Profile Photo'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </label>

                  <label className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold cursor-pointer border border-slate-200 dark:border-slate-700">
                    <Camera className="w-4 h-4 text-purple-600" />
                    <span>
                      {coverUrl
                        ? language === 'bn'
                          ? '✓ কভার ছবি যুক্ত'
                          : '✓ Cover Added'
                        : language === 'bn'
                        ? 'কভার ছবি দিন'
                        : 'Cover Photo'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCoverUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-[#42b72a] hover:bg-[#36a420] text-white font-extrabold text-sm sm:text-base shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>
                    {language === 'bn' ? 'সাইন আপ (নতুন অ্যাকাউন্ট খুলুন)' : 'Sign Up'}
                  </span>
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="text-xs font-bold text-[#1877F2] hover:underline cursor-pointer"
                  >
                    {language === 'bn'
                      ? 'ইতিমধ্যে অ্যাকাউন্ট আছে? লগইন করুন'
                      : 'Already have an account? Log In'}
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>
              {language === 'bn'
                ? 'AES-256 ও SHA-256 এনক্রিপ্টেড ব্যক্তিগত অ্যাকাউন্ট ভল্ট'
                : 'AES-256 & SHA-256 Encrypted Personal Account Vault'}
            </span>
          </div>
        </div>
      </main>

      {/* Forgot PIN / Reset Password Modal */}
      {isForgotPinOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                  {language === 'bn' ? 'পিন বা পাসওয়ার্ড রিসেট করুন' : 'Reset PIN or Password'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsForgotPinOpen(false);
                  setNewResetPin('');
                  setForgotPinTargetUserId(null);
                }}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResetPinSubmit} className="space-y-3.5">
              {forgotPinTargetUserId ? (
                (() => {
                  const targetUser = profiles.find((p) => p.id === forgotPinTargetUserId);
                  return (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <img
                        src={targetUser?.avatar}
                        alt={targetUser?.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-bold text-sm text-slate-900 dark:text-slate-100">
                          {language === 'bn' ? targetUser?.nameBn || targetUser?.name : targetUser?.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          @{targetUser?.username} • {targetUser?.email || targetUser?.phone || 'Account Verified'}
                        </p>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'bn' ? 'ইউজারনেম, ইমেইল বা ফোন নম্বর' : 'Username, Email or Phone'}
                  </label>
                  <input
                    type="text"
                    required
                    value={resetIdentifier}
                    onChange={(e) => setResetIdentifier(e.target.value)}
                    placeholder={language === 'bn' ? 'যেমন: pranto_dev বা 017xxxxxxxx' : 'e.g. pranto_dev'}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#1877F2]"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'bn' ? 'নতুন ৪-সংখ্যার পিন বা পাসওয়ার্ড দিন' : 'Enter New 4-Digit PIN or Password'}
                </label>
                <input
                  type="password"
                  required
                  autoFocus
                  value={newResetPin}
                  onChange={(e) => setNewResetPin(e.target.value)}
                  placeholder="••••"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#1877F2]"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  {language === 'bn'
                    ? 'নতুন পিন সেট করলে পুরনো পিন বাতিল হয়ে যাবে এবং সাথে সাথে অ্যাকাউন্টে ঢুকতে পারবেন।'
                    : 'Setting a new PIN will overwrite the old PIN and immediately log you in.'}
                </p>
              </div>

              {/* Direct Firebase Password Reset Email Link */}
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 flex items-center justify-between gap-2">
                <span className="text-[11px] text-blue-800 dark:text-blue-300 font-medium">
                  {language === 'bn' ? 'অফিসিয়াল ফায়ারবেস ইমেইল রিসেট লিঙ্ক পাঠাতে চান?' : 'Want an official Firebase password reset email?'}
                </span>
                <button
                  type="button"
                  onClick={async () => {
                    const targetEmail = resetIdentifier.includes('@')
                      ? resetIdentifier
                      : profiles.find((p) => p.id === forgotPinTargetUserId)?.email;
                    if (targetEmail) {
                      await sendPasswordReset(targetEmail);
                      setIsForgotPinOpen(false);
                    }
                  }}
                  className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold shrink-0 cursor-pointer"
                >
                  {language === 'bn' ? 'ইমেইল পাঠান' : 'Send Email'}
                </button>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsForgotPinOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  {language === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#1877F2] hover:bg-blue-700 text-white text-xs font-bold shadow-md cursor-pointer transition-colors"
                >
                  {language === 'bn' ? 'পিন রিসেট ও লগইন করুন' : 'Reset PIN & Log In'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto px-4 py-4">
        <p className="text-center text-xs text-slate-400">
          Bandhan © 2026 • Responsive Mobile & Desktop Social Network
        </p>
      </footer>
    </div>
  );
};

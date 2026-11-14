import React, { Component, ErrorInfo, ReactNode, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

class RootErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, errorMessage: error.message || 'Unknown runtime error' };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App caught in RootErrorBoundary:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleResetStorage = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    } catch {
      window.location.reload();
    }
  };

  handleAutoRepair = () => {
    try {
      localStorage.removeItem('bandhan_posts_local');
      localStorage.removeItem('bandhan_photo_albums');
    } catch {}
    this.setState({ hasError: false, errorMessage: '' });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#f0f2f5] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto text-2xl font-bold">
              b
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
              বন্ধন সোশ্যাল নেটওয়ার্ক
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              সাময়িক সমস্যার জন্য দুঃখিত। নিচের বাটনে ক্লিক করে অ্যাপটি স্বাভাবিকভাবে পুনরায় চালু করুন।
            </p>
            {this.state.errorMessage && (
              <p className="text-[10px] font-mono text-rose-500 bg-rose-50 dark:bg-rose-950/50 p-2 rounded-xl text-left truncate">
                ত্রুটি: {this.state.errorMessage}
              </p>
            )}
            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={this.handleAutoRepair}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-md"
              >
                স্বয়ংক্রিয় রিকভার ও চালু করুন
              </button>
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer"
              >
                রিলোড করুন (Reload)
              </button>
              <button
                type="button"
                onClick={this.handleResetStorage}
                className="w-full py-2 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
              >
                ক্যাশে ক্লিয়ার ও রিস্টার্ট
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </StrictMode>,
);

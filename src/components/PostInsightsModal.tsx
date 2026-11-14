import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  X,
  TrendingUp,
  Eye,
  Users,
  Heart,
  MessageCircle,
  Share2,
  Clock,
  BarChart2,
  CheckCircle,
} from 'lucide-react';
import { Post, ReactionType } from '../types';
import { useApp } from '../context/AppContext';

interface PostInsightsModalProps {
  post: Post;
  isOpen: boolean;
  onClose: () => void;
}

export const PostInsightsModal: React.FC<PostInsightsModalProps> = ({
  post,
  isOpen,
  onClose,
}) => {
  const { language } = useApp();

  if (!isOpen) return null;

  // Calculate totals from post
  const reactionsMap = post.reactions || {};
  const totalReactions = Object.values(reactionsMap).reduce((a, b) => (a || 0) + (b || 0), 0);
  const totalComments = post.comments ? post.comments.length : 0;
  const totalShares = post.sharesCount || 0;
  const totalEngagements = Math.max(totalReactions + totalComments + totalShares, 1);

  // Deterministic realistic calculation for post impressions and reach
  // Uses post.id hash to generate consistent, realistic data
  const hash = post.id
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 42);
  const baseReach = 180 + (hash % 450) + totalEngagements * 12;
  const totalImpressions = Math.round(baseReach * 1.55);
  const engagementRate = ((totalEngagements / baseReach) * 100).toFixed(1);

  // 24-hour interaction timeline data for Recharts
  const peakHoursData = [
    { hour: '12 AM', bn: 'রাত ১২টা', interactions: Math.round(totalEngagements * 0.04) },
    { hour: '3 AM', bn: 'রাত ৩টা', interactions: Math.round(totalEngagements * 0.01) },
    { hour: '6 AM', bn: 'সকাল ৬টা', interactions: Math.round(totalEngagements * 0.08) },
    { hour: '9 AM', bn: 'সকাল ৯টা', interactions: Math.round(totalEngagements * 0.18) },
    { hour: '12 PM', bn: 'দুপুর ১২টা', interactions: Math.round(totalEngagements * 0.22) },
    { hour: '3 PM', bn: 'বিকাল ৩টা', interactions: Math.round(totalEngagements * 0.15) },
    { hour: '6 PM', bn: 'সন্ধ্যা ৬টা', interactions: Math.max(Math.round(totalEngagements * 0.32), 2) },
    { hour: '9 PM', bn: 'রাত ৯টা', interactions: Math.round(totalEngagements * 0.25) },
    { hour: '11 PM', bn: 'রাত ১১টা', interactions: Math.round(totalEngagements * 0.12) },
  ];

  // Reaction types breakdown for Recharts BarChart
  const reactionBreakdownData = [
    { name: language === 'bn' ? 'লাইক' : 'Like', count: reactionsMap.like || 0, fill: '#1877F2' },
    { name: language === 'bn' ? 'লাভ' : 'Love', count: reactionsMap.love || 0, fill: '#E0245E' },
    { name: language === 'bn' ? 'কেয়ার' : 'Care', count: reactionsMap.care || 0, fill: '#F59E0B' },
    { name: language === 'bn' ? 'হাহা' : 'Haha', count: reactionsMap.haha || 0, fill: '#EAB308' },
    { name: language === 'bn' ? 'ওয়াও' : 'Wow', count: reactionsMap.wow || 0, fill: '#8B5CF6' },
    { name: language === 'bn' ? 'কমেন্ট' : 'Comments', count: totalComments, fill: '#10B981' },
    { name: language === 'bn' ? 'শেয়ার' : 'Shares', count: totalShares, fill: '#06B6D4' },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-slate-100">
                {language === 'bn' ? 'পোস্ট ইনসাইটস ও অ্যানালিটিক্স' : 'Post Insights & Analytics'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'bn'
                  ? 'আপনার পোস্টের পাঠক ও ইন্টারঅ্যাকশন বিশ্লেষণ'
                  : 'Audience reach and interaction timeline for your post'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Scrollable Area */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Post Snippet Preview */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2.5">
            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="font-bold text-slate-900 dark:text-slate-100 mr-1.5">
                {language === 'bn' ? 'পোস্টের বিষয়:' : 'Post Content:'}
              </span>
              <span className="italic line-clamp-1">
                {post.content ? `"${post.content}"` : '(Media Post)'}
              </span>
              <span className="block text-[11px] text-slate-400 mt-0.5">
                {language === 'bn' ? 'প্রকাশিত:' : 'Published:'} {post.createdAt} • {post.privacy}
              </span>
            </div>
          </div>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 rounded-xl">
              <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 mb-1">
                <span className="text-xs font-semibold">
                  {language === 'bn' ? 'রিচ (Reach)' : 'Reach'}
                </span>
                <Users className="w-4 h-4" />
              </div>
              <p className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                {baseReach.toLocaleString()}
              </p>
              <p className="text-[10px] text-blue-600 dark:text-blue-400 font-medium mt-0.5">
                {language === 'bn' ? 'অনন্য অ্যাকাউন্ট' : 'Unique accounts'}
              </p>
            </div>

            <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 rounded-xl">
              <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400 mb-1">
                <span className="text-xs font-semibold">
                  {language === 'bn' ? 'ইম্প্রেশন' : 'Impressions'}
                </span>
                <Eye className="w-4 h-4" />
              </div>
              <p className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                {totalImpressions.toLocaleString()}
              </p>
              <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium mt-0.5">
                {language === 'bn' ? 'মোট ভিউ' : 'Total views'}
              </p>
            </div>

            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/60 rounded-xl">
              <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-1">
                <span className="text-xs font-semibold">
                  {language === 'bn' ? 'এনগেজমেন্ট' : 'Engagements'}
                </span>
                <TrendingUp className="w-4 h-4" />
              </div>
              <p className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                {totalEngagements}
              </p>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                {engagementRate}% {language === 'bn' ? 'এনগেজমেন্ট রেট' : 'rate'}
              </p>
            </div>

            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/60 rounded-xl">
              <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 mb-1">
                <span className="text-xs font-semibold">
                  {language === 'bn' ? 'শীর্ষ সময়' : 'Peak Hour'}
                </span>
                <Clock className="w-4 h-4" />
              </div>
              <p className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                6:00 PM
              </p>
              <p className="text-[10px] text-rose-600 dark:text-rose-400 font-medium mt-0.5">
                {language === 'bn' ? 'সর্বাধিক সক্রিয়তা' : 'Most active'}
              </p>
            </div>
          </div>

          {/* Recharts Area Chart: Peak Interaction Times */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>
                    {language === 'bn'
                      ? 'শীর্ষ ইন্টারঅ্যাকশন সময়সূচি (Peak Interaction Times)'
                      : 'Peak Interaction Times Throughout the Day'}
                  </span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {language === 'bn'
                    ? 'কোন সময়ে পাঠকরা আপনার পোস্টে সবচেয়ে বেশি লাইক, কমেন্ট ও রিঅ্যাক্ট করেছেন'
                    : 'Interaction distribution based on peak audience activity hours'}
                </p>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                {language === 'bn' ? '২৪ ঘণ্টার গ্রাফ' : '24h Timeline'}
              </span>
            </div>

            <div className="h-56 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={peakHoursData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="interactionGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis
                    dataKey={language === 'bn' ? 'bn' : 'hour'}
                    tick={{ fontSize: 11 }}
                    stroke="#94A3B8"
                  />
                  <YAxis tick={{ fontSize: 11 }} stroke="#94A3B8" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1E293B',
                      borderRadius: '8px',
                      border: 'none',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                    labelStyle={{ color: '#93C5FD', fontWeight: 'bold' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="interactions"
                    name={language === 'bn' ? 'ইন্টারঅ্যাকশন' : 'Interactions'}
                    stroke="#2563EB"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#interactionGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recharts Bar Chart: Reaction & Engagement Breakdown */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-rose-500" />
              <span>
                {language === 'bn'
                  ? 'রিঅ্যাকশন ও এনগেজমেন্ট বিভাজন'
                  : 'Reactions & Engagement Breakdown'}
              </span>
            </h4>
            <div className="h-44 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={reactionBreakdownData}
                  margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94A3B8" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#94A3B8" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1E293B',
                      borderRadius: '8px',
                      border: 'none',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Bar
                    dataKey="count"
                    name={language === 'bn' ? 'সংখ্যা' : 'Count'}
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex justify-end bg-slate-50/50 dark:bg-slate-800/30 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm cursor-pointer shadow-sm transition-colors"
          >
            {language === 'bn' ? 'বন্ধ করুন' : 'Close Insights'}
          </button>
        </div>
      </div>
    </div>
  );
};

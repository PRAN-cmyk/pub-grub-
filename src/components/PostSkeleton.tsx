import React from 'react';

interface PostSkeletonProps {
  hasImage?: boolean;
}

export const PostSkeleton: React.FC<PostSkeletonProps> = ({ hasImage = true }) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 mb-4 overflow-hidden animate-pulse">
      {/* Skeleton Header */}
      <div className="p-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar circle */}
          <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
          <div className="space-y-2">
            {/* Author name bar */}
            <div className="w-32 sm:w-44 h-3.5 bg-slate-200 dark:bg-slate-800 rounded" />
            {/* Timestamp bar */}
            <div className="w-20 h-2.5 bg-slate-100 dark:bg-slate-800/60 rounded" />
          </div>
        </div>
        {/* Menu dots */}
        <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800" />
      </div>

      {/* Skeleton Text Content */}
      <div className="px-4 py-2 space-y-2">
        <div className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="w-11/12 h-3 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="w-3/4 h-3 bg-slate-200 dark:bg-slate-800 rounded" />
      </div>

      {/* Skeleton Media/Image Box */}
      {hasImage && (
        <div className="mt-2 w-full h-60 sm:h-72 bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200 dark:from-slate-800 dark:via-slate-800/80 dark:to-slate-800 relative overflow-hidden">
          <div className="absolute inset-0 bg-slate-300/30 dark:bg-slate-700/30" />
        </div>
      )}

      {/* Skeleton Reaction Stats */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800" />
          <div className="w-12 h-2.5 bg-slate-200 dark:bg-slate-800 rounded" />
        </div>
        <div className="w-24 h-2.5 bg-slate-200 dark:bg-slate-800 rounded" />
      </div>

      {/* Divider */}
      <div className="h-px bg-slate-100 dark:bg-slate-800 mx-4" />

      {/* Skeleton Action Buttons */}
      <div className="px-3 py-2 flex items-center justify-between gap-2">
        <div className="flex-1 h-8 bg-slate-100 dark:bg-slate-800/70 rounded-xl" />
        <div className="flex-1 h-8 bg-slate-100 dark:bg-slate-800/70 rounded-xl" />
        <div className="flex-1 h-8 bg-slate-100 dark:bg-slate-800/70 rounded-xl" />
      </div>
    </div>
  );
};

export const FeedSkeleton: React.FC = () => {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading newsfeed posts">
      <PostSkeleton hasImage={true} />
      <PostSkeleton hasImage={false} />
      <PostSkeleton hasImage={true} />
    </div>
  );
};

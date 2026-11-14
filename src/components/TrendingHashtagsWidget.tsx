import React, { useMemo } from 'react';
import { Hash, TrendingUp, Sparkles, Flame } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const TrendingHashtagsWidget: React.FC = () => {
  const { posts, setSearchQuery, language } = useApp();

  const trendingTags = useMemo(() => {
    const counts: Record<string, number> = {};

    posts.forEach((post) => {
      if (!post.content) return;
      // Match #hashtag in English or Bengali script
      const matches = post.content.match(/#([a-zA-Z0-9_\u0980-\u09FF]+)/g);
      if (matches) {
        matches.forEach((tag) => {
          const clean = tag.trim();
          counts[clean] = (counts[clean] || 0) + 1;
        });
      }
    });

    const sorted = Object.entries(counts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);

    // If organic hashtags in feed are fewer than 4, provide default platform hashtags with real minimum counts
    if (sorted.length < 4) {
      const defaults = [
        { tag: '#Bandhan', count: 1 },
        { tag: '#Bangladesh', count: 1 },
        { tag: '#TechCommunity', count: 1 },
        { tag: '#DhakaVibes', count: 1 },
      ];
      defaults.forEach((def) => {
        if (!sorted.some((s) => s.tag.toLowerCase() === def.tag.toLowerCase())) {
          sorted.push(def);
        }
      });
    }

    return sorted.slice(0, 6);
  }, [posts]);

  const handleTagClick = (tag: string) => {
    setSearchQuery(tag);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white flex items-center justify-center shadow-xs">
            <Flame className="w-4 h-4 fill-white" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <span>{language === 'bn' ? 'ট্রেন্ডিং হ্যাশট্যাগ' : 'Trending Hashtags'}</span>
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              {language === 'bn' ? 'রিয়েল-টাইম আলোচনার বিষয়সমূহ' : 'Real-time trending topics'}
            </p>
          </div>
        </div>
        <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-900">
          <TrendingUp className="w-3 h-3" />
          <span>Live</span>
        </span>
      </div>

      <div className="space-y-1.5 pt-1">
        {trendingTags.map((item, index) => (
          <button
            key={item.tag}
            type="button"
            onClick={() => handleTagClick(item.tag)}
            className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[11px] font-black text-slate-400 group-hover:text-blue-600 w-4">
                #{index + 1}
              </span>
              <div className="min-w-0">
                <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate block">
                  {item.tag}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  {item.count} {language === 'bn' ? (item.count === 1 ? 'পোস্ট' : 'টি পোস্ট') : (item.count === 1 ? 'post' : 'posts')}
                </span>
              </div>
            </div>
            <Hash className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ))}
      </div>
    </div>
  );
};

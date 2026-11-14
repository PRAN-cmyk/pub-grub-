import React, { useEffect, useState } from 'react';
import { DollarSign, Minimize2, Maximize2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

/**
 * Single Top Floating Ad Bar (`AdBannerSlot`)
 * - Strictly isolated inside a 320x50 sandboxed `srcDoc` iframe so the ad scripts
 *   NEVER affect the rest of the page, never hijack clicks, and never break React DOM.
 * - Outer wrapper uses `pointer-events-none` so surrounding UI is 100% clickable.
 * - Can be minimized to a tiny floating pill anytime.
 */
export const AdBannerSlot: React.FC = () => {
  const { language } = useApp();
  const [isMinimized, setIsMinimized] = useState(false);
  const [impressions, setImpressions] = useState<number>(() => {
    const saved = localStorage.getItem('bandhan_ad_impressions');
    return saved ? parseInt(saved, 10) || 0 : 0;
  });

  useEffect(() => {
    setImpressions((prev) => {
      const next = prev + 1;
      try {
        localStorage.setItem('bandhan_ad_impressions', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  // Isolated iframe document containing the user's exact Adsterra / HighRevenueFormat banner code
  const isolatedAdHtml = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      html, body {
        margin: 0;
        padding: 0;
        width: 320px;
        height: 50px;
        background: transparent;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        font-family: system-ui, sans-serif;
      }
    </style>
  </head>
  <body>
    <div id="container-1f28db0d12d6778b50e59a4c9f25f2ab"></div>
    <script type="text/javascript">
      atOptions = {
        'key' : '4c4f35ccc56d35a42b0046d66e705387',
        'format' : 'iframe',
        'height' : 50,
        'width' : 320,
        'params' : {}
      };
    </script>
    <script type="text/javascript" src="https://www.highrevenueformat.com/4c4f35ccc56d35a42b0046d66e705387/invoke.js"></script>
    <script async="async" data-cfasync="false" src="https://pl31606730.profitableratecpmnetwork.com/1f28db0d12d6778b50e59a4c9f25f2ab/invoke.js"></script>
  </body>
</html>`;

  const estRevenue = (impressions * 0.0032).toFixed(2);

  return (
    <div className="sticky top-14 z-30 w-full pointer-events-none flex justify-center px-2 pt-1.5 pb-0.5">
      {isMinimized ? (
        <button
          type="button"
          onClick={() => setIsMinimized(false)}
          className="pointer-events-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-md text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:scale-105 transition-transform cursor-pointer"
          title={language === 'bn' ? 'বিজ্ঞাপন বারটি দেখুন' : 'Expand Floating Ad'}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>{language === 'bn' ? `বিজ্ঞাপন ($${estRevenue})` : `Ad ($${estRevenue})`}</span>
          <Maximize2 className="w-3 h-3 text-slate-400" />
        </button>
      ) : (
        <div className="pointer-events-auto max-w-[calc(100vw-1rem)] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-lg px-2.5 py-1.5 flex flex-col items-center">
          {/* Compact Top Bar of the Floating Ad */}
          <div className="w-full flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mb-1 px-0.5 gap-2">
            <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 truncate">
              <DollarSign className="w-3 h-3 shrink-0" />
              <span className="truncate">
                {language === 'bn'
                  ? `স্পন্সরড অ্যাড • আয়: $${estRevenue}`
                  : `Sponsored Ad • Est: $${estRevenue}`}
              </span>
            </span>

            <button
              type="button"
              onClick={() => setIsMinimized(true)}
              className="inline-flex items-center gap-0.5 text-[10px] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 px-1 rounded cursor-pointer shrink-0"
              title={language === 'bn' ? 'ছোট করুন' : 'Minimize Floating Ad'}
            >
              <span>{language === 'bn' ? 'ছোট করুন' : 'Hide'}</span>
              <Minimize2 className="w-2.5 h-2.5" />
            </button>
          </div>

          {/* Strict 320x50 Sandboxed Ad Container */}
          <div className="w-full max-w-[320px] h-[50px] rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-800/80 flex items-center justify-center">
            <iframe
              title="Top Floating Sponsored Ad"
              srcDoc={isolatedAdHtml}
              width={320}
              height={50}
              scrolling="no"
              frameBorder={0}
              sandbox="allow-scripts allow-same-origin allow-popups"
              className="w-full max-w-[320px] h-[50px] border-0 block"
            />
          </div>
        </div>
      )}
    </div>
  );
};

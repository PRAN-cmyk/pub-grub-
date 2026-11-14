import React, { useState } from 'react';
import { Plus, Trash2, Clock, BarChart2, X, Check } from 'lucide-react';
import { PollData, PollOption } from '../types';
import { useApp } from '../context/AppContext';

interface CreatePollProps {
  initialPoll?: PollData | null;
  onSave: (poll: PollData) => void;
  onCancel: () => void;
}

export const CreatePoll: React.FC<CreatePollProps> = ({ initialPoll, onSave, onCancel }) => {
  const { language, showToast } = useApp();

  const [question, setQuestion] = useState(initialPoll?.question || '');
  const [options, setOptions] = useState<string[]>(() => {
    if (initialPoll?.options && initialPoll.options.length >= 2) {
      return initialPoll.options.map((o) => o.text);
    }
    return ['', ''];
  });
  const [durationHours, setDurationHours] = useState<number>(24);

  const handleAddOption = () => {
    if (options.length >= 6) {
      showToast(
        language === 'bn'
          ? 'সর্বোচ্চ ৬টি অপশন যোগ করা যাবে'
          : 'Maximum 6 options allowed',
      );
      return;
    }
    setOptions([...options, '']);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) {
      showToast(
        language === 'bn'
          ? 'পোলে কমপক্ষে ২টি অপশন থাকতে হবে'
          : 'A poll must have at least 2 options',
      );
      return;
    }
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index: number, value: string) => {
    const next = [...options];
    next[index] = value;
    setOptions(next);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) {
      showToast(
        language === 'bn'
          ? 'পোলের প্রশ্ন খালি রাখা যাবে না'
          : 'Poll question cannot be empty',
      );
      return;
    }

    const cleanOptions = options.map((o) => o.trim()).filter(Boolean);
    if (cleanOptions.length < 2) {
      showToast(
        language === 'bn'
          ? 'কমপক্ষে ২টি সঠিক অপশন পূরণ করুন'
          : 'Please provide at least 2 valid options',
      );
      return;
    }

    const pollOptions: PollOption[] = cleanOptions.map((text, idx) => ({
      id: `opt_${Date.now()}_${idx}`,
      text,
      votes: [],
    }));

    const expiresAt =
      durationHours > 0
        ? new Date(Date.now() + durationHours * 60 * 60 * 1000).toISOString()
        : undefined;

    const pollData: PollData = {
      id: `poll_${Date.now()}`,
      question: question.trim(),
      options: pollOptions,
      expiresAt,
      isClosed: false,
    };

    onSave(pollData);
  };

  return (
    <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-md">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {language === 'bn' ? 'পোল বা মতামত জরিপ তৈরি করুন' : 'Create a Community Poll'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {language === 'bn'
                ? 'বন্ধুদের মতামত জানতে প্রশ্ন ও অপশন লিখুন'
                : 'Ask a question and let friends vote'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        {/* Question Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            {language === 'bn' ? 'পোলের প্রশ্ন *' : 'Poll Question *'}
          </label>
          <input
            type="text"
            required
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={
              language === 'bn'
                ? 'যেমন: এই সপ্তাহে কোন জায়গাটিতে ঘুরতে যাবেন?'
                : 'e.g. Which programming language do you love most?'
            }
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all"
            maxLength={180}
          />
        </div>

        {/* Options */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            {language === 'bn' ? 'বিকল্পসমূহ (Options) *' : 'Poll Options *'}
          </label>
          {options.map((opt, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="w-6 text-center text-xs font-bold text-slate-400 dark:text-slate-500">
                {index + 1}.
              </span>
              <input
                type="text"
                value={opt}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                placeholder={
                  language === 'bn' ? `অপশন ${index + 1} লিখুন` : `Option ${index + 1}`
                }
                className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                maxLength={80}
              />
              {options.length > 2 && (
                <button
                  type="button"
                  onClick={() => handleRemoveOption(index)}
                  className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                  title={language === 'bn' ? 'অপশন মুছুন' : 'Remove option'}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}

          {options.length < 6 && (
            <button
              type="button"
              onClick={handleAddOption}
              className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 px-3 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? '+ আরেকটি অপশন যোগ করুন' : '+ Add another option'}</span>
            </button>
          )}
        </div>

        {/* Poll Duration Selection */}
        <div className="pt-2 flex items-center justify-between border-t border-slate-200 dark:border-slate-700 text-xs">
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
            <Clock className="w-4 h-4 text-blue-500" />
            <span className="font-medium">
              {language === 'bn' ? 'পোলের মেয়াদ:' : 'Poll Duration:'}
            </span>
          </div>
          <select
            value={durationHours}
            onChange={(e) => setDurationHours(Number(e.target.value))}
            className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-medium cursor-pointer"
          >
            <option value={24}>{language === 'bn' ? '২৪ ঘণ্টা (1 Day)' : '24 Hours'}</option>
            <option value={72}>{language === 'bn' ? '৩ দিন' : '3 Days'}</option>
            <option value={168}>{language === 'bn' ? '৭ দিন (1 Week)' : '7 Days'}</option>
            <option value={0}>{language === 'bn' ? 'মেয়াদহীন (Permanent)' : 'No Limit'}</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer transition-colors"
          >
            {language === 'bn' ? 'বাতিল' : 'Cancel'}
          </button>
          <button
            type="submit"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg cursor-pointer transition-all active:scale-95"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'পোলে যুক্ত করুন' : 'Attach Poll'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

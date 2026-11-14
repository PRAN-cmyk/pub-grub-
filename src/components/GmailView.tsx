import React, { useState, useEffect, useCallback } from 'react';
import {
  Mail,
  Send,
  RefreshCw,
  Search,
  Trash2,
  Inbox,
  Star,
  Tag,
  AlertCircle,
  CheckCircle2,
  X,
  ExternalLink,
  Clock,
  User as UserIcon,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getAccessToken } from '../firebase';

export interface GmailMessageItem {
  id: string;
  threadId: string;
  snippet: string;
  from: string;
  to?: string;
  subject: string;
  date: string;
  isUnread?: boolean;
  isStarred?: boolean;
}

const SAMPLE_EMAILS: GmailMessageItem[] = [
  {
    id: 'sample_gmail_1',
    threadId: 'th_1',
    from: 'Google Workspace Team <workspace-noreply@google.com>',
    subject: 'Welcome to Google Workspace & Gmail Integration on Bandhan',
    snippet: 'Your Gmail, Drive, Contacts, Chat, and Meet APIs are now active and ready on Bandhan Social Network.',
    date: '10:30 AM',
    isUnread: true,
    isStarred: true,
  },
  {
    id: 'sample_gmail_2',
    threadId: 'th_2',
    from: 'Arafat Hossain <arafat.dev@gmail.com>',
    subject: 'Bandhan Project Updates & Feedback',
    snippet: 'Hey! The new live video broadcast, reels audio library, and post insights features are working amazingly!',
    date: 'Yesterday',
    isUnread: false,
    isStarred: false,
  },
  {
    id: 'sample_gmail_3',
    threadId: 'th_3',
    from: 'Nusrat Jahan <nusrat.photos@gmail.com>',
    subject: 'Photography workshop invitations for next weekend',
    snippet: 'Hi, I have uploaded the high-resolution landscape photo albums to Google Drive for our next group meet.',
    date: 'Oct 1',
    isUnread: false,
    isStarred: true,
  },
];

export const GmailView: React.FC = () => {
  const { driveAccessToken, firebaseUserEmail, language, showToast } = useApp();

  const [messages, setMessages] = useState<GmailMessageItem[]>(SAMPLE_EMAILS);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFolder, setActiveFolder] = useState<'inbox' | 'starred' | 'sent'>('inbox');

  // Reading email modal
  const [selectedMessage, setSelectedMessage] = useState<GmailMessageItem | null>(null);

  // Compose email modal
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Confirmation modals
  const [confirmSendOpen, setConfirmSendOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<GmailMessageItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchGmailMessages = useCallback(async () => {
    const token = (await getAccessToken()) || driveAccessToken;
    if (!token) return;

    setIsLoading(true);
    try {
      const q = searchQuery.trim() ? encodeURIComponent(searchQuery.trim()) : '';
      const listRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=20${q ? `&q=${q}` : ''}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!listRes.ok) {
        throw new Error(`Gmail API error: ${listRes.status}`);
      }

      const listData = await listRes.json();
      if (!listData.messages || !Array.isArray(listData.messages)) {
        setMessages([]);
        return;
      }

      // Fetch message details for top messages
      const details = await Promise.all(
        listData.messages.slice(0, 15).map(async (msg: { id: string; threadId: string }) => {
          try {
            const res = await fetch(
              `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date&metadataHeaders=To`,
              {
                headers: { Authorization: `Bearer ${token}` },
              },
            );
            if (!res.ok) return null;
            const data = await res.json();
            const headers = data.payload?.headers || [];
            const getHeader = (name: string) =>
              headers.find((h: { name: string; value: string }) => h.name.toLowerCase() === name.toLowerCase())
                ?.value || '';

            return {
              id: data.id,
              threadId: data.threadId,
              snippet: data.snippet || '',
              from: getHeader('From') || 'Unknown Sender',
              to: getHeader('To') || '',
              subject: getHeader('Subject') || '(No Subject)',
              date: getHeader('Date') ? new Date(getHeader('Date')).toLocaleDateString() : 'Recent',
              isUnread: data.labelIds?.includes('UNREAD') || false,
              isStarred: data.labelIds?.includes('STARRED') || false,
            } as GmailMessageItem;
          } catch {
            return null;
          }
        }),
      );

      const validDetails = details.filter((m): m is GmailMessageItem => m !== null);
      if (validDetails.length > 0) {
        setMessages(validDetails);
      }
    } catch (err) {
      console.error('Fetch Gmail messages error:', err);
      // Fallback to sample emails if API is not fully configured yet
    } finally {
      setIsLoading(false);
    }
  }, [driveAccessToken, searchQuery]);

  useEffect(() => {
    if (driveAccessToken) {
      fetchGmailMessages();
    }
  }, [driveAccessToken, fetchGmailMessages]);

  // Execute Sending Email (after explicit user confirmation)
  const handleConfirmSendEmail = async () => {
    setConfirmSendOpen(false);
    setIsSending(true);

    const token = (await getAccessToken()) || driveAccessToken;
    if (!token) {
      showToast(
        language === 'bn'
          ? '⚠️ গুগল অ্যাকাউন্ট সংযুক্ত করুন'
          : '⚠️ Please authenticate with Google first',
      );
      setIsSending(false);
      return;
    }

    try {
      // Build RFC 2822 email payload
      const rawEmail = [
        `To: ${composeTo.trim()}`,
        `Subject: ${composeSubject.trim() || 'No Subject'}`,
        'Content-Type: text/plain; charset=utf-8',
        'MIME-Version: 1.0',
        '',
        composeBody.trim(),
      ].join('\r\n');

      // Base64url encode
      const encodedEmail = btoa(unescape(encodeURIComponent(rawEmail)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const res = await fetch(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ raw: encodedEmail }),
        },
      );

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Send failed: ${res.status}`);
      }

      showToast(
        language === 'bn'
          ? `✉️ "${composeTo}" ঠিকানায় ইমেইল সফলভাবে পাঠানো হয়েছে!`
          : `✉️ Email successfully sent to "${composeTo}"!`,
      );

      // Add to sent messages
      const sentMsg: GmailMessageItem = {
        id: `sent_${Date.now()}`,
        threadId: `th_sent_${Date.now()}`,
        from: firebaseUserEmail || 'Me',
        to: composeTo,
        subject: composeSubject.trim() || '(No Subject)',
        snippet: composeBody.slice(0, 120),
        date: 'Just now',
        isUnread: false,
      };
      setMessages((prev) => [sentMsg, ...prev]);

      setIsComposeOpen(false);
      setComposeTo('');
      setComposeSubject('');
      setComposeBody('');
    } catch (err) {
      console.error('Send email error:', err);
      showToast(
        language === 'bn'
          ? '⚠️ ইমেইল পাঠানো সম্ভব হয়নি। গুগল অনুমতি চেক করুন।'
          : '⚠️ Failed to send email. Please check Google permissions.',
      );
    } finally {
      setIsSending(false);
    }
  };

  // Execute Deleting Email (after explicit user confirmation)
  const handleConfirmDeleteEmail = async () => {
    if (!messageToDelete) return;
    setIsDeleting(true);

    const token = (await getAccessToken()) || driveAccessToken;
    try {
      if (token) {
        await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageToDelete.id}`,
          {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          },
        );
      }

      setMessages((prev) => prev.filter((m) => m.id !== messageToDelete.id));
      showToast(
        language === 'bn'
          ? '🗑️ ইমেইলটি সফলভাবে মুছে ফেলা হয়েছে'
          : '🗑️ Email permanently deleted',
      );
      if (selectedMessage?.id === messageToDelete.id) {
        setSelectedMessage(null);
      }
    } catch (err) {
      console.error('Delete email error:', err);
      showToast(
        language === 'bn'
          ? '⚠️ ইমেইল মুছে ফেলা যায়নি'
          : '⚠️ Failed to delete email',
      );
    } finally {
      setIsDeleting(false);
      setMessageToDelete(null);
    }
  };

  const filteredMessages = messages.filter((m) => {
    if (activeFolder === 'starred') return m.isStarred;
    return true;
  });

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-4">
      {/* Gmail Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>{language === 'bn' ? 'গুগল জিমেইল ইনবক্স' : 'Google Gmail Inbox'}</span>
                <span className="px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 text-[10px] font-bold">
                  Gmail API
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {firebaseUserEmail ? (
                  <span>
                    {language === 'bn' ? 'সংযুক্ত ইমেইল:' : 'Connected:'}{' '}
                    <strong className="text-slate-800 dark:text-slate-200">{firebaseUserEmail}</strong>
                  </span>
                ) : (
                  language === 'bn'
                    ? 'আপনার গুগল অ্যাকাউন্ট দিয়ে ইমেইল পড়ুন ও নতুন ইমেইল পাঠান'
                    : 'Read, compose and send Gmail messages with real-time sync'
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchGmailMessages}
            disabled={isLoading}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer"
            title="Refresh Inbox"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-red-600' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => setIsComposeOpen(true)}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'নতুন ইমেইল লিখুন' : 'Compose Email'}</span>
          </button>
        </div>
      </div>

      {/* Search & Folder Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveFolder('inbox')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
              activeFolder === 'inbox'
                ? 'bg-red-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            <Inbox className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'ইনবক্স' : 'Inbox'}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 text-white">
              {messages.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFolder('starred')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
              activeFolder === 'starred'
                ? 'bg-amber-500 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            <Star className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'স্টারচিহ্নিত' : 'Starred'}</span>
          </button>
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') fetchGmailMessages();
            }}
            placeholder={language === 'bn' ? 'ইমেইল খুঁজুন...' : 'Search emails in Gmail...'}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus:border-red-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Messages List */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        {filteredMessages.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <Mail className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-xs font-bold">
              {language === 'bn' ? 'কোনো ইমেইল পাওয়া যায়নি' : 'No emails found'}
            </p>
          </div>
        ) : (
          filteredMessages.map((msg) => (
            <div
              key={msg.id}
              onClick={() => setSelectedMessage(msg)}
              className={`p-3 sm:p-3.5 flex items-start sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors ${
                msg.isUnread ? 'bg-red-50/30 dark:bg-red-950/20' : ''
              }`}
            >
              <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMessages((prev) =>
                      prev.map((m) => (m.id === msg.id ? { ...m, isStarred: !m.isStarred } : m)),
                    );
                  }}
                  className="p-1 text-slate-400 hover:text-amber-500 cursor-pointer shrink-0"
                >
                  <Star className={`w-4 h-4 ${msg.isStarred ? 'fill-amber-400 text-amber-400' : ''}`} />
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p
                      className={`text-xs truncate ${
                        msg.isUnread ? 'font-black text-slate-900 dark:text-slate-100' : 'font-medium text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {msg.from}
                    </p>
                    {msg.isUnread && (
                      <span className="w-2 h-2 rounded-full bg-red-600 shrink-0" />
                    )}
                  </div>
                  <p
                    className={`text-xs sm:text-sm truncate mt-0.5 ${
                      msg.isUnread ? 'font-bold text-slate-900 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {msg.subject}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    {msg.snippet}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] text-slate-400">{msg.date}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMessageToDelete(msg);
                  }}
                  className="p-1 text-slate-400 hover:text-red-500 cursor-pointer rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  title="Delete email"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Read Email Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 truncate pr-4">
                {selectedMessage.subject}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedMessage(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    From: {selectedMessage.from}
                  </p>
                  {selectedMessage.to && (
                    <p className="text-[11px] text-slate-500">To: {selectedMessage.to}</p>
                  )}
                </div>
                <span className="text-xs text-slate-400">{selectedMessage.date}</span>
              </div>

              <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                {selectedMessage.snippet}
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setMessageToDelete(selectedMessage)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{language === 'bn' ? 'ইমেইল মুছুন' : 'Delete Email'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setComposeTo(selectedMessage.from.match(/<([^>]+)>/)?.[1] || selectedMessage.from);
                  setComposeSubject(`Re: ${selectedMessage.subject}`);
                  setSelectedMessage(null);
                  setIsComposeOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{language === 'bn' ? 'উত্তর দিন' : 'Reply'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compose Email Modal */}
      {isComposeOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-red-600 text-white">
              <h3 className="font-extrabold text-base flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>{language === 'bn' ? 'নতুন জিমেইল বার্তা লিখুন' : 'New Gmail Message'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsComposeOpen(false)}
                className="p-1 rounded-full text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!composeTo.trim()) return;
                // Open confirmation dialog before actual transmission
                setConfirmSendOpen(true);
              }}
              className="p-5 space-y-3"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'bn' ? 'প্রাপকের ইমেইল *' : 'To (Recipient Email) *'}
                </label>
                <input
                  type="email"
                  required
                  value={composeTo}
                  onChange={(e) => setComposeTo(e.target.value)}
                  placeholder="recipient@example.com"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'bn' ? 'বিষয় (Subject)' : 'Subject'}
                </label>
                <input
                  type="text"
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  placeholder={language === 'bn' ? 'ইমেইলের বিষয়...' : 'Email subject...'}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'bn' ? 'বার্তার বিবরণ *' : 'Message Body *'}
                </label>
                <textarea
                  required
                  rows={6}
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value)}
                  placeholder={language === 'bn' ? 'আপনার বার্তা লিখুন...' : 'Write your email message...'}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-slate-100 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsComposeOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
                >
                  {language === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={!composeTo.trim() || !composeBody.trim()}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{language === 'bn' ? 'পাঠান' : 'Send Email'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mandatory User Confirmation Dialog Before Sending Email */}
      {confirmSendOpen && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950 flex items-center justify-center">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                  {language === 'bn' ? 'ইমেইল পাঠানোর নিশ্চিতকরণ' : 'Confirm Sending Email'}
                </h4>
                <p className="text-xs text-slate-500">Google Workspace Gmail API</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {language === 'bn'
                ? `আপনি কি নিশ্চিত যে "${composeTo}" ঠিকানায় "${composeSubject || 'No Subject'}" শিরোনামে এই ইমেইলটি পাঠাতে চান?`
                : `Are you sure you want to send this email to "${composeTo}" with subject "${composeSubject || 'No Subject'}"?`}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmSendOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
              >
                {language === 'bn' ? 'না, বাতিল' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmSendEmail}
                disabled={isSending}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md cursor-pointer disabled:opacity-50"
              >
                {isSending
                  ? language === 'bn'
                    ? 'পাঠানো হচ্ছে...'
                    : 'Sending...'
                  : language === 'bn'
                  ? 'হ্যাঁ, নিশ্চিত পাঠান'
                  : 'Yes, Send Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mandatory User Confirmation Dialog Before Deleting Email */}
      {messageToDelete && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                  {language === 'bn' ? 'ইমেইল মুছে ফেলার নিশ্চিতকরণ' : 'Confirm Deleting Email'}
                </h4>
                <p className="text-xs text-slate-500">Google Workspace Gmail API</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {language === 'bn'
                ? `আপনি কি নিশ্চিত যে "${messageToDelete.subject}" ইমেইলটি আপনার জিমেইল অ্যাকাউন্ট থেকে মুছে ফেলতে চান? এই কাজটি ফিরিয়ে আনা যাবে না।`
                : `Are you sure you want to delete the email "${messageToDelete.subject}"? This action cannot be undone.`}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMessageToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
              >
                {language === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteEmail}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md cursor-pointer disabled:opacity-50"
              >
                {isDeleting
                  ? language === 'bn'
                    ? 'মুছে ফেলা হচ্ছে...'
                    : 'Deleting...'
                  : language === 'bn'
                  ? 'হ্যাঁ, মুছে ফেলুন'
                  : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

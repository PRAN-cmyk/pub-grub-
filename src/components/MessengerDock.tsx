import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Minus,
  Phone,
  Video,
  Send,
  Smile,
  Image as ImageIcon,
  ThumbsUp,
  Users,
  Check,
  CheckCheck,
  Mic,
  Paperclip,
  Trash2,
} from 'lucide-react';
import { fileToDataUrl } from '../utils/storage';
import { useApp } from '../context/AppContext';
import {
  uploadVoiceNoteToStorage,
  setChatTypingStatusCloud,
  subscribeToChatTypingStatusCloud,
  markChatMessageSeenCloud,
} from '../firebase';

export const MessengerDock: React.FC = () => {
  const {
    activeChatIds,
    conversations,
    currentUser,
    closeChat,
    sendMessage,
    startCall,
    viewUserProfile,
    groups,
    groupChats,
    sendGroupChatMessage,
    activeGroupChatId,
    setActiveGroupChatId,
    isMyStatusOnline,
    language,
    t,
  } = useApp();

  const [minimizedIds, setMinimizedIds] = useState<string[]>([]);
  const [isGroupMinimized, setIsGroupMinimized] = useState(false);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [groupInput, setGroupInput] = useState('');
  const [recordingFriendId, setRecordingFriendId] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const messagesEndRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const groupMessagesEndRef = useRef<HTMLDivElement | null>(null);

  const startVoiceRecording = async (friendId: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      setRecordingFriendId(friendId);
      setRecordingDuration(0);

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.start();
      recordIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch {
      handleSend(friendId, '🎙️ [ভয়েস মেসেজ (0:12) • Voice Note]');
    }
  };

  const [typingMap, setTypingMap] = useState<Record<string, boolean>>({});
  const typingTimerRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Subscribe to real-time typing indicators in open chats
  useEffect(() => {
    const unsubs: (() => void)[] = [];
    activeChatIds.forEach((friendId) => {
      const chatId = [currentUser.id, friendId].sort().join('_');
      const unsub = subscribeToChatTypingStatusCloud(chatId, (users) => {
        const isPeerTyping = users.some((u) => u.userId === friendId);
        setTypingMap((prev) => ({ ...prev, [friendId]: isPeerTyping }));
      });
      unsubs.push(unsub);
    });

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [activeChatIds, currentUser.id]);

  const handleInputChange = (friendId: string, val: string) => {
    setInputs((prev) => ({ ...prev, [friendId]: val }));

    const chatId = [currentUser.id, friendId].sort().join('_');
    setChatTypingStatusCloud(chatId, true, currentUser.name).catch(() => {});

    if (typingTimerRef.current[friendId]) {
      clearTimeout(typingTimerRef.current[friendId]);
    }
    typingTimerRef.current[friendId] = setTimeout(() => {
      setChatTypingStatusCloud(chatId, false).catch(() => {});
    }, 2500);
  };

  const stopAndSendVoiceRecording = (friendId: string) => {
    if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
    const rec = mediaRecorderRef.current;
    const dur = recordingDuration || 1;
    if (rec && rec.state !== 'inactive') {
      rec.onstop = async () => {
        try {
          const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const chatId = [currentUser.id, friendId].sort().join('_');
          const audioUrl = await uploadVoiceNoteToStorage(blob, chatId);
          const durStr = `${Math.floor(dur / 60)}:${(dur % 60).toString().padStart(2, '0')}`;
          sendMessage(friendId, `🎙️ Voice Note (${durStr})`, { audioUrl, audioDuration: dur });
        } catch (err) {
          console.warn('Voice send error fallback:', err);
          sendMessage(friendId, `🎙️ [ভয়েস মেসেজ • Voice Note]`);
        } finally {
          rec.stream.getTracks().forEach((track) => track.stop());
        }
      };
      rec.stop();
    }
    setRecordingFriendId(null);
    setRecordingDuration(0);
  };

  const cancelVoiceRecording = () => {
    if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
    const rec = mediaRecorderRef.current;
    if (rec && rec.state !== 'inactive') {
      rec.stream.getTracks().forEach((track) => track.stop());
      rec.stop();
    }
    setRecordingFriendId(null);
    setRecordingDuration(0);
  };

  const activeGroup = activeGroupChatId
    ? groups.find((g) => g.id === activeGroupChatId) || null
    : null;
  const activeGroupMessages = activeGroupChatId
    ? groupChats[activeGroupChatId] || []
    : [];

  useEffect(() => {
    activeChatIds.forEach((id) => {
      messagesEndRefs.current[id]?.scrollIntoView({ behavior: 'smooth' });
    });
  }, [conversations, activeChatIds]);

  useEffect(() => {
    if (activeGroupChatId) {
      groupMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeGroupChatId, activeGroupMessages.length]);

  if (activeChatIds.length === 0 && !activeGroup) return null;

  const toggleMinimize = (id: string) => {
    setMinimizedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleSend = (friendId: string, customText?: string) => {
    const textToSend = customText ?? inputs[friendId] ?? '';
    if (!textToSend.trim()) return;
    sendMessage(friendId, textToSend);
    if (!customText) {
      setInputs((prev) => ({ ...prev, [friendId]: '' }));
    }
  };

  const handleSendGroupMsg = (customText?: string) => {
    if (!activeGroupChatId) return;
    const textToSend = customText ?? groupInput;
    if (!textToSend.trim()) return;
    sendGroupChatMessage(activeGroupChatId, textToSend.trim());
    if (!customText) {
      setGroupInput('');
    }
  };

  // Limit visible windows so they never overflow the display width
  const visibleChatIds = activeGroup ? activeChatIds.slice(-1) : activeChatIds.slice(-2);

  return (
    <div className="fixed bottom-0 right-2 sm:right-4 z-40 flex items-end justify-end gap-2 sm:gap-3 max-w-[calc(100vw-1rem)] pointer-events-none">
      {/* ACTIVE GROUP CHAT WINDOW */}
      {activeGroup && (
        <div
          className={`pointer-events-auto w-[calc(100vw-1rem)] max-w-[330px] sm:w-80 bg-white dark:bg-slate-900 rounded-t-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden transition-all duration-200 ${
            isGroupMinimized ? 'h-12' : 'h-[min(410px,calc(100vh-5.5rem))] sm:h-[420px]'
          }`}
        >
          {/* Group Chat Header */}
          <div
            onClick={() => setIsGroupMinimized((p) => !p)}
            className="px-3 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white flex items-center justify-between cursor-pointer select-none shrink-0"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="relative shrink-0">
                <img
                  src={activeGroup.coverImage}
                  alt={activeGroup.name}
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-full object-cover border border-white/40"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-indigo-600 rounded-full" />
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-xs text-white truncate">
                  {language === 'bn' ? activeGroup.nameBn || activeGroup.name : activeGroup.name}
                </h4>
                <p className="text-[10px] text-indigo-100 flex items-center gap-1">
                  <Users className="w-2.5 h-2.5" />
                  <span>
                    {language === 'bn'
                      ? `গ্রুপ চ্যাট • ${activeGroup.membersCount} সদস্য অনলাইন`
                      : `Group Chat • ${activeGroup.membersCount} members`}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => setIsGroupMinimized((p) => !p)}
                className="p-1.5 rounded-full hover:bg-white/15 text-white cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setActiveGroupChatId(null)}
                className="p-1.5 rounded-full hover:bg-white/15 text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {!isGroupMinimized && (
            <>
              <div className="flex-1 p-3 overflow-y-auto space-y-2.5 bg-slate-50/60 dark:bg-slate-950/60">
                {activeGroupMessages.map((msg) => {
                  const isMe = msg.senderId === currentUser.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isMe && (
                        <img
                          src={msg.senderAvatar}
                          alt={msg.senderName}
                          referrerPolicy="no-referrer"
                          className="w-6 h-6 rounded-full object-cover shrink-0"
                        />
                      )}
                      <div
                        className={`max-w-[78%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                          isMe
                            ? 'bg-indigo-600 text-white rounded-br-xs shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200/70 dark:border-slate-700 rounded-bl-xs'
                        }`}
                      >
                        {!isMe && (
                          <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mb-0.5">
                            {msg.senderName}
                          </p>
                        )}
                        <p className="break-words">{msg.text}</p>
                        <span
                          className={`block text-[9px] mt-0.5 text-right ${
                            isMe ? 'text-indigo-200' : 'text-slate-400'
                          }`}
                        >
                          {msg.timestamp}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div ref={groupMessagesEndRef} />
              </div>

              {/* Group Chat Quick Input */}
              <div className="p-2 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendGroupMsg();
                  }}
                  className="flex items-center gap-1.5"
                >
                  <input
                    type="text"
                    value={groupInput}
                    onChange={(e) => setGroupInput(e.target.value)}
                    placeholder={
                      language === 'bn' ? 'গ্রুপে বার্তা লিখুন...' : 'Message group...'
                    }
                    className="flex-1 py-1.5 px-3 bg-slate-100 dark:bg-slate-800 text-xs rounded-full focus:outline-none text-slate-900 dark:text-slate-100"
                  />
                  {groupInput.trim() ? (
                    <button
                      type="submit"
                      className="p-1.5 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSendGroupMsg('👋 সবাই কেমন আছেন?')}
                      className="p-1.5 rounded-full text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 cursor-pointer"
                      title="Wave to Group"
                    >
                      <ThumbsUp className="w-4 h-4" />
                    </button>
                  )}
                </form>
              </div>
            </>
          )}
        </div>
      )}

      {/* 1-ON-1 CHAT WINDOWS */}
      {visibleChatIds.map((friendId, idx) => {
        const conv = conversations[friendId];
        if (!conv) return null;

        const isMinimized = minimizedIds.includes(friendId);
        const friendName =
          language === 'bn' ? conv.friend.nameBn || conv.friend.name : conv.friend.name;
        const isFriendOnline = conv.friend.isOnline !== false && conv.isOnline !== false;

        return (
          <div
            key={friendId}
            className={`pointer-events-auto w-[calc(100vw-1rem)] max-w-[330px] sm:w-80 bg-white dark:bg-slate-900 rounded-t-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden transition-all duration-200 ${
              idx > 0 ? 'hidden md:flex' : 'flex'
            } ${
              isMinimized ? 'h-12' : 'h-[min(410px,calc(100vh-5.5rem))] sm:h-[420px]'
            }`}
          >
            {/* Chat Header */}
            <div
              onClick={() => toggleMinimize(friendId)}
              className="px-3 py-2 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors select-none shrink-0"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    viewUserProfile(conv.friend);
                  }}
                  className="relative shrink-0 cursor-pointer"
                >
                  <img
                    src={conv.friend.avatar}
                    alt={friendName}
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-full object-cover hover:opacity-90 transition-opacity"
                  />
                  <span
                    className={`absolute bottom-0 right-0 w-2.5 h-2.5 border-2 border-white dark:border-slate-900 rounded-full ${
                      isFriendOnline ? 'bg-emerald-500' : 'bg-slate-400'
                    }`}
                  />
                </div>
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    viewUserProfile(conv.friend);
                  }}
                  className="min-w-0 cursor-pointer"
                >
                  <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    {friendName}
                  </h4>
                  <p
                    className={`text-[10px] font-medium ${
                      isFriendOnline && isMyStatusOnline
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-400'
                    }`}
                  >
                    {isFriendOnline
                      ? language === 'bn'
                        ? '● সক্রিয় আছেন (Online)'
                        : '● Active now'
                      : language === 'bn'
                      ? 'অফলাইন'
                      : 'Offline'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => startCall(conv.friend, 'audio')}
                  className="p-1.5 rounded-full text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title={language === 'bn' ? 'অডিও কল করুন' : 'Start Audio Call'}
                >
                  <Phone className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => startCall(conv.friend, 'video')}
                  className="p-1.5 rounded-full text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title={language === 'bn' ? 'ভিডিও কল করুন' : 'Start Video Call'}
                >
                  <Video className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => toggleMinimize(friendId)}
                  className="p-1.5 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => closeChat(friendId)}
                  className="p-1.5 rounded-full text-slate-500 hover:bg-red-50 hover:text-red-500 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Chat Body & Footer */}
            {!isMinimized && (
              <>
                <div className="flex-1 p-3 overflow-y-auto space-y-2.5 bg-slate-50/50 dark:bg-slate-950/50">
                  <div className="text-center py-2">
                    <img
                      src={conv.friend.avatar}
                      alt={friendName}
                      referrerPolicy="no-referrer"
                      className="w-11 h-11 rounded-full mx-auto mb-1 object-cover shadow-sm"
                    />
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {friendName}
                    </p>
                    <p className="text-[10px] text-slate-400">{conv.friend.role}</p>
                  </div>

                  {conv.messages.map((msg, idx) => {
                    const isMe = msg.senderId === currentUser.id;
                    const isLastMe =
                      isMe &&
                      (idx === conv.messages.length - 1 ||
                        !conv.messages.slice(idx + 1).some((m) => m.senderId === currentUser.id));

                    return (
                      <div key={msg.id} className="space-y-1">
                        <div
                          className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
                        >
                          {!isMe && (
                            <img
                              src={conv.friend.avatar}
                              alt={friendName}
                              referrerPolicy="no-referrer"
                              className="w-6 h-6 rounded-full object-cover shrink-0"
                            />
                          )}
                          <div
                            className={`max-w-[78%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                              isMe
                                ? 'bg-blue-600 text-white rounded-br-xs shadow-xs'
                                : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200/70 dark:border-slate-700 rounded-bl-xs'
                            }`}
                          >
                            {msg.audioUrl ? (
                              <div className="my-1.5 space-y-1">
                                <audio controls src={msg.audioUrl} className="w-52 h-8 max-w-full rounded-lg" />
                                <span className={`block text-[10px] font-semibold ${isMe ? 'text-blue-100' : 'text-slate-600 dark:text-slate-300'}`}>
                                  🎙️ Voice Note
                                </span>
                              </div>
                            ) : (
                              <p className="break-words">{msg.text}</p>
                            )}
                            <div className="flex items-center justify-between gap-1.5 mt-0.5">
                              <span
                                className={`block text-[9px] ${
                                  isMe ? 'text-blue-200' : 'text-slate-400'
                                }`}
                              >
                                {msg.timestamp}
                              </span>
                              {isMe && (
                                <span
                                  className="inline-flex items-center"
                                  title={msg.isRead !== false ? 'Seen' : 'Delivered'}
                                >
                                  {msg.isRead !== false ? (
                                    <CheckCheck className="w-3 h-3 text-blue-200 stroke-[2.5]" />
                                  ) : (
                                    <Check className="w-3 h-3 text-blue-200/75 stroke-[2]" />
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Seen Read Receipt Indicator underneath last outgoing message */}
                        {isLastMe && (
                          <div className="flex items-center justify-end gap-1 pr-1 text-[10px] select-none animate-in fade-in duration-200">
                            {msg.isRead !== false ? (
                              <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-semibold">
                                <span className="text-[10px] text-blue-600 dark:text-blue-400">
                                  {language === 'bn' ? 'দেখা হয়েছে (Seen)' : 'Seen'}
                                </span>
                                <img
                                  src={conv.friend.avatar}
                                  alt={conv.friend.name}
                                  className="w-3.5 h-3.5 rounded-full object-cover ring-1 ring-blue-500/60"
                                  title={`${friendName} ${language === 'bn' ? 'মেসেজটি দেখেছেন' : 'seen this message'}`}
                                />
                              </div>
                            ) : (
                              <span className="text-slate-400 flex items-center gap-0.5 text-[10px]">
                                <Check className="w-2.5 h-2.5 text-slate-400" />
                                <span>{language === 'bn' ? 'পৌঁছেছে' : 'Delivered'}</span>
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Live Typing Status Indicator */}
                  {typingMap[friendId] && (
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 py-1 px-1 animate-in fade-in duration-150">
                      <img
                        src={conv.friend.avatar}
                        alt={friendName}
                        className="w-5 h-5 rounded-full object-cover"
                      />
                      <div className="flex items-center gap-1.5 bg-slate-200 dark:bg-slate-800 px-3 py-1.5 rounded-2xl rounded-bl-xs">
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                          {language === 'bn' ? `${friendName} লিখছেন...` : `${friendName} is typing...`}
                        </span>
                        <span className="flex gap-0.5 ml-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </span>
                      </div>
                    </div>
                  )}

                  <div
                    ref={(el) => {
                      messagesEndRefs.current[friendId] = el;
                    }}
                  />
                </div>

                {/* Quick Emoji & Message Input */}
                <div className="p-2 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
                  <div className="flex items-center gap-1 pb-1.5 px-1 overflow-x-auto no-scrollbar">
                    {['👋 হাই!', '❤️', '🔥 দারুণ!', '😊 কেমন আছেন?', '👍'].map((quick) => (
                      <button
                        key={quick}
                        type="button"
                        onClick={() => handleSend(friendId, quick)}
                        className="shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
                      >
                        {quick}
                      </button>
                    ))}
                  </div>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSend(friendId);
                    }}
                    className="flex items-center gap-1.5"
                  >
                    <label
                      className="p-1.5 rounded-full text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 cursor-pointer shrink-0"
                      title={language === 'bn' ? 'ছবি বা ফাইল পাঠান' : 'Send Photo or File'}
                    >
                      <Paperclip className="w-4 h-4" />
                      <input
                        type="file"
                        accept="image/*,video/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            const url = await fileToDataUrl(file);
                            handleSend(friendId, `🖼️ ${file.name}`);
                          } catch {
                            // ignore
                          }
                          e.target.value = '';
                        }}
                      />
                    </label>

                    {/* Voice Note Recording Controls */}
                    {recordingFriendId === friendId ? (
                      <div className="flex-1 flex items-center justify-between bg-rose-50 dark:bg-rose-950/40 px-3 py-1.5 rounded-full border border-rose-300 dark:border-rose-800 animate-pulse">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                          <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
                            {language === 'bn' ? 'রেকর্ডিং হচ্ছে' : 'Recording'} {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={cancelVoiceRecording}
                            className="p-1 rounded-full text-slate-500 hover:text-rose-500 hover:bg-white/60 dark:hover:bg-slate-800 cursor-pointer"
                            title="Cancel"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => stopAndSendVoiceRecording(friendId)}
                            className="p-1.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white cursor-pointer shadow-xs"
                            title="Send Voice Note"
                          >
                            <Send className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => startVoiceRecording(friendId)}
                          className="p-1.5 rounded-full text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer shrink-0"
                          title={language === 'bn' ? 'ভয়েস নোট রেকর্ড করুন' : 'Record Voice Note'}
                        >
                          <Mic className="w-4 h-4" />
                        </button>
                        <div className="flex-1 relative">
                          <input
                            type="text"
                            value={inputs[friendId] || ''}
                            onChange={(e) => handleInputChange(friendId, e.target.value)}
                            placeholder={t.typeMessage}
                            className="w-full py-1.5 pl-3 pr-7 bg-slate-100 dark:bg-slate-800 text-xs rounded-full focus:outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setInputs((prev) => ({
                                ...prev,
                                [friendId]: (prev[friendId] || '') + '😊',
                              }))
                            }
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-500 cursor-pointer"
                          >
                            <Smile className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}

                    {(inputs[friendId] || '').trim() ? (
                      <button
                        type="submit"
                        className="p-1.5 rounded-full bg-blue-600 text-white hover:bg-blue-700 cursor-pointer shrink-0"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSend(friendId, '👍')}
                        className="p-1.5 rounded-full text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 cursor-pointer shrink-0"
                        title="Send Thumbs Up"
                      >
                        <ThumbsUp className="w-4 h-4" />
                      </button>
                    )}
                  </form>
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
};

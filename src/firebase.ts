import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  setDoc,
  deleteDoc,
  collection,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  orderBy,
  limit,
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, uploadBytesResumable, uploadString, getDownloadURL } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

// 1. Initialize Firebase App, Firestore, Auth & Storage
const app = initializeApp(firebaseConfig);
const databaseId = (firebaseConfig as { firestoreDatabaseId?: string }).firestoreDatabaseId;
export const db = databaseId ? getFirestore(app, databaseId) : getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// 2. Google Workspace OAuth Scopes (Keep, Drive, Contacts, Gmail, Tasks)
export const SCOPES = [
  'https://www.googleapis.com/auth/tasks',
  'https://www.googleapis.com/auth/tasks.readonly',
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/contacts',
  'https://www.googleapis.com/auth/contacts.readonly',
  'https://www.googleapis.com/auth/gmail.readonly',
];

// Clean Google sign-in provider without sensitive workspace scopes for instant login
export const baseGoogleProvider = new GoogleAuthProvider();
baseGoogleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Dedicated provider with workspace scopes when explicitly connecting Google Workspace / Keep
export const workspaceGoogleProvider = new GoogleAuthProvider();
SCOPES.forEach((scope) => {
  workspaceGoogleProvider.addScope(scope);
});
workspaceGoogleProvider.setCustomParameters({
  prompt: 'select_account',
});

// 3. Validate Connection to Firestore silently on boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch {
    // Offline or unauthenticated initial probe is expected prior to user login
  }
}
testConnection();

// 4. Standardized Firestore Error Handler
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    uid: string | null;
    email: string | null;
    isAnonymous: boolean;
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
): never {
  const err = error as { code?: string; message?: string };
  const info: FirestoreErrorInfo = {
    error: err.message || String(error),
    operationType,
    path,
    authInfo: {
      uid: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      isAnonymous: auth.currentUser?.isAnonymous || false,
    },
  };
  console.warn(`Firestore Permission Notice: ${operationType} on ${path}:`, info.error);
  throw new Error(JSON.stringify(info));
}

// 5. Authentication & Token Management
let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: FirebaseUser, token: string | null) => void,
  onAuthFailure?: () => void,
) => {
  // Check for any pending redirect result from mobile browser sign-ins
  getRedirectResult(auth)
    .then(async (result) => {
      if (result?.user) {
        const credential = GoogleAuthProvider.credentialFromResult(result);
        cachedAccessToken = credential?.accessToken || null;
        await syncFirebaseUserProfile(result.user);
        if (onAuthSuccess) onAuthSuccess(result.user, cachedAccessToken);
      }
    })
    .catch((err) => {
      console.warn('Redirect auth result warning:', err);
    });

  return onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
    if (user) {
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const getFirebaseIdToken = async (): Promise<string | null> => {
  if (!auth.currentUser) return null;
  try {
    return await auth.currentUser.getIdToken();
  } catch (error) {
    console.error('Failed to get Firebase ID token:', error);
    return null;
  }
};

export const syncFirebaseUserProfile = async (user: FirebaseUser, customNameBn?: string) => {
  const safeUid = user.uid.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
  const publicPath = `users/${safeUid}`;
  const privatePath = `users/${safeUid}/private/info`;

  const cleanName = (user.displayName || 'Bandhan Member').slice(0, 120);
  const cleanUsername = (
    user.email?.split('@')[0]?.replace(/[^a-zA-Z0-9_.-]/g, '_') || `user_${safeUid.slice(0, 8)}`
  ).slice(0, 80);
  const cleanAvatar = (
    user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=0284c7&color=fff`
  ).slice(0, 2048);

  try {
    await setDoc(
      doc(db, 'users', safeUid),
      {
        uid: safeUid,
        name: cleanName,
        nameBn: customNameBn || cleanName,
        username: cleanUsername,
        avatar: cleanAvatar,
        bio: 'Bandhan Member • Connected with Firebase Cloud',
        city: 'Dhaka, Bangladesh',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, publicPath);
  }

  if (user.email) {
    try {
      await setDoc(
        doc(db, 'users', safeUid, 'private', 'info'),
        {
          uid: safeUid,
          email: user.email.slice(0, 254),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, privatePath);
    }
  }
};

export const googleSignIn = async (
  useWorkspaceScopes = false,
): Promise<{
  user: FirebaseUser;
  accessToken: string;
} | null> => {
  const chosenProvider = useWorkspaceScopes ? workspaceGoogleProvider : baseGoogleProvider;
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, chosenProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    cachedAccessToken = credential?.accessToken || null;

    await syncFirebaseUserProfile(result.user);

    return { user: result.user, accessToken: cachedAccessToken || '' };
  } catch (error: any) {
    console.error('Google Sign in popup error:', error);
    // If popup blocked or cancelled on mobile, attempt graceful redirect fallback
    if (
      error?.code === 'auth/popup-blocked' ||
      error?.code === 'auth/cancelled-popup-request'
    ) {
      try {
        await signInWithRedirect(auth, chosenProvider);
        return null; // The redirect will complete and be picked up by initAuth
      } catch (redirectErr) {
        console.error('Redirect sign in error:', redirectErr);
        throw redirectErr;
      }
    }
    let friendlyMessage = 'Google login failed. Please select your Google account.';
    if (error?.code === 'auth/popup-closed-by-user') {
      friendlyMessage = 'Sign-in window closed. Please click continue with Google again.';
    } else if (error?.code === 'auth/network-request-failed') {
      friendlyMessage = 'Network error. Please check your internet connection.';
    } else if (error?.code === 'auth/account-exists-with-different-credential') {
      friendlyMessage = 'An account already exists with this email with a different login provider.';
    }
    const err = new Error(friendlyMessage);
    (err as any).code = error?.code;
    throw err;
  } finally {
    isSigningIn = false;
  }
};

export const firebaseRegisterWithEmailPassword = async (
  email: string,
  pass: string,
  displayName: string,
  nameBn?: string,
): Promise<FirebaseUser> => {
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
  if (displayName.trim()) {
    await updateProfile(cred.user, { displayName: displayName.trim() });
  }
  await syncFirebaseUserProfile(cred.user, nameBn);
  return cred.user;
};

export const firebaseLoginWithEmailPassword = async (
  email: string,
  pass: string,
): Promise<FirebaseUser> => {
  const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
  await syncFirebaseUserProfile(cred.user);
  return cred.user;
};

export const firebaseSendPasswordResetEmail = async (email: string): Promise<void> => {
  await sendPasswordResetEmail(auth, email.trim());
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const firebaseLogout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

// 6. Cloud Posts & Backend API Synchronization
export interface FirestoreCloudPostRecord {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  privacy: 'public' | 'friends' | 'only_me';
  mediaUrl?: string;
  mediaType?: string;
  driveFileId?: string;
  driveFileName?: string;
  driveWebViewLink?: string;
  musicTitle?: string;
  audioUrl?: string;
  createdAt?: any;
}

export const isCloudPlayableUrl = (url?: string | null): url is string => {
  if (!url) return false;
  return /^(https?:\/\/|data:)/i.test(url) && !url.startsWith('data:video/')
    ? true
    : url.startsWith('data:video/')
    ? url.length < 700_000
    : /^(https?:\/\/)/i.test(url);
};

export const uploadMediaToFirebaseStorage = async (
  file: File | Blob,
  onProgress?: (percent: number) => void,
): Promise<string> => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Firebase authentication required for Storage upload');
  }
  const safeUid = user.uid.replace(/[^a-zA-Z0-9_-]/g, '_');
  const rawName = (file as File).name || `media_${Date.now()}.mp4`;
  const cleanName = rawName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-64);
  const storageRef = ref(storage, `users/${safeUid}/${Date.now()}_${cleanName}`);

  return await new Promise<string>((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file, {
      contentType: file.type || 'application/octet-stream',
    });

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        if (onProgress && snapshot.totalBytes > 0) {
          const pct = Math.min(99, Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100));
          onProgress(pct);
        }
      },
      (err) => reject(err),
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          if (onProgress) onProgress(100);
          resolve(downloadUrl);
        } catch (err) {
          reject(err);
        }
      },
    );
  });
};

export const savePostToFirestoreCloud = async (params: {
  postId: string;
  content: string;
  privacy: 'public' | 'friends' | 'only_me';
  driveFileId?: string;
  driveFileName?: string;
  driveWebViewLink?: string;
  mediaUrl?: string;
  mediaType?: string;
  musicTitle?: string;
  audioUrl?: string;
  poll?: any;
}) => {
  const user = auth.currentUser;
  if (!user) return;

  const safePostId = params.postId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
  const path = `cloudPosts/${safePostId}`;

  const payload: Record<string, unknown> = {
    authorId: user.uid,
    authorName: (user.displayName || 'Bandhan User').slice(0, 120),
    authorAvatar: (
      user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}`
    ).slice(0, 2048),
    content: (params.content.trim() || 'Shared a post').slice(0, 5000),
    privacy: params.privacy,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (isCloudPlayableUrl(params.mediaUrl)) payload.mediaUrl = params.mediaUrl;
  if (params.mediaType && isCloudPlayableUrl(params.mediaUrl)) payload.mediaType = params.mediaType;
  if (params.musicTitle) payload.musicTitle = params.musicTitle.slice(0, 120);
  if (isCloudPlayableUrl(params.audioUrl)) payload.audioUrl = params.audioUrl;
  if (params.driveFileId) payload.driveFileId = params.driveFileId.slice(0, 128);
  if (params.driveFileName) payload.driveFileName = params.driveFileName.slice(0, 256);
  if (params.driveWebViewLink) payload.driveWebViewLink = params.driveWebViewLink.slice(0, 2048);

  try {
    await setDoc(doc(db, 'cloudPosts', safePostId), payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};

export const deletePostFromFirestoreCloud = async (postId: string) => {
  const user = auth.currentUser;
  if (!user) return;

  const safePostId = postId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
  const path = `cloudPosts/${safePostId}`;
  try {
    await deleteDoc(doc(db, 'cloudPosts', safePostId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

export const subscribeToPublicCloudPosts = (
  onUpdate: (records: FirestoreCloudPostRecord[]) => void,
) => {
  if (!auth.currentUser) return () => {};
  const path = 'cloudPosts';
  const q = query(collection(db, 'cloudPosts'), where('privacy', '==', 'public'));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: FirestoreCloudPostRecord[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          authorId: String(data.authorId || ''),
          authorName: String(data.authorName || 'Bandhan User'),
          authorAvatar: String(data.authorAvatar || ''),
          content: String(data.content || ''),
          privacy: (data.privacy as 'public' | 'friends' | 'only_me') || 'public',
          mediaUrl: data.mediaUrl ? String(data.mediaUrl) : undefined,
          mediaType: data.mediaType ? String(data.mediaType) : undefined,
          driveFileId: data.driveFileId ? String(data.driveFileId) : undefined,
          driveFileName: data.driveFileName ? String(data.driveFileName) : undefined,
          driveWebViewLink: data.driveWebViewLink ? String(data.driveWebViewLink) : undefined,
          musicTitle: data.musicTitle ? String(data.musicTitle) : undefined,
          audioUrl: data.audioUrl ? String(data.audioUrl) : undefined,
        };
      });
      onUpdate(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    },
  );
};

// 7. 24-Hour Stories & Storage Management
export const saveStoryToFirestoreCloud = async (story: {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  mediaUrl?: string;
  mediaType?: string;
  text?: string;
  gradientBg?: string;
  audioUrl?: string;
  audioTitle?: string;
  audioArtist?: string;
}) => {
  const user = auth.currentUser;
  if (!user) return;
  const safeId = story.id.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
  const expiresAtMs = Date.now() + 24 * 60 * 60 * 1000;
  const safeMediaUrl = isCloudPlayableUrl(story.mediaUrl) ? story.mediaUrl : undefined;
  const safeAudioUrl = isCloudPlayableUrl(story.audioUrl) ? story.audioUrl : undefined;
  if (!safeMediaUrl && story.mediaType !== 'text' && !story.gradientBg) return;

  await setDoc(doc(db, 'cloudStories', safeId), {
    ...story,
    mediaUrl: safeMediaUrl || null,
    audioUrl: safeAudioUrl || null,
    id: safeId,
    authorId: user.uid,
    createdAt: serverTimestamp(),
    expiresAt: expiresAtMs,
  });
};

export const subscribeToCloudStories = (onUpdate: (stories: any[]) => void) => {
  const q = query(collection(db, 'cloudStories'));
  return onSnapshot(q, (snapshot) => {
    const now = Date.now();
    const activeStories = snapshot.docs
      .map((d) => d.data())
      .filter((s) => !s.expiresAt || s.expiresAt > now);
    onUpdate(activeStories);
  });
};

// 8. Realtime WebRTC Call Signaling via Firestore
export const createCallSessionCloud = async (
  callId: string,
  offer: RTCSessionDescriptionInit,
  caller: any = null,
  callee: any = null,
) => {
  const safeCallId = callId.replace(/[^a-zA-Z0-9_-]/g, '_');
  await setDoc(doc(db, 'cloudCalls', safeCallId), {
    callId: safeCallId,
    caller: caller || auth.currentUser?.uid || 'user',
    callee: callee || 'peer',
    offer: { type: offer.type, sdp: offer.sdp },
    status: 'calling',
    createdAt: Date.now(),
  });
};

export const answerCallSessionCloud = async (callId: string, answer: RTCSessionDescriptionInit) => {
  const safeCallId = callId.replace(/[^a-zA-Z0-9_-]/g, '_');
  await setDoc(
    doc(db, 'cloudCalls', safeCallId),
    {
      answer: { type: answer.type, sdp: answer.sdp },
      status: 'connected',
      answeredAt: Date.now(),
    },
    { merge: true },
  );
};

export const sendCallCandidateCloud = async (
  callId: string,
  candidate: RTCIceCandidateInit,
  role: 'caller' | 'callee' = 'caller',
) => {
  const safeCallId = callId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const candId = `${role}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const candPayload =
    typeof (candidate as any).toJSON === 'function'
      ? (candidate as any).toJSON()
      : candidate;
  await setDoc(doc(db, 'cloudCalls', safeCallId, 'candidates', candId), {
    candidate: candPayload,
    role,
    timestamp: Date.now(),
  });
};

export const listenToCallSessionCloud = (
  callId: string,
  onUpdate: (data: any) => void,
  onCandidate?: (cand: any) => void,
) => {
  const safeCallId = callId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const unsubCall = onSnapshot(doc(db, 'cloudCalls', safeCallId), (snap) => {
    if (snap.exists()) onUpdate(snap.data());
  });

  let unsubCandidates = () => {};
  if (onCandidate) {
    unsubCandidates = onSnapshot(
      collection(db, 'cloudCalls', safeCallId, 'candidates'),
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            onCandidate(change.doc.data());
          }
        });
      },
    );
  }

  return () => {
    unsubCall();
    unsubCandidates();
  };
};

// 9. Real-Time Chat & Voice Notes via Firestore
export interface CloudChatMessage {
  id: string;
  senderId: string;
  recipientId: string;
  text: string;
  audioUrl?: string;
  audioDuration?: number;
  imageUrl?: string;
  replyToId?: string;
  timestamp: number;
}

export const sendChatMessageCloud = async (
  chatId: string,
  message: {
    id: string;
    senderId: string;
    recipientId: string;
    text: string;
    audioUrl?: string;
    audioDuration?: number;
    imageUrl?: string;
    replyToId?: string;
  },
) => {
  const user = auth.currentUser;
  if (!user) return;
  const safeChatId = chatId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeMsgId = message.id.replace(/[^a-zA-Z0-9_-]/g, '_');
  await setDoc(doc(db, 'cloudChats', safeChatId, 'messages', safeMsgId), {
    ...message,
    senderId: user.uid,
    timestamp: Date.now(),
    createdAt: serverTimestamp(),
  });
};

export const subscribeToChatMessagesCloud = (
  chatId: string,
  onUpdate: (messages: CloudChatMessage[]) => void,
) => {
  const safeChatId = chatId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const q = query(
    collection(db, 'cloudChats', safeChatId, 'messages'),
    orderBy('timestamp', 'asc'),
    limit(50),
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const msgs = snapshot.docs.map((d) => d.data() as CloudChatMessage);
      onUpdate(msgs);
    },
    (err) => {
      console.warn('Chat listener notice:', err);
    },
  );
};

// 10. Google Keep / Personal Notes Synchronization
export interface CloudNote {
  id: string;
  userId: string;
  title: string;
  content: string;
  color?: string;
  isPinned?: boolean;
  tags?: string[];
  updatedAt: number;
}

export const saveNoteToCloud = async (note: CloudNote) => {
  const user = auth.currentUser;
  if (!user) return;
  const safeId = note.id.replace(/[^a-zA-Z0-9_-]/g, '_');
  await setDoc(doc(db, 'cloudNotes', safeId), {
    ...note,
    userId: user.uid,
    updatedAt: Date.now(),
  });
};

export const deleteNoteFromCloud = async (noteId: string) => {
  const safeId = noteId.replace(/[^a-zA-Z0-9_-]/g, '_');
  await deleteDoc(doc(db, 'cloudNotes', safeId));
};

export const subscribeToUserNotesCloud = (
  userId: string,
  onUpdate: (notes: CloudNote[]) => void,
) => {
  const q = query(collection(db, 'cloudNotes'), where('userId', '==', userId));
  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((d) => d.data() as CloudNote);
      onUpdate(list);
    },
    (err) => {
      console.warn('Notes listener notice:', err);
    },
  );
};

// 11. Voice Note Audio Upload to Firebase Storage
export const uploadVoiceNoteToStorage = async (audioBlob: Blob, chatId: string): Promise<string> => {
  const fileName = `voice_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.webm`;
  const safeChatId = chatId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const storageRef = ref(storage, `chats/${safeChatId}/${fileName}`);

  try {
    const uploadResult = await uploadBytes(storageRef, audioBlob, {
      contentType: audioBlob.type || 'audio/webm',
    });
    return await getDownloadURL(uploadResult.ref);
  } catch (storageErr) {
    console.warn('Firebase Storage upload fallback triggered:', storageErr);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to encode audio'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(audioBlob);
    });
  }
};

// 12. Cloud Reels Real-time Synchronization
export interface FirestoreCloudReelRecord {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  videoUrl: string;
  caption: string;
  soundTitle?: string;
  likesCount: number;
  likedUserIds?: string[];
  viewsCount: number;
  sharesCount: number;
  commentsCount: number;
  reactions?: Record<string, string>;
  createdAt?: any;
}

export const saveReelToFirestoreCloud = async (reel: {
  id: string;
  videoUrl: string;
  caption: string;
  soundTitle?: string;
}) => {
  const user = auth.currentUser;
  if (!user || !isCloudPlayableUrl(reel.videoUrl)) return;
  const safeReelId = reel.id.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
  const path = `cloudReels/${safeReelId}`;

  const payload: Record<string, unknown> = {
    id: safeReelId,
    authorId: user.uid,
    authorName: (user.displayName || 'Bandhan Creator').slice(0, 120),
    authorAvatar: (
      user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'Creator')}`
    ).slice(0, 2048),
    videoUrl: reel.videoUrl,
    caption: (reel.caption || '').slice(0, 1000),
    soundTitle: (reel.soundTitle || 'Original Audio - Bandhan').slice(0, 120),
    likesCount: 0,
    likedUserIds: [],
    viewsCount: 0,
    sharesCount: 0,
    commentsCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'cloudReels', safeReelId), payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};

export const deleteReelFromFirestoreCloud = async (reelId: string) => {
  const user = auth.currentUser;
  if (!user) return;
  const safeId = reelId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
  try {
    await deleteDoc(doc(db, 'cloudReels', safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `cloudReels/${safeId}`);
  }
};

export const subscribeToCloudReels = (
  onUpdate: (reels: FirestoreCloudReelRecord[]) => void,
) => {
  if (!auth.currentUser) return () => {};
  const q = query(collection(db, 'cloudReels'), limit(50));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: FirestoreCloudReelRecord[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          authorId: String(data.authorId || ''),
          authorName: String(data.authorName || 'Bandhan Creator'),
          authorAvatar: String(data.authorAvatar || ''),
          videoUrl: String(data.videoUrl || ''),
          caption: String(data.caption || ''),
          soundTitle: data.soundTitle ? String(data.soundTitle) : 'Original Audio',
          likesCount: Number(data.likesCount || 0),
          likedUserIds: Array.isArray(data.likedUserIds) ? data.likedUserIds : [],
          viewsCount: Number(data.viewsCount || 0),
          sharesCount: Number(data.sharesCount || 0),
          commentsCount: Number(data.commentsCount || 0),
          reactions: data.reactions || {},
          createdAt: data.createdAt,
        };
      });
      onUpdate(items);
    },
    (err) => {
      console.warn('Cloud reels listener notice:', err);
    },
  );
};

export const updateReelReactionCloud = async (
  reelId: string,
  reactionType: string,
  isLiking: boolean,
) => {
  const user = auth.currentUser;
  if (!user) return;
  const safeId = reelId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
  const reelRef = doc(db, 'cloudReels', safeId);
  try {
    const snap = await getDocFromServer(reelRef);
    if (!snap.exists()) return;
    const data = snap.data();
    let likedUserIds: string[] = Array.isArray(data.likedUserIds) ? [...data.likedUserIds] : [];
    let likesCount = Number(data.likesCount || 0);

    if (isLiking) {
      if (!likedUserIds.includes(user.uid)) {
        likedUserIds.push(user.uid);
        likesCount += 1;
      }
    } else {
      likedUserIds = likedUserIds.filter((id) => id !== user.uid);
      likesCount = Math.max(0, likesCount - 1);
    }

    await setDoc(
      reelRef,
      {
        likedUserIds,
        likesCount,
        [`reactions.${user.uid}`]: isLiking ? reactionType : null,
      },
      { merge: true },
    );
  } catch (error) {
    console.warn('Update reel reaction error:', error);
  }
};

// 13. Cloud Post Reactions Synchronization
export const updatePostReactionCloud = async (
  postId: string,
  reactionType: string | null,
) => {
  const user = auth.currentUser;
  if (!user) return;
  const safeId = postId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
  const postRef = doc(db, 'cloudPosts', safeId);
  try {
    const snap = await getDocFromServer(postRef);
    if (!snap.exists()) return;
    const data = snap.data();
    const userReactions = { ...(data.userReactions || {}) };

    if (reactionType) {
      userReactions[user.uid] = reactionType;
    } else {
      delete userReactions[user.uid];
    }

    const reactionsCount = Object.keys(userReactions).length;

    await setDoc(
      postRef,
      {
        userReactions,
        reactionsCount,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  } catch (error) {
    console.warn('Update post reaction error:', error);
  }
};

// 14. Chat Typing Indicators & Seen Receipts
export const setChatTypingStatusCloud = async (
  chatId: string,
  isTyping: boolean,
  userName?: string,
) => {
  const user = auth.currentUser;
  if (!user) return;
  const safeChatId = chatId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const typingRef = doc(db, 'cloudChats', safeChatId, 'typing', user.uid);
  try {
    if (isTyping) {
      await setDoc(typingRef, {
        userId: user.uid,
        userName: userName || user.displayName || 'Friend',
        isTyping: true,
        updatedAt: Date.now(),
      });
    } else {
      await deleteDoc(typingRef);
    }
  } catch (err) {
    // Non-blocking
  }
};

export const subscribeToChatTypingStatusCloud = (
  chatId: string,
  onUpdate: (typingUsers: { userId: string; userName: string }[]) => void,
) => {
  const safeChatId = chatId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const typingCol = collection(db, 'cloudChats', safeChatId, 'typing');
  return onSnapshot(
    typingCol,
    (snapshot) => {
      const currentUid = auth.currentUser?.uid;
      const now = Date.now();
      const activeTyping = snapshot.docs
        .map((d) => d.data())
        .filter((d) => d.userId !== currentUid && d.isTyping && now - (d.updatedAt || 0) < 6000)
        .map((d) => ({ userId: String(d.userId), userName: String(d.userName || 'Friend') }));
      onUpdate(activeTyping);
    },
    (err) => {
      console.warn('Typing status listener notice:', err);
    },
  );
};

export const markChatMessageSeenCloud = async (
  chatId: string,
  messageId: string,
) => {
  const user = auth.currentUser;
  if (!user) return;
  const safeChatId = chatId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeMsgId = messageId.replace(/[^a-zA-Z0-9_-]/g, '_');
  try {
    await setDoc(
      doc(db, 'cloudChats', safeChatId, 'messages', safeMsgId),
      {
        isRead: true,
        seenAt: Date.now(),
        seenBy: user.uid,
      },
      { merge: true },
    );
  } catch (err) {
    // Non-blocking
  }
};


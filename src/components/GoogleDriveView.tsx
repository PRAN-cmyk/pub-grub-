import React, { useState, useEffect, useCallback } from 'react';
import {
  HardDrive,
  Upload,
  RefreshCw,
  Search,
  Trash2,
  Edit3,
  Share2,
  ExternalLink,
  Folder,
  FileText,
  Image as ImageIcon,
  Film,
  CheckCircle2,
  Cloud,
  AlertTriangle,
  X,
  Users,
  MessageSquare,
  Video,
  Plus,
  Send,
  Copy,
  UserPlus,
  Phone,
  Mail,
  Building2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getAccessToken, getFirebaseIdToken } from '../firebase';
import { GmailView } from './GmailView';

interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  webViewLink?: string;
  iconLink?: string;
  thumbnailLink?: string;
}

interface GoogleContactItem {
  resourceName: string;
  name: string;
  email?: string;
  phone?: string;
  organization?: string;
  photoUrl?: string;
}

interface GoogleChatSpace {
  name: string;
  displayName?: string;
  spaceType?: string;
}

interface GoogleChatMessage {
  name: string;
  text?: string;
  createTime?: string;
  sender?: {
    name?: string;
    displayName?: string;
    type?: string;
  };
}

interface MeetRoomRecord {
  id?: number;
  spaceName: string;
  meetingCode: string;
  meetingUri: string;
  title: string;
  createdAt?: string;
}

type DriveFilterType = 'all' | 'images' | 'videos' | 'docs' | 'folders';

export const GoogleDriveView: React.FC = () => {
  const {
    currentUser,
    posts,
    reels,
    driveAccessToken,
    firebaseUserEmail,
    signInWithGoogleAccount,
    workspaceSubTab,
    setWorkspaceSubTab,
    importGoogleContactAsFriend,
    addPost,
    setActiveTab,
    language,
    showToast,
  } = useApp();

  const [isSigningIn, setIsSigningIn] = useState(false);
  const [needsAuth, setNeedsAuth] = useState(!driveAccessToken);

  // --- 1. Google Drive State ---
  const [files, setFiles] = useState<DriveFileItem[]>([]);
  const [isLoadingDrive, setIsLoadingDrive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<DriveFilterType>('all');

  const [fileToDelete, setFileToDelete] = useState<DriveFileItem | null>(null);
  const [isDeletingFile, setIsDeletingFile] = useState(false);

  const [fileToRename, setFileToRename] = useState<DriveFileItem | null>(null);
  const [newFileNameInput, setNewFileNameInput] = useState('');
  const [isRenamingFile, setIsRenamingFile] = useState(false);

  // --- 2. Google Contacts State ---
  const [gContacts, setGContacts] = useState<GoogleContactItem[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [contactSearch, setContactSearch] = useState('');
  const [isCreateContactOpen, setIsCreateContactOpen] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [isCreatingContact, setIsCreatingContact] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<GoogleContactItem | null>(null);
  const [isDeletingContact, setIsDeletingContact] = useState(false);

  // --- 3. Google Chat State ---
  const [chatSpaces, setChatSpaces] = useState<GoogleChatSpace[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<GoogleChatSpace | null>(null);
  const [spaceMessages, setSpaceMessages] = useState<GoogleChatMessage[]>([]);
  const [isLoadingSpaces, setIsLoadingSpaces] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState('');
  const [isCreatingSpace, setIsCreatingSpace] = useState(false);
  const [chatMessageDraft, setChatMessageDraft] = useState('');
  const [isSendingChatMsg, setIsSendingChatMsg] = useState(false);
  const [chatApiNotice, setChatApiNotice] = useState<string | null>(null);

  // --- 4. Google Meet State ---
  const [meetTitle, setMeetTitle] = useState('');
  const [isCreatingMeet, setIsCreatingMeet] = useState(false);
  const [activeMeetRoom, setActiveMeetRoom] = useState<MeetRoomRecord | null>(null);
  const [savedMeetings, setSavedMeetings] = useState<MeetRoomRecord[]>([]);
  const [isLoadingMeetings, setIsLoadingMeetings] = useState(false);

  // --- Drive Handlers ---
  const fetchDriveFiles = useCallback(async () => {
    const token = (await getAccessToken()) || driveAccessToken;
    if (!token) {
      setNeedsAuth(true);
      return;
    }

    setIsLoadingDrive(true);
    try {
      const qParts = ['trashed = false'];
      if (searchTerm.trim()) {
        const escaped = searchTerm.trim().replace(/'/g, "\\'");
        qParts.push(`name contains '${escaped}'`);
      }
      const qParam = encodeURIComponent(qParts.join(' and '));
      const fieldsParam = encodeURIComponent(
        'files(id,name,mimeType,size,modifiedTime,webViewLink,iconLink,thumbnailLink)',
      );
      const url = `https://www.googleapis.com/drive/v3/files?pageSize=40&q=${qParam}&fields=${fieldsParam}&orderBy=modifiedTime%20desc`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401 || res.status === 403) {
        setNeedsAuth(true);
        return;
      }

      const data = await res.json();
      if (Array.isArray(data.files)) {
        setFiles(data.files);
        setNeedsAuth(false);
      }
    } catch (err) {
      console.error('Error fetching Google Drive files:', err);
    } finally {
      setIsLoadingDrive(false);
    }
  }, [driveAccessToken, searchTerm]);

  // --- Contacts (People API) Handlers ---
  const fetchGoogleContacts = useCallback(async () => {
    const token = (await getAccessToken()) || driveAccessToken;
    if (!token) {
      setNeedsAuth(true);
      return;
    }

    setIsLoadingContacts(true);
    try {
      const res = await fetch(
        'https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,phoneNumbers,photos,organizations&pageSize=100',
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (res.status === 401 || res.status === 403) {
        setNeedsAuth(true);
        return;
      }

      const data = await res.json();
      const connections = Array.isArray(data.connections) ? data.connections : [];
      const parsed: GoogleContactItem[] = connections.map(
        (person: {
          resourceName?: string;
          names?: { displayName?: string }[];
          emailAddresses?: { value?: string }[];
          phoneNumbers?: { value?: string }[];
          organizations?: { name?: string }[];
          photos?: { url?: string }[];
        }) => ({
          resourceName: String(person.resourceName || ''),
          name:
            person.names?.[0]?.displayName ||
            person.emailAddresses?.[0]?.value ||
            person.phoneNumbers?.[0]?.value ||
            'Unnamed Contact',
          email: person.emailAddresses?.[0]?.value,
          phone: person.phoneNumbers?.[0]?.value,
          organization: person.organizations?.[0]?.name,
          photoUrl: person.photos?.[0]?.url,
        }),
      );
      setGContacts(parsed);
      setNeedsAuth(false);
    } catch (err) {
      console.error('Error fetching Google Contacts:', err);
    } finally {
      setIsLoadingContacts(false);
    }
  }, [driveAccessToken]);

  const handleCreateGoogleContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName.trim()) return;

    const token = (await getAccessToken()) || driveAccessToken;
    if (!token) {
      setNeedsAuth(true);
      return;
    }

    setIsCreatingContact(true);
    try {
      const bodyPayload: Record<string, unknown> = {
        names: [{ givenName: newContactName.trim() }],
      };
      if (newContactEmail.trim()) {
        bodyPayload.emailAddresses = [{ value: newContactEmail.trim() }];
      }
      if (newContactPhone.trim()) {
        bodyPayload.phoneNumbers = [{ value: newContactPhone.trim() }];
      }

      const res = await fetch('https://people.googleapis.com/v1/people:createContact', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bodyPayload),
      });

      if (res.status === 401 || res.status === 403) {
        setNeedsAuth(true);
        return;
      }

      if (!res.ok) {
        throw new Error(`Create contact failed: ${res.status}`);
      }

      const created = await res.json();
      const addedItem: GoogleContactItem = {
        resourceName: String(created.resourceName || `people/c_${Date.now()}`),
        name: created.names?.[0]?.displayName || newContactName.trim(),
        email: created.emailAddresses?.[0]?.value || newContactEmail.trim() || undefined,
        phone: created.phoneNumbers?.[0]?.value || newContactPhone.trim() || undefined,
        photoUrl: created.photos?.[0]?.url,
      };

      setGContacts((prev) => [addedItem, ...prev]);
      setNewContactName('');
      setNewContactEmail('');
      setNewContactPhone('');
      setIsCreateContactOpen(false);
      showToast(
        language === 'bn'
          ? `✅ "${addedItem.name}" আপনার গুগল কন্টাক্টসে সংরক্ষিত হয়েছে!`
          : `✅ "${addedItem.name}" saved to your Google Contacts!`,
      );
    } catch (err) {
      console.error('Create Google Contact error:', err);
      showToast(
        language === 'bn'
          ? '⚠️ গুগল কন্টাক্ট তৈরি করতে সমস্যা হয়েছে'
          : '⚠️ Could not create Google Contact',
      );
    } finally {
      setIsCreatingContact(false);
    }
  };

  const confirmDeleteGoogleContact = async () => {
    if (!contactToDelete) return;
    const token = (await getAccessToken()) || driveAccessToken;
    if (!token) {
      setNeedsAuth(true);
      return;
    }

    setIsDeletingContact(true);
    try {
      const res = await fetch(
        `https://people.googleapis.com/v1/${contactToDelete.resourceName}:deleteContact`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (res.status === 401 || res.status === 403) {
        setNeedsAuth(true);
        return;
      }

      setGContacts((prev) =>
        prev.filter((c) => c.resourceName !== contactToDelete.resourceName),
      );
      showToast(
        language === 'bn'
          ? `🗑️ "${contactToDelete.name}" গুগল কন্টাক্টস থেকে মুছে ফেলা হয়েছে`
          : `🗑️ "${contactToDelete.name}" deleted from Google Contacts`,
      );
      setContactToDelete(null);
    } catch (err) {
      console.error('Delete Google Contact error:', err);
      showToast(
        language === 'bn'
          ? '⚠️ কন্টাক্ট মুছে ফেলতে সমস্যা হয়েছে'
          : '⚠️ Failed to delete contact',
      );
    } finally {
      setIsDeletingContact(false);
    }
  };

  // --- Google Chat Handlers ---
  const fetchChatSpaces = useCallback(async () => {
    const token = (await getAccessToken()) || driveAccessToken;
    if (!token) {
      setNeedsAuth(true);
      return;
    }

    setIsLoadingSpaces(true);
    setChatApiNotice(null);
    try {
      const res = await fetch('https://chat.googleapis.com/v1/spaces?pageSize=30', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        setNeedsAuth(true);
        return;
      }

      const data = await res.json();
      if (data.error) {
        setChatApiNotice(
          data.error.message ||
            (language === 'bn'
              ? 'গুগল চ্যাট API ব্যবহারের জন্য Google Workspace অ্যাকাউন্ট প্রয়োজন হতে পারে।'
              : 'Google Chat API may require a Google Workspace account.'),
        );
        return;
      }

      const list: GoogleChatSpace[] = Array.isArray(data.spaces) ? data.spaces : [];
      setChatSpaces(list);
      if (list.length > 0 && !selectedSpace) {
        setSelectedSpace(list[0]);
      }
    } catch (err) {
      console.error('Error fetching Google Chat spaces:', err);
    } finally {
      setIsLoadingSpaces(false);
    }
  }, [driveAccessToken, language, selectedSpace]);

  const fetchSpaceMessages = useCallback(
    async (spaceName: string) => {
      const token = (await getAccessToken()) || driveAccessToken;
      if (!token) return;

      setIsLoadingMessages(true);
      try {
        const res = await fetch(
          `https://chat.googleapis.com/v1/${spaceName}/messages?pageSize=25`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        const data = await res.json();
        if (Array.isArray(data.messages)) {
          setSpaceMessages(data.messages);
        } else {
          setSpaceMessages([]);
        }
      } catch (err) {
        console.error('Error fetching space messages:', err);
      } finally {
        setIsLoadingMessages(false);
      }
    },
    [driveAccessToken],
  );

  const handleCreateChatSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpaceName.trim()) return;
    const token = (await getAccessToken()) || driveAccessToken;
    if (!token) {
      setNeedsAuth(true);
      return;
    }

    setIsCreatingSpace(true);
    try {
      const res = await fetch('https://chat.googleapis.com/v1/spaces', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          spaceType: 'SPACE',
          displayName: newSpaceName.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        showToast(
          data.error?.message ||
            (language === 'bn'
              ? '⚠️ স্পেস তৈরি করা যায়নি'
              : '⚠️ Could not create Google Chat Space'),
        );
        return;
      }
      setChatSpaces((prev) => [data, ...prev]);
      setSelectedSpace(data);
      setNewSpaceName('');
      showToast(
        language === 'bn'
          ? `✅ গুগল চ্যাট স্পেস "${data.displayName}" তৈরি হয়েছে!`
          : `✅ Google Chat Space "${data.displayName}" created!`,
      );
    } catch (err) {
      console.error('Create Chat Space error:', err);
    } finally {
      setIsCreatingSpace(false);
    }
  };

  const handleSendChatSpaceMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSpace || !chatMessageDraft.trim()) return;

    const token = (await getAccessToken()) || driveAccessToken;
    if (!token) {
      setNeedsAuth(true);
      return;
    }

    setIsSendingChatMsg(true);
    try {
      const res = await fetch(
        `https://chat.googleapis.com/v1/${selectedSpace.name}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: chatMessageDraft.trim(),
          }),
        },
      );
      const data = await res.json();
      if (res.ok && data.name) {
        setSpaceMessages((prev) => [...prev, data]);
        setChatMessageDraft('');
      } else {
        showToast(
          data.error?.message ||
            (language === 'bn' ? '⚠️ মেসেজ পাঠানো যায়নি' : '⚠️ Failed to send message'),
        );
      }
    } catch (err) {
      console.error('Send Google Chat message error:', err);
    } finally {
      setIsSendingChatMsg(false);
    }
  };

  // --- Google Meet Handlers ---
  const fetchSavedMeetings = useCallback(async () => {
    const idToken = await getFirebaseIdToken();
    if (!idToken) return;

    setIsLoadingMeetings(true);
    try {
      const res = await fetch('/api/meetings', {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.meetings)) {
          setSavedMeetings(data.meetings);
        }
      }
    } catch (err) {
      console.error('Error loading saved meetings:', err);
    } finally {
      setIsLoadingMeetings(false);
    }
  }, []);

  const handleCreateGoogleMeetSpace = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const token = (await getAccessToken()) || driveAccessToken;
    if (!token) {
      setNeedsAuth(true);
      return;
    }

    setIsCreatingMeet(true);
    try {
      const res = await fetch('https://meet.googleapis.com/v2/spaces', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (res.status === 401 || res.status === 403) {
        setNeedsAuth(true);
        return;
      }

      const data = await res.json();
      if (!res.ok || !data.meetingUri) {
        throw new Error(data.error?.message || 'Failed to create Google Meet space');
      }

      const roomTitle =
        meetTitle.trim() ||
        (language === 'bn'
          ? `${currentUser.nameBn || currentUser.name}-এর ভিডিও মিটিং`
          : `${currentUser.name}'s Video Meeting`);

      const newRoom: MeetRoomRecord = {
        spaceName: String(data.name || 'spaces/instant'),
        meetingCode: String(data.meetingCode || ''),
        meetingUri: String(data.meetingUri),
        title: roomTitle,
      };

      setActiveMeetRoom(newRoom);
      setSavedMeetings((prev) => [newRoom, ...prev]);
      setMeetTitle('');

      // Persist to backend API (/api/meetings)
      const idToken = await getFirebaseIdToken();
      if (idToken) {
        fetch('/api/meetings', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${idToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newRoom),
        }).catch(() => {});
      }

      showToast(
        language === 'bn'
          ? `✅ গুগল মিট রুম তৈরি হয়েছে: ${newRoom.meetingCode}`
          : `✅ Google Meet room created: ${newRoom.meetingCode}`,
      );
    } catch (err) {
      console.error('Create Google Meet error:', err);
      showToast(
        language === 'bn'
          ? '⚠️ গুগল মিট লিংক তৈরি করতে সমস্যা হয়েছে। আবার সাইন-ইন করে চেষ্টা করুন।'
          : '⚠️ Failed to create Google Meet room. Please re-authenticate and try again.',
      );
    } finally {
      setIsCreatingMeet(false);
    }
  };

  const handleShareMeetToFeed = (room: MeetRoomRecord) => {
    addPost({
      content:
        language === 'bn'
          ? `📹 লাইভ গুগল মিট ভিডিও আড্ডায় যোগ দিন: "${room.title}"\n🔗 মিটিং লিংক: ${room.meetingUri}`
          : `📹 Join my live Google Meet video session: "${room.title}"\n🔗 Meeting Link: ${room.meetingUri}`,
      privacy: 'public',
      driveFile: {
        id: room.meetingCode || room.spaceName,
        name: `${room.title} (Google Meet: ${room.meetingCode})`,
        mimeType: 'video/vnd.google-apps.meet',
        webViewLink: room.meetingUri,
      },
    });
    showToast(
      language === 'bn'
        ? '🚀 গুগল মিট লিংক নিউজফিডে শেয়ার করা হয়েছে!'
        : '🚀 Google Meet room shared to the Newsfeed!',
    );
    setActiveTab('feed');
  };

  // Load active sub-tab data when token or sub-tab changes
  useEffect(() => {
    if (!driveAccessToken) {
      setNeedsAuth(true);
      return;
    }
    setNeedsAuth(false);
    if (workspaceSubTab === 'drive') {
      fetchDriveFiles();
    } else if (workspaceSubTab === 'contacts') {
      fetchGoogleContacts();
    } else if (workspaceSubTab === 'chat') {
      fetchChatSpaces();
    } else if (workspaceSubTab === 'meet') {
      fetchSavedMeetings();
    }
  }, [
    driveAccessToken,
    workspaceSubTab,
    fetchDriveFiles,
    fetchGoogleContacts,
    fetchChatSpaces,
    fetchSavedMeetings,
  ]);

  useEffect(() => {
    if (workspaceSubTab === 'chat' && selectedSpace?.name) {
      fetchSpaceMessages(selectedSpace.name);
    }
  }, [workspaceSubTab, selectedSpace, fetchSpaceMessages]);

  const handleGoogleConnect = async () => {
    setIsSigningIn(true);
    try {
      const ok = await signInWithGoogleAccount();
      if (ok) {
        setNeedsAuth(false);
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  // Upload any file from device to Google Drive
  const handleFileUploadToDrive = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const token = (await getAccessToken()) || driveAccessToken;
    if (!token) {
      setNeedsAuth(true);
      return;
    }

    setIsUploading(true);
    try {
      const metadata = {
        name: file.name,
        mimeType: file.type || 'application/octet-stream',
      };

      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', file);

      const res = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,modifiedTime,webViewLink,iconLink,thumbnailLink',
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        },
      );

      if (!res.ok) throw new Error(`Upload failed: ${res.status}`);

      const uploaded: DriveFileItem = await res.json();
      setFiles((prev) => [uploaded, ...prev]);
      showToast(
        language === 'bn'
          ? `✅ "${uploaded.name}" আপনার গুগল ড্রাইভে আপলোড হয়েছে!`
          : `✅ "${uploaded.name}" uploaded to your Google Drive!`,
      );
    } catch (err) {
      console.error('Google Drive upload error:', err);
      showToast(
        language === 'bn'
          ? '⚠️ গুগল ড্রাইভে আপলোড ব্যর্থ হয়েছে'
          : '⚠️ Failed to upload file to Google Drive',
      );
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  // Backup Bandhan Profile & Posts to Google Drive
  const handleBackupToDrive = async () => {
    const token = (await getAccessToken()) || driveAccessToken;
    if (!token) {
      setNeedsAuth(true);
      return;
    }

    setIsBackingUp(true);
    try {
      const myPosts = posts.filter((p) => p.author.id === currentUser.id);
      const myReels = reels.filter((r) => r.author.id === currentUser.id);

      const backupPayload = {
        exportedAt: new Date().toISOString(),
        platform: 'Bandhan Social Network',
        profile: {
          id: currentUser.id,
          name: currentUser.name,
          nameBn: currentUser.nameBn,
          username: currentUser.username,
          bio: currentUser.bio,
          city: currentUser.city,
          followersCount: currentUser.followersCount,
          friendsCount: currentUser.friendsCount,
        },
        postsCount: myPosts.length,
        reelsCount: myReels.length,
        posts: myPosts.map((p) => ({
          id: p.id,
          content: p.content,
          createdAt: p.createdAt,
          privacy: p.privacy,
        })),
      };

      const fileName = `bandhan-backup-${currentUser.username}-${new Date().toISOString().slice(0, 10)}.json`;
      const metadata = { name: fileName, mimeType: 'application/json' };

      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append(
        'file',
        new Blob([JSON.stringify(backupPayload, null, 2)], { type: 'application/json' }),
      );

      const res = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,modifiedTime,webViewLink',
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        },
      );

      if (!res.ok) throw new Error(`Backup failed: ${res.status}`);

      const createdFile: DriveFileItem = await res.json();
      setFiles((prev) => [createdFile, ...prev]);
      showToast(
        language === 'bn'
          ? `☁️ আপনার প্রোফাইল ও পোস্ট গুগল ড্রাইভে ব্যাকআপ করা হয়েছে (${fileName})!`
          : `☁️ Profile & posts backed up to Google Drive (${fileName})!`,
      );
    } catch (err) {
      console.error('Drive backup error:', err);
      showToast(
        language === 'bn'
          ? '⚠️ গুগল ড্রাইভে ব্যাকআপ সংরক্ষণ করা যায়নি'
          : '⚠️ Could not save backup to Google Drive',
      );
    } finally {
      setIsBackingUp(false);
    }
  };

  // Confirm Rename File in Google Drive
  const confirmRenameDriveFile = async () => {
    if (!fileToRename || !newFileNameInput.trim()) return;
    const token = (await getAccessToken()) || driveAccessToken;
    if (!token) {
      setNeedsAuth(true);
      return;
    }

    setIsRenamingFile(true);
    try {
      const res = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileToRename.id}?fields=id,name,mimeType,size,modifiedTime,webViewLink,iconLink,thumbnailLink`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: newFileNameInput.trim() }),
        },
      );

      if (!res.ok) throw new Error(`Rename failed: ${res.status}`);

      const updated: DriveFileItem = await res.json();
      setFiles((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
      showToast(
        language === 'bn'
          ? `✏️ ফাইলের নাম পরিবর্তন করে "${updated.name}" রাখা হয়েছে`
          : `✏️ Renamed file to "${updated.name}"`,
      );
      setFileToRename(null);
      setNewFileNameInput('');
    } catch (err) {
      console.error('Rename error:', err);
      showToast(
        language === 'bn'
          ? '⚠️ ফাইলের নাম পরিবর্তন করা যায়নি'
          : '⚠️ Could not rename file in Google Drive',
      );
    } finally {
      setIsRenamingFile(false);
    }
  };

  // Confirm Delete File in Google Drive
  const confirmDeleteDriveFile = async () => {
    if (!fileToDelete) return;
    const token = (await getAccessToken()) || driveAccessToken;
    if (!token) {
      setNeedsAuth(true);
      return;
    }

    setIsDeletingFile(true);
    try {
      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileToDelete.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok && res.status !== 204) {
        throw new Error(`Delete failed: ${res.status}`);
      }

      setFiles((prev) => prev.filter((f) => f.id !== fileToDelete.id));
      showToast(
        language === 'bn'
          ? `🗑️ "${fileToDelete.name}" গুগল ড্রাইভ থেকে মুছে ফেলা হয়েছে`
          : `🗑️ "${fileToDelete.name}" deleted from Google Drive`,
      );
      setFileToDelete(null);
    } catch (err) {
      console.error('Delete error:', err);
      showToast(
        language === 'bn'
          ? '⚠️ এই ফাইলটি মুছে ফেলার অনুমতি নেই'
          : '⚠️ Permission denied or unable to delete this Drive file',
      );
    } finally {
      setIsDeletingFile(false);
    }
  };

  const handleShareDriveFileToFeed = (file: DriveFileItem) => {
    const isImage = file.mimeType.startsWith('image/');
    addPost({
      content:
        language === 'bn'
          ? `☁️ আমার গুগল ড্রাইভ থেকে একটি ফাইল শেয়ার করলাম: "${file.name}"`
          : `☁️ Shared a file from my Google Drive: "${file.name}"`,
      image: isImage && file.thumbnailLink ? file.thumbnailLink.replace('=s220', '=s1000') : undefined,
      mediaType: isImage ? 'image' : undefined,
      privacy: 'public',
      driveFile: {
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        webViewLink: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`,
      },
    });
    showToast(
      language === 'bn'
        ? `🚀 "${file.name}" নিউজফিডে শেয়ার করা হয়েছে!`
        : `🚀 "${file.name}" shared to the Newsfeed!`,
    );
    setActiveTab('feed');
  };

  const filteredDriveFiles = files.filter((f) => {
    if (filterType === 'images') return f.mimeType.startsWith('image/');
    if (filterType === 'videos') return f.mimeType.startsWith('video/');
    if (filterType === 'folders') return f.mimeType === 'application/vnd.google-apps.folder';
    if (filterType === 'docs') {
      return (
        !f.mimeType.startsWith('image/') &&
        !f.mimeType.startsWith('video/') &&
        f.mimeType !== 'application/vnd.google-apps.folder'
      );
    }
    return true;
  });

  const filteredContacts = gContacts.filter((c) => {
    if (!contactSearch.trim()) return true;
    const q = contactSearch.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.phone && c.phone.toLowerCase().includes(q))
    );
  });

  const formatFileSize = (bytesStr?: string) => {
    if (!bytesStr) return 'Cloud Doc';
    const bytes = Number(bytesStr);
    if (Number.isNaN(bytes)) return 'Cloud Doc';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const renderFileTypeIcon = (mimeType: string) => {
    if (mimeType === 'application/vnd.google-apps.folder') {
      return <Folder className="w-5 h-5 text-amber-500" />;
    }
    if (mimeType.startsWith('image/')) {
      return <ImageIcon className="w-5 h-5 text-emerald-500" />;
    }
    if (mimeType.startsWith('video/')) {
      return <Film className="w-5 h-5 text-rose-500" />;
    }
    return <FileText className="w-5 h-5 text-blue-500" />;
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 rounded-2xl p-5 text-white shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/25">
              <Cloud className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-black tracking-tight">
                  {language === 'bn'
                    ? 'গুগল ওয়ার্কস্পেস হাব (ড্রাইভ, কন্টাক্টস, চ্যাট ও মিট)'
                    : 'Google Workspace Hub (Drive, Contacts, Chat & Meet)'}
                </h1>
                <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-400/20 text-emerald-100 border border-emerald-300/30 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {firebaseUserEmail ? 'Connected' : 'Google OAuth 2.0'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-blue-100 mt-1">
                {language === 'bn'
                  ? 'আপনার নিজস্ব Google Drive, Google Contacts, Google Chat এবং Google Meet সরাসরি বন্ধন থেকে ব্যবহার করুন।'
                  : 'Access your real Google Drive files, Google Contacts, Google Chat spaces, and instant Google Meet video rooms.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleGoogleConnect}
              disabled={isSigningIn}
              className="px-4 py-2.5 rounded-xl bg-white text-blue-700 hover:bg-blue-50 font-bold text-xs shadow-md flex items-center gap-2 transition-all cursor-pointer disabled:opacity-60"
            >
              <Cloud className="w-4 h-4" />
              {isSigningIn
                ? language === 'bn'
                  ? 'সংযুক্ত হচ্ছে...'
                  : 'Connecting...'
                : driveAccessToken
                ? language === 'bn'
                  ? 'গুগল অ্যাকাউন্ট রিফ্রেশ'
                  : 'Refresh Google Auth'
                : language === 'bn'
                ? 'গুগল দিয়ে সাইন ইন করুন'
                : 'Sign in with Google'}
            </button>
          </div>
        </div>

        {/* Sub-Tab Switcher (Drive, Gmail, Contacts, Chat, Meet) */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-4 pt-3 border-t border-white/15">
          {(
            [
              {
                id: 'drive',
                icon: HardDrive,
                labelBn: 'গুগল ড্রাইভ',
                labelEn: 'Google Drive',
                subBn: 'ফাইল ও ব্যাকআপ',
                subEn: 'Files & Backup',
              },
              {
                id: 'gmail',
                icon: Mail,
                labelBn: 'জি-মেইল (Gmail)',
                labelEn: 'Gmail & Inbox',
                subBn: 'মেইল ও বার্তা',
                subEn: 'Send & Receive',
              },
              {
                id: 'contacts',
                icon: Users,
                labelBn: 'গুগল কন্টাক্টস',
                labelEn: 'Google Contacts',
                subBn: 'ফোনবুক ও বন্ধু',
                subEn: 'People & Sync',
              },
              {
                id: 'chat',
                icon: MessageSquare,
                labelBn: 'গুগল চ্যাট',
                labelEn: 'Google Chat',
                subBn: 'স্পেস ও মেসেজ',
                subEn: 'Spaces & Rooms',
              },
              {
                id: 'meet',
                icon: Video,
                labelBn: 'গুগল মিট',
                labelEn: 'Google Meet',
                subBn: 'লাইভ ভিডিও কল',
                subEn: 'Video Meetings',
              },
            ] as const
          ).map((item) => {
            const Icon = item.icon;
            const active = workspaceSubTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setWorkspaceSubTab(item.id)}
                className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                  active
                    ? 'bg-white text-blue-700 border-white shadow-md'
                    : 'bg-white/10 text-white border-white/15 hover:bg-white/20'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    active ? 'bg-blue-600 text-white' : 'bg-white/15 text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-extrabold truncate">
                    {language === 'bn' ? item.labelBn : item.labelEn}
                  </p>
                  <p
                    className={`text-[10px] truncate ${
                      active ? 'text-blue-600 font-semibold' : 'text-blue-100'
                    }`}
                  >
                    {language === 'bn' ? item.subBn : item.subEn}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Single-Button Connect Card when not yet authenticated */}
      {needsAuth ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-4">
            <Cloud className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 mb-2">
            {language === 'bn'
              ? 'গুগল ড্রাইভ, কন্টাক্টস, চ্যাট এবং মিট চালু করুন'
              : 'Connect Google Drive, Contacts, Chat & Meet'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
            {language === 'bn'
              ? 'এক ক্লিকে আপনার গুগল অ্যাকাউন্ট দিয়ে লগইন করে ড্রাইভ ফাইল আপলোড, গুগল কন্টাক্টস সিঙ্ক, গুগল চ্যাট স্পেস এবং তাৎক্ষণিক গুগল মিট ভিডিও মিটিং তৈরি করুন।'
              : 'Sign in with your Google Account in one click to manage Drive files, sync Google Contacts, chat in Google Chat spaces, and launch instant Google Meet video calls.'}
          </p>
          <button
            type="button"
            onClick={handleGoogleConnect}
            disabled={isSigningIn}
            className="px-6 py-3 rounded-xl bg-[#1877F2] hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-500/25 inline-flex items-center gap-2.5 transition-all cursor-pointer disabled:opacity-50"
          >
            <Cloud className="w-4 h-4" />
            {isSigningIn
              ? language === 'bn'
                ? 'গুগল পপআপ খোলা হচ্ছে...'
                : 'Opening Google Sign-In...'
              : language === 'bn'
              ? 'গুগল অ্যাকাউন্ট সংযুক্ত করুন'
              : 'Connect with Google'}
          </button>
        </div>
      ) : (
        <>
          {/* ==================== TAB 1: GOOGLE DRIVE ==================== */}
          {workspaceSubTab === 'drive' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') fetchDriveFiles();
                    }}
                    placeholder={
                      language === 'bn'
                        ? 'আপনার গুগল ড্রাইভে ফাইল খুঁজুন...'
                        : 'Search files in your Google Drive...'
                    }
                    className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <label className="px-3.5 py-2.5 rounded-xl bg-[#1877F2] hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>
                      {isUploading
                        ? language === 'bn'
                          ? 'আপলোড হচ্ছে...'
                          : 'Uploading...'
                        : language === 'bn'
                        ? 'ড্রাইভে ফাইল আপলোড'
                        : 'Upload to Drive'}
                    </span>
                    <input
                      type="file"
                      onChange={handleFileUploadToDrive}
                      disabled={isUploading}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={handleBackupToDrive}
                    disabled={isBackingUp}
                    className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors disabled:opacity-50"
                  >
                    <Cloud className="w-3.5 h-3.5" />
                    <span>
                      {isBackingUp
                        ? language === 'bn'
                          ? 'ব্যাকআপ হচ্ছে...'
                          : 'Backing up...'
                        : language === 'bn'
                        ? 'প্রোফাইল ব্যাকআপ'
                        : 'Backup Profile'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={fetchDriveFiles}
                    disabled={isLoadingDrive}
                    className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer transition-colors"
                    title="Refresh Drive Files"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoadingDrive ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                {(
                  [
                    { id: 'all', labelBn: 'সব ফাইল', labelEn: 'All Files' },
                    { id: 'images', labelBn: 'ছবি', labelEn: 'Images' },
                    { id: 'videos', labelBn: 'ভিডিও', labelEn: 'Videos' },
                    { id: 'docs', labelBn: 'ডকুমেন্ট', labelEn: 'Documents' },
                    { id: 'folders', labelBn: 'ফোল্ডার', labelEn: 'Folders' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFilterType(tab.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                      filterType === tab.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {language === 'bn' ? tab.labelBn : tab.labelEn}
                  </button>
                ))}
              </div>

              {/* Files Grid */}
              {isLoadingDrive ? (
                <div className="py-12 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
                  <span>
                    {language === 'bn'
                      ? 'আপনার গুগল ড্রাইভ ফাইল লোড হচ্ছে...'
                      : 'Loading your Google Drive files...'}
                  </span>
                </div>
              ) : filteredDriveFiles.length === 0 ? (
                <div className="py-12 text-center text-slate-500 dark:text-slate-400 text-sm">
                  {language === 'bn'
                    ? 'কোনো ফাইল পাওয়া যায়নি। উপরের "ড্রাইভে ফাইল আপলোড" বাটনে ক্লিক করে নতুন ফাইল যোগ করুন।'
                    : 'No matching files found in your Google Drive.'}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredDriveFiles.map((file) => (
                    <div
                      key={file.id}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-700 bg-slate-50/50 dark:bg-slate-800/40 flex items-start justify-between gap-3 transition-all"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        {file.thumbnailLink ? (
                          <img
                            src={file.thumbnailLink}
                            alt={file.name}
                            referrerPolicy="no-referrer"
                            className="w-11 h-11 rounded-lg object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                            {renderFileTypeIcon(file.mimeType)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p
                            className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate"
                            title={file.name}
                          >
                            {file.name}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {formatFileSize(file.size)}
                            {file.modifiedTime
                              ? ` • ${new Date(file.modifiedTime).toLocaleDateString()}`
                              : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleShareDriveFileToFeed(file)}
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/60 cursor-pointer"
                          title={language === 'bn' ? 'নিউজফিডে শেয়ার করুন' : 'Share to Newsfeed'}
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFileToRename(file);
                            setNewFileNameInput(file.name);
                          }}
                          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700 cursor-pointer"
                          title={language === 'bn' ? 'নাম পরিবর্তন করুন' : 'Rename File'}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {file.webViewLink && (
                          <a
                            href={file.webViewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700"
                            title="Open in Google Drive"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => setFileToDelete(file)}
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer"
                          title={language === 'bn' ? 'মুছে ফেলুন' : 'Delete File'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ==================== TAB: GMAIL & INBOX ==================== */}
          {workspaceSubTab === 'gmail' && <GmailView />}

          {/* ==================== TAB 2: GOOGLE CONTACTS ==================== */}
          {workspaceSubTab === 'contacts' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={contactSearch}
                    onChange={(e) => setContactSearch(e.target.value)}
                    placeholder={
                      language === 'bn'
                        ? 'গুগল কন্টাক্টস খুঁজুন (নাম, ইমেইল বা ফোন)...'
                        : 'Search Google Contacts by name, email, or phone...'
                    }
                    className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateContactOpen((prev) => !prev)}
                    className="px-3.5 py-2.5 rounded-xl bg-[#1877F2] hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>
                      {language === 'bn' ? 'নতুন গুগল কন্টাক্ট' : 'Add Google Contact'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={fetchGoogleContacts}
                    disabled={isLoadingContacts}
                    className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
                    title="Refresh Google Contacts"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoadingContacts ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Add New Google Contact Form */}
              {isCreateContactOpen && (
                <form
                  onSubmit={handleCreateGoogleContact}
                  className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                      {language === 'bn'
                        ? 'আপনার গুগল অ্যাকাউন্টে নতুন কন্টাক্ট যোগ করুন'
                        : 'Save New Contact to Your Google Account'}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsCreateContactOpen(false)}
                      className="text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <input
                      type="text"
                      required
                      value={newContactName}
                      onChange={(e) => setNewContactName(e.target.value)}
                      placeholder={language === 'bn' ? 'পূর্ণ নাম *' : 'Full Name *'}
                      className="px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-blue-500"
                    />
                    <input
                      type="email"
                      value={newContactEmail}
                      onChange={(e) => setNewContactEmail(e.target.value)}
                      placeholder={language === 'bn' ? 'ইমেইল ঠিকানা' : 'Email Address'}
                      className="px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-blue-500"
                    />
                    <input
                      type="tel"
                      value={newContactPhone}
                      onChange={(e) => setNewContactPhone(e.target.value)}
                      placeholder={language === 'bn' ? 'ফোন নম্বর' : 'Phone Number'}
                      className="px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isCreatingContact}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                    >
                      {isCreatingContact
                        ? language === 'bn'
                          ? 'সংরক্ষণ হচ্ছে...'
                          : 'Saving...'
                        : language === 'bn'
                        ? 'গুগল কন্টাক্টসে সেভ করুন'
                        : 'Save to Google Contacts'}
                    </button>
                  </div>
                </form>
              )}

              {/* Contacts List */}
              {isLoadingContacts ? (
                <div className="py-12 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
                  <span>
                    {language === 'bn'
                      ? 'গুগল কন্টাক্টস লোড হচ্ছে...'
                      : 'Loading your Google Contacts...'}
                  </span>
                </div>
              ) : filteredContacts.length === 0 ? (
                <div className="py-12 text-center text-slate-500 dark:text-slate-400 text-sm">
                  {language === 'bn'
                    ? 'আপনার গুগল কন্টাক্টসে কোনো কন্টাক্ট পাওয়া যায়নি। উপরে "নতুন গুগল কন্টাক্ট" বাটনে ক্লিক করে যোগ করুন।'
                    : 'No contacts found in your Google Contacts. Click "Add Google Contact" above to create one.'}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredContacts.map((c) => (
                    <div
                      key={c.resourceName}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={
                            c.photoUrl ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=2563eb&color=fff`
                          }
                          alt={c.name}
                          referrerPolicy="no-referrer"
                          className="w-11 h-11 rounded-full object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                            {c.name}
                          </p>
                          {c.email && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                              <Mail className="w-3 h-3 shrink-0" />
                              {c.email}
                            </p>
                          )}
                          {c.phone && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                              <Phone className="w-3 h-3 shrink-0" />
                              {c.phone}
                            </p>
                          )}
                          {c.organization && (
                            <p className="text-[10px] text-blue-600 dark:text-blue-400 truncate flex items-center gap-1">
                              <Building2 className="w-3 h-3 shrink-0" />
                              {c.organization}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            importGoogleContactAsFriend({
                              id: c.resourceName,
                              name: c.name,
                              email: c.email,
                              phone: c.phone,
                              avatar: c.photoUrl,
                            })
                          }
                          className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                          title={
                            language === 'bn'
                              ? 'বন্ধনে ফ্রেন্ড হিসেবে যুক্ত ও চ্যাট করুন'
                              : 'Add to Bandhan Friends & Chat'
                          }
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">
                            {language === 'bn' ? 'চ্যাট' : 'Connect'}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setContactToDelete(c)}
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer"
                          title={language === 'bn' ? 'মুছে ফেলুন' : 'Delete Contact'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ==================== TAB 3: GOOGLE CHAT ==================== */}
          {workspaceSubTab === 'chat' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
                <div>
                  <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-600" />
                    {language === 'bn'
                      ? 'গুগল চ্যাট স্পেস ও মেসেজিং'
                      : 'Google Chat Spaces & Messaging'}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {language === 'bn'
                      ? 'আপনার গুগল চ্যাট স্পেস দেখুন, নতুন স্পেস খুলুন এবং সরাসরি মেসেজ পাঠান।'
                      : 'View your Google Chat Spaces, create new spaces, and send real-time messages.'}
                  </p>
                </div>

                <form onSubmit={handleCreateChatSpace} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newSpaceName}
                    onChange={(e) => setNewSpaceName(e.target.value)}
                    placeholder={
                      language === 'bn' ? 'নতুন স্পেসের নাম...' : 'New Chat Space name...'
                    }
                    className="px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-blue-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isCreatingSpace || !newSpaceName.trim()}
                    className="px-3 py-2 rounded-xl bg-[#1877F2] hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{language === 'bn' ? 'স্পেস তৈরি' : 'Create Space'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={fetchChatSpaces}
                    disabled={isLoadingSpaces}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 cursor-pointer"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoadingSpaces ? 'animate-spin' : ''}`} />
                  </button>
                </form>
              </div>

              {chatApiNotice && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-200 flex items-center justify-between gap-3">
                  <span>{chatApiNotice}</span>
                  <a
                    href="https://mail.google.com/chat"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-amber-600 text-white font-bold shrink-0 flex items-center gap-1"
                  >
                    <span>Open Google Chat Web</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-h-[340px]">
                {/* Spaces Sidebar */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 space-y-1.5 overflow-y-auto max-h-80">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
                    {language === 'bn' ? 'আপনার স্পেসসমূহ' : 'Your Spaces'} ({chatSpaces.length})
                  </p>
                  {isLoadingSpaces ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      {language === 'bn' ? 'লোড হচ্ছে...' : 'Loading spaces...'}
                    </div>
                  ) : chatSpaces.length === 0 ? (
                    <div className="py-8 px-2 text-center text-xs text-slate-400">
                      {language === 'bn'
                        ? 'কোনো গুগল চ্যাট স্পেস পাওয়া যায়নি। উপরে নাম লিখে নতুন স্পেস তৈরি করুন।'
                        : 'No Google Chat spaces found. Create a new space above.'}
                    </div>
                  ) : (
                    chatSpaces.map((sp) => {
                      const active = selectedSpace?.name === sp.name;
                      return (
                        <button
                          key={sp.name}
                          type="button"
                          onClick={() => setSelectedSpace(sp)}
                          className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                            active
                              ? 'bg-blue-600 text-white'
                              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          <span className="truncate">
                            {sp.displayName || sp.name.replace('spaces/', 'Space #')}
                          </span>
                          <span className="text-[10px] opacity-75">{sp.spaceType || 'CHAT'}</span>
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Selected Space Messages */}
                <div className="md:col-span-2 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col justify-between overflow-hidden">
                  {selectedSpace ? (
                    <>
                      <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100">
                          {selectedSpace.displayName || selectedSpace.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => fetchSpaceMessages(selectedSpace.name)}
                          className="text-xs text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <RefreshCw
                            className={`w-3 h-3 ${isLoadingMessages ? 'animate-spin' : ''}`}
                          />
                          {language === 'bn' ? 'রিফ্রেশ' : 'Refresh'}
                        </button>
                      </div>

                      <div className="flex-1 p-3 space-y-2.5 overflow-y-auto max-h-64 bg-slate-50/30 dark:bg-slate-950/30">
                        {isLoadingMessages ? (
                          <p className="text-xs text-slate-400 text-center py-8">
                            {language === 'bn' ? 'মেসেজ লোড হচ্ছে...' : 'Loading messages...'}
                          </p>
                        ) : spaceMessages.length === 0 ? (
                          <p className="text-xs text-slate-400 text-center py-8">
                            {language === 'bn'
                              ? 'এই স্পেসে এখনো কোনো মেসেজ নেই। নিচে প্রথম মেসেজটি লিখুন!'
                              : 'No messages in this space yet. Send the first message below!'}
                          </p>
                        ) : (
                          spaceMessages.map((m) => (
                            <div
                              key={m.name}
                              className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs"
                            >
                              <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                                <span className="font-bold text-blue-600 dark:text-blue-400">
                                  {m.sender?.displayName || 'Google Chat Member'}
                                </span>
                                {m.createTime && (
                                  <span>{new Date(m.createTime).toLocaleTimeString()}</span>
                                )}
                              </div>
                              <p className="text-slate-800 dark:text-slate-100 whitespace-pre-wrap">
                                {m.text || '(Attachment)'}
                              </p>
                            </div>
                          ))
                        )}
                      </div>

                      <form
                        onSubmit={handleSendChatSpaceMessage}
                        className="p-2.5 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 bg-white dark:bg-slate-900"
                      >
                        <input
                          type="text"
                          value={chatMessageDraft}
                          onChange={(e) => setChatMessageDraft(e.target.value)}
                          placeholder={
                            language === 'bn'
                              ? 'গুগল চ্যাট স্পেসে মেসেজ লিখুন...'
                              : 'Write a message to this Google Chat space...'
                          }
                          className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <button
                          type="submit"
                          disabled={isSendingChatMsg || !chatMessageDraft.trim()}
                          className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{language === 'bn' ? 'পাঠান' : 'Send'}</span>
                        </button>
                      </form>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center p-8 text-xs text-slate-400 text-center">
                      {language === 'bn'
                        ? 'বাম পাশ থেকে একটি গুগল চ্যাট স্পেস নির্বাচন করুন অথবা নতুন স্পেস তৈরি করুন।'
                        : 'Select a Google Chat space on the left or create a new space to start messaging.'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ==================== TAB 4: GOOGLE MEET ==================== */}
          {workspaceSubTab === 'meet' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
                <div className="space-y-1">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-white/20">
                    <Video className="w-3 h-3" />
                    Google Meet API v2
                  </span>
                  <h2 className="text-base sm:text-lg font-black">
                    {language === 'bn'
                      ? 'তাৎক্ষণিক গুগল মিট ভিডিও মিটিং তৈরি করুন'
                      : 'Create an Instant Google Meet Video Room'}
                  </h2>
                  <p className="text-xs text-emerald-100">
                    {language === 'bn'
                      ? 'এক ক্লিকে আসল Google Meet লিংক তৈরি করে বন্ধুদের সাথে শেয়ার করুন বা নিউজফিডে পোস্ট করুন।'
                      : 'Generate a real Google Meet conference link in one click and share it with friends or on your Newsfeed.'}
                  </p>
                </div>

                <form
                  onSubmit={handleCreateGoogleMeetSpace}
                  className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0"
                >
                  <input
                    type="text"
                    value={meetTitle}
                    onChange={(e) => setMeetTitle(e.target.value)}
                    placeholder={
                      language === 'bn'
                        ? 'মিটিংয়ের বিষয় (যেমন: গ্রুপ আড্ডা)...'
                        : 'Meeting topic (e.g., Team Hangout)...'
                    }
                    className="px-3.5 py-2.5 rounded-xl bg-white/15 placeholder:text-emerald-100 text-white text-xs border border-white/25 focus:outline-none focus:bg-white/25"
                  />
                  <button
                    type="submit"
                    disabled={isCreatingMeet}
                    className="px-4 py-2.5 rounded-xl bg-white text-emerald-700 hover:bg-emerald-50 font-extrabold text-xs shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                  >
                    <Video className="w-4 h-4" />
                    <span>
                      {isCreatingMeet
                        ? language === 'bn'
                          ? 'তৈরি হচ্ছে...'
                          : 'Creating Meet...'
                        : language === 'bn'
                        ? 'নতুন গুগল মিট রুম খুলুন'
                        : 'New Google Meet'}
                    </span>
                  </button>
                </form>
              </div>

              {/* Newly Created Active Meet Room Banner */}
              {activeMeetRoom && (
                <div className="p-4 rounded-2xl border-2 border-emerald-500/60 bg-emerald-50/50 dark:bg-emerald-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                      <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                        {activeMeetRoom.title}
                      </h3>
                    </div>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300 font-mono break-all">
                      {activeMeetRoom.meetingUri}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    <a
                      href={activeMeetRoom.meetingUri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>{language === 'bn' ? 'মিটিংয়ে যোগ দিন' : 'Join Google Meet'}</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(activeMeetRoom.meetingUri);
                        showToast(
                          language === 'bn'
                            ? '📋 গুগল মিট লিংক কপি করা হয়েছে!'
                            : '📋 Google Meet link copied!',
                        );
                      }}
                      className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{language === 'bn' ? 'কপি লিংক' : 'Copy Link'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleShareMeetToFeed(activeMeetRoom)}
                      className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>{language === 'bn' ? 'ফিডে শেয়ার' : 'Share to Feed'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Saved Meeting Spaces History */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    {language === 'bn'
                      ? 'আপনার তৈরি করা গুগল মিট রুমসমূহ'
                      : 'Your Recent Google Meet Rooms'}
                  </h3>
                  <button
                    type="button"
                    onClick={fetchSavedMeetings}
                    disabled={isLoadingMeetings}
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoadingMeetings ? 'animate-spin' : ''}`} />
                    {language === 'bn' ? 'রিফ্রেশ' : 'Refresh'}
                  </button>
                </div>

                {savedMeetings.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">
                    {language === 'bn'
                      ? 'এখনো কোনো গুগল মিট রুম তৈরি করা হয়নি। উপরে "নতুন গুগল মিট রুম খুলুন" বাটনে ক্লিক করুন।'
                      : 'No Google Meet rooms created yet. Click "New Google Meet" above to create one.'}
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {savedMeetings.map((room, idx) => (
                      <div
                        key={`${room.meetingCode || idx}`}
                        className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                            {room.title}
                          </p>
                          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono truncate">
                            {room.meetingUri}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <a
                            href={room.meetingUri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1"
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span>{language === 'bn' ? 'জয়েন' : 'Join'}</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => handleShareMeetToFeed(room)}
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 cursor-pointer"
                            title={language === 'bn' ? 'ফিডে শেয়ার করুন' : 'Share to Newsfeed'}
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Mandatory Confirmation Modal: Rename Drive File */}
      {fileToRename && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                {language === 'bn'
                  ? 'গুগল ড্রাইভ ফাইলের নাম পরিবর্তন নিশ্চিত করুন'
                  : 'Confirm Google Drive File Rename'}
              </h3>
              <button
                type="button"
                onClick={() => setFileToRename(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {language === 'bn'
                ? `আপনি কি আপনার গুগল ড্রাইভে "${fileToRename.name}" ফাইলটির নাম পরিবর্তন করতে চান?`
                : `Are you sure you want to rename "${fileToRename.name}" in your Google Drive?`}
            </p>
            <input
              type="text"
              value={newFileNameInput}
              onChange={(e) => setNewFileNameInput(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-blue-500"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setFileToRename(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                {language === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={confirmRenameDriveFile}
                disabled={isRenamingFile || !newFileNameInput.trim()}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white cursor-pointer disabled:opacity-50"
              >
                {isRenamingFile
                  ? language === 'bn'
                    ? 'পরিবর্তন হচ্ছে...'
                    : 'Renaming...'
                  : language === 'bn'
                  ? 'নিশ্চিত করুন'
                  : 'Confirm Rename'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mandatory Confirmation Modal: Delete Drive File */}
      {fileToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-rose-600">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="text-base font-extrabold">
                {language === 'bn'
                  ? 'গুগল ড্রাইভ থেকে ফাইল মুছে ফেলা নিশ্চিত করুন'
                  : 'Confirm Permanent Delete from Google Drive'}
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {language === 'bn'
                ? `আপনি কি নিশ্চিতভাবে "${fileToDelete.name}" ফাইলটি আপনার গুগল ড্রাইভ থেকে মুছে ফেলতে চান?`
                : `Are you sure you want to delete "${fileToDelete.name}" from your Google Drive?`}
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setFileToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                {language === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={confirmDeleteDriveFile}
                disabled={isDeletingFile}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer disabled:opacity-50"
              >
                {isDeletingFile
                  ? language === 'bn'
                    ? 'মুছে ফেলা হচ্ছে...'
                    : 'Deleting...'
                  : language === 'bn'
                  ? 'হ্যাঁ, মুছে ফেলুন'
                  : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mandatory Confirmation Modal: Delete Google Contact */}
      {contactToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-rose-600">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="text-base font-extrabold">
                {language === 'bn'
                  ? 'গুগল কন্টাক্ট মুছে ফেলা নিশ্চিত করুন'
                  : 'Confirm Delete from Google Contacts'}
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {language === 'bn'
                ? `আপনি কি নিশ্চিতভাবে "${contactToDelete.name}" (${contactToDelete.email || contactToDelete.phone || contactToDelete.resourceName}) কন্টাক্টটি আপনার গুগল কন্টাক্টস থেকে মুছে ফেলতে চান?`
                : `Are you sure you want to delete "${contactToDelete.name}" (${contactToDelete.email || contactToDelete.phone || contactToDelete.resourceName}) from your Google Contacts?`}
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setContactToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                {language === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={confirmDeleteGoogleContact}
                disabled={isDeletingContact}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer disabled:opacity-50"
              >
                {isDeletingContact
                  ? language === 'bn'
                    ? 'মুছে ফেলা হচ্ছে...'
                    : 'Deleting...'
                  : language === 'bn'
                  ? 'হ্যাঁ, মুছে ফেলুন'
                  : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

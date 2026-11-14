export type ReactionType = 'like' | 'love' | 'care' | 'haha' | 'wow' | 'sad' | 'angry';

export interface User {
  id: string;
  name: string;
  nameBn?: string;
  username: string;
  avatar: string;
  coverImage?: string;
  bio?: string;
  bioBn?: string;
  city?: string;
  workplace?: string;
  joinedDate?: string;
  followersCount: number;
  friendsCount: number;
  isVerified?: boolean;
  pinHash?: string;
  email?: string;
  phone?: string;
  isOnline?: boolean;
  lastSeen?: string;
  location?: string;
  role?: string;
  website?: string;
  education?: string;
  relationship?: string;
  hobbies?: string;
  birthday?: string;
  isBirthdayToday?: boolean;
}

export interface ReactionDetail {
  userId: string;
  type: ReactionType;
  userName: string;
}

export interface CommentReply {
  id: string;
  author: User;
  content: string;
  createdAt: string;
  likesCount: number;
  isLiked?: boolean;
  reactions?: Partial<Record<ReactionType, number>>;
  userReaction?: ReactionType | null;
  userReactions?: Record<string, ReactionType>;
}

export interface PostComment {
  id: string;
  author: User;
  content: string;
  createdAt: string;
  likesCount: number;
  isLiked?: boolean;
  reactions?: Partial<Record<ReactionType, number>>;
  userReaction?: ReactionType | null;
  userReactions?: Record<string, ReactionType>;
  replies?: CommentReply[];
}

export type ThemeMode = 'system' | 'light' | 'dark';

export interface UserActivityItem {
  id: string;
  type: 'login' | 'security' | 'post' | 'reaction' | 'settings';
  titleEn: string;
  titleBn: string;
  detailEn?: string;
  detailBn?: string;
  timestamp: string;
  device?: string;
  ip?: string;
}

export interface Post {
  id: string;
  author: User;
  createdAt: string;
  content: string;
  image?: string;
  video?: string;
  mediaType?: 'image' | 'video';
  gradientBg?: string; // For styled status updates like Facebook
  location?: string;
  isPinned?: boolean;
  isLive?: boolean;
  feeling?: {
    type: string;
    emoji: string;
    labelEn: string;
    labelBn: string;
  };
  privacy: 'public' | 'friends' | 'only_me';
  reactions: Record<ReactionType, number>;
  userReaction?: ReactionType | null;
  userReactions?: Record<string, ReactionType>; // userId -> ReactionType (supports multi-account / different users reacting)
  reactionDetails?: ReactionDetail[];
  comments: PostComment[];
  sharesCount: number;
  isSaved?: boolean;
  groupId?: string;
  groupName?: string;
  driveFile?: {
    id: string;
    name: string;
    mimeType?: string;
    webViewLink?: string;
  };
  scheduledFor?: string;
  expiresAt?: string; // ISO date string when post self-destructs
  selfDestructDuration?: number; // duration in minutes
  poll?: PollData;
}

export interface PollOption {
  id: string;
  text: string;
  votes: string[]; // User IDs who voted for this option
}

export interface PollData {
  id: string;
  question: string;
  options: PollOption[];
  expiresAt?: string;
  isClosed?: boolean;
}

export interface PhotoAlbum {
  id: string;
  userId: string;
  title: string;
  titleBn?: string;
  description?: string;
  coverUrl?: string;
  photos: string[];
  createdAt: string;
  isSystem?: boolean;
}


export interface StoryReactionUser {
  userId: string;
  userName: string;
  userAvatar: string;
  emoji: string;
  createdAt: string;
}

export interface Story {
  id: string;
  author: User;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'text';
  videoUrl?: string;
  audioTitle?: string;
  audioArtist?: string;
  audioUrl?: string;
  duration?: number;
  gradientBg?: string;
  text?: string;
  createdAt: string;
  expiresAt?: number;
  isViewed?: boolean;
  viewsCount?: number;
  reactions?: Record<string, number>;
  userReactions?: Record<string, string>;
  reactionUsers?: StoryReactionUser[];
  musicSticker?: {
    songTitle: string;
    artist: string;
    coverUrl?: string;
  };
}

export type StoryItem = Story;

export interface AudioTrack {
  id: string;
  title: string;
  artist: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar: string;
  sourceType: 'reel' | 'story' | 'library';
  audioUrl?: string;
  videoUrl?: string;
  createdAt: string;
  copyrightLicense: string;
  usesCount: number;
}

export interface GroupChatMessage {
  id: string;
  groupId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  timestamp: string;
}

export interface OfficialPage {
  id: string;
  name: string;
  nameBn?: string;
  category: string;
  description: string;
  avatar: string;
  coverImage: string;
  followersCount: number;
  isFollowed: boolean;
  ownerId: string;
  isVerified?: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  mediaUrl?: string;
  audioUrl?: string;
  audioDuration?: number;
  timestamp: string;
  isRead?: boolean;
  seenAt?: number;
}

export interface ChatConversation {
  friend: User;
  messages: ChatMessage[];
  unreadCount: number;
  isOnline: boolean;
  lastActive?: string;
}

export interface FriendRequest {
  id: string;
  user: User;
  mutualFriends: number;
  timestamp: string;
}

export interface AppNotification {
  id: string;
  type: 'reaction' | 'comment' | 'friend_request' | 'birthday' | 'group' | 'mention';
  sender: User;
  textEn: string;
  textBn: string;
  timestamp: string;
  isRead: boolean;
  postId?: string;
}

export interface MarketplaceItem {
  id: string;
  title: string;
  titleBn?: string;
  price: number;
  currency: string;
  location: string;
  locationBn?: string;
  category: 'electronics' | 'vehicles' | 'furniture' | 'apparel' | 'hobbies';
  imageUrl: string;
  seller: User;
  description: string;
  createdAt: string;
}

export interface SocialGroup {
  id: string;
  name: string;
  nameBn?: string;
  category: string;
  categoryBn?: string;
  membersCount: number;
  coverImage: string;
  description: string;
  isJoined: boolean;
  privacy: 'public' | 'private';
}

export interface ReelItem {
  id: string;
  author: User;
  description: string;
  videoUrl?: string;
  posterUrl?: string;
  songTitle: string;
  likesCount: number;
  commentsCount: number;
  comments?: PostComment[];
  sharesCount: number;
  viewsCount?: number;
  isLiked?: boolean;
  likedUserIds?: string[];
  createdAt?: string;
}

export interface ActiveCall {
  friend: User;
  type: 'audio' | 'video';
}

export type MainTab =
  | 'feed'
  | 'watch'
  | 'marketplace'
  | 'groups'
  | 'pages'
  | 'gaming'
  | 'drive'
  | 'gmail'
  | 'classroom'
  | 'keep'
  | 'profile'
  | 'saved'
  | 'friends';

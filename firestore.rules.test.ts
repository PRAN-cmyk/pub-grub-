/**
 * Firestore Security Rules Test Specification (`firestore.rules.test.ts`)
 * Verifies that all "Dirty Dozen" adversarial payloads return PERMISSION_DENIED.
 */

export interface SecurityTestCase {
  id: number;
  name: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  path: string;
  auth: { uid: string; email?: string; email_verified?: boolean } | null;
  payload?: Record<string, unknown>;
  expected: 'PERMISSION_DENIED' | 'ALLOWED';
}

export const DIRTY_DOZEN_TESTS: SecurityTestCase[] = [
  {
    id: 1,
    name: 'Reject unverified email write on /users/{userId}',
    operation: 'create',
    path: '/users/user_1',
    auth: { uid: 'user_1', email: 'u1@example.com', email_verified: false },
    payload: {
      uid: 'user_1',
      name: 'User One',
      username: 'user_one',
      avatar: 'https://example.com/a.png',
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Reject identity spoofing on /users/{userId}',
    operation: 'create',
    path: '/users/user_2',
    auth: { uid: 'user_1', email: 'u1@example.com', email_verified: true },
    payload: {
      uid: 'user_2',
      name: 'Spoofed',
      username: 'spoof',
      avatar: 'https://example.com/a.png',
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Reject shadow field injection (isAdmin: true) on /users/{userId}',
    operation: 'create',
    path: '/users/user_1',
    auth: { uid: 'user_1', email: 'u1@example.com', email_verified: true },
    payload: {
      uid: 'user_1',
      name: 'User One',
      username: 'user_one',
      avatar: 'https://example.com/a.png',
      isAdmin: true,
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Reject non-owner PII read on /users/{userId}/private/info',
    operation: 'get',
    path: '/users/user_2/private/info',
    auth: { uid: 'user_1', email: 'u1@example.com', email_verified: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Reject oversized bio (>500 chars) on /users/{userId}',
    operation: 'create',
    path: '/users/user_1',
    auth: { uid: 'user_1', email: 'u1@example.com', email_verified: true },
    payload: {
      uid: 'user_1',
      name: 'User One',
      username: 'user_one',
      avatar: 'https://example.com/a.png',
      bio: 'x'.repeat(600),
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Reject poisoned ID on /cloudPosts/{postId}',
    operation: 'create',
    path: '/cloudPosts/bad$id!',
    auth: { uid: 'user_1', email: 'u1@example.com', email_verified: true },
    payload: {},
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Reject post authorId spoofing on /cloudPosts/{postId}',
    operation: 'create',
    path: '/cloudPosts/post_1',
    auth: { uid: 'user_1', email: 'u1@example.com', email_verified: true },
    payload: {
      authorId: 'user_2',
      authorName: 'User Two',
      authorAvatar: 'https://example.com/a.png',
      content: 'Hello',
      privacy: 'public',
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Reject invalid privacy enum on /cloudPosts/{postId}',
    operation: 'create',
    path: '/cloudPosts/post_1',
    auth: { uid: 'user_1', email: 'u1@example.com', email_verified: true },
    payload: {
      authorId: 'user_1',
      authorName: 'User One',
      authorAvatar: 'https://example.com/a.png',
      content: 'Hello',
      privacy: 'invalid_enum',
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Reject forged client timestamp on /cloudPosts/{postId}',
    operation: 'create',
    path: '/cloudPosts/post_1',
    auth: { uid: 'user_1', email: 'u1@example.com', email_verified: true },
    payload: {
      authorId: 'user_1',
      authorName: 'User One',
      authorAvatar: 'https://example.com/a.png',
      content: 'Hello',
      privacy: 'public',
      createdAt: '2020-01-01T00:00:00Z',
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Reject immutable createdAt mutation on /cloudPosts/{postId}',
    operation: 'update',
    path: '/cloudPosts/post_1',
    auth: { uid: 'user_1', email: 'u1@example.com', email_verified: true },
    payload: {
      createdAt: '2025-01-01T00:00:00Z',
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Reject unauthorized read of only_me post on /cloudPosts/{postId}',
    operation: 'get',
    path: '/cloudPosts/private_post_user_2',
    auth: { uid: 'user_1', email: 'u1@example.com', email_verified: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Reject value poisoning (>5000 chars content) on /cloudPosts/{postId} update',
    operation: 'update',
    path: '/cloudPosts/post_1',
    auth: { uid: 'user_1', email: 'u1@example.com', email_verified: true },
    payload: {
      content: 'A'.repeat(5500),
    },
    expected: 'PERMISSION_DENIED',
  },
];

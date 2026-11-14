import { and, desc, eq, or } from 'drizzle-orm';
import { db } from './index.ts';
import { meetingLogs, posts, users } from './schema.ts';

export async function listVisiblePostsForUser(uid: string) {
  try {
    return await db
      .select({
        id: posts.id,
        clientPostId: posts.clientPostId,
        content: posts.content,
        privacy: posts.privacy,
        mediaUrl: posts.mediaUrl,
        mediaType: posts.mediaType,
        meetUri: posts.meetUri,
        createdAt: posts.createdAt,
        authorUid: users.uid,
        authorName: users.name,
        authorEmail: users.email,
        authorAvatar: users.avatar,
      })
      .from(posts)
      .innerJoin(users, eq(posts.userId, users.id))
      .where(or(eq(posts.privacy, 'public'), eq(users.uid, uid)))
      .orderBy(desc(posts.createdAt))
      .limit(50);
  } catch (error) {
    console.error('Database query failed in listVisiblePostsForUser:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function upsertUserPost(params: {
  userId: number;
  clientPostId: string;
  content: string;
  privacy: string;
  mediaUrl?: string | null;
  mediaType?: string | null;
  meetUri?: string | null;
}) {
  try {
    const result = await db
      .insert(posts)
      .values({
        userId: params.userId,
        clientPostId: params.clientPostId,
        content: params.content,
        privacy: params.privacy,
        mediaUrl: params.mediaUrl || null,
        mediaType: params.mediaType || null,
        meetUri: params.meetUri || null,
      })
      .onConflictDoUpdate({
        target: posts.clientPostId,
        set: {
          content: params.content,
          privacy: params.privacy,
          mediaUrl: params.mediaUrl || null,
          mediaType: params.mediaType || null,
          meetUri: params.meetUri || null,
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database query failed in upsertUserPost:', error);
    throw new Error('Failed to save post. Please try again later.', { cause: error });
  }
}

export async function deleteUserPostByClientId(userId: number, clientPostId: string) {
  try {
    await db
      .delete(posts)
      .where(and(eq(posts.userId, userId), eq(posts.clientPostId, clientPostId)));
  } catch (error) {
    console.error('Database query failed in deleteUserPostByClientId:', error);
    throw new Error('Failed to delete post. Please try again later.', { cause: error });
  }
}

export async function listUserMeetings(uid: string) {
  try {
    return await db
      .select({
        id: meetingLogs.id,
        spaceName: meetingLogs.spaceName,
        meetingCode: meetingLogs.meetingCode,
        meetingUri: meetingLogs.meetingUri,
        title: meetingLogs.title,
        createdAt: meetingLogs.createdAt,
      })
      .from(meetingLogs)
      .innerJoin(users, eq(meetingLogs.userId, users.id))
      .where(eq(users.uid, uid))
      .orderBy(desc(meetingLogs.createdAt))
      .limit(30);
  } catch (error) {
    console.error('Database query failed in listUserMeetings:', error);
    throw new Error('Failed to fetch meeting history. Please try again later.', {
      cause: error,
    });
  }
}

export async function createMeetingLog(params: {
  userId: number;
  spaceName: string;
  meetingCode: string;
  meetingUri: string;
  title: string;
}) {
  try {
    const result = await db
      .insert(meetingLogs)
      .values({
        userId: params.userId,
        spaceName: params.spaceName,
        meetingCode: params.meetingCode,
        meetingUri: params.meetingUri,
        title: params.title,
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database query failed in createMeetingLog:', error);
    throw new Error('Failed to record meeting space. Please try again later.', {
      cause: error,
    });
  }
}

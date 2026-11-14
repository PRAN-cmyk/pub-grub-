import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  name: text('name'),
  avatar: text('avatar'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  clientPostId: text('client_post_id').notNull().unique(),
  content: text('content').notNull(),
  privacy: text('privacy').notNull(),
  mediaUrl: text('media_url'),
  mediaType: text('media_type'),
  meetUri: text('meet_uri'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const meetingLogs = pgTable('meeting_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  spaceName: text('space_name').notNull(),
  meetingCode: text('meeting_code').notNull(),
  meetingUri: text('meeting_uri').notNull(),
  title: text('title').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  meetingLogs: many(meetingLogs),
}));

export const postsRelations = relations(posts, ({ one }) => ({
  author: one(users, {
    fields: [posts.userId],
    references: [users.id],
  }),
}));

export const meetingLogsRelations = relations(meetingLogs, ({ one }) => ({
  creator: one(users, {
    fields: [meetingLogs.userId],
    references: [users.id],
  }),
}));

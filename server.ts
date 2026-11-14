import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';
import { z } from 'zod';
import { requireAuth, AuthRequest } from './src/middleware/auth.ts';
import { getOrCreateUser } from './src/db/users.ts';
import {
  listVisiblePostsForUser,
  upsertUserPost,
  deleteUserPostByClientId,
  listUserMeetings,
  createMeetingLog,
} from './src/db/social.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim());

const safeIdRegex = /^[a-zA-Z0-9_\-]+$/;

const postSchema = z.object({
  clientPostId: z
    .string()
    .trim()
    .min(1, 'Post ID is required')
    .max(200, 'Post ID too long')
    .regex(safeIdRegex, 'Invalid post ID format'),
  content: z
    .string()
    .trim()
    .min(1, 'Post content cannot be empty')
    .max(10000, 'Post content exceeds 10,000 characters limit'),
  privacy: z.enum(['public', 'friends', 'only_me']).default('public'),
  mediaUrl: z.string().trim().max(500000).nullable().optional(),
  mediaType: z.enum(['image', 'video', 'text']).nullable().optional(),
  meetUri: z.string().trim().max(1000).nullable().optional(),
  authorName: z.string().trim().max(200).optional(),
  authorAvatar: z.string().trim().max(500000).optional(),
});

const meetingSchema = z.object({
  spaceName: z.string().trim().max(200).default('spaces/instant'),
  meetingCode: z.string().trim().max(200).default(''),
  meetingUri: z.string().trim().min(1, 'Meeting URI is required').max(2000),
  title: z.string().trim().max(300).default('Bandhan Video Meeting'),
});

export const albumSchema = z.object({
  title: z.string().trim().min(1, 'Album title is required').max(150),
  titleBn: z.string().trim().max(150).optional(),
  description: z.string().trim().max(1000).optional(),
  coverUrl: z.string().trim().max(500000).optional(),
  photos: z.array(z.string().trim().max(500000)).default([]),
});

async function startServer() {
  const app = express();
  const PORT = process.env.NODE_ENV === 'production' && process.env.PORT ? Number(process.env.PORT) : 3000;

  app.use(
    helmet({
      frameguard: false,
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: false,
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: false,
    }),
  );

  // Allow embedding within AI Studio iframe
  app.use((_req, res, next) => {
    res.removeHeader('X-Frame-Options');
    next();
  });

  app.use(
    cors({
      origin: (origin, callback) => {
        if (
          !origin ||
          allowedOrigins.includes(origin) ||
          origin.includes('.run.app') ||
          origin.includes('.googleusercontent.com') ||
          origin.includes('localhost') ||
          origin.includes('127.0.0.1')
        ) {
          callback(null, true);
          return;
        }

        callback(null, true);
      },
      credentials: true,
    }),
  );

  app.use(
    express.json({
      limit: '10mb',
    }),
  );

  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many authentication requests, please try again later.' },
  });

  // Apply rate limiter ONLY to API endpoints, not static assets or Vite
  app.use('/api', generalLimiter);

  // Sync user profile and fetch visible posts
  app.get('/api/posts', authLimiter, requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      const email = req.user?.email || `${uid}@bandhan.local`;
      if (!uid) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      await getOrCreateUser(uid, email, req.user?.name, req.user?.picture);
      const rows = await listVisiblePostsForUser(uid);
      return res.json({ posts: rows });
    } catch (error: unknown) {
      console.error('Failed to fetch posts:', error);
      const msg = error instanceof Error ? error.message : 'Failed to fetch posts';
      return res.status(500).json({ error: msg });
    }
  });

  // Create or update a post
  app.post('/api/posts', authLimiter, requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      const email = req.user?.email || `${uid}@bandhan.local`;
      if (!uid) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const parsed = postSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: 'Invalid post payload',
          details: parsed.error.flatten(),
        });
      }

      const data = parsed.data;
      const dbUser = await getOrCreateUser(
        uid,
        email,
        data.authorName || req.user?.name,
        data.authorAvatar || req.user?.picture,
      );

      const saved = await upsertUserPost({
        userId: dbUser.id,
        clientPostId: String(data.clientPostId),
        content: String(data.content),
        privacy: String(data.privacy || 'public'),
        mediaUrl: data.mediaUrl ?? null,
        mediaType: data.mediaType ?? null,
        meetUri: data.meetUri ?? null,
      });

      return res.json({ post: saved });
    } catch (error: unknown) {
      console.error('Failed to save post:', error);
      const msg = error instanceof Error ? error.message : 'Failed to save post';
      return res.status(500).json({ error: msg });
    }
  });

  // Delete a post
  app.delete('/api/posts/:clientPostId', authLimiter, requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      const email = req.user?.email || `${uid}@bandhan.local`;
      if (!uid) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const clientPostId = String(req.params.clientPostId || '').trim();
      if (!safeIdRegex.test(clientPostId) || clientPostId.length > 200) {
        return res.status(400).json({ error: 'Invalid clientPostId format' });
      }

      const dbUser = await getOrCreateUser(uid, email, req.user?.name, req.user?.picture);
      await deleteUserPostByClientId(dbUser.id, clientPostId);
      return res.json({ ok: true });
    } catch (error: unknown) {
      console.error('Failed to delete post:', error);
      const msg = error instanceof Error ? error.message : 'Failed to delete post';
      return res.status(500).json({ error: msg });
    }
  });

  // Fetch user's Google Meet spaces history
  app.get('/api/meetings', authLimiter, requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      const email = req.user?.email || `${uid}@bandhan.local`;
      if (!uid) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      await getOrCreateUser(uid, email, req.user?.name, req.user?.picture);
      const meetings = await listUserMeetings(uid);
      return res.json({ meetings });
    } catch (error: unknown) {
      console.error('Failed to fetch meetings:', error);
      const msg = error instanceof Error ? error.message : 'Failed to fetch meetings';
      return res.status(500).json({ error: msg });
    }
  });

  // Record a new Google Meet space
  app.post('/api/meetings', authLimiter, requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      const email = req.user?.email || `${uid}@bandhan.local`;
      if (!uid) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const parsed = meetingSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: 'Invalid meeting payload',
          details: parsed.error.flatten(),
        });
      }

      const data = parsed.data;
      const dbUser = await getOrCreateUser(uid, email, req.user?.name, req.user?.picture);
      const created = await createMeetingLog({
        userId: dbUser.id,
        spaceName: String(data.spaceName),
        meetingCode: String(data.meetingCode),
        meetingUri: String(data.meetingUri),
        title: String(data.title),
      });

      return res.json({ meeting: created });
    } catch (error: unknown) {
      console.error('Failed to save meeting:', error);
      const msg = error instanceof Error ? error.message : 'Failed to save meeting';
      return res.status(500).json({ error: msg });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        const indexHtmlPath = path.resolve(__dirname, 'index.html');
        let template = fs.readFileSync(indexHtmlPath, 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  server.on('error', (err: any) => {
    console.error(`Server error on port ${PORT}:`, err);
  });
}

startServer();

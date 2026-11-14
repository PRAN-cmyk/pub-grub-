/**
 * Cloudinary Media & Video Integration for Bandhan
 * - 100% Free Tier (No credit card, no Firebase billing required).
 * - Direct browser-to-Cloudinary unsigned REST upload with real-time progress.
 * - Hardware-accelerated global CDN URLs with automatic format (f_auto) and quality (q_auto).
 * - Automatic graceful fallback to high-capacity IndexedDB Native Blob storage if offline or unconfigured.
 */

import { fileToDataUrl } from './storage';
import { auth, uploadMediaToFirebaseStorage } from '../firebase';

export interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
  apiKey?: string;
  isCustomConfigured: boolean;
}

export interface CloudinaryUploadResult {
  url: string;
  secureUrl: string;
  publicId: string;
  resourceType: 'image' | 'video' | 'raw';
  format?: string;
  duration?: number;
  width?: number;
  height?: number;
  bytes?: number;
  isCloudinary: boolean;
}

const STORAGE_KEY_CLOUD_NAME = 'bandhan_cloudinary_cloud_name';
const STORAGE_KEY_UPLOAD_PRESET = 'bandhan_cloudinary_upload_preset';
const STORAGE_KEY_API_KEY = 'bandhan_cloudinary_api_key';

// Default free-tier ready configuration
// Users can provide their own cloud name and unsigned preset in settings
const DEFAULT_CLOUD_NAME = 'dkhpt0h9z'; // Pre-configured community free-tier cloud for Bandhan
const DEFAULT_UPLOAD_PRESET = 'bandhan_unsigned'; // Pre-configured unsigned upload preset

/**
 * Retrieves the currently active Cloudinary configuration.
 */
export function getCloudinaryConfig(): CloudinaryConfig {
  let customCloud = '';
  let customPreset = '';
  let customApiKey = '';

  try {
    customCloud = localStorage.getItem(STORAGE_KEY_CLOUD_NAME) || '';
    customPreset = localStorage.getItem(STORAGE_KEY_UPLOAD_PRESET) || '';
    customApiKey = localStorage.getItem(STORAGE_KEY_API_KEY) || '';
  } catch {
    // ignore localStorage restriction
  }

  const envCloud = (import.meta as any).env?.VITE_CLOUDINARY_CLOUD_NAME || '';
  const envPreset = (import.meta as any).env?.VITE_CLOUDINARY_UPLOAD_PRESET || '';

  const cloudName = customCloud.trim() || envCloud.trim() || DEFAULT_CLOUD_NAME;
  const uploadPreset = customPreset.trim() || envPreset.trim() || DEFAULT_UPLOAD_PRESET;

  const isCustomConfigured = Boolean(
    (customCloud.trim() && customPreset.trim()) || (envCloud.trim() && envPreset.trim()),
  );

  return {
    cloudName,
    uploadPreset,
    apiKey: customApiKey.trim() || undefined,
    isCustomConfigured,
  };
}

/**
 * Saves custom user/admin Cloudinary credentials into local secure storage.
 */
export function saveCloudinaryConfig(cloudName: string, uploadPreset: string, apiKey?: string): void {
  try {
    if (cloudName.trim()) {
      localStorage.setItem(STORAGE_KEY_CLOUD_NAME, cloudName.trim());
    } else {
      localStorage.removeItem(STORAGE_KEY_CLOUD_NAME);
    }

    if (uploadPreset.trim()) {
      localStorage.setItem(STORAGE_KEY_UPLOAD_PRESET, uploadPreset.trim());
    } else {
      localStorage.removeItem(STORAGE_KEY_UPLOAD_PRESET);
    }

    if (apiKey?.trim()) {
      localStorage.setItem(STORAGE_KEY_API_KEY, apiKey.trim());
    } else {
      localStorage.removeItem(STORAGE_KEY_API_KEY);
    }
  } catch (err) {
    console.warn('Failed to save Cloudinary configuration to storage:', err);
  }
}

/**
 * Clears custom Cloudinary credentials and restores system defaults.
 */
export function resetCloudinaryConfig(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_CLOUD_NAME);
    localStorage.removeItem(STORAGE_KEY_UPLOAD_PRESET);
    localStorage.removeItem(STORAGE_KEY_API_KEY);
  } catch {
    // ignore
  }
}

/**
 * Detects whether a File object is a video.
 */
export function isVideoFile(file: File): boolean {
  if (file.type.startsWith('video/')) return true;
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  return ['mp4', 'mov', 'webm', 'mkv', 'avi', 'm4v', '3gp', 'ogg', 'ts'].includes(ext);
}

/**
 * Uploads any media (Video or Photo) to Cloudinary via unsigned HTTP POST.
 * Provides fine-grained upload progress callbacks (0% to 100%).
 * If Cloudinary fails or is offline, falls back seamlessly to high-speed local IndexedDB storage.
 */
export async function uploadMediaToCloudinary(
  file: File,
  options?: {
    onProgress?: (percent: number) => void;
    folder?: string;
    resourceType?: 'auto' | 'image' | 'video';
  },
): Promise<CloudinaryUploadResult> {
  const config = getCloudinaryConfig();
  const isVideo = isVideoFile(file);
  const resourceType = options?.resourceType || (isVideo ? 'video' : 'image');

  // Attempt Cloudinary direct upload
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', config.uploadPreset);
    if (options?.folder) {
      formData.append('folder', options.folder);
    }

    const uploadUrl = `https://api.cloudinary.com/v1_1/${config.cloudName}/${resourceType}/upload`;

    const response = await new Promise<any>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', uploadUrl);
      xhr.timeout = 120000;

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && options?.onProgress) {
          const percent = Math.min(99, Math.round((event.loaded / event.total) * 100));
          options.onProgress(percent);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            if (options?.onProgress) options.onProgress(100);
            resolve(data);
          } catch (e) {
            reject(new Error('Invalid JSON response from Cloudinary'));
          }
        } else {
          try {
            const errData = JSON.parse(xhr.responseText);
            reject(new Error(errData.error?.message || `Cloudinary upload failed with status ${xhr.status}`));
          } catch {
            reject(new Error(`Cloudinary upload failed with status ${xhr.status}`));
          }
        }
      };

      xhr.onerror = () => reject(new Error('Network error during Cloudinary upload'));
      xhr.ontimeout = () => reject(new Error('Cloudinary upload timed out'));

      xhr.send(formData);
    });

    return {
      url: response.url || response.secure_url,
      secureUrl: response.secure_url || response.url,
      publicId: response.public_id,
      resourceType: response.resource_type || (isVideo ? 'video' : 'image'),
      format: response.format,
      duration: response.duration,
      width: response.width,
      height: response.height,
      bytes: response.bytes || file.size,
      isCloudinary: true,
    };
  } catch (error) {
    console.warn('Cloudinary upload failed, attempting cloud Storage fallback:', error);

    if (auth.currentUser && file.size <= 50 * 1024 * 1024) {
      try {
        const firebaseUrl = await uploadMediaToFirebaseStorage(file, options?.onProgress);
        return {
          url: firebaseUrl,
          secureUrl: firebaseUrl,
          publicId: `fb_${Date.now()}`,
          resourceType: isVideo ? 'video' : 'image',
          bytes: file.size,
          isCloudinary: false,
        };
      } catch (fbErr) {
        console.warn('Firebase Storage fallback failed, switching to local IndexedDB blob:', fbErr);
      }
    }

    // Smooth fallback to IndexedDB Native Blob storage so the user's action never halts
    if (options?.onProgress) {
      options.onProgress(80);
    }
    const localUrl = await fileToDataUrl(file);
    if (options?.onProgress) {
      options.onProgress(100);
    }

    return {
      url: localUrl,
      secureUrl: localUrl,
      publicId: `local_${Date.now()}`,
      resourceType: isVideo ? 'video' : 'image',
      bytes: file.size,
      isCloudinary: false,
    };
  }
}

/**
 * Generates an optimized Cloudinary delivery URL with automatic format and quality.
 */
export function getOptimizedCloudinaryUrl(
  url: string,
  options?: { width?: number; height?: number; crop?: string; quality?: string },
): string {
  if (!url || !url.includes('cloudinary.com')) return url;

  const transformations: string[] = ['f_auto', 'q_auto'];
  if (options?.width) transformations.push(`w_${options.width}`);
  if (options?.height) transformations.push(`h_${options.height}`);
  if (options?.crop) transformations.push(`c_${options.crop}`);

  const transformStr = transformations.join(',');

  // Insert transformations after /upload/
  if (url.includes('/upload/')) {
    return url.replace('/upload/', `/upload/${transformStr}/`);
  }

  return url;
}

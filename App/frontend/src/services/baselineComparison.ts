// src/services/baselineComparison.ts
import { extractFaceEmbedding, cosineSimilarity } from '@/utils/faceEmbedding';

export interface BiometricBaseline {
  faceEmbedding: Float32Array;
  capturedAt: number;
  epicNumber: string;
}

export interface BaselineComparisonResult {
  passed: boolean;
  baselineMatch: number; // 0-100 similarity score
  spoofingDetected: boolean;
  attemptsRemaining: number;
  lockoutUntil?: Date;
}

// In-memory baseline storage (in production, use encrypted IndexedDB)
const baselineStore = new Map<string, BiometricBaseline>();
const attemptTracker = new Map<string, { count: number; lastAttempt: number }>();

const MAX_ATTEMPTS = 3;
const LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes
const MATCH_THRESHOLD = 0.85; // 85% similarity required

export const saveBaseline = async (
  epicNumber: string,
  videoFrame: HTMLVideoElement | HTMLCanvasElement
): Promise<void> => {
  try {
    const embedding = await extractFaceEmbedding(videoFrame);
    
    const baseline: BiometricBaseline = {
      faceEmbedding: embedding,
      capturedAt: Date.now(),
      epicNumber
    };

    baselineStore.set(epicNumber, baseline);
  } catch (error) {
    console.error('Failed to save baseline:', error);
    throw new Error('Failed to capture biometric baseline');
  }
};

export const compareWithBaseline = async (
  epicNumber: string,
  videoFrame: HTMLVideoElement | HTMLCanvasElement,
  multiFrameVerification: boolean = true
): Promise<BaselineComparisonResult> => {
  
  // Check if user is locked out
  const lockoutStatus = checkLockout(epicNumber);
  if (lockoutStatus.isLockedOut) {
    return {
      passed: false,
      baselineMatch: 0,
      spoofingDetected: false,
      attemptsRemaining: 0,
      lockoutUntil: lockoutStatus.lockoutUntil
    };
  }

  // Get stored baseline
  const baseline = baselineStore.get(epicNumber);
  if (!baseline) {
    throw new Error('No baseline found for this user. Please complete registration first.');
  }

  try {
    let totalSimilarity = 0;
    let validFrames = 0;
    const framesToCheck = multiFrameVerification ? 5 : 1;

    // Compare multiple frames for consistency
    for (let i = 0; i < framesToCheck; i++) {
      if (i > 0) {
        // Wait a bit between frames
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      const currentEmbedding = await extractFaceEmbedding(videoFrame);
      const similarity = cosineSimilarity(baseline.faceEmbedding, currentEmbedding);
      
      if (similarity > 0) { // Valid comparison
        totalSimilarity += similarity;
        validFrames++;
      }
    }

    if (validFrames === 0) {
      throw new Error('Could not extract face features from video');
    }

    const averageSimilarity = totalSimilarity / validFrames;
    const matchScore = Math.round(averageSimilarity * 100);
    const passed = averageSimilarity >= MATCH_THRESHOLD;

    // Detect spoofing
    const spoofingDetected = detectSpoofing(videoFrame);

    if (!passed) {
      // Track failed attempt
      trackFailedAttempt(epicNumber);
    } else {
      // Reset attempts on success
      attemptTracker.delete(epicNumber);
    }

    const attempts = attemptTracker.get(epicNumber);
    const attemptsRemaining = MAX_ATTEMPTS - (attempts?.count || 0);

    return {
      passed: passed && !spoofingDetected,
      baselineMatch: matchScore,
      spoofingDetected,
      attemptsRemaining: Math.max(0, attemptsRemaining),
      lockoutUntil: attempts && attempts.count >= MAX_ATTEMPTS 
        ? new Date(attempts.lastAttempt + LOCKOUT_DURATION)
        : undefined
    };

  } catch (error) {
    console.error('Baseline comparison error:', error);
    throw error;
  }
};

const checkLockout = (epicNumber: string): { 
  isLockedOut: boolean; 
  lockoutUntil?: Date 
} => {
  const attempts = attemptTracker.get(epicNumber);
  if (!attempts || attempts.count < MAX_ATTEMPTS) {
    return { isLockedOut: false };
  }

  const now = Date.now();
  const lockoutEnd = attempts.lastAttempt + LOCKOUT_DURATION;

  if (now < lockoutEnd) {
    return {
      isLockedOut: true,
      lockoutUntil: new Date(lockoutEnd)
    };
  }

  // Lockout expired, reset attempts
  attemptTracker.delete(epicNumber);
  return { isLockedOut: false };
};

const trackFailedAttempt = (epicNumber: string): void => {
  const now = Date.now();
  const existing = attemptTracker.get(epicNumber);

  if (existing) {
    // Check if we should reset (after lockout period)
    if (now - existing.lastAttempt > LOCKOUT_DURATION) {
      attemptTracker.set(epicNumber, { count: 1, lastAttempt: now });
    } else {
      attemptTracker.set(epicNumber, {
        count: existing.count + 1,
        lastAttempt: now
      });
    }
  } else {
    attemptTracker.set(epicNumber, { count: 1, lastAttempt: now });
  }
};

const detectSpoofing = (videoFrame: HTMLVideoElement | HTMLCanvasElement): boolean => {
  // Anti-spoofing techniques:
  // 1. Texture analysis - detect flat surfaces (photos/screens)
  // 2. 3D depth estimation - detect lack of depth
  // 3. Motion analysis - detect lack of natural micro-movements
  
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;

    // Get dimensions
    const width = videoFrame instanceof HTMLVideoElement 
      ? videoFrame.videoWidth 
      : videoFrame.width;
    const height = videoFrame instanceof HTMLVideoElement 
      ? videoFrame.videoHeight 
      : videoFrame.height;

    canvas.width = width;
    canvas.height = height;

    // Draw frame
    ctx.drawImage(videoFrame, 0, 0);
    const imageData = ctx.getImageData(0, 0, width, height);
    
    // Texture analysis - calculate variance
    const variance = calculateTextureVariance(imageData);
    
    // Low variance suggests flat surface (photo/screen)
    // Threshold: variance < 500 is suspicious
    const isFlatSurface = variance < 500;

    // In production, add more sophisticated checks:
    // - Monocular depth estimation using ML
    // - Motion coherence analysis
    // - Face landmark depth consistency
    
    return isFlatSurface;

  } catch (error) {
    console.error('Spoofing detection error:', error);
    return false; // Fail open to avoid false positives
  }
};

const calculateTextureVariance = (imageData: ImageData): number => {
  const pixels = imageData.data;
  let mean = 0;
  let variance = 0;
  const sampleSize = pixels.length / 4; // Number of pixels

  // Calculate mean brightness
  for (let i = 0; i < pixels.length; i += 4) {
    const gray = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
    mean += gray;
  }
  mean /= sampleSize;

  // Calculate variance
  for (let i = 0; i < pixels.length; i += 4) {
    const gray = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
    variance += Math.pow(gray - mean, 2);
  }
  variance /= sampleSize;

  return variance;
};

// Behavioral biometric matching (optional enhancement)
export const matchBehavioralBiometrics = (
  baselineHeadMovements: number[],
  currentHeadMovements: number[]
): number => {
  // Compare head movement patterns (speed, smoothness, range)
  // Returns similarity score 0-1
  
  if (baselineHeadMovements.length !== currentHeadMovements.length) {
    return 0;
  }

  let totalDiff = 0;
  for (let i = 0; i < baselineHeadMovements.length; i++) {
    totalDiff += Math.abs(baselineHeadMovements[i] - currentHeadMovements[i]);
  }

  const avgDiff = totalDiff / baselineHeadMovements.length;
  const similarity = Math.max(0, 1 - (avgDiff / 100));

  return similarity;
};

// Clear baseline (for testing or logout)
export const clearBaseline = (epicNumber: string): void => {
  baselineStore.delete(epicNumber);
  attemptTracker.delete(epicNumber);
};

// Get baseline status
export const hasBaseline = (epicNumber: string): boolean => {
  return baselineStore.has(epicNumber);
};
// src/hooks/useMediaPipe.ts
import { useEffect, useRef, useState } from 'react';

interface FaceLandmarks {
  landmarks: { x: number; y: number; z: number }[];
  boundingBox: { xMin: number; yMin: number; width: number; height: number };
}

interface HeadPose {
  yaw: number;   // Left-right rotation (-90 to 90)
  pitch: number; // Up-down rotation (-90 to 90)
  roll: number;  // Tilt (-90 to 90)
}

export interface MediaPipeResult {
  faceLandmarks: FaceLandmarks | null;
  headPose: HeadPose | null;
  faceCount: number;
  confidence: number;
}

export const useMediaPipe = (videoRef: React.RefObject<HTMLVideoElement>) => {
  const [isReady, setIsReady] = useState(false);
  const [result, setResult] = useState<MediaPipeResult>({
    faceLandmarks: null,
    headPose: null,
    faceCount: 0,
    confidence: 0
  });
  const animationFrameId = useRef<number>();

  // Calculate head pose from landmarks
  const calculateHeadPose = (landmarks: { x: number; y: number; z: number }[]): HeadPose => {
    if (landmarks.length < 468) {
      return { yaw: 0, pitch: 0, roll: 0 };
    }

    // Use specific landmark points for pose estimation
    const noseTip = landmarks[1];
    const leftEye = landmarks[33];
    const rightEye = landmarks[263];
    const leftMouth = landmarks[61];
    const rightMouth = landmarks[291];

    // Calculate yaw (left-right rotation)
    const eyeMidX = (leftEye.x + rightEye.x) / 2;
    const yaw = (noseTip.x - eyeMidX) * 180;

    // Calculate pitch (up-down rotation)
    const eyeMidY = (leftEye.y + rightEye.y) / 2;
    const mouthMidY = (leftMouth.y + rightMouth.y) / 2;
    const pitch = (mouthMidY - eyeMidY) * 90;

    // Calculate roll (tilt)
    const eyeAngle = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x);
    const roll = eyeAngle * (180 / Math.PI);

    return { yaw, pitch, roll };
  };

  // Detect faces using simple computer vision (placeholder for MediaPipe)
  const detectFaces = async () => {
    if (!videoRef.current || !isReady) return;

    const video = videoRef.current;

    // Wait until video has enough data
    if (video.readyState < 2) {
      animationFrameId.current = requestAnimationFrame(detectFaces);
      return;
    }

    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(video, 0, 0);
      const mockLandmarks = generateMockLandmarks(canvas.width, canvas.height);
      const headPose = calculateHeadPose(mockLandmarks);

      setResult({
        faceLandmarks: {
          landmarks: mockLandmarks,
          boundingBox: {
            xMin: canvas.width * 0.3,
            yMin: canvas.height * 0.2,
            width: canvas.width * 0.4,
            height: canvas.height * 0.5
          }
        },
        headPose,
        faceCount: 1,
        confidence: 0.95
      });
    } catch (error) {
      console.error('Face detection error:', error);
    }

    animationFrameId.current = requestAnimationFrame(detectFaces);
  };

  // Generate mock landmarks (replace with actual MediaPipe in production)
  const generateMockLandmarks = (width: number, height: number) => {
    const landmarks = [];
    const centerX = width / 2;
    const centerY = height / 2;
    
    for (let i = 0; i < 468; i++) {
      const angle = (i / 468) * Math.PI * 2;
      const radius = 100 + Math.random() * 50;
      landmarks.push({
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        z: Math.random() * 50 - 25
      });
    }
    
    return landmarks;
  };

  useEffect(() => {
    // Check if video is ready
    if (!videoRef.current) return;

    const video = videoRef.current;
    
    // Wait for video to be ready
    const handleLoadedData = () => {
      console.log('Video loaded, initializing MediaPipe...');
      setIsReady(true);
    };

    const handleError = (e: Event) => {
      console.error('Video error:', e);
    };

    if (video.readyState >= 2) {
      // Video already loaded
      setIsReady(true);
    } else {
      video.addEventListener('loadeddata', handleLoadedData);
      video.addEventListener('error', handleError);
    }

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('error', handleError);
    };
  }, [videoRef]);

  useEffect(() => {
    if (isReady && videoRef.current) {
      console.log('Starting face detection...');
      detectFaces();
    }

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isReady, videoRef]);

  return { isReady, result };
};
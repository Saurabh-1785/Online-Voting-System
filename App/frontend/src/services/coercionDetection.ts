// src/services/coercionDetection.ts
import { MediaPipeResult } from '@/hooks/useMediaPipe';

export interface CoercionIndicators {
  visualStress: boolean;
  offCameraGaze: boolean;
  multiplePersons: boolean;
  voiceStress: boolean;
  unnaturalBehavior: boolean;
}

export interface CoercionAnalysisResult {
  coercionRiskScore: number; // 0-100
  coercionIndicators: CoercionIndicators;
  confidence: number;
  shouldBlock: boolean;
  details: string[];
}

// Track gaze history for pattern analysis
interface GazeHistory {
  timestamp: number;
  offCamera: boolean;
}

let gazeHistory: GazeHistory[] = [];
let previousHeadPose: any = null;
let previousTimestamp: number = 0;

export const analyzeCoercionRisk = (
  mediaPipeResult: MediaPipeResult,
  audioAnalysis?: AudioAnalysisResult
): CoercionAnalysisResult => {
  const indicators: CoercionIndicators = {
    visualStress: false,
    offCameraGaze: false,
    multiplePersons: false,
    voiceStress: false,
    unnaturalBehavior: false
  };

  const details: string[] = [];
  let riskScore = 0;

  if (!mediaPipeResult.faceLandmarks || !mediaPipeResult.headPose) {
    return {
      coercionRiskScore: 0,
      coercionIndicators: indicators,
      confidence: 0,
      shouldBlock: false,
      details: ['No face detected']
    };
  }

  // 1. Check for multiple persons
  if (mediaPipeResult.faceCount > 1) {
    indicators.multiplePersons = true;
    riskScore += 30;
    details.push(`Multiple faces detected (${mediaPipeResult.faceCount})`);
  }

  // 2. Analyze gaze patterns
  const gazeAnalysis = analyzeGazePattern(mediaPipeResult.headPose);
  if (gazeAnalysis.frequentOffCameraGlances) {
    indicators.offCameraGaze = true;
    riskScore += 20;
    details.push(`Frequent off-camera glances detected (${gazeAnalysis.offCameraCount} in 30s)`);
  }

  // 3. Detect micro-expressions indicating stress
  const stressDetected = detectMicroExpressions(mediaPipeResult.faceLandmarks);
  if (stressDetected.hasStressIndicators) {
    indicators.visualStress = true;
    riskScore += 25;
    details.push(`Stress indicators: ${stressDetected.indicators.join(', ')}`);
  }

  // 4. Analyze head movement patterns
  const movementAnalysis = analyzeHeadMovement(mediaPipeResult.headPose);
  if (movementAnalysis.isUnnatural) {
    indicators.unnaturalBehavior = true;
    riskScore += 15;
    details.push('Unnatural head movement detected');
  }

  // 5. Voice stress analysis (if available)
  if (audioAnalysis) {
    const voiceStress = analyzeVoiceStress(audioAnalysis);
    if (voiceStress.stressDetected) {
      indicators.voiceStress = true;
      riskScore += 20;
      details.push(`Voice stress: ${voiceStress.reason}`);
    }
  }

  const shouldBlock = riskScore > 75;
  const confidence = mediaPipeResult.confidence;

  return {
    coercionRiskScore: Math.min(riskScore, 100),
    coercionIndicators: indicators,
    confidence,
    shouldBlock,
    details
  };
};

// Analyze gaze patterns over time
const analyzeGazePattern = (headPose: any): { 
  frequentOffCameraGlances: boolean; 
  offCameraCount: number 
} => {
  const now = Date.now();
  const { yaw, pitch } = headPose;
  
  // Consider off-camera if yaw > 30° or pitch > 30°
  const isOffCamera = Math.abs(yaw) > 30 || Math.abs(pitch) > 30;
  
  // Add to history
  gazeHistory.push({ timestamp: now, offCamera: isOffCamera });
  
  // Keep only last 30 seconds
  gazeHistory = gazeHistory.filter(h => now - h.timestamp < 30000);
  
  // Count off-camera instances
  const offCameraCount = gazeHistory.filter(h => h.offCamera).length;
  
  // Flag if more than 5 off-camera glances in 30 seconds
  return {
    frequentOffCameraGlances: offCameraCount > 5,
    offCameraCount
  };
};

// Detect micro-expressions indicating stress/fear
const detectMicroExpressions = (landmarks: any): {
  hasStressIndicators: boolean;
  indicators: string[];
} => {
  const indicators: string[] = [];
  
  if (!landmarks || !landmarks.landmarks) {
    return { hasStressIndicators: false, indicators };
  }

  const landmarkPoints = landmarks.landmarks;
  
  // 1. Eyebrow position (raised = surprise/fear)
  const leftEyebrow = landmarkPoints[70];
  const rightEyebrow = landmarkPoints[300];
  const leftEye = landmarkPoints[33];
  const rightEye = landmarkPoints[263];
  
  if (leftEyebrow && rightEyebrow && leftEye && rightEye) {
    const leftBrowHeight = leftEye.y - leftEyebrow.y;
    const rightBrowHeight = rightEye.y - rightEyebrow.y;
    const avgBrowHeight = (leftBrowHeight + rightBrowHeight) / 2;
    
    // If eyebrows are significantly raised
    if (avgBrowHeight > 30) {
      indicators.push('Raised eyebrows (surprise/fear)');
    }
  }

  // 2. Mouth corners (downturned = stress/sadness)
  const leftMouth = landmarkPoints[61];
  const rightMouth = landmarkPoints[291];
  const mouthTop = landmarkPoints[13];
  
  if (leftMouth && rightMouth && mouthTop) {
    const mouthCornerAvgY = (leftMouth.y + rightMouth.y) / 2;
    
    // If mouth corners are lower than expected
    if (mouthCornerAvgY - mouthTop.y > 20) {
      indicators.push('Tense mouth position');
    }
  }

  // 3. Eye widening (fear indicator)
  const leftEyeUpper = landmarkPoints[159];
  const leftEyeLower = landmarkPoints[145];
  
  if (leftEyeUpper && leftEyeLower) {
    const eyeOpenness = Math.abs(leftEyeLower.y - leftEyeUpper.y);
    
    // If eyes are unusually wide
    if (eyeOpenness > 15) {
      indicators.push('Wide eyes (fear)');
    }
  }

  return {
    hasStressIndicators: indicators.length > 0,
    indicators
  };
};

// Analyze head movement for unnatural patterns
const analyzeHeadMovement = (currentPose: any): {
  isUnnatural: boolean;
  reason?: string;
} => {
  const now = Date.now();
  
  if (!previousHeadPose || !previousTimestamp) {
    previousHeadPose = currentPose;
    previousTimestamp = now;
    return { isUnnatural: false };
  }

  const deltaTime = (now - previousTimestamp) / 1000; // in seconds
  
  if (deltaTime === 0) {
    return { isUnnatural: false };
  }

  // Calculate angular velocities
  const yawVelocity = Math.abs(currentPose.yaw - previousHeadPose.yaw) / deltaTime;
  const pitchVelocity = Math.abs(currentPose.pitch - previousHeadPose.pitch) / deltaTime;
  
  // Calculate acceleration
  const yawAccel = yawVelocity / deltaTime;
  const pitchAccel = pitchVelocity / deltaTime;
  
  previousHeadPose = currentPose;
  previousTimestamp = now;

  // Detect jerky movements (high acceleration)
  if (yawAccel > 150 || pitchAccel > 150) {
    return {
      isUnnatural: true,
      reason: 'Jerky/forced movement detected'
    };
  }

  // Detect too-perfect movements (coached behavior)
  if (yawVelocity > 0 && yawVelocity < 5 && Math.abs(currentPose.yaw) > 20) {
    return {
      isUnnatural: true,
      reason: 'Suspiciously smooth coached movement'
    };
  }

  return { isUnnatural: false };
};

// Audio analysis result interface
export interface AudioAnalysisResult {
  pitchVariation: number;
  speechRate: number;
  voiceTremor: boolean;
  backgroundNoise: boolean;
}

// Analyze voice for stress indicators
const analyzeVoiceStress = (audioAnalysis: AudioAnalysisResult): {
  stressDetected: boolean;
  reason: string;
} => {
  const reasons: string[] = [];

  // High pitch variation indicates stress
  if (audioAnalysis.pitchVariation > 50) {
    reasons.push('high pitch variation');
  }

  // Very fast or very slow speech
  if (audioAnalysis.speechRate < 2 || audioAnalysis.speechRate > 4) {
    reasons.push('abnormal speech rate');
  }

  // Voice trembling
  if (audioAnalysis.voiceTremor) {
    reasons.push('voice trembling');
  }

  // Background voices or prompting
  if (audioAnalysis.backgroundNoise) {
    reasons.push('background voices detected');
  }

  return {
    stressDetected: reasons.length > 0,
    reason: reasons.join(', ')
  };
};

// Reset tracking history (call between sessions)
export const resetCoercionTracking = () => {
  gazeHistory = [];
  previousHeadPose = null;
  previousTimestamp = 0;
};

// Get coercion warning message based on risk score
export const getCoercionWarning = (riskScore: number): {
  title: string;
  message: string;
  action: 'allow' | 'warn' | 'block';
} => {
  if (riskScore < 50) {
    return {
      title: 'Low Risk',
      message: 'No significant coercion indicators detected.',
      action: 'allow'
    };
  } else if (riskScore < 75) {
    return {
      title: '⚠️ Potential Coercion Detected',
      message: 'We detected some indicators that suggest you may be under pressure. If you are being coerced, please close this window and contact authorities. You can retry registration later in a private setting.',
      action: 'warn'
    };
  } else {
    return {
      title: '🚨 High Coercion Risk',
      message: 'For your safety, this registration session has been blocked. Multiple indicators suggest potential coercion. Please contact the election commission for manual verification.',
      action: 'block'
    };
  }
};
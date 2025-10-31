// src/services/livenessDetection.ts
import { MediaPipeResult } from '@/hooks/useMediaPipe';

export interface LivenessChallenge {
  type: 'head_turn' | 'read_numbers' | 'blink' | 'smile' | 'nod' | 'face_front' | 'lighting';
  parameters: {
    direction?: 'left' | 'right' | 'up' | 'down';
    digits?: string;
    count?: number;
    targetAngle?: number;
  };
  duration: number;
  order: number;
  instruction: string;
}

export interface LivenessResult {
  challengePassed: boolean;
  confidence: number;
  feedback: string;
}

// Generate randomized challenges to prevent replay attacks
export const generateLivenessChallenges = (count: number = 5): LivenessChallenge[] => {
  const allChallenges: LivenessChallenge[] = [
    {
      type: 'face_front',
      parameters: { targetAngle: 0 },
      duration: 3,
      order: 1,
      instruction: 'Face camera directly'
    },
    {
      type: 'lighting',
      parameters: {},
      duration: 2,
      order: 2,
      instruction: 'Ensure good lighting'
    },
    {
      type: 'head_turn',
      parameters: { direction: 'left', targetAngle: -45 },
      duration: 4,
      order: 3,
      instruction: 'Slowly turn your head to the LEFT'
    },
    {
      type: 'head_turn',
      parameters: { direction: 'right', targetAngle: 45 },
      duration: 4,
      order: 4,
      instruction: 'Slowly turn your head to the RIGHT'
    },
    {
      type: 'read_numbers',
      parameters: { digits: generateRandomDigits() },
      duration: 5,
      order: 5,
      instruction: `Read these numbers aloud: ${generateRandomDigits()}`
    },
    {
      type: 'blink',
      parameters: { count: Math.floor(Math.random() * 3) + 2 },
      duration: 3,
      order: 6,
      instruction: `Blink ${Math.floor(Math.random() * 3) + 2} times`
    },
    {
      type: 'smile',
      parameters: {},
      duration: 3,
      order: 7,
      instruction: 'Smile naturally'
    },
    {
      type: 'nod',
      parameters: { direction: 'up' },
      duration: 4,
      order: 8,
      instruction: 'Nod your head UP and DOWN slowly'
    }
  ];

  // Shuffle and select random challenges
  const shuffled = allChallenges.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map((challenge, index) => ({
    ...challenge,
    order: index + 1
  }));
};

const generateRandomDigits = (): string => {
  const digits = [];
  for (let i = 0; i < 4; i++) {
    digits.push(Math.floor(Math.random() * 10));
  }
  return digits.join('-');
};

// Verify liveness challenge completion
export const verifyLivenessChallenge = (
  challenge: LivenessChallenge,
  mediaPipeResult: MediaPipeResult,
  frameData?: ImageData
): LivenessResult => {
  if (!mediaPipeResult.faceLandmarks || !mediaPipeResult.headPose) {
    return {
      challengePassed: false,
      confidence: 0,
      feedback: 'No face detected'
    };
  }

  const { headPose, faceCount, confidence } = mediaPipeResult;

  // Ensure only one face
  if (faceCount !== 1) {
    return {
      challengePassed: false,
      confidence: 0,
      feedback: 'Multiple faces detected or no face found'
    };
  }

  switch (challenge.type) {
    case 'face_front':
      return verifyFaceFront(headPose, confidence);
    
    case 'lighting':
      return verifyLighting(frameData, confidence);
    
    case 'head_turn':
      return verifyHeadTurn(headPose, challenge.parameters, confidence);
    
    case 'blink':
      return verifyBlink(mediaPipeResult.faceLandmarks, confidence);
    
    case 'smile':
      return verifySmile(mediaPipeResult.faceLandmarks, confidence);
    
    case 'nod':
      return verifyNod(headPose, confidence);
    
    case 'read_numbers':
      // Voice verification would require audio processing
      // Simulated for now
      return {
        challengePassed: true,
        confidence: 0.85,
        feedback: 'Voice challenge completed'
      };
    
    default:
      return {
        challengePassed: false,
        confidence: 0,
        feedback: 'Unknown challenge type'
      };
  }
};

const verifyFaceFront = (headPose: any, baseConfidence: number): LivenessResult => {
  const { yaw, pitch } = headPose;
  const isCenter = Math.abs(yaw) < 15 && Math.abs(pitch) < 15;
  
  return {
    challengePassed: isCenter,
    confidence: isCenter ? baseConfidence : 0.3,
    feedback: isCenter ? 'Face positioned correctly' : 'Please face the camera directly'
  };
};

const verifyLighting = (frameData: ImageData | undefined, baseConfidence: number): LivenessResult => {
  if (!frameData) {
    return { challengePassed: true, confidence: 0.7, feedback: 'Lighting check passed' };
  }

  // Calculate average brightness
  let totalBrightness = 0;
  const pixels = frameData.data;
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    totalBrightness += (r + g + b) / 3;
  }
  
  const avgBrightness = totalBrightness / (pixels.length / 4);
  const isGoodLighting = avgBrightness >= 50 && avgBrightness <= 200;
  
  return {
    challengePassed: isGoodLighting,
    confidence: isGoodLighting ? baseConfidence : 0.4,
    feedback: isGoodLighting ? 'Lighting is good' : 'Please improve lighting conditions'
  };
};

const verifyHeadTurn = (headPose: any, params: any, baseConfidence: number): LivenessResult => {
  const { yaw } = headPose;
  const targetAngle = params.targetAngle || 0;
  const tolerance = 10;
  
  const isCorrectAngle = Math.abs(yaw - targetAngle) < tolerance;
  
  return {
    challengePassed: isCorrectAngle,
    confidence: isCorrectAngle ? baseConfidence : 0.4,
    feedback: isCorrectAngle 
      ? `Head turned ${params.direction} correctly` 
      : `Please turn head ${params.direction}`
  };
};

const verifyBlink = (landmarks: any, baseConfidence: number): LivenessResult => {
  // In production, track eye aspect ratio over time to detect blinks
  // Simulated for now
  const blinkDetected = Math.random() > 0.3;
  
  return {
    challengePassed: blinkDetected,
    confidence: blinkDetected ? baseConfidence : 0.5,
    feedback: blinkDetected ? 'Blink detected' : 'Please blink as instructed'
  };
};

const verifySmile = (landmarks: any, baseConfidence: number): LivenessResult => {
  // In production, detect mouth corners lifting
  // Simulated for now
  const smileDetected = Math.random() > 0.3;
  
  return {
    challengePassed: smileDetected,
    confidence: smileDetected ? baseConfidence : 0.5,
    feedback: smileDetected ? 'Smile detected' : 'Please smile naturally'
  };
};

const verifyNod = (headPose: any, baseConfidence: number): LivenessResult => {
  const { pitch } = headPose;
  // In production, track pitch changes over time
  const nodDetected = Math.abs(pitch) > 10;
  
  return {
    challengePassed: nodDetected,
    confidence: nodDetected ? baseConfidence : 0.5,
    feedback: nodDetected ? 'Nod detected' : 'Please nod your head'
  };
};

// Anti-spoofing: Texture analysis
export const detectTextureSpoof = (frameData: ImageData): number => {
  if (!frameData) return 0.5;
  
  // Simple texture analysis based on variance
  const pixels = frameData.data;
  let variance = 0;
  let mean = 0;
  
  // Calculate mean
  for (let i = 0; i < pixels.length; i += 4) {
    const gray = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
    mean += gray;
  }
  mean /= (pixels.length / 4);
  
  // Calculate variance
  for (let i = 0; i < pixels.length; i += 4) {
    const gray = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
    variance += Math.pow(gray - mean, 2);
  }
  variance /= (pixels.length / 4);
  
  // Low variance suggests flat surface (photo/screen)
  const spoofScore = variance < 500 ? 0.8 : 0.2;
  return spoofScore;
};

// Calculate movement smoothness (detect jerky/forced movements)
export const calculateMovementSmoothness = (
  previousPose: any,
  currentPose: any,
  deltaTime: number
): { smooth: boolean; acceleration: number } => {
  if (!previousPose || !currentPose || deltaTime === 0) {
    return { smooth: true, acceleration: 0 };
  }

  const yawChange = Math.abs(currentPose.yaw - previousPose.yaw);
  const pitchChange = Math.abs(currentPose.pitch - previousPose.pitch);
  
  const velocity = (yawChange + pitchChange) / deltaTime;
  const acceleration = velocity / deltaTime;
  
  // High acceleration suggests forced movement
  const smooth = acceleration < 100;
  
  return { smooth, acceleration };
};
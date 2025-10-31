// src/utils/faceEmbedding.ts

/**
 * Extract a 128-dimensional face embedding from a video frame or canvas
 * In production, this would use a pre-trained FaceNet or similar model via TensorFlow.js
 * For now, we'll create a simplified version that extracts features from the image
 */
export const extractFaceEmbedding = async (
  source: HTMLVideoElement | HTMLCanvasElement
): Promise<Float32Array> => {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    // Get dimensions
    const width = source instanceof HTMLVideoElement 
      ? source.videoWidth 
      : source.width;
    const height = source instanceof HTMLVideoElement 
      ? source.videoHeight 
      : source.height;

    if (width === 0 || height === 0) {
      throw new Error('Invalid video dimensions');
    }

    // Resize to standard size for consistent embeddings
    const targetSize = 128;
    canvas.width = targetSize;
    canvas.height = targetSize;

    // Draw and resize image
    ctx.drawImage(source, 0, 0, targetSize, targetSize);
    const imageData = ctx.getImageData(0, 0, targetSize, targetSize);

    // Extract features (simplified version)
    // In production, use TensorFlow.js with FaceNet or similar model
    const embedding = extractSimplifiedFeatures(imageData);

    return embedding;

  } catch (error) {
    console.error('Face embedding extraction error:', error);
    throw error;
  }
};

/**
 * Simplified feature extraction
 * In production, replace with actual FaceNet model inference
 */
const extractSimplifiedFeatures = (imageData: ImageData): Float32Array => {
  const embedding = new Float32Array(128);
  const pixels = imageData.data;
  const width = imageData.width;
  const height = imageData.height;

  // Divide image into 8x8 grid (64 regions)
  const gridSize = 8;
  const cellWidth = width / gridSize;
  const cellHeight = height / gridSize;

  let featureIndex = 0;

  // Extract features from each grid cell
  for (let gy = 0; gy < gridSize; gy++) {
    for (let gx = 0; gx < gridSize; gx++) {
      const x = Math.floor(gx * cellWidth);
      const y = Math.floor(gy * cellHeight);
      const w = Math.floor(cellWidth);
      const h = Math.floor(cellHeight);

      // Calculate average RGB and variance for this region
      const stats = calculateRegionStats(pixels, x, y, w, h, width);
      
      embedding[featureIndex++] = stats.avgR / 255;
      embedding[featureIndex++] = stats.avgG / 255;

      if (featureIndex >= 128) break;
    }
    if (featureIndex >= 128) break;
  }

  // Normalize the embedding
  normalizeEmbedding(embedding);

  return embedding;
};

/**
 * Calculate statistics for an image region
 */
const calculateRegionStats = (
  pixels: Uint8ClampedArray,
  x: number,
  y: number,
  w: number,
  h: number,
  imageWidth: number
): {
  avgR: number;
  avgG: number;
  avgB: number;
  variance: number;
} => {
  let sumR = 0, sumG = 0, sumB = 0;
  let count = 0;

  for (let py = y; py < y + h; py++) {
    for (let px = x; px < x + w; px++) {
      const index = (py * imageWidth + px) * 4;
      if (index < pixels.length) {
        sumR += pixels[index];
        sumG += pixels[index + 1];
        sumB += pixels[index + 2];
        count++;
      }
    }
  }

  const avgR = count > 0 ? sumR / count : 0;
  const avgG = count > 0 ? sumG / count : 0;
  const avgB = count > 0 ? sumB / count : 0;

  // Calculate variance
  let variance = 0;
  for (let py = y; py < y + h; py++) {
    for (let px = x; px < x + w; px++) {
      const index = (py * imageWidth + px) * 4;
      if (index < pixels.length) {
        const gray = (pixels[index] + pixels[index + 1] + pixels[index + 2]) / 3;
        const avgGray = (avgR + avgG + avgB) / 3;
        variance += Math.pow(gray - avgGray, 2);
      }
    }
  }
  variance = count > 0 ? variance / count : 0;

  return { avgR, avgG, avgB, variance };
};

/**
 * Normalize embedding to unit length (L2 normalization)
 */
const normalizeEmbedding = (embedding: Float32Array): void => {
  let sumSquares = 0;
  for (let i = 0; i < embedding.length; i++) {
    sumSquares += embedding[i] * embedding[i];
  }
  
  const magnitude = Math.sqrt(sumSquares);
  if (magnitude > 0) {
    for (let i = 0; i < embedding.length; i++) {
      embedding[i] /= magnitude;
    }
  }
};

/**
 * Calculate cosine similarity between two embeddings
 * Returns value between -1 and 1 (higher is more similar)
 */
export const cosineSimilarity = (
  embedding1: Float32Array,
  embedding2: Float32Array
): number => {
  if (embedding1.length !== embedding2.length) {
    throw new Error('Embeddings must have the same length');
  }

  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < embedding1.length; i++) {
    dotProduct += embedding1[i] * embedding2[i];
    norm1 += embedding1[i] * embedding1[i];
    norm2 += embedding2[i] * embedding2[i];
  }

  norm1 = Math.sqrt(norm1);
  norm2 = Math.sqrt(norm2);

  if (norm1 === 0 || norm2 === 0) {
    return 0;
  }

  return dotProduct / (norm1 * norm2);
};

/**
 * Calculate Euclidean distance between two embeddings
 * Returns value >= 0 (lower is more similar)
 */
export const euclideanDistance = (
  embedding1: Float32Array,
  embedding2: Float32Array
): number => {
  if (embedding1.length !== embedding2.length) {
    throw new Error('Embeddings must have the same length');
  }

  let sumSquares = 0;
  for (let i = 0; i < embedding1.length; i++) {
    const diff = embedding1[i] - embedding2[i];
    sumSquares += diff * diff;
  }

  return Math.sqrt(sumSquares);
};

/**
 * Check if two faces match based on similarity threshold
 */
export const doFacesMatch = (
  embedding1: Float32Array,
  embedding2: Float32Array,
  threshold: number = 0.85
): boolean => {
  const similarity = cosineSimilarity(embedding1, embedding2);
  return similarity >= threshold;
};

/**
 * Detect if embedding represents a valid face
 * (checks for minimum variance/entropy)
 */
export const isValidFaceEmbedding = (embedding: Float32Array): boolean => {
  // Calculate variance of embedding values
  let mean = 0;
  for (let i = 0; i < embedding.length; i++) {
    mean += embedding[i];
  }
  mean /= embedding.length;

  let variance = 0;
  for (let i = 0; i < embedding.length; i++) {
    variance += Math.pow(embedding[i] - mean, 2);
  }
  variance /= embedding.length;

  // Low variance suggests uniform input (e.g., blank screen)
  // Threshold: variance should be > 0.001
  return variance > 0.001;
};

// Note: In production, integrate actual TensorFlow.js models:
// 
// import * as tf from '@tensorflow/tfjs';
// import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
// 
// export const loadFaceNetModel = async () => {
//   const model = await tf.loadGraphModel('path/to/facenet/model.json');
//   return model;
// };
// 
// export const extractFaceEmbeddingWithModel = async (
//   model: tf.GraphModel,
//   canvas: HTMLCanvasElement
// ): Promise<Float32Array> => {
//   const tensor = tf.browser.fromPixels(canvas);
//   const resized = tf.image.resizeBilinear(tensor, [160, 160]);
//   const normalized = resized.div(255.0);
//   const batched = normalized.expandDims(0);
//   
//   const embedding = await model.predict(batched) as tf.Tensor;
//   const embeddingArray = await embedding.data();
//   
//   tensor.dispose();
//   resized.dispose();
//   normalized.dispose();
//   batched.dispose();
//   embedding.dispose();
//   
//   return new Float32Array(embeddingArray);
// };
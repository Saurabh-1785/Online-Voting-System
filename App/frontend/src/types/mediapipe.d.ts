declare module '@mediapipe/face_mesh' {
  export interface Results {
    multiFaceLandmarks?: Array<Array<{x: number; y: number; z: number}>>;
    image: HTMLVideoElement | HTMLCanvasElement;
  }

  export class FaceMesh {
    constructor(config: {
      locateFile: (file: string) => string;
    });
    setOptions(options: {
      maxNumFaces?: number;
      refineLandmarks?: boolean;
      minDetectionConfidence?: number;
      minTrackingConfidence?: number;
    }): void;
    onResults(callback: (results: Results) => void): void;
    send(inputs: { image: HTMLVideoElement | HTMLCanvasElement }): Promise<void>;
    close(): void;
  }
}

declare module '@mediapipe/camera_utils' {
  export class Camera {
    constructor(
      video: HTMLVideoElement,
      options: {
        onFrame: () => Promise<void>;
        width?: number;
        height?: number;
      }
    );
    start(): void;
    stop(): void;
  }
}
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, Check, X, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const Liveness = () => {
  const navigate = useNavigate();
  const [cameraActive, setCameraActive] = useState(false);
  const [currentChallenge, setCurrentChallenge] = useState(0);
  const [challengeComplete, setChallengeComplete] = useState<boolean[]>([false, false, false]);
  const [verificationStatus, setVerificationStatus] = useState<"idle" | "processing" | "success" | "failed">("idle");
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const challenges = [
    "Please turn your head slowly to the LEFT",
    "Read these numbers aloud: 7-4-1-9",
    "Blink THREE times",
  ];

  useEffect(() => {
    // Check if logged in
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    if (!isLoggedIn) {
      toast.error("Please login first");
      navigate("/login");
      return;
    }

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [navigate]); // Removed stream from dependency array

  // FIX 1: Separate useEffect to attach stream to video
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      
      videoRef.current.onloadedmetadata = () => {
        videoRef.current?.play()
          .then(() => {
            console.log("✅ Camera feed active");
            setCameraActive(true);
          })
          .catch(err => {
            console.error("❌ Video play error:", err);
            toast.error("Failed to start video");
          });
      };
    }
  }, [stream]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: true, // Changed to true for voice challenge
      });
      
      setStream(mediaStream);
      console.log("✅ Camera stream obtained");
      
      // Don't set cameraActive here - wait for video to actually play
      // setCameraActive will be set in the useEffect above
      
    } catch (error) {
      console.error("❌ Camera error:", error);
      toast.error("Camera access denied. Please enable camera permissions.");
      setVerificationStatus("failed");
    }
  };

  // FIX 2: Only start verification after camera is actually active
  useEffect(() => {
    if (cameraActive && verificationStatus === "idle") {
      startVerification();
    }
  }, [cameraActive]);

  const startVerification = () => {
    console.log("🚀 Starting verification");
    setVerificationStatus("processing");
    setCurrentChallenge(0);
    simulateChallenge(0);
  };

  const simulateChallenge = (challengeIndex: number) => {
    console.log(`Challenge ${challengeIndex + 1} started`);
    
    // Simulate challenge completion after 4 seconds
    setTimeout(() => {
      const newComplete = [...challengeComplete];
      newComplete[challengeIndex] = true;
      setChallengeComplete(newComplete);
      
      console.log(`✓ Challenge ${challengeIndex + 1} completed`);

      if (challengeIndex < challenges.length - 1) {
        setCurrentChallenge(challengeIndex + 1);
        simulateChallenge(challengeIndex + 1);
      } else {
        // All challenges complete
        completeVerification();
      }
    }, 4000);
  };

  const completeVerification = () => {
    console.log("✅ All challenges completed");
    setVerificationStatus("success");
    toast.success("Identity verified successfully!");

    // Cleanup camera
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    // Redirect to voting page
    setTimeout(() => {
      navigate("/vote");
    }, 3000);
  };

  const handleRetry = () => {
    if (attemptsLeft <= 1) {
      toast.error("Maximum attempts exceeded. Logging out...");
      localStorage.removeItem("isLoggedIn");
      setTimeout(() => navigate("/login"), 2000);
      return;
    }

    setAttemptsLeft(prev => prev - 1);
    setVerificationStatus("idle");
    setChallengeComplete([false, false, false]);
    setCurrentChallenge(0);
    setCameraActive(false);
    
    // Restart camera
    startCamera();
  };

  const handleCancel = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    localStorage.removeItem("isLoggedIn");
    navigate("/");
    toast("Verification cancelled");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {verificationStatus === "success" ? (
        <Card className="p-8 text-center max-w-md animate-fade-in">
          <div className="bg-secondary/10 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6 relative">
            <Check className="h-16 w-16 text-secondary" />
            <div className="absolute inset-0 bg-secondary/20 rounded-full animate-ping"></div>
          </div>
          <h2 className="text-3xl font-bold text-secondary mb-3">✓ Identity Verified Successfully</h2>
          <p className="text-muted-foreground mb-6">Redirecting to ballot...</p>
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
          </div>
        </Card>
      ) : verificationStatus === "failed" ? (
        <Card className="p-8 text-center max-w-md animate-fade-in">
          <div className="bg-destructive/10 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
            <X className="h-16 w-16 text-destructive" />
          </div>
          <h2 className="text-3xl font-bold text-destructive mb-3">Verification Failed</h2>
          <p className="text-muted-foreground mb-6">Please try again.</p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-6">
            <AlertCircle className="h-4 w-4" />
            <span>Attempts remaining: {attemptsLeft} of 3</span>
          </div>
          <div className="flex gap-4 justify-center">
            <Button onClick={handleCancel} variant="outline">
              Cancel
            </Button>
            <Button onClick={handleRetry} variant="hero">
              Retry
            </Button>
          </div>
        </Card>
      ) : (
        <div className="w-full max-w-5xl">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold mb-2">Identity Verification</h1>
            <p className="text-muted-foreground">Complete the following challenges to verify your identity</p>
          </div>

          <div className="relative">
            <div className="relative bg-black rounded-2xl overflow-hidden shadow-2xl">
              {/* Always show video element, but show loading if not active */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full aspect-video object-cover ${!cameraActive ? 'hidden' : ''}`}
              />
              
              {!cameraActive ? (
                <div className="aspect-video flex items-center justify-center bg-black">
                  <div className="text-center text-white">
                    <Camera className="h-16 w-16 mx-auto mb-4 opacity-50 animate-pulse" />
                    <p className="text-lg">Initializing camera...</p>
                    <p className="text-sm text-muted-foreground mt-2">Please allow camera access</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Face Detection Oval */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-96 h-[500px] border-4 border-secondary rounded-[50%] shadow-lg"></div>
                  </div>

                  {/* Progress Ring */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    <circle
                      cx="50%"
                      cy="50%"
                      r="200"
                      fill="none"
                      stroke="rgba(19, 136, 8, 0.3)"
                      strokeWidth="8"
                    />
                    <circle
                      cx="50%"
                      cy="50%"
                      r="200"
                      fill="none"
                      stroke="rgb(19, 136, 8)"
                      strokeWidth="8"
                      strokeDasharray={`${(challengeComplete.filter(Boolean).length / challenges.length) * 1256} 1256`}
                      strokeLinecap="round"
                      transform="rotate(-90 50% 50%)"
                      className="transition-all duration-500"
                    />
                  </svg>

                  {/* Challenge Text */}
                  {verificationStatus === "processing" && (
                    <div className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-card/95 backdrop-blur-sm px-8 py-4 rounded-xl shadow-xl max-w-lg z-10">
                      <p className="text-xl font-semibold text-center">{challenges[currentChallenge]}</p>
                      <p className="text-sm text-muted-foreground text-center mt-2">
                        Challenge {currentChallenge + 1} of {challenges.length}
                      </p>
                    </div>
                  )}

                  {/* Checkmarks */}
                  <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-4 z-10">
                    {challengeComplete.map((complete, index) => (
                      <div
                        key={index}
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                          complete
                            ? "bg-secondary text-secondary-foreground shadow-lg scale-110"
                            : index === currentChallenge
                            ? "bg-primary/20 border-2 border-primary animate-pulse"
                            : "bg-muted/50 border-2 border-muted"
                        }`}
                      >
                        {complete ? <Check className="h-6 w-6" /> : <span className="text-sm">{index + 1}</span>}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Cancel Button */}
            <div className="absolute top-4 right-4 z-20">
              <Button onClick={handleCancel} variant="destructive" size="sm">
                Cancel
              </Button>
            </div>
          </div>

          {/* Instructions */}
          <Card className="mt-6 p-6 bg-muted/50">
            <h3 className="font-semibold mb-3">Instructions:</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Position your face within the oval outline</li>
              <li>• Ensure good lighting on your face</li>
              <li>• Follow each challenge instruction carefully</li>
              <li>• Speak clearly when reading aloud</li>
              <li>• Complete all 3 challenges to proceed</li>
            </ul>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Liveness;
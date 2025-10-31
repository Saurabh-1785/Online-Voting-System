// Enhanced src/pages/register/Step3.tsx with AI-powered coercion detection
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Header from "@/components/Header";
import ProgressStepper from "@/components/ProgressStepper";
import { Camera, Check, AlertTriangle, Shield } from "lucide-react";
import { toast } from "sonner";
import { useMediaPipe } from "@/hooks/useMediaPipe";
import { generateLivenessChallenges, verifyLivenessChallenge } from "@/services/livenessDetection";
import { analyzeCoercionRisk, getCoercionWarning, resetCoercionTracking } from "@/services/coercionDetection";
import { saveBaseline } from "@/services/baselineComparison";

const Step3 = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  const [cameraState, setCameraState] = useState<"idle" | "requesting" | "granted" | "denied">("idle");
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingComplete, setRecordingComplete] = useState(false);
  
  const [challenges] = useState(generateLivenessChallenges(5));
  const [currentChallengeIndex, setCurrentChallengeIndex] = useState(-1);
  const [completedChallenges, setCompletedChallenges] = useState<boolean[]>(new Array(5).fill(false));
  
  const [coercionRisk, setCoercionRisk] = useState(0);
  const [coercionWarnings, setCoercionWarnings] = useState<string[]>([]);
  const [showCoercionAlert, setShowCoercionAlert] = useState(false);
  
  const { isReady, result } = useMediaPipe(videoRef);

  const steps = [
    { number: 1, title: "Eligibility" },
    { number: 2, title: "Verification" },
    { number: 3, title: "Biometric" },
    { number: 4, title: "Confirmation" },
  ];

  useEffect(() => {
    const data = localStorage.getItem("registrationData");
    if (!data) {
      toast.error("Please complete previous steps first");
      navigate("/register/step-1");
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      resetCoercionTracking();
    };
  }, [navigate, stream]);

  // Real-time coercion monitoring
  useEffect(() => {
    if (!isProcessing || !isReady) return;

    const monitorCoercion = setInterval(() => {
      if (result.faceLandmarks && result.headPose) {
        const coercionAnalysis = analyzeCoercionRisk(result);
        
        setCoercionRisk(coercionAnalysis.coercionRiskScore);
        
        if (coercionAnalysis.coercionRiskScore > 50 && !showCoercionAlert) {
          setShowCoercionAlert(true);
          setCoercionWarnings(coercionAnalysis.details);
        }

        if (coercionAnalysis.shouldBlock) {
          toast.error("Session blocked due to high coercion risk");
          handleBlockSession();
        }
      }
    }, 2000); // Check every 2 seconds

    return () => clearInterval(monitorCoercion);
  }, [isProcessing, isReady, result, showCoercionAlert]);

  useEffect(() => {
    if (!videoRef.current) return;

    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        videoRef.current!.srcObject = stream;
        videoRef.current!.onloadedmetadata = () => {
          videoRef.current!.play();
          console.log("✅ Camera feed active");
        };
      })
      .catch((err) => console.error("❌ Camera error:", err));
  }, []);


  const requestCameraAccess = async () => {
    setCameraState("requesting");
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user", width: 1280, height: 720 },
        audio: true 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setCameraState("granted");
      toast.success("Camera access granted");
    } catch (error) {
      setCameraState("denied");
      toast.error("Camera access denied. Please enable camera permissions.");
    }
  };

  const startRecording = () => {
    setIsProcessing(true);
    setCurrentChallengeIndex(0);
    resetCoercionTracking();
    setCoercionRisk(0);
    setCoercionWarnings([]);
    setShowCoercionAlert(false);
    processChallenges();
  };

  const processChallenges = async () => {
    for (let i = 0; i < challenges.length; i++) {
      setCurrentChallengeIndex(i);
      
      // Wait for challenge duration
      const challenge = challenges[i];
      await new Promise(resolve => setTimeout(resolve, challenge.duration * 1000));
      
      // Verify challenge (simplified - in production use real-time verification)
      const verification = verifyLivenessChallenge(challenge, result);
      
      if (verification.challengePassed) {
        setCompletedChallenges(prev => {
          const updated = [...prev];
          updated[i] = true;
          return updated;
        });
      } else {
        toast.error(`Challenge failed: ${verification.feedback}`);
        setIsProcessing(false);
        return;
      }
    }
    
    // All challenges completed
    await finalizeBaseline();
  };

  const finalizeBaseline = async () => {
    try {
      if (!videoRef.current) return;
      
      // Save biometric baseline
      const epicNumber = JSON.parse(localStorage.getItem("registrationData") || "{}").epicNumber;
      await saveBaseline(epicNumber, videoRef.current);
      
      // Check final coercion score
      if (coercionRisk > 75) {
        toast.error("Registration blocked due to coercion indicators");
        handleBlockSession();
        return;
      }
      
      if (coercionRisk > 50) {
        toast.warning("Coercion risk detected - please review before continuing");
        setShowCoercionAlert(true);
        setIsProcessing(false);
        return;
      }
      
      setIsProcessing(false);
      setRecordingComplete(true);
      toast.success("Biometric baseline captured successfully!");
      
    } catch (error) {
      toast.error("Failed to save biometric data");
      setIsProcessing(false);
    }
  };

  const handleBlockSession = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setIsProcessing(false);
    
    setTimeout(() => {
      navigate("/register/step-1");
    }, 3000);
  };

  const handleContinue = () => {
    const existingData = JSON.parse(localStorage.getItem("registrationData") || "{}");
    localStorage.setItem("registrationData", JSON.stringify({
      ...existingData,
      biometricComplete: true,
    }));
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    
    navigate("/register/step-4");
  };

  const handleRetake = () => {
    setRecordingComplete(false);
    setCompletedChallenges(new Array(5).fill(false));
    setCurrentChallengeIndex(-1);
    setCoercionRisk(0);
    setCoercionWarnings([]);
    setShowCoercionAlert(false);
    resetCoercionTracking();
  };

  const currentChallenge = currentChallengeIndex >= 0 ? challenges[currentChallengeIndex] : null;
  const coercionWarning = getCoercionWarning(coercionRisk);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto max-w-5xl px-4 py-8">
        <ProgressStepper steps={steps} currentStep={3} />

        {/* Coercion Alert */}
        {showCoercionAlert && coercionWarning.action !== 'allow' && (
          <Alert variant={coercionWarning.action === 'block' ? 'destructive' : 'default'} className="mt-8 animate-fade-in">
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle className="text-lg font-bold">{coercionWarning.title}</AlertTitle>
            <AlertDescription className="mt-2">
              <p className="mb-2">{coercionWarning.message}</p>
              {coercionWarnings.length > 0 && (
                <div className="mt-3 text-sm">
                  <p className="font-semibold mb-1">Detected indicators:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {coercionWarnings.map((warning, i) => (
                      <li key={i}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        <Card className="mt-8 shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              AI-Powered Biometric Verification
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cameraState === "idle" && (
              <div className="text-center py-12">
                <div className="bg-primary/10 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                  <Camera className="h-12 w-12 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Camera Access Required</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Our AI system will guide you through secure biometric verification with real-time coercion detection.
                </p>
                <Button onClick={requestCameraAccess} variant="hero" size="lg">
                  Allow Camera Access
                </Button>
              </div>
            )}

            {cameraState === "requesting" && (
              <div className="text-center py-12 animate-pulse">
                <Camera className="h-16 w-16 text-primary mx-auto mb-4" />
                <p className="text-lg text-muted-foreground">Requesting camera access...</p>
              </div>
            )}

            {cameraState === "denied" && (
              <div className="text-center py-12">
                <div className="bg-destructive/10 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                  <Camera className="h-12 w-12 text-destructive" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Camera Access Denied</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Please enable camera permissions in your browser settings.
                </p>
                <Button onClick={requestCameraAccess} variant="outline">
                  Try Again
                </Button>
              </div>
            )}

            {cameraState === "granted" && !recordingComplete && (
              <div className="space-y-6">
                {/* Video Feed */}
                <div className="relative bg-black rounded-xl overflow-hidden aspect-video">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Face Detection Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className={`w-80 h-96 border-4 rounded-[50%] transition-colors ${
                      isProcessing ? "border-secondary" : "border-primary"
                    }`}></div>
                  </div>

                  {/* Coercion Risk Indicator */}
                  {isProcessing && (
                    <div className="absolute top-4 right-4 bg-card/90 backdrop-blur-sm px-4 py-2 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Shield className={`h-5 w-5 ${
                          coercionRisk < 30 ? 'text-secondary' :
                          coercionRisk < 60 ? 'text-gold' : 'text-destructive'
                        }`} />
                        <div>
                          <p className="text-xs text-muted-foreground">Security Status</p>
                          <p className="text-sm font-semibold">{
                            coercionRisk < 30 ? 'Secure' :
                            coercionRisk < 60 ? 'Monitoring' : 'Alert'
                          }</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Recording Indicator */}
                  {isProcessing && (
                    <div className="absolute top-4 left-4 flex items-center gap-2 bg-destructive text-destructive-foreground px-3 py-2 rounded-full">
                      <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                      <span className="text-sm font-semibold">AI Monitoring Active</span>
                    </div>
                  )}

                  {/* Challenge Instruction */}
                  {currentChallenge && (
                    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-card/95 backdrop-blur-sm px-6 py-4 rounded-xl max-w-md">
                      <p className="text-lg font-semibold text-center">{currentChallenge.instruction}</p>
                      <p className="text-sm text-muted-foreground text-center mt-2">
                        Challenge {currentChallengeIndex + 1} of {challenges.length}
                      </p>
                    </div>
                  )}
                </div>

                {/* Instructions Panel */}
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="bg-muted/50">
                    <CardContent className="pt-6">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Check className="h-5 w-5 text-primary" />
                        Liveness Challenges
                      </h3>
                      <ul className="space-y-2">
                        {challenges.map((challenge, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm">
                            {completedChallenges[i] ? (
                              <Check className="h-4 w-4 text-secondary" />
                            ) : i === currentChallengeIndex ? (
                              <div className="w-4 h-4 border-2 border-primary rounded-full animate-pulse" />
                            ) : (
                              <div className="w-4 h-4 border-2 border-muted-foreground rounded-full" />
                            )}
                            <span className={
                              completedChallenges[i] ? 'line-through text-muted-foreground' :
                              i === currentChallengeIndex ? 'font-semibold' : ''
                            }>
                              {challenge.instruction}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="bg-muted/50">
                    <CardContent className="pt-6">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        Safety Features
                      </h3>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>• Real-time coercion detection</li>
                        <li>• Multiple person detection</li>
                        <li>• Stress indicator monitoring</li>
                        <li>• Anti-spoofing measures</li>
                        <li>• Secure baseline capture</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                {/* Controls */}
                {!isProcessing && (
                  <div className="text-center">
                    <Button onClick={startRecording} variant="hero" size="lg" disabled={!isReady}>
                      {isReady ? 'Start AI Verification' : 'Initializing AI...'}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {recordingComplete && (
              <div className="text-center py-12 animate-fade-in">
                <div className="bg-secondary/10 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                  <Check className="h-12 w-12 text-secondary" />
                </div>
                <h3 className="text-2xl font-semibold mb-3 text-secondary">
                  ✓ Biometric Verification Complete
                </h3>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  Your biometric baseline has been securely captured with AI-powered safety verification.
                </p>
                <div className="flex gap-4 justify-center">
                  <Button onClick={handleRetake} variant="outline" size="lg">
                    Retake
                  </Button>
                  <Button onClick={handleContinue} variant="success" size="lg">
                    Continue to Confirmation
                  </Button>
                </div>
              </div>
            )}

            {cameraState === "granted" && !isProcessing && currentChallengeIndex === -1 && !recordingComplete && (
              <div className="flex items-center justify-between pt-4">
                <Link to="/register/step-2">
                  <Button type="button" variant="ghost">
                    Back
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Step3;
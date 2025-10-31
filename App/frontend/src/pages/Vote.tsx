import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { AlertCircle, Clock, Lock, X } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Candidate {
  id: string;
  name: string;
  party: string;
  symbol: string;
}

const Vote = () => {
  const navigate = useNavigate();
  const [selectedCandidate, setSelectedCandidate] = useState<string>("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showBanner, setShowBanner] = useState(true);
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes in seconds
  const [isSubmitting, setIsSubmitting] = useState(false);

  const candidates: Candidate[] = [
    {
      id: "1",
      name: "Rajesh Kumar",
      party: "Indian National Congress",
      symbol: "✋",
    },
    {
      id: "2",
      name: "Priya Sharma",
      party: "Bharatiya Janata Party",
      symbol: "🪷",
    },
    {
      id: "3",
      name: "Amit Patel",
      party: "Aam Aadmi Party",
      symbol: "🧹",
    },
    {
      id: "4",
      name: "NOTA",
      party: "None of the Above",
      symbol: "❌",
    },
  ];

  useEffect(() => {
    // Check if logged in
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    if (!isLoggedIn) {
      toast.error("Please login first");
      navigate("/login");
      return;
    }

    // Timer countdown
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          toast.error("Session expired. Please login again.");
          navigate("/login");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Prevent navigation
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearInterval(timer);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [navigate]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleReviewVote = () => {
    if (!selectedCandidate) {
      toast.error("Please select a candidate");
      return;
    }
    setShowConfirmation(true);
  };

  const handleConfirmVote = async () => {
    setShowConfirmation(false);
    setIsSubmitting(true);

    // Simulate encryption and submission process
    const steps = [
      { message: "⏳ Encrypting your vote...", duration: 1500 },
      { message: "🔒 Securing ballot data...", duration: 1500 },
      { message: "📤 Submitting to ballot server...", duration: 1500 },
      { message: "✓ Vote cast successfully!", duration: 1000 },
    ];

    for (const step of steps) {
      toast(step.message);
      await new Promise(resolve => setTimeout(resolve, step.duration));
    }

    // Generate tracking code
    const trackingCode = `${Math.random().toString(36).substring(2, 5).toUpperCase()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
    
    localStorage.setItem("trackingCode", trackingCode);
    localStorage.setItem("voteCastTime", new Date().toISOString());

    navigate("/receipt");
  };

  const selectedCandidateData = candidates.find(c => c.id === selectedCandidate);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-accent text-accent-foreground py-4 px-4 sticky top-0 z-50 shadow-lg">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">2025 General Election</h1>
              <p className="text-sm opacity-90">Constituency: Mumbai North</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-accent-foreground/10 px-4 py-2 rounded-lg">
                <Clock className="h-5 w-5" />
                <span className="font-mono font-semibold text-lg">{formatTime(timeLeft)}</span>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-sm">
                <Lock className="h-4 w-4" />
                <span>Secure Session</span>
              </div>
            </div>
          </div>
          <div className="mt-2 bg-gold/20 rounded px-3 py-2 text-sm flex items-start gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>Do not refresh or close this window during voting</span>
          </div>
        </div>
      </header>

      <div className="container mx-auto max-w-4xl px-4 py-8">
        {/* Instructions Banner */}
        {showBanner && (
          <Card className="mb-6 bg-primary/5 border-primary/20 animate-fade-in">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-foreground">Voting Instructions</p>
                    <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                      <li>• Select ONE candidate below and review your choice carefully</li>
                      <li>• Your vote is encrypted and anonymous</li>
                      <li>• You can re-vote before polling closes (last vote counts)</li>
                    </ul>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowBanner(false)}
                  className="flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Candidates */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">Select Your Candidate</h2>
          
          <RadioGroup value={selectedCandidate} onValueChange={setSelectedCandidate}>
            <div className="grid md:grid-cols-2 gap-4">
              {candidates.map((candidate) => (
                <Card
                  key={candidate.id}
                  className={`cursor-pointer transition-all duration-300 ${
                    selectedCandidate === candidate.id
                      ? "border-secondary border-4 shadow-xl bg-secondary/5"
                      : "border-border hover:border-primary hover:shadow-lg"
                  }`}
                  onClick={() => setSelectedCandidate(candidate.id)}
                >
                  <CardContent className="pt-6 pb-6">
                    <div className="flex items-start gap-4">
                      <RadioGroupItem value={candidate.id} id={candidate.id} className="mt-1" />
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <Label
                              htmlFor={candidate.id}
                              className="text-xl font-bold cursor-pointer block mb-2"
                            >
                              {candidate.name}
                            </Label>
                            <p className="text-sm text-muted-foreground mb-3">{candidate.party}</p>
                          </div>
                          <div className="text-6xl">{candidate.symbol}</div>
                        </div>
                        {selectedCandidate === candidate.id && (
                          <div className="mt-3 flex items-center gap-2 text-secondary font-semibold animate-fade-in">
                            <div className="w-2 h-2 bg-secondary rounded-full"></div>
                            <span className="text-sm">Selected</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </RadioGroup>
        </div>

        {/* Review Button */}
        {selectedCandidate && (
          <div className="sticky bottom-6 animate-fade-in">
            <Card className="bg-card shadow-2xl border-2 border-primary/30">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Your selection:</p>
                    <p className="font-semibold text-lg">{selectedCandidateData?.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedCandidateData?.party}</p>
                  </div>
                  <Button onClick={handleReviewVote} variant="hero" size="lg">
                    Review Your Vote
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-gold" />
              Review Your Selection
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Please confirm your vote before submitting
            </AlertDialogDescription>
          </AlertDialogHeader>

          {selectedCandidateData && (
            <div className="py-6">
              <Card className="border-2 border-primary/30">
                <CardContent className="pt-6 text-center">
                  <div className="text-7xl mb-4">{selectedCandidateData.symbol}</div>
                  <p className="text-2xl font-bold mb-2">{selectedCandidateData.name}</p>
                  <p className="text-muted-foreground">{selectedCandidateData.party}</p>
                </CardContent>
              </Card>

              <div className="mt-6 bg-gold/10 border-2 border-gold/30 rounded-lg p-4">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-gold flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-foreground mb-1">⚠️ This action cannot be undone</p>
                    <p className="text-muted-foreground">
                      Your vote will be encrypted and submitted. You can vote again later, but only your last vote will count.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Go Back to Change</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmVote}
              disabled={isSubmitting}
              className="bg-secondary hover:bg-secondary/90"
            >
              {isSubmitting ? "Processing..." : "Confirm & Cast Vote"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Vote;

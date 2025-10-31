import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/Header";
import ProgressStepper from "@/components/ProgressStepper";
import { CheckCircle, Copy, Download, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const Step4 = () => {
  const navigate = useNavigate();
  const [registrationId] = useState(`REG-2025-${Math.floor(Math.random() * 100000)}`);
  const [registrationData, setRegistrationData] = useState<any>(null);

  const steps = [
    { number: 1, title: "Eligibility" },
    { number: 2, title: "Verification" },
    { number: 3, title: "Biometric" },
    { number: 4, title: "Confirmation" },
  ];

  useEffect(() => {
    const data = localStorage.getItem("registrationData");
    if (!data) {
      toast.error("Please complete all registration steps first");
      navigate("/register/step-1");
      return;
    }
    const parsed = JSON.parse(data);
    if (!parsed.biometricComplete) {
      toast.error("Please complete biometric verification first");
      navigate("/register/step-3");
      return;
    }
    setRegistrationData(parsed);
  }, [navigate]);

  const copyRegistrationId = () => {
    navigator.clipboard.writeText(registrationId);
    toast.success("Registration ID copied to clipboard!");
  };

  const downloadCertificate = () => {
    toast.success("Registration certificate download started");
    // Simulate download
  };

  const handleComplete = () => {
    toast.success("Registration completed successfully!");
    setTimeout(() => navigate("/login"), 1500);
  };

  if (!registrationData) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto max-w-3xl px-4 py-8">
        <ProgressStepper steps={steps} currentStep={4} />

        <div className="mt-8 text-center animate-fade-in">
          {/* Success Animation */}
          <div className="bg-secondary/10 rounded-full w-32 h-32 flex items-center justify-center mx-auto mb-6 relative">
            <CheckCircle className="h-20 w-20 text-secondary" />
            <div className="absolute inset-0 bg-secondary/20 rounded-full animate-ping"></div>
          </div>

          <h1 className="text-4xl font-bold mb-3">Registration Successful! 🎉</h1>
          <p className="text-lg text-muted-foreground mb-8">
            You are now registered to vote online
          </p>

          {/* Registration Details */}
          <Card className="border-2 border-secondary/30 shadow-xl mb-8">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-6">
                  <p className="text-sm text-muted-foreground mb-2">Registration ID</p>
                  <div className="flex items-center justify-center gap-3">
                    <p className="text-3xl font-bold font-mono text-primary">{registrationId}</p>
                    <Button onClick={copyRegistrationId} size="icon" variant="ghost">
                      <Copy className="h-5 w-5" />
                    </Button>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 text-left">
                  <div className="bg-muted/30 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">EPIC Number</p>
                    <p className="font-semibold text-lg">{registrationData.epicNumber}</p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="font-semibold text-lg text-secondary">✅ Verified & Active</p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Category</p>
                    <p className="font-semibold text-lg capitalize">
                      {registrationData.category === "nri" ? "Non-Resident Indian" : "Armed Forces"}
                    </p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Registered On</p>
                    <p className="font-semibold text-lg">{new Date().toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Important Information */}
          <Card className="bg-gold/10 border-2 border-gold/30 mb-8">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <AlertCircle className="h-6 w-6 text-gold flex-shrink-0 mt-1" />
                <div className="text-left space-y-3">
                  <p className="font-semibold text-foreground">Important Information:</p>
                  <ul className="space-y-2 text-sm text-foreground/90">
                    <li className="flex items-start gap-2">
                      <span className="text-destructive">🚫</span>
                      <span>Your name has been removed from the physical voter roll at your home constituency</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-secondary">✅</span>
                      <span>You can now vote online during election periods</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">📱</span>
                      <span>Keep your registered mobile numbers active for OTP verification</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card className="bg-muted/50 mb-8">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-lg mb-3">What Happens Next?</h3>
              <ul className="space-y-2 text-sm text-muted-foreground text-left max-w-md mx-auto">
                <li>• During elections, you will receive an SMS with voting instructions</li>
                <li>• You can login anytime to check election schedules</li>
                <li>• Save your Registration ID: <strong className="text-foreground">{registrationId}</strong></li>
                <li>• Contact support if you need any assistance</li>
              </ul>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={handleComplete} variant="hero" size="xl">
              Go to Login
            </Button>
            <Button onClick={downloadCertificate} variant="outline" size="xl">
              <Download className="h-5 w-5 mr-2" />
              Download Certificate
            </Button>
          </div>

          <div className="mt-8">
            <Link to="/">
              <Button variant="ghost">
                Return to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step4;

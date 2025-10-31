import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import OTPInput from "@/components/OTPInput";
import { Shield, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const Login = () => {
  const navigate = useNavigate();
  const [epicNumber, setEpicNumber] = useState("");
  const [step, setStep] = useState<"epic" | "otp1" | "otp2">("epic");
  const [otp1, setOtp1] = useState("");
  const [otp2, setOtp2] = useState("");
  const [timeLeft, setTimeLeft] = useState(120);
  const [attempts, setAttempts] = useState(3);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useState(() => {
    if (step !== "epic" && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  });

  const handleEpicSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!epicNumber || epicNumber.length !== 10) {
      toast.error("Please enter a valid 10-character EPIC number");
      return;
    }

    // Simulate sending first OTP
    setStep("otp1");
    setTimeLeft(120);
    toast.success("OTP sent to your EPIC registered mobile!");
  };

  const handleOtp1Submit = () => {
    if (otp1.length !== 6) {
      toast.error("Please enter the complete 6-digit OTP");
      return;
    }

    // Simulate OTP verification
    if (otp1 === "123456" || true) { // Accept any for demo
      setStep("otp2");
      setTimeLeft(120);
      setOtp2("");
      toast.success("First OTP verified! Now verify Aadhaar mobile.");
    } else {
      setAttempts(prev => prev - 1);
      if (attempts <= 1) {
        toast.error("Maximum attempts exceeded. Please try again later.");
        setStep("epic");
        setEpicNumber("");
        setAttempts(3);
      } else {
        toast.error(`Incorrect OTP. ${attempts - 1} attempts remaining`);
      }
    }
  };

  const handleOtp2Submit = () => {
    if (otp2.length !== 6) {
      toast.error("Please enter the complete 6-digit OTP");
      return;
    }

    // Simulate final verification
    toast.success("Login successful! Redirecting to liveness verification...");
    
    // Store login state
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("epicNumber", epicNumber);
    
    setTimeout(() => navigate("/liveness"), 1500);
  };

  const handleResendOTP = () => {
    setTimeLeft(120);
    if (step === "otp1") {
      setOtp1("");
    } else {
      setOtp2("");
    }
    toast.success("OTP resent successfully!");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <div className="flex-1 flex items-center justify-center px-4 py-12 bg-gradient-hero">
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader className="text-center">
            <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-3xl">Secure Login</CardTitle>
            <CardDescription className="text-base">
              {step === "epic" && "Enter your EPIC number to begin"}
              {step === "otp1" && "Verify your EPIC registered mobile"}
              {step === "otp2" && "Verify your Aadhaar linked mobile"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Step 1: EPIC Number */}
            {step === "epic" && (
              <form onSubmit={handleEpicSubmit} className="space-y-6 animate-fade-in">
                <div className="space-y-2">
                  <Label htmlFor="epic" className="text-base font-semibold">
                    Election Photo ID Card Number
                  </Label>
                  <Input
                    id="epic"
                    placeholder="ABC1234567"
                    value={epicNumber}
                    onChange={(e) => setEpicNumber(e.target.value.toUpperCase())}
                    maxLength={10}
                    className="text-lg h-12"
                    autoFocus
                  />
                  <p className="text-sm text-muted-foreground">
                    Enter the EPIC number you registered with
                  </p>
                </div>

                <Button type="submit" variant="hero" size="lg" className="w-full">
                  Proceed to OTP Verification
                </Button>

                <div className="text-center space-y-2 pt-4">
                  <p className="text-sm text-muted-foreground">
                    Not registered?{" "}
                    <Link to="/register/step-1" className="text-primary font-semibold hover:underline">
                      Register here
                    </Link>
                  </p>
                  <Link to="/help">
                    <Button variant="ghost" size="sm">
                      Need help?
                    </Button>
                  </Link>
                </div>
              </form>
            )}

            {/* Step 2: First OTP */}
            {step === "otp1" && (
              <div className="space-y-6 animate-fade-in">
                <Card className="bg-primary/5 border-2 border-primary/20">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-center gap-2 text-primary font-semibold mb-4">
                      <Clock className="h-5 w-5" />
                      <span>Session expires in {formatTime(timeLeft)}</span>
                    </div>

                    <div className="text-center mb-4">
                      <p className="text-sm font-semibold mb-2">OTP sent to EPIC Mobile</p>
                      <p className="text-lg font-mono text-muted-foreground">****1234</p>
                    </div>

                    <OTPInput
                      value={otp1}
                      onChange={setOtp1}
                      disabled={timeLeft === 0}
                    />

                    {timeLeft === 0 && (
                      <div className="mt-4 text-center">
                        <Button onClick={handleResendOTP} variant="outline" size="sm">
                          Resend OTP
                        </Button>
                      </div>
                    )}

                    {attempts < 3 && (
                      <div className="mt-4 flex items-center gap-2 text-sm text-destructive">
                        <AlertCircle className="h-4 w-4" />
                        <span>{attempts} attempts remaining</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Button
                  onClick={handleOtp1Submit}
                  variant="hero"
                  size="lg"
                  className="w-full"
                  disabled={otp1.length !== 6 || timeLeft === 0}
                >
                  Verify First OTP
                </Button>

                <div className="text-center">
                  <Button onClick={() => setStep("epic")} variant="ghost" size="sm">
                    Change EPIC Number
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Second OTP */}
            {step === "otp2" && (
              <div className="space-y-6 animate-fade-in">
                <Card className="bg-secondary/5 border-2 border-secondary/20">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-center gap-2 text-secondary font-semibold mb-4">
                      <Clock className="h-5 w-5" />
                      <span>Session expires in {formatTime(timeLeft)}</span>
                    </div>

                    <div className="text-center mb-4">
                      <p className="text-sm font-semibold mb-2">OTP sent to Aadhaar Mobile</p>
                      <p className="text-lg font-mono text-muted-foreground">****5678</p>
                    </div>

                    <OTPInput
                      value={otp2}
                      onChange={setOtp2}
                      disabled={timeLeft === 0}
                    />

                    {timeLeft === 0 && (
                      <div className="mt-4 text-center">
                        <Button onClick={handleResendOTP} variant="outline" size="sm">
                          Resend OTP
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Button
                  onClick={handleOtp2Submit}
                  variant="success"
                  size="lg"
                  className="w-full"
                  disabled={otp2.length !== 6 || timeLeft === 0}
                >
                  Complete Login
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default Login;

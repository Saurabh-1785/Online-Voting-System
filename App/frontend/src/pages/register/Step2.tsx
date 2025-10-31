import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Header";
import ProgressStepper from "@/components/ProgressStepper";
import OTPInput from "@/components/OTPInput";
import { Upload, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";

const Step2 = () => {
  const navigate = useNavigate();
  const [aadhaar, setAadhaar] = useState("");
  const [epicMobile, setEpicMobile] = useState("");
  const [aadhaarMobile, setAadhaarMobile] = useState("");
  const [document, setDocument] = useState<File | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [epicOtp, setEpicOtp] = useState("");
  const [aadhaarOtp, setAadhaarOtp] = useState("");
  const [timeLeft, setTimeLeft] = useState(150); // 2:30 in seconds
  const [category, setCategory] = useState("");

  const steps = [
    { number: 1, title: "Eligibility" },
    { number: 2, title: "Verification" },
    { number: 3, title: "Biometric" },
    { number: 4, title: "Confirmation" },
  ];

  useEffect(() => {
    // Load registration data
    const data = localStorage.getItem("registrationData");
    if (!data) {
      toast.error("Please complete step 1 first");
      navigate("/register/step-1");
      return;
    }
    const parsed = JSON.parse(data);
    setCategory(parsed.category);
  }, [navigate]);

  useEffect(() => {
    if (otpSent && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [otpSent, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const maskAadhaar = (value: string) => {
    if (value.length <= 4) return value;
    return 'X'.repeat(value.length - 4) + value.slice(-4);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }
      setDocument(file);
      toast.success("Document uploaded successfully");
    }
  };

  const handleSendOTP = () => {
    if (!aadhaar || aadhaar.length !== 12) {
      toast.error("Please enter a valid 12-digit Aadhaar number");
      return;
    }
    if (!epicMobile || !aadhaarMobile) {
      toast.error("Please enter both mobile numbers");
      return;
    }
    if (!document) {
      toast.error("Please upload the required document");
      return;
    }

    // Simulate sending OTP
    setOtpSent(true);
    setTimeLeft(150);
    toast.success("OTPs sent to both mobile numbers!");
  };

  const handleVerifyOTP = () => {
    if (epicOtp.length !== 6 || aadhaarOtp.length !== 6) {
      toast.error("Please enter both 6-digit OTPs");
      return;
    }

    // Simulate OTP verification
    toast.success("Identity verified successfully!");
    
    // Store data and navigate
    const existingData = JSON.parse(localStorage.getItem("registrationData") || "{}");
    localStorage.setItem("registrationData", JSON.stringify({
      ...existingData,
      aadhaar,
      epicMobile,
      aadhaarMobile,
    }));
    
    setTimeout(() => navigate("/register/step-3"), 1000);
  };

  const handleResendOTP = () => {
    setTimeLeft(150);
    setEpicOtp("");
    setAadhaarOtp("");
    toast.success("OTPs resent!");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto max-w-3xl px-4 py-8">
        <ProgressStepper steps={steps} currentStep={2} />

        <Card className="mt-8 shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl">Verify Your Identity</CardTitle>
            <CardDescription className="text-base">
              Provide your Aadhaar details and upload required documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Aadhaar Number */}
              <div className="space-y-2">
                <Label htmlFor="aadhaar" className="text-base font-semibold">
                  Aadhaar Number
                </Label>
                <Input
                  id="aadhaar"
                  placeholder="1234 5678 9012"
                  value={aadhaar}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 12);
                    setAadhaar(value);
                  }}
                  disabled={otpSent}
                  className="text-lg h-12"
                  type="text"
                />
                {aadhaar.length === 12 && (
                  <p className="text-sm text-muted-foreground">
                    Masked: {maskAadhaar(aadhaar)}
                  </p>
                )}
              </div>

              {/* Document Upload */}
              <div className="space-y-2">
                <Label htmlFor="document" className="text-base font-semibold">
                  {category === "nri" ? "Upload Passport/Visa Copy" : "Upload Service ID Card"}
                </Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
                  <input
                    id="document"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    disabled={otpSent}
                    className="hidden"
                  />
                  <label htmlFor="document" className="cursor-pointer">
                    {document ? (
                      <div className="flex items-center justify-center gap-2 text-secondary">
                        <CheckCircle className="h-6 w-6" />
                        <div>
                          <p className="font-medium">{document.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {(document.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="h-10 w-10 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Click to upload or drag and drop<br />
                          PDF, JPG, PNG (max 5MB)
                        </p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Mobile Numbers */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="epic-mobile" className="text-base font-semibold">
                    EPIC Mobile Number
                  </Label>
                  <Input
                    id="epic-mobile"
                    placeholder="+91 98765 43210"
                    value={epicMobile}
                    onChange={(e) => setEpicMobile(e.target.value)}
                    disabled={otpSent}
                    className="text-lg h-12"
                  />
                  <p className="text-xs text-muted-foreground">
                    Registered with your Voter ID
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="aadhaar-mobile" className="text-base font-semibold">
                    Aadhaar Mobile Number
                  </Label>
                  <Input
                    id="aadhaar-mobile"
                    placeholder="+91 98765 43210"
                    value={aadhaarMobile}
                    onChange={(e) => setAadhaarMobile(e.target.value)}
                    disabled={otpSent}
                    className="text-lg h-12"
                  />
                  <p className="text-xs text-muted-foreground">
                    Linked with your Aadhaar
                  </p>
                </div>
              </div>

              {/* OTP Section */}
              {otpSent && (
                <div className="space-y-6 pt-4 border-t-2 border-primary/20 animate-fade-in">
                  <div className="flex items-center justify-center gap-2 text-primary font-semibold">
                    <Clock className="h-5 w-5" />
                    <span>Time remaining: {formatTime(timeLeft)}</span>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <Card className="border-2 border-primary/30">
                      <CardContent className="pt-6">
                        <Label className="text-sm font-semibold mb-3 block text-center">
                          OTP sent to EPIC Mobile
                          <br />
                          <span className="text-muted-foreground">****{epicMobile.slice(-4)}</span>
                        </Label>
                        <OTPInput
                          value={epicOtp}
                          onChange={setEpicOtp}
                          disabled={timeLeft === 0}
                        />
                      </CardContent>
                    </Card>

                    <Card className="border-2 border-secondary/30">
                      <CardContent className="pt-6">
                        <Label className="text-sm font-semibold mb-3 block text-center">
                          OTP sent to Aadhaar Mobile
                          <br />
                          <span className="text-muted-foreground">****{aadhaarMobile.slice(-4)}</span>
                        </Label>
                        <OTPInput
                          value={aadhaarOtp}
                          onChange={setAadhaarOtp}
                          disabled={timeLeft === 0}
                        />
                      </CardContent>
                    </Card>
                  </div>

                  {timeLeft === 0 && (
                    <div className="text-center">
                      <Button onClick={handleResendOTP} variant="outline">
                        Resend OTP
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between pt-4">
                <Link to="/register/step-1">
                  <Button type="button" variant="ghost" disabled={otpSent}>
                    Back
                  </Button>
                </Link>
                {!otpSent ? (
                  <Button onClick={handleSendOTP} variant="hero" size="lg">
                    Send OTP
                  </Button>
                ) : (
                  <Button
                    onClick={handleVerifyOTP}
                    variant="success"
                    size="lg"
                    disabled={epicOtp.length !== 6 || aadhaarOtp.length !== 6 || timeLeft === 0}
                  >
                    Verify & Continue
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Step2;

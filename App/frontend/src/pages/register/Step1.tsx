import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import Header from "@/components/Header";
import ProgressStepper from "@/components/ProgressStepper";
import { Globe, Shield } from "lucide-react";
import { toast } from "sonner";

const Step1 = () => {
  const navigate = useNavigate();
  const [epicNumber, setEpicNumber] = useState("");
  const [category, setCategory] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const steps = [
    { number: 1, title: "Eligibility" },
    { number: 2, title: "Verification" },
    { number: 3, title: "Biometric" },
    { number: 4, title: "Confirmation" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!epicNumber || epicNumber.length !== 10) {
      toast.error("Please enter a valid 10-character EPIC number");
      return;
    }

    if (!category) {
      toast.error("Please select your category");
      return;
    }

    if (!agreedToTerms) {
      toast.error("Please agree to the terms to continue");
      return;
    }

    // Store data and navigate
    localStorage.setItem("registrationData", JSON.stringify({ epicNumber, category }));
    toast.success("Eligibility confirmed!");
    navigate("/register/step-2");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto max-w-3xl px-4 py-8">
        <ProgressStepper steps={steps} currentStep={1} />

        <Card className="mt-8 shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl">Confirm Your Eligibility</CardTitle>
            <CardDescription className="text-base">
              Provide your EPIC number and select your category to begin registration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* EPIC Number */}
              <div className="space-y-2">
                <Label htmlFor="epic" className="text-base font-semibold">
                  EPIC Number (Voter ID)
                </Label>
                <Input
                  id="epic"
                  placeholder="ABC1234567"
                  value={epicNumber}
                  onChange={(e) => setEpicNumber(e.target.value.toUpperCase())}
                  maxLength={10}
                  className="text-lg h-12"
                />
                <p className="text-sm text-muted-foreground">
                  Found on your Election Photo ID Card (10 characters)
                </p>
              </div>

              {/* Category Selection */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Select Your Category</Label>
                <RadioGroup value={category} onValueChange={setCategory} className="space-y-3">
                  <Card className={`cursor-pointer transition-all ${category === "nri" ? "border-primary border-2 shadow-md" : "border-border"}`}>
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-start gap-4">
                        <RadioGroupItem value="nri" id="nri" className="mt-1" />
                        <div className="flex-1">
                          <Label htmlFor="nri" className="cursor-pointer flex items-center gap-2 font-semibold text-base">
                            <Globe className="h-5 w-5 text-primary" />
                            Non-Resident Indian (NRI)
                          </Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            Living abroad with valid passport
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className={`cursor-pointer transition-all ${category === "armed-forces" ? "border-primary border-2 shadow-md" : "border-border"}`}>
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-start gap-4">
                        <RadioGroupItem value="armed-forces" id="armed-forces" className="mt-1" />
                        <div className="flex-1">
                          <Label htmlFor="armed-forces" className="cursor-pointer flex items-center gap-2 font-semibold text-base">
                            <Shield className="h-5 w-5 text-secondary" />
                            Armed Forces Personnel
                          </Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            Active duty military service
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </RadioGroup>
              </div>

              {/* Terms Checkbox */}
              <Card className="bg-muted/50 border-2 border-muted">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="terms"
                      checked={agreedToTerms}
                      onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                      className="mt-1"
                    />
                    <Label htmlFor="terms" className="cursor-pointer text-sm leading-relaxed">
                      I understand that registering for online voting will <strong>disable my ability to vote at my home polling station</strong>. 
                      I will only be able to vote through this online platform during elections.
                    </Label>
                  </div>
                </CardContent>
              </Card>

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between pt-4">
                <Link to="/">
                  <Button type="button" variant="ghost">
                    Back to Home
                  </Button>
                </Link>
                <Button type="submit" variant="hero" size="lg">
                  Continue to Verification
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Step1;

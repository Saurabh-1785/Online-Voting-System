import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CheckCircle, Copy, Download, Shield, Eye, LogOut } from "lucide-react";
import { toast } from "sonner";

const Receipt = () => {
  const navigate = useNavigate();
  const [trackingCode, setTrackingCode] = useState("");
  const [voteCastTime, setVoteCastTime] = useState("");
  const [confetti, setConfetti] = useState(true);

  useEffect(() => {
    const code = localStorage.getItem("trackingCode");
    const time = localStorage.getItem("voteCastTime");

    if (!code || !time) {
      toast.error("No vote receipt found");
      navigate("/");
      return;
    }

    setTrackingCode(code);
    setVoteCastTime(new Date(time).toLocaleString());

    // Hide confetti after animation
    setTimeout(() => setConfetti(false), 3000);
  }, [navigate]);

  const copyTrackingCode = () => {
    navigator.clipboard.writeText(trackingCode);
    toast.success("Tracking code copied to clipboard!");
  };

  const downloadReceipt = () => {
    toast.success("Receipt download started");
    // Simulate PDF download
  };

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("epicNumber");
    toast.success("Logged out securely");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <div className="flex-1 flex items-center justify-center px-4 py-12 bg-gradient-to-br from-secondary/5 to-background">
        <div className="w-full max-w-2xl animate-fade-in">
          {/* Confetti Animation */}
          {confetti && (
            <div className="fixed inset-0 pointer-events-none z-50">
              {[...Array(50)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 bg-primary rounded-full animate-confetti"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `-5%`,
                    animationDelay: `${Math.random() * 2}s`,
                    background: ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--gold))"][i % 3],
                  }}
                />
              ))}
            </div>
          )}

          {/* Success Icon */}
          <div className="text-center mb-8">
            <div className="bg-secondary/10 rounded-full w-32 h-32 flex items-center justify-center mx-auto mb-6 relative">
              <CheckCircle className="h-20 w-20 text-secondary" />
              <div className="absolute inset-0 bg-secondary/20 rounded-full animate-ping"></div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-3">Vote Cast Successfully! ✅</h1>
            <p className="text-lg text-muted-foreground">
              Your vote has been securely recorded
            </p>
          </div>

          {/* Receipt Card */}
          <Card className="border-4 border-secondary/30 shadow-2xl mb-6">
            <CardContent className="pt-8 pb-8">
              <div className="space-y-6">
                {/* Tracking Code */}
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-3 font-semibold">
                    Your Anonymous Tracking Code
                  </p>
                  <Card className="bg-muted/50 border-2 border-muted">
                    <CardContent className="pt-6 pb-6">
                      <div className="flex items-center justify-center gap-4">
                        <p className="text-3xl md:text-4xl font-bold font-mono tracking-wider text-primary">
                          {trackingCode}
                        </p>
                        <Button onClick={copyTrackingCode} size="icon" variant="ghost">
                          <Copy className="h-6 w-6" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Vote Details */}
                <div className="grid md:grid-cols-2 gap-4">
                  <Card className="bg-muted/30">
                    <CardContent className="pt-4 pb-4">
                      <p className="text-sm text-muted-foreground mb-1">Cast On</p>
                      <p className="font-semibold">{voteCastTime}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-muted/30">
                    <CardContent className="pt-4 pb-4">
                      <p className="text-sm text-muted-foreground mb-1">Election</p>
                      <p className="font-semibold">2025 General Election</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Security Features */}
                <div className="grid md:grid-cols-3 gap-4">
                  <Card className="bg-secondary/5 border-secondary/20">
                    <CardContent className="pt-4 pb-4 text-center">
                      <Shield className="h-8 w-8 text-secondary mx-auto mb-2" />
                      <p className="text-sm font-semibold">🔒 Encrypted</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Your vote is encrypted
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="pt-4 pb-4 text-center">
                      <Eye className="h-8 w-8 text-primary mx-auto mb-2" />
                      <p className="text-sm font-semibold">🎭 Anonymous</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Your vote is anonymous
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="bg-gold/5 border-gold/20">
                    <CardContent className="pt-4 pb-4 text-center">
                      <CheckCircle className="h-8 w-8 text-gold mx-auto mb-2" />
                      <p className="text-sm font-semibold">✅ Counted</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Your vote is counted
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Important Information */}
          <Card className="bg-primary/5 border-2 border-primary/30 mb-6">
            <CardContent className="pt-6 pb-6">
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Important Information
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>
                    <strong>Save this tracking code</strong> to verify your vote was counted on the public bulletin board
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>
                    This code does <strong>NOT reveal who you voted for</strong> - your vote remains anonymous
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>
                    You can <strong>re-vote anytime before polling closes</strong>. Only your last vote will be counted.
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <Link to="/verify" className="block">
              <Button variant="hero" size="lg" className="w-full">
                <Eye className="h-5 w-5 mr-2" />
                Verify on Bulletin Board
              </Button>
            </Link>
            <Button onClick={downloadReceipt} variant="outline" size="lg" className="w-full">
              <Download className="h-5 w-5 mr-2" />
              Download Receipt
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Link to="/vote" className="block">
              <Button variant="secondary" size="lg" className="w-full">
                Vote Again
              </Button>
            </Link>
            <Button onClick={handleLogout} variant="outline" size="lg" className="w-full">
              <LogOut className="h-5 w-5 mr-2" />
              Logout Securely
            </Button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Receipt;

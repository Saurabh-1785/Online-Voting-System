import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Search, CheckCircle, AlertCircle, Shield, TrendingUp } from "lucide-react";
import { toast } from "sonner";

const Verify = () => {
  const [trackingCode, setTrackingCode] = useState("");
  const [searchResult, setSearchResult] = useState<"idle" | "found" | "not-found">("idle");
  const [voteData, setVoteData] = useState({
    castOn: new Date().toLocaleString(),
    hash: "sha256:a7b3c9d4e5f6g7h8i9j0k1l2m3n4o5p6...",
  });

  // Mock statistics
  const stats = {
    totalVotes: 45234,
    votesVerified: 45180,
    lastUpdated: "2 minutes ago",
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    if (!trackingCode || trackingCode.length < 10) {
      toast.error("Please enter a valid tracking code");
      return;
    }

    // Simulate search (90% success rate for demo)
    const found = Math.random() > 0.1;

    if (found) {
      setSearchResult("found");
      toast.success("Vote found and verified!");
    } else {
      setSearchResult("not-found");
      toast.error("Vote not found");
    }
  };

  const handleReset = () => {
    setTrackingCode("");
    setSearchResult("idle");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <div className="flex-1 px-4 py-12 bg-gradient-to-br from-primary/5 to-background">
        <div className="container mx-auto max-w-4xl">
          {/* Header Section */}
          <div className="text-center mb-12">
            <div className="bg-primary/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
              <Shield className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Public Election Bulletin Board
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Verify your vote was counted using your anonymous tracking code
            </p>
          </div>

          {/* Statistics Bar */}
          <Card className="mb-8 bg-gradient-card border-2">
            <CardContent className="pt-6 pb-6">
              <div className="grid md:grid-cols-3 gap-6 text-center">
                <div>
                  <TrendingUp className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="text-3xl font-bold text-foreground">{stats.totalVotes.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Total Votes Cast</p>
                </div>
                <div>
                  <CheckCircle className="h-8 w-8 text-secondary mx-auto mb-2" />
                  <p className="text-3xl font-bold text-foreground">{stats.votesVerified.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Votes Verified</p>
                </div>
                <div>
                  <Shield className="h-8 w-8 text-accent mx-auto mb-2" />
                  <p className="text-3xl font-bold text-foreground">100%</p>
                  <p className="text-sm text-muted-foreground">Transparency</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-4">
                Last updated: {stats.lastUpdated}
              </p>
            </CardContent>
          </Card>

          {/* Search Section */}
          <Card className="shadow-xl mb-8">
            <CardContent className="pt-8 pb-8">
              <form onSubmit={handleSearch} className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="tracking-code" className="text-lg font-semibold">
                    Enter Your Tracking Code
                  </Label>
                  <div className="flex gap-3">
                    <Input
                      id="tracking-code"
                      placeholder="a7R-4gT-p9K"
                      value={trackingCode}
                      onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
                      className="text-lg h-14 font-mono"
                      autoFocus
                    />
                    <Button type="submit" variant="hero" size="lg" className="px-8">
                      <Search className="h-5 w-5 mr-2" />
                      Verify
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    The tracking code you received after casting your vote
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Search Results */}
          {searchResult === "found" && (
            <Card className="border-4 border-secondary/30 shadow-2xl animate-fade-in mb-8">
              <CardContent className="pt-8 pb-8">
                <div className="text-center mb-6">
                  <div className="bg-secondary/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-12 w-12 text-secondary" />
                  </div>
                  <h2 className="text-3xl font-bold text-secondary mb-2">✅ Vote Verified</h2>
                  <p className="text-muted-foreground">Your vote has been counted in the final tally</p>
                </div>

                <div className="space-y-4">
                  <Card className="bg-muted/50">
                    <CardContent className="pt-4 pb-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Tracking Code</p>
                          <p className="font-mono font-bold text-lg">{trackingCode}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Status</p>
                          <p className="font-semibold text-lg text-secondary">✅ Included in Final Tally</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-muted/50">
                    <CardContent className="pt-4 pb-4">
                      <p className="text-sm text-muted-foreground mb-1">Cast On</p>
                      <p className="font-semibold">{voteData.castOn}</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-muted/50">
                    <CardContent className="pt-4 pb-4">
                      <p className="text-sm text-muted-foreground mb-2">Encrypted Vote Hash</p>
                      <p className="font-mono text-xs break-all text-foreground/80">
                        {voteData.hash}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-primary/5 border-2 border-primary/30">
                    <CardContent className="pt-4 pb-4">
                      <div className="flex gap-3">
                        <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-foreground">
                          <strong>🔒 Your vote identity remains private.</strong> This verification only confirms your vote was counted, not who you voted for.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="mt-6 text-center">
                  <Button onClick={handleReset} variant="outline">
                    Verify Another Vote
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {searchResult === "not-found" && (
            <Card className="border-4 border-destructive/30 shadow-2xl animate-fade-in mb-8">
              <CardContent className="pt-8 pb-8">
                <div className="text-center">
                  <div className="bg-destructive/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="h-12 w-12 text-destructive" />
                  </div>
                  <h2 className="text-3xl font-bold text-destructive mb-4">⚠️ Vote Not Found</h2>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    The tracking code you entered was not found in our records.
                  </p>

                  <Card className="bg-muted/50 text-left max-w-md mx-auto mb-6">
                    <CardContent className="pt-6 pb-6">
                      <p className="font-semibold mb-3">Possible reasons:</p>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <span className="text-destructive">•</span>
                          <span>Code was entered incorrectly</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-destructive">•</span>
                          <span>Vote is still being processed (wait a few minutes)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-destructive">•</span>
                          <span>Invalid tracking code</span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Button onClick={handleReset} variant="hero">
                    Try Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* How It Works */}
          <Card className="bg-muted/50">
            <CardContent className="pt-6 pb-6">
              <h3 className="font-semibold text-lg mb-4">How Vote Verification Works</h3>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  <strong className="text-foreground">1. Anonymous Tracking:</strong> Each vote receives a unique tracking code that is mathematically linked to the encrypted vote, but not to your identity.
                </p>
                <p>
                  <strong className="text-foreground">2. Public Bulletin Board:</strong> All encrypted votes and their tracking codes are published on this public bulletin board.
                </p>
                <p>
                  <strong className="text-foreground">3. End-to-End Verifiability:</strong> You can verify your vote was counted without revealing who you voted for.
                </p>
                <p>
                  <strong className="text-foreground">4. Cryptographic Security:</strong> The system uses advanced cryptography to ensure votes cannot be traced back to voters.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Verify;

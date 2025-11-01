import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Shield, Smartphone, CheckCircle, Lock, Globe, Vote } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-hero py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in">
              <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
                Secure Online Voting
              </h1>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Vote from anywhere in the world with military-grade security. 
                Your voice matters, no matter where you are.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/register/step-1">
                  <Button variant="hero" size="xl" className="w-full sm:w-auto">
                    Register to Vote
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="success" size="xl" className="w-full sm:w-auto">
                    Cast Your Vote
                  </Button>
                </Link>
              </div>
            </div>
            <div className="hidden md:block animate-fade-in">
              <div className="bg-card rounded-2xl shadow-xl p-8 border-4 border-primary/20">
                <div className="aspect-square bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl flex items-center justify-center">
                  <Vote className="h-32 w-32 text-primary" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-center mb-4">Why Choose ECI Secure Vote?</h2>
          <p className="text-center text-muted-foreground mb-12 text-lg">
            Built with the highest security standards for Indian democracy
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2 hover:border-primary transition-all duration-300 hover:shadow-lg">
              <CardContent className="pt-6">
                <div className="bg-accent/10 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                  <Lock className="h-8 w-8 text-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Military-Grade Security</h3>
                <p className="text-muted-foreground">
                  End-to-end encryption, biometric verification, and dual OTP authentication 
                  ensure your vote is secure and anonymous.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-secondary transition-all duration-300 hover:shadow-lg">
              <CardContent className="pt-6">
                <div className="bg-secondary/10 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                  <Smartphone className="h-8 w-8 text-secondary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Easy Access</h3>
                <p className="text-muted-foreground">
                  Vote from your phone, tablet, or computer. No special equipment needed. 
                  Works on any device with a camera and internet connection.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-gold transition-all duration-300 hover:shadow-lg">
              <CardContent className="pt-6">
                <div className="bg-gold/10 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                  <CheckCircle className="h-8 w-8 text-gold" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Verifiable</h3>
                <p className="text-muted-foreground">
                  Track your vote with an anonymous receipt. Publicly verify it was counted 
                  without revealing who you voted for.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-center mb-4">How It Works</h2>
          <p className="text-center text-muted-foreground mb-16 text-lg">
            Simple, secure voting in 5 easy steps
          </p>

          <div className="relative">
            {/* Timeline Line */}
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-1 bg-primary/20 transform -translate-x-1/2"></div>

            <div className="space-y-12">
              {[
                {
                  step: "1",
                  title: "Register with EPIC & Aadhaar",
                  description: "Provide your Voter ID and Aadhaar details. Upload required documents based on your category (NRI/Armed Forces).",
                  icon: Shield,
                },
                {
                  step: "2",
                  title: "Verify Identity with OTP",
                  description: "Receive OTPs on both your EPIC-registered and Aadhaar-linked mobile numbers for dual verification.",
                  icon: Smartphone,
                },
                {
                  step: "3",
                  title: "Complete Biometric Scan",
                  description: "Use your device camera to capture baseline biometric data. Simple face and voice verification.",
                  icon: Lock,
                },
                {
                  step: "4",
                  title: "Cast Your Vote Securely",
                  description: "Choose your candidate. Your vote is encrypted before being sent. The process is anonymous and verifiable.",
                  icon: Vote,
                },
                {
                  step: "5",
                  title: "Receive Anonymous Receipt",
                  description: "Get a tracking code to verify your vote was counted, without revealing who you voted for.",
                  icon: CheckCircle,
                },
              ].map((item, index) => (
                <div key={index} className="relative">
                  <div className={`md:w-1/2 ${index % 2 === 0 ? 'md:ml-auto md:pl-12' : 'md:pr-12'}`}>
                    <Card className="border-2 hover:border-primary transition-all duration-300 hover:shadow-lg">
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <div className="bg-primary text-primary-foreground rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg flex-shrink-0">
                            {item.step}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                            <p className="text-muted-foreground">{item.description}</p>
                          </div>
                          <item.icon className="h-8 w-8 text-primary flex-shrink-0" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  {/* Timeline Dot */}
                  <div className="hidden md:block absolute left-1/2 top-8 w-4 h-4 bg-primary rounded-full transform -translate-x-1/2 border-4 border-background"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Exercise Your Right to Vote?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of Indians abroad who have already registered
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register/step-1">
              <Button variant="hero" size="xl">
                Start Registration
              </Button>
            </Link>
            <Link to="/help">
              <Button variant="outline" size="xl">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Mail, Phone, Clock, FileQuestion, Shield, Vote, CheckCircle, Settings } from "lucide-react";

const Help = () => {
  const [activeSection, setActiveSection] = useState("getting-started");

  const sections = [
    { id: "getting-started", label: "Getting Started", icon: FileQuestion },
    { id: "registration", label: "Registration Process", icon: Settings },
    { id: "voting", label: "Voting Process", icon: Vote },
    { id: "security", label: "Security & Privacy", icon: Shield },
    { id: "troubleshooting", label: "Troubleshooting", icon: Settings },
    { id: "contact", label: "Contact Support", icon: Mail },
  ];

  const faqs = {
    "getting-started": [
      {
        question: "What is ECI Secure Vote?",
        answer: "ECI Secure Vote is an online voting platform developed by the Election Commission of India to enable Non-Resident Indians (NRIs) and Armed Forces personnel to vote securely from anywhere in the world.",
      },
      {
        question: "Who is eligible to use this platform?",
        answer: "This platform is available for: (1) Non-Resident Indians (NRIs) who are registered voters and living abroad with a valid passport, and (2) Active duty Armed Forces personnel serving away from their home constituency.",
      },
      {
        question: "How secure is online voting?",
        answer: "We use military-grade encryption, biometric verification, dual OTP authentication, and end-to-end verifiable cryptography to ensure your vote is secure and anonymous. Your vote is encrypted before transmission and cannot be traced back to you.",
      },
    ],
    registration: [
      {
        question: "How do I register?",
        answer: "Registration is a 4-step process: (1) Provide your EPIC number and select your category, (2) Verify your identity with Aadhaar and upload required documents, (3) Complete biometric baseline capture using your device camera, (4) Receive confirmation and registration ID.",
      },
      {
        question: "What documents do I need?",
        answer: "You will need: (1) Your Election Photo ID Card (EPIC/Voter ID), (2) Your Aadhaar card number, (3) For NRIs: Valid passport and visa copy, (4) For Armed Forces: Service ID card. All documents should be in PDF, JPG, or PNG format (max 5MB).",
      },
      {
        question: "What happens to my home constituency registration?",
        answer: "Once you register for online voting, your name will be removed from the physical voter roll at your home polling station. You will only be able to vote through this online platform. This is to prevent duplicate voting.",
      },
      {
        question: "How long does registration take?",
        answer: "The entire registration process takes approximately 15-20 minutes. After successful registration, your account is activated immediately and you can vote during election periods.",
      },
    ],
    voting: [
      {
        question: "How do I cast my vote?",
        answer: "To vote: (1) Login with your EPIC number and verify with dual OTP, (2) Complete liveness verification using your camera, (3) Select your candidate from the ballot, (4) Review and confirm your selection, (5) Receive an anonymous tracking code for verification.",
      },
      {
        question: "Can I vote multiple times?",
        answer: "Yes, you can vote multiple times before polling closes. However, only your LAST vote will be counted. This allows you to change your mind if needed. Each time you vote, you'll receive a new tracking code.",
      },
      {
        question: "How do I know my vote was counted?",
        answer: "After voting, you'll receive a unique tracking code. You can use this code on the public verification portal to confirm your vote was counted, without revealing who you voted for. The system provides end-to-end verifiable voting.",
      },
      {
        question: "How long do I have to vote?",
        answer: "Once you start the voting session, you have 15 minutes to complete the process. Voting periods are announced during elections. You'll receive an SMS notification when voting opens for your constituency.",
      },
    ],
    security: [
      {
        question: "Is my vote secret?",
        answer: "Yes, absolutely. Your vote is encrypted before transmission and anonymized in our database. The tracking code you receive is mathematically linked to your encrypted vote but NOT to your identity. No one, including system administrators, can trace your vote back to you.",
      },
      {
        question: "What is biometric verification?",
        answer: "Biometric verification uses your device camera to verify your identity through facial recognition and voice challenges. During registration, we capture a baseline. During voting, we verify it's you by comparing live biometric data with your baseline.",
      },
      {
        question: "What if someone gets my EPIC number?",
        answer: "Even with your EPIC number, they cannot vote as you. The system requires: (1) OTP sent to your EPIC-registered mobile, (2) OTP sent to your Aadhaar-linked mobile, (3) Live biometric verification. All three layers must pass.",
      },
      {
        question: "Can the government see who I voted for?",
        answer: "No. Your vote is encrypted with your public key before leaving your device. The encrypted vote and your identity are stored separately and cryptographically unlinked. The system is designed so that even with full database access, votes cannot be traced to voters.",
      },
    ],
    troubleshooting: [
      {
        question: "What if I can't pass the liveness check?",
        answer: "Tips for successful liveness verification: (1) Ensure good lighting on your face, (2) Remove glasses if reflective, (3) Position camera at eye level, (4) Follow instructions carefully and slowly, (5) Speak clearly when reading aloud. You have 3 attempts before needing to contact support.",
      },
      {
        question: "I didn't receive my OTP. What should I do?",
        answer: "If you don't receive OTP: (1) Check if your mobile numbers are correctly registered, (2) Wait 2-3 minutes for delivery, (3) Check spam/blocked messages, (4) Request resend after timer expires. If still not received, contact support immediately.",
      },
      {
        question: "My tracking code doesn't work. What's wrong?",
        answer: "If your tracking code isn't found: (1) Double-check you entered it correctly (case-sensitive), (2) Wait a few minutes as votes may take time to process, (3) Ensure you're using the code from your LATEST vote if you voted multiple times. If problem persists, contact support with your EPIC number.",
      },
      {
        question: "The website is not loading properly.",
        answer: "Try these steps: (1) Clear your browser cache and cookies, (2) Try a different browser (Chrome, Firefox, or Safari recommended), (3) Check your internet connection, (4) Disable VPN if using one, (5) Try accessing from a different device. For persistent issues, contact technical support.",
      },
    ],
    contact: [],
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <div className="flex-1 px-4 py-12">
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="bg-primary/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
              <FileQuestion className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Help Center</h1>
            <p className="text-xl text-muted-foreground">
              Find answers to common questions about ECI Secure Vote
            </p>
          </div>

          {/* Two Column Layout */}
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <aside className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardContent className="pt-6 pb-6">
                  <nav className="space-y-1">
                    {sections.map((section) => (
                      <Button
                        key={section.id}
                        variant={activeSection === section.id ? "secondary" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => setActiveSection(section.id)}
                      >
                        <section.icon className="h-4 w-4 mr-2" />
                        <span className="text-sm">{section.label}</span>
                      </Button>
                    ))}
                  </nav>
                </CardContent>
              </Card>
            </aside>

            {/* Main Content */}
            <main className="lg:col-span-3">
              {activeSection !== "contact" ? (
                <Card>
                  <CardContent className="pt-8 pb-8">
                    <h2 className="text-2xl font-bold mb-6">
                      {sections.find(s => s.id === activeSection)?.label}
                    </h2>
                    
                    <Accordion type="single" collapsible className="space-y-4">
                      {faqs[activeSection as keyof typeof faqs]?.map((faq, index) => (
                        <AccordionItem key={index} value={`item-${index}`} className="border rounded-lg px-4">
                          <AccordionTrigger className="text-left font-semibold hover:no-underline">
                            {faq.question}
                          </AccordionTrigger>
                          <AccordionContent className="text-muted-foreground leading-relaxed">
                            {faq.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  <Card className="border-2 border-primary/30">
                    <CardContent className="pt-8 pb-8">
                      <div className="flex items-start gap-4">
                        <div className="bg-primary/10 rounded-full p-3">
                          <Mail className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-2">Email Support</h3>
                          <p className="text-muted-foreground mb-3">
                            Get help via email. We respond within 24 hours.
                          </p>
                          <p className="font-mono font-semibold">support@ecivote.gov.in</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-secondary/30">
                    <CardContent className="pt-8 pb-8">
                      <div className="flex items-start gap-4">
                        <div className="bg-secondary/10 rounded-full p-3">
                          <Phone className="h-6 w-6 text-secondary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-2">Phone Support</h3>
                          <p className="text-muted-foreground mb-3">
                            Call our toll-free helpline for immediate assistance.
                          </p>
                          <p className="font-mono font-semibold text-xl">1950</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-accent/30">
                    <CardContent className="pt-8 pb-8">
                      <div className="flex items-start gap-4">
                        <div className="bg-accent/10 rounded-full p-3">
                          <Clock className="h-6 w-6 text-accent" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-2">Support Hours</h3>
                          <p className="text-muted-foreground mb-3">
                            Our support team is available:
                          </p>
                          <ul className="space-y-1 text-sm">
                            <li>• <strong>During Election Period:</strong> 24/7</li>
                            <li>• <strong>Regular Days:</strong> Monday-Friday, 9 AM - 6 PM IST</li>
                            <li>• <strong>Weekends:</strong> 10 AM - 4 PM IST</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-muted/50">
                    <CardContent className="pt-6 pb-6">
                      <h3 className="font-semibold mb-3">Before Contacting Support</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Please have the following information ready:
                      </p>
                      <ul className="text-sm text-muted-foreground space-y-2">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                          <span>Your EPIC (Voter ID) number</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                          <span>Registration ID (if registered)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                          <span>Description of the issue you're facing</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                          <span>Screenshots (if applicable)</span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Help;

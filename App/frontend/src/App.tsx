import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Step1 from "./pages/register/Step1";
import Step2 from "./pages/register/Step2";
import Step3 from "./pages/register/Step3";
import Step4 from "./pages/register/Step4";
import Liveness from "./pages/Liveness";
import Vote from "./pages/Vote";
import Receipt from "./pages/Receipt";
import Verify from "./pages/Verify";
import Help from "./pages/Help";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register/step-1" element={<Step1 />} />
          <Route path="/register/step-2" element={<Step2 />} />
          <Route path="/register/step-3" element={<Step3 />} />
          <Route path="/register/step-4" element={<Step4 />} />
          <Route path="/liveness" element={<Liveness />} />
          <Route path="/vote" element={<Vote />} />
          <Route path="/receipt" element={<Receipt />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/help" element={<Help />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

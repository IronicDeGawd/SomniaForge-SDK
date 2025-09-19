import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { useState } from "react";
import Header from "@/components/Header";
import DocsLayout from "@/layouts/DocsLayout";
import Landing from "./pages/Landing";
import Documentation from "./pages/Documentation";
import Demo from "./pages/Demo";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  return (
    <div className="min-h-screen bg-background">
      <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/docs/*" element={<DocsLayout sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />}>
          <Route index element={<Documentation />} />
          <Route path="*" element={<Documentation />} />
        </Route>
        <Route path="/windowed-docs" element={<DocsLayout sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />} />
        <Route path="/demo" element={<Demo />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

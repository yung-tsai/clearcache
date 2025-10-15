import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Login from "./pages/Login";
import NewEntry from "./pages/NewEntry";
import EditEntry from "./pages/EditEntry";
import Folder from "./pages/Folder";
import Account from "./pages/Account";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import EditorTest from "./pages/EditorTest";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/app/new" element={<NewEntry />} />
            <Route path="/app/entry/:id" element={<EditEntry />} />
            <Route path="/app/folder" element={<Folder />} />
            <Route path="/app/account" element={<Account />} />
            <Route path="/app/admin" element={<Admin />} />
            <Route path="/editor-test" element={<EditorTest />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

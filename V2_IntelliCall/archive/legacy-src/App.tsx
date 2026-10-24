import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastProvider } from "./components/ui/Toast";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute, OnboardingRoute } from "./components/auth/ProtectedRoute";
import AppLayout from "./components/ui/AppLayout";

import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import OnboardingPage from "./pages/OnboardingPage";
import DashboardPage from "./pages/DashboardPage";
import LeadsPage from "./pages/LeadsPage";
import LeadDetailPage from "./pages/LeadDetailPage";
import CampaignsPage from "./pages/CampaignsPage";
import CampaignDetailPage from "./pages/CampaignDetailPage";
import CreateCampaignPage from "./pages/CreateCampaignPage";
import AgentsPage from "./pages/AgentsPage";
import AgentDetailPage from "./pages/AgentDetailPage";
import CallsPage from "./pages/CallsPage";
import CallDetailPage from "./pages/CallDetailPage";
import DecisionsPage from "./pages/DecisionsPage";
import DecisionDetailPage from "./pages/DecisionDetailPage";
import OutcomesPage from "./pages/OutcomesPage";
import StrategiesPage from "./pages/StrategiesPage";
import SettingsPage from "./pages/SettingsPage";
import AccountSettingsPage from "./pages/AccountSettingsPage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public marketing & auth routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/signin" element={<AuthPage />} />
            <Route path="/signup" element={<AuthPage />} />

            {/* Gated onboarding route */}
            <Route
              path="/onboarding"
              element={
                <OnboardingRoute>
                  <OnboardingPage />
                </OnboardingRoute>
              }
            />

            {/* App shell — all authenticated & onboarded routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/leads" element={<LeadsPage />} />
                <Route path="/leads/:id" element={<LeadDetailPage />} />
                <Route path="/campaigns" element={<CampaignsPage />} />
                <Route path="/campaigns/new" element={<CreateCampaignPage />} />
                <Route path="/campaigns/:id" element={<CampaignDetailPage />} />
                <Route path="/agents" element={<AgentsPage />} />
                <Route path="/agents/:id" element={<AgentDetailPage />} />
                <Route path="/calls" element={<CallsPage />} />
                <Route path="/calls/:id" element={<CallDetailPage />} />
                <Route path="/decisions" element={<DecisionsPage />} />
                <Route path="/decisions/:id" element={<DecisionDetailPage />} />
                <Route path="/outcomes" element={<OutcomesPage />} />
                <Route path="/strategies" element={<StrategiesPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/settings/account" element={<AccountSettingsPage />} />
              </Route>
            </Route>
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

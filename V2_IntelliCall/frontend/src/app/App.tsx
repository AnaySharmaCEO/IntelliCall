import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './AppLayout';
import LandingPage from '../features/landing/LandingPage';
import AuthPage from '../features/auth/AuthPage';
import OnboardingPage from '../features/onboarding/OnboardingPage';
import DashboardPage from '../features/dashboard/DashboardPage';
import CallsPage from '../features/calls/CallsPage';
import CallDetailPage from '../features/calls/CallDetailPage';
import LiveCallMonitorPage from '../features/calls/LiveCallMonitorPage';
import ReviewQueuePage from '../features/review/ReviewQueuePage';
import AgentsPage from '../features/agents/AgentsPage';
import CampaignsPage from '../features/campaigns/CampaignsPage';
import CampaignWizardPage from '../features/campaigns/CampaignWizardPage';
import LeadsPage from '../features/leads/LeadsPage';
import LeadDetailPage from '../features/leads/LeadDetailPage';
import AppointmentsPage from '../features/appointments/AppointmentsPage';
import CompliancePage from '../features/compliance/CompliancePage';
import AnalyticsPage from '../features/analytics/AnalyticsPage';
import SettingsPage from '../features/settings/SettingsPage';
import KitPage from '../features/kit/KitPage';
import PhoneSimulatorPage from '../features/calls/PhoneSimulatorPage';

export const App: React.FC = () => {
  return (
    <Routes>
      {/* Public Landing Page at root (Preserved) */}
      <Route path="/" element={<LandingPage />} />

      {/* Auth & Onboarding Flows */}
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/signin" element={<AuthPage initialMode="signin" />} />
      <Route path="/login" element={<AuthPage initialMode="signin" />} />
      <Route path="/signup" element={<AuthPage initialMode="signup" />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/phone-simulator" element={<PhoneSimulatorPage />} />

      {/* Main Authenticated / App Shell */}
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/calls" element={<CallsPage />} />
        <Route path="/calls/live" element={<LiveCallMonitorPage />} />
        <Route path="/calls/:id" element={<CallDetailPage />} />
        <Route path="/review" element={<ReviewQueuePage />} />
        <Route path="/agents" element={<AgentsPage />} />
        <Route path="/campaigns" element={<CampaignsPage />} />
        <Route path="/campaigns/new" element={<CampaignWizardPage />} />
        <Route path="/leads" element={<LeadsPage />} />
        <Route path="/leads/:id" element={<LeadDetailPage />} />
        <Route path="/appointments" element={<AppointmentsPage />} />
        <Route path="/compliance" element={<CompliancePage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/settings" element={<SettingsPage />} />

        {/* Design System Verification Kitchen Sink */}
        <Route path="/__kit" element={<KitPage />} />

        {/* Fallback redirect */}
        <Route path="/app" element={<Navigate to="/dashboard" replace />} />
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;

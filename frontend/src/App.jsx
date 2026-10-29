import { Route, Routes } from 'react-router';

import { AppShell } from '@/components/AppShell';
import { GuestRoute } from '@/features/auth/GuestRoute';
import { RequireAuth } from '@/features/auth/RequireAuth';
import { AdminActivitiesPage } from '@/pages/AdminActivitiesPage';
import { CreateTeamPage } from '@/pages/CreateTeamPage';
import { DailyActivityPage } from '@/pages/DailyActivityPage';
import { HistoryPage } from '@/pages/HistoryPage';
import { HomePage } from '@/pages/HomePage';
import { JoinPage } from '@/pages/JoinPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { ProgressPage } from '@/pages/ProgressPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { SignInPage } from '@/pages/SignInPage';
import { TeamSettingsPage } from '@/pages/TeamSettingsPage';
import { TeamsPage } from '@/pages/TeamsPage';

/**
 * Route table for the web app.
 */
export function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route
        path="/sign-in"
        element={
          <GuestRoute>
            <SignInPage />
          </GuestRoute>
        }
      />
      <Route
        path="/register"
        element={
          <GuestRoute>
            <RegisterPage />
          </GuestRoute>
        }
      />
      <Route path="/join" element={<JoinPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route path="/teams" element={<TeamsPage />} />
          <Route path="/teams/new" element={<CreateTeamPage />} />
          <Route path="/teams/:teamId" element={<DailyActivityPage />} />
          <Route path="/teams/:teamId/progress" element={<ProgressPage />} />
          <Route path="/teams/:teamId/history" element={<HistoryPage />} />
          <Route path="/teams/:teamId/settings" element={<TeamSettingsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/admin/activities" element={<AdminActivitiesPage />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

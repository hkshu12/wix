import { useEffect, type ReactNode } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { AppChrome } from '../layout/AppChrome';
import { AppLayout } from '../layout/AppLayout';
import { AboutPage } from '../pages/AboutPage';
import { LandingPage } from '../pages/LandingPage';
import { SettingsPage } from '../pages/SettingsPage';
import { StudioPage } from '../pages/StudioPage';
import { UpdatePage } from '../pages/UpdatePage';
import { shouldShowLandingPage } from '../lib/platform';
import { getHasEnteredStudio } from '../storage/onboarding';

export function LandingGate({ landing }: { landing: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const fromIntro = (location.state as { fromIntro?: boolean } | null)?.fromIntro === true;

  useEffect(() => {
    if (!fromIntro && getHasEnteredStudio()) {
      navigate('/studio', { replace: true });
    }
  }, [fromIntro, navigate]);

  if (!fromIntro && getHasEnteredStudio()) {
    return null;
  }

  return <>{landing}</>;
}

function RootRoute() {
  if (!shouldShowLandingPage()) {
    return <Navigate to="/studio" replace />;
  }

  return <LandingGate landing={<LandingPage />} />;
}

function NotFoundRedirect() {
  return <Navigate to={shouldShowLandingPage() ? '/' : '/studio'} replace />;
}

export function AppRouter() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<RootRoute />} />
        <Route path="/studio" element={<StudioPage />} />
        <Route element={<AppChrome />}>
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/update" element={<UpdatePage />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFoundRedirect />} />
    </Routes>
  );
}

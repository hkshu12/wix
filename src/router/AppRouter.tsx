import { useEffect, type ReactNode } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { AppLayout } from '../layout/AppLayout';
import { LandingPage } from '../pages/LandingPage';
import { StudioPage } from '../pages/StudioPage';
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

export function AppRouter() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<LandingGate landing={<LandingPage />} />} />
        <Route path="/studio" element={<StudioPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

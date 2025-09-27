import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function AuthGuard({ children, requireAdmin = false }: AuthGuardProps) {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/login');
        return;
      }

      if (requireAdmin && profile?.role !== 'admin') {
        navigate('/');
        return;
      }
    }
  }, [user, profile, loading, requireAdmin, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="mac-window w-96">
          <div className="mac-title-bar">
            <div className="mac-close-button"></div>
            <div className="mac-title-bar-stripes-left"></div>
            <div className="mac-title-bar-center">Loading...</div>
            <div className="mac-title-bar-stripes-right"></div>
          </div>
          <div className="mac-content p-8 text-center">
            <div className="text-sm font-mono">Authenticating...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!user || (requireAdmin && profile?.role !== 'admin')) {
    return null;
  }

  return <>{children}</>;
}
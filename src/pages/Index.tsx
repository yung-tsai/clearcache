import { MacDesktop } from '@/components/MacDesktop';
import { AuthGuard } from '@/components/AuthGuard';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-sm font-mono">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-mono font-bold">Clear Cache Journal</h1>
          <p className="text-muted-foreground font-mono">Please sign in to continue</p>
          <Link 
            to="/login" 
            className="inline-block px-6 py-2 bg-primary text-primary-foreground rounded font-mono hover:bg-primary/90 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <MacDesktop />
    </AuthGuard>
  );
};

export default Index;

import { AuthGuard } from '@/components/AuthGuard';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

export default function Account() {
  const { user, profile, signOut } = useAuth();

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto bg-white border border-black shadow-lg">
          <div className="h-5 bg-gradient-to-b from-gray-100 to-gray-200 border-b border-black/20 flex items-center px-2">
            <div className="flex-1 text-center text-xs font-medium text-black">
              Account Settings
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-mono font-bold mb-2">Email</label>
              <div className="p-2 border border-black bg-gray-50 font-mono text-sm">
                {user?.email}
              </div>
            </div>

            <div>
              <label className="block text-sm font-mono font-bold mb-2">Role</label>
              <div className="p-2 border border-black bg-gray-50 font-mono text-sm">
                {profile?.role || 'user'}
              </div>
            </div>

            <div>
              <label className="block text-sm font-mono font-bold mb-2">User ID</label>
              <div className="p-2 border border-black bg-gray-50 font-mono text-xs break-all">
                {user?.id}
              </div>
            </div>

            <div className="pt-4 border-t border-black/20">
              <Button
                onClick={signOut}
                variant="destructive"
                className="mac-button"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
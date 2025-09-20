import { AuthGuard } from '@/components/AuthGuard';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import MacWindow from '@/components/MacWindow';

export default function Account() {
  const { user, profile, signOut } = useAuth();

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background p-4">
        <MacWindow title="Account Settings" className="max-w-2xl mx-auto">
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
                {profile?.role}
              </div>
            </div>

            <div>
              <label className="block text-sm font-mono font-bold mb-2">Subscription Status</label>
              <div className="p-2 border border-black bg-gray-50 font-mono text-sm">
                Inactive (Iteration 2 feature)
              </div>
            </div>

            <div className="pt-4">
              <Button
                onClick={signOut}
                variant="destructive"
                className="mac-button"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </MacWindow>
      </div>
    </AuthGuard>
  );
}
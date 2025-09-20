import AdminPanel from '@/components/AdminPanel';
import { AuthGuard } from '@/components/AuthGuard';

export default function Admin() {
  return (
    <AuthGuard requireAdmin>
      <AdminPanel />
    </AuthGuard>
  );
}
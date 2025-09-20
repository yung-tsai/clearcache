import JournalFolder from '@/components/JournalFolder';
import { AuthGuard } from '@/components/AuthGuard';

export default function Folder() {
  return (
    <AuthGuard>
      <JournalFolder />
    </AuthGuard>
  );
}
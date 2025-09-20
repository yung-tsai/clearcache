import JournalEditor from '@/components/JournalEditor';
import { AuthGuard } from '@/components/AuthGuard';

export default function NewEntry() {
  return (
    <AuthGuard>
      <JournalEditor />
    </AuthGuard>
  );
}
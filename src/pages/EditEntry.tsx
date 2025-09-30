import { useParams } from 'react-router-dom';
import JournalEditor from '@/components/JournalEditor';
import { AuthGuard } from '@/components/AuthGuard';

export default function EditEntry() {
  const { id } = useParams<{ id: string }>();
  
  return (
    <AuthGuard>
      <JournalEditor entryId={id} />
    </AuthGuard>
  );
}
import { useParams } from 'react-router-dom';
import JournalEditor from '@/components/JournalEditor';

export default function EditEntry() {
  const { id } = useParams<{ id: string }>();
  
  return <JournalEditor entryId={id} />;
}
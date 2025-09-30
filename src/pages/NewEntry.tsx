import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import JournalEditor from '@/components/JournalEditor';
import { AuthGuard } from '@/components/AuthGuard';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';

export default function NewEntry() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [currentData, setCurrentData] = useState<{
    title: string;
    markdown: string;
    editorStateJSON: string;
  } | null>(null);

  const handleSave = async () => {
    if (!currentData || !currentData.title.trim()) {
      toast({
        title: "Title required",
        description: "Please add a title (first line) before saving.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const userId = user?.id || '12345678-1234-1234-1234-123456789012';
      
      const { data, error } = await supabase
        .from('entries')
        .insert({
          user_id: userId,
          title: currentData.title,
          content: currentData.markdown,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Saved",
        description: "Your entry has been saved.",
      });

      navigate(`/app/entry/${data.id}`);
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Save Error",
        description: "Could not save your entry. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background p-4">
        <div className="mx-auto max-w-4xl">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold">New Entry</h1>
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
          
          <JournalEditor
            placeholder="Start writing your entry..."
            onChange={(data) => setCurrentData(data)}
          />
        </div>
      </div>
    </AuthGuard>
  );
}

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import JournalEditor from '@/components/JournalEditor';
import { AuthGuard } from '@/components/AuthGuard';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Save, Trash2 } from 'lucide-react';

export default function EditEntry() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [initialMarkdown, setInitialMarkdown] = useState<string>('');
  const [currentData, setCurrentData] = useState<{
    title: string;
    markdown: string;
    editorStateJSON: string;
  } | null>(null);

  useEffect(() => {
    if (!id) return;

    const loadEntry = async () => {
      try {
        const { data, error } = await supabase
          .from('entries')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setInitialMarkdown(data.content || '');
      } catch (error) {
        console.error('Load error:', error);
        toast({
          title: "Load Error",
          description: "Could not load entry.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadEntry();
  }, [id, toast]);

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
      const { error } = await supabase
        .from('entries')
        .update({
          title: currentData.title,
          content: currentData.markdown,
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Saved",
        description: "Your entry has been updated.",
      });
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

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this entry?')) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('entries')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Deleted",
        description: "Entry has been deleted.",
      });

      navigate('/app/folder');
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Delete Error",
        description: "Could not delete entry.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <p>Loading...</p>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background p-4">
        <div className="mx-auto max-w-4xl">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold">Edit Entry</h1>
            <div className="flex gap-2">
              <Button onClick={handleDelete} variant="destructive" disabled={isDeleting}>
                <Trash2 className="mr-2 h-4 w-4" />
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
          
          <JournalEditor
            value={initialMarkdown}
            placeholder="Start writing your entry..."
            onChange={(data) => setCurrentData(data)}
          />
        </div>
      </div>
    </AuthGuard>
  );
}

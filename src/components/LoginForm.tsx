import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import MacWindow from '@/components/MacWindow';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/app/folder`,
        },
      });

      if (error) {
        toast({
          title: 'Login Error',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Check your email',
          description: 'We sent you a magic link to sign in.',
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'Login Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <MacWindow title="Clear Cache - Login" className="w-96">
        <form onSubmit={handleLogin} className="p-6 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-mono font-bold mb-2">
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="font-mono"
            />
          </div>
          
          <Button
            type="submit"
            disabled={loading || !email}
            className="w-full mac-button"
          >
            {loading ? 'Sending...' : 'Send Magic Link'}
          </Button>
          
          <div className="text-xs font-mono text-center text-muted-foreground">
            A magic link will be sent to your email
          </div>
        </form>
      </MacWindow>
    </div>
  );
}
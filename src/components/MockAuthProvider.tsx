import { createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { Profile } from '@/lib/database.types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const MockAuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: false,
  signOut: async () => {},
});

// Mock user for testing
const mockUser: User = {
  id: '12345678-1234-1234-1234-123456789012', // Valid UUID format
  email: 'test@example.com',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  aud: 'authenticated',
  role: 'authenticated',
  app_metadata: {},
  user_metadata: {},
} as User;

const mockProfile: Profile = {
  user_id: '12345678-1234-1234-1234-123456789012', // Matching UUID
  role: 'user',
  created_at: new Date().toISOString(),
};

export function MockAuthProvider({ children }: { children: React.ReactNode }) {
  const value: AuthContextType = {
    user: mockUser,
    session: null,
    profile: mockProfile,
    loading: false,
    signOut: async () => console.log('Mock sign out'),
  };

  return (
    <MockAuthContext.Provider value={value}>
      {children}
    </MockAuthContext.Provider>
  );
}

export const useMockAuth = () => {
  return useContext(MockAuthContext);
};
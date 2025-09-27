import { MacDesktop } from '@/components/MacDesktop';
import { MockAuthProvider } from '@/components/MockAuthProvider';

const Index = () => {
  // DEVELOPMENT MODE: Set to true to bypass authentication  
  const BYPASS_AUTH = true; // ⚠️ Set to false for production

  if (BYPASS_AUTH) {
    // Mock user context for testing - enables streaks/badges to work
    return (
      <MockAuthProvider>
        <MacDesktop />
      </MockAuthProvider>
    );
  }

  // Note: In production, restore full auth logic here
  return null;
};

export default Index;

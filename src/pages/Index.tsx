import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Hero from '@/components/landing/Hero';
import RegionSelector from '@/components/landing/RegionSelector';
import ChatRoom from '@/components/chat/ChatRoom';
import { useChatRooms, useChatRoom } from '@/hooks/useChatRooms';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';

type AppView = 'landing' | 'regions' | 'chat';

const Index = () => {
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const { user, profile, isLoading, signOut } = useAuth();
  const { data: rooms } = useChatRooms();
  const { data: selectedRoomData } = useChatRoom(selectedRegion || '');
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (!user) {
      navigate('/auth');
    } else {
      setCurrentView('regions');
    }
  };

  const handleSelectRegion = (regionCode: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    setSelectedRegion(regionCode);
    setCurrentView('chat');
  };

  const handleBackToRegions = () => {
    setSelectedRegion(null);
    setCurrentView('regions');
  };

  const handleSignOut = async () => {
    await signOut();
    setCurrentView('landing');
  };

  // Get member count from database
  const getMemberCount = () => {
    if (!selectedRoomData) return 0;
    // For now return a placeholder - would need a count query
    return 100;
  };

  if (currentView === 'chat' && selectedRegion && selectedRoomData) {
    return (
      <ChatRoom
        roomId={selectedRoomData.id}
        regionCode={selectedRegion}
        regionName={selectedRoomData.region_name}
        memberCount={getMemberCount()}
        onBack={handleBackToRegions}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header for authenticated users */}
      {user && currentView !== 'landing' && (
        <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
          <div className="container flex items-center justify-between h-16 px-4">
            <h1 className="font-display text-xl font-bold gradient-text">GayConnect</h1>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-sm font-semibold">
                  {profile?.username?.charAt(0).toUpperCase() || <User className="w-4 h-4" />}
                </div>
                <span className="text-sm font-medium">{profile?.username}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={handleSignOut}>
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </header>
      )}

      {currentView === 'landing' && (
        <Hero onGetStarted={handleGetStarted} />
      )}
      
      {currentView === 'regions' && (
        <RegionSelector onSelectRegion={handleSelectRegion} />
      )}
    </div>
  );
};

export default Index;

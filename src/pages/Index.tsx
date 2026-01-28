import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Hero from '@/components/landing/Hero';
import RegionSelector from '@/components/landing/RegionSelector';
import ChatRoom from '@/components/chat/ChatRoom';
import PrivateChatList from '@/components/chat/PrivateChatList';
import PrivateChatRoom from '@/components/chat/PrivateChatRoom';
import ProfileEditDialog from '@/components/profile/ProfileEditDialog';
import BottomNavBar from '@/components/navigation/BottomNavBar';
import { useChatRooms, useChatRoom } from '@/hooks/useChatRooms';
import { usePrivateConversations } from '@/hooks/usePrivateConversations';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { useAuth } from '@/contexts/AuthContext';
import { useIsAdmin } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { LogOut, User, Shield } from 'lucide-react';

type AppView = 'landing' | 'home' | 'groups' | 'messages' | 'profile' | 'chat' | 'private';
type NavTab = 'home' | 'groups' | 'messages' | 'profile';

const Index = () => {
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedPrivateUserId, setSelectedPrivateUserId] = useState<string | null>(null);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const { user, profile, signOut } = useAuth();
  const { data: isAdmin } = useIsAdmin();
  const { data: rooms } = useChatRooms();
  const { data: selectedRoomData } = useChatRoom(selectedRegion || '');
  const { getOrCreateConversation } = usePrivateConversations();
  const { getTotalUnreadCount, markAsRead } = useUnreadMessages();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (!user) {
      navigate('/auth');
    } else {
      setCurrentView('home');
      setActiveTab('home');
    }
  };

  const handleTabChange = (tab: NavTab) => {
    setActiveTab(tab);
    if (tab === 'profile') {
      setShowProfileEdit(true);
    } else if (tab === 'messages') {
      setSelectedPrivateUserId(null);
      setCurrentView('messages');
    } else if (tab === 'groups') {
      setCurrentView('groups');
    } else {
      setCurrentView('home');
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
    setCurrentView('groups');
    setActiveTab('groups');
  };

  const handleSignOut = async () => {
    await signOut();
    setCurrentView('landing');
    setActiveTab('home');
  };

  // Start private chat from member list in group chat
  const handleStartPrivateChat = async (userId: string) => {
    try {
      await getOrCreateConversation.mutateAsync(userId);
      setSelectedPrivateUserId(userId);
      setCurrentView('private');
      setActiveTab('messages');
    } catch (error) {
      console.error('Error starting private chat:', error);
    }
  };

  // Select conversation from private chat list
  const handleSelectConversation = (userId: string) => {
    setSelectedPrivateUserId(userId);
    // Mark messages as read when opening conversation
    markAsRead.mutate(userId);
  };

  const handleBackFromPrivateChat = () => {
    setSelectedPrivateUserId(null);
    setCurrentView('messages');
  };

  // Get member count from database
  const getMemberCount = () => {
    if (!selectedRoomData) return 0;
    return 100;
  };

  // Render private chat view
  if (currentView === 'private' && selectedPrivateUserId) {
    return (
      <PrivateChatRoom
        otherUserId={selectedPrivateUserId}
        onBack={handleBackFromPrivateChat}
      />
    );
  }

  // Render group chat view
  if (currentView === 'chat' && selectedRegion && selectedRoomData) {
    return (
      <ChatRoom
        roomId={selectedRoomData.id}
        regionCode={selectedRegion}
        regionName={selectedRoomData.region_name}
        memberCount={getMemberCount()}
        onBack={handleBackToRegions}
        onStartPrivateChat={handleStartPrivateChat}
      />
    );
  }

  const showBottomNav = user && currentView !== 'landing' && currentView !== 'chat' && currentView !== 'private';

  return (
    <div className="min-h-screen bg-background">
      {/* Header for authenticated users */}
      {user && currentView !== 'landing' && (
        <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
          <div className="container flex items-center justify-between h-16 px-4">
            <h1 className="font-display text-xl font-bold gradient-text">GayConnect</h1>
            
            <div className="flex items-center gap-3">
              {/* Admin button */}
              {isAdmin && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate('/admin')}
                  className="gap-2"
                >
                  <Shield className="w-4 h-4" />
                  Admin
                </Button>
              )}
              
              <Button variant="ghost" size="icon" onClick={handleSignOut}>
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </header>
      )}

      {/* Profile Edit Dialog */}
      <ProfileEditDialog open={showProfileEdit} onOpenChange={setShowProfileEdit} />

      {/* Landing page */}
      {currentView === 'landing' && (
        <Hero onGetStarted={handleGetStarted} />
      )}
      
      {/* Home view */}
      {(currentView === 'home' || currentView === 'groups') && (
        <div className="pb-24">
          <RegionSelector onSelectRegion={handleSelectRegion} />
        </div>
      )}

      {/* Messages view */}
      {currentView === 'messages' && (
        <div className="h-[calc(100vh-4rem)] pb-24">
          <PrivateChatList
            onSelectConversation={(userId) => {
              handleSelectConversation(userId);
              setSelectedPrivateUserId(userId);
              setCurrentView('private');
            }}
            selectedUserId={null}
          />
        </div>
      )}

      {/* Bottom Navigation Bar */}
      {showBottomNav && (
        <BottomNavBar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          unreadCount={getTotalUnreadCount()}
        />
      )}
    </div>
  );
};

export default Index;

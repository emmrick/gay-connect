import { useNavigate } from 'react-router-dom';
import UnifiedPageHeader from '@/components/layout/UnifiedPageHeader';
import HenryChat from '@/components/henry/HenryChat';

const HenryPage = () => {
  const navigate = useNavigate();
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <UnifiedPageHeader
        onNavigateToCredits={() => navigate('/credits')}
        onNavigateToProfile={() => navigate('/profile')}
      />
      <div className="flex-1 min-h-0">
        <HenryChat />
      </div>
    </div>
  );
};

export default HenryPage;

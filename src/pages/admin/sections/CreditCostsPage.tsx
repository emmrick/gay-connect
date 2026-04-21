import CreditOffersPanel from '@/components/admin/CreditOffersPanel';
import AdFreePlansPanel from '@/components/admin/AdFreePlansPanel';
import CreditCostsPanel from '@/components/admin/CreditCostsPanel';
import CreditPromotionsPanel from '@/components/admin/CreditPromotionsPanel';
import ChatbotPricingPanel from '@/components/admin/ChatbotPricingPanel';

const CreditCostsPage = () => (
  <div className="space-y-8">
    <CreditPromotionsPanel />
    <CreditOffersPanel />
    <AdFreePlansPanel />
    <CreditCostsPanel />
    <ChatbotPricingPanel />
  </div>
);

export default CreditCostsPage;


-- Ads table: stores all advertisements
CREATE TABLE public.ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  link_url TEXT,
  advertiser_name TEXT NOT NULL,
  advertiser_email TEXT,
  placement TEXT NOT NULL DEFAULT 'native' CHECK (placement IN ('compact', 'native', 'sponsored_card')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'paused', 'expired')),
  rejection_reason TEXT,
  target_pages TEXT[] DEFAULT '{}',
  budget_cents INTEGER DEFAULT 0,
  spent_cents INTEGER DEFAULT 0,
  cost_per_click_cents INTEGER DEFAULT 2,
  cost_per_mille_cents INTEGER DEFAULT 10,
  impressions_count INTEGER DEFAULT 0,
  clicks_count INTEGER DEFAULT 0,
  max_impressions INTEGER,
  max_clicks INTEGER,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ad impressions tracking
CREATE TABLE public.ad_impressions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  page_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ad clicks tracking
CREATE TABLE public.ad_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  page_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ad-free subscriptions (credits-based)
CREATE TABLE public.ad_free_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  credits_paid NUMERIC NOT NULL DEFAULT 30,
  payment_plan TEXT DEFAULT 'monthly' CHECK (payment_plan IN ('monthly', 'biweekly', 'weekly')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_impressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_free_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS: Ads - public read for approved, admin write
CREATE POLICY "Anyone can read approved ads" ON public.ads FOR SELECT USING (status = 'approved' AND is_active = true);
CREATE POLICY "Admins can manage all ads" ON public.ads FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS: Impressions - authenticated insert, admin read
CREATE POLICY "Authenticated users can log impressions" ON public.ad_impressions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can read impressions" ON public.ad_impressions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS: Clicks - authenticated insert, admin read
CREATE POLICY "Authenticated users can log clicks" ON public.ad_clicks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can read clicks" ON public.ad_clicks FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS: Ad-free subscriptions - user can read own, admin can manage
CREATE POLICY "Users can read own ad-free sub" ON public.ad_free_subscriptions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can manage ad-free subs" ON public.ad_free_subscriptions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Indexes
CREATE INDEX idx_ads_status ON public.ads(status, is_active);
CREATE INDEX idx_ad_impressions_ad_id ON public.ad_impressions(ad_id);
CREATE INDEX idx_ad_clicks_ad_id ON public.ad_clicks(ad_id);
CREATE INDEX idx_ad_free_subs_user ON public.ad_free_subscriptions(user_id);

-- Trigger for updated_at
CREATE TRIGGER update_ads_updated_at BEFORE UPDATE ON public.ads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

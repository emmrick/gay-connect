import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Heart } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { LoginFormData, SignupFormData } from '@/lib/validations/auth';
import AuthHeader from '@/components/auth/AuthHeader';
import LoginForm from '@/components/auth/LoginForm';
import SignupForm from '@/components/auth/SignupForm';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';
import ForgotPasswordDialog from '@/components/auth/ForgotPasswordDialog';
import { motion, AnimatePresence } from 'framer-motion';

const Auth = () => {
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [coupleInviteCode, setCoupleInviteCode] = useState('');
  const [defaultReferralCode, setDefaultReferralCode] = useState('');

  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      setDefaultReferralCode(refCode.toUpperCase());
      setIsLogin(false);
    }
    const coupleCode = searchParams.get('couple');
    if (coupleCode) {
      setCoupleInviteCode(coupleCode);
      setIsLogin(false);
    }
  }, [searchParams]);

  const handleLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const { error } = await signIn(data.email, data.password);
      if (error) throw error;

      if (coupleInviteCode) {
        try {
          const { data: result } = await supabase.rpc('join_couple_by_code', { _invite_code: coupleInviteCode });
          const r = result as { success: boolean; error?: string } | null;
          if (r?.success) toast.success('Vous avez rejoint le compte couple !');
          else toast.error(r?.error || 'Code couple invalide');
        } catch { toast.error('Erreur lors de la jonction au couple'); }
      }

      toast.success('Connexion réussie !');
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (data: SignupFormData) => {
    setIsLoading(true);
    try {
      if (data.referralCode) {
        localStorage.setItem('pending_referral_code', data.referralCode.trim());
      }

      const { error } = await signUp(data.email, data.password, data.username, data.region, data.age);
      if (error) throw error;

      if (data.accountType === 'couple') {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: coupleData, error: coupleError } = await supabase
            .from('couple_accounts')
            .insert({ owner_user_id: session.user.id })
            .select()
            .single();

          if (!coupleError && coupleData) {
            await supabase
              .from('profiles')
              .update({ couple_account_id: coupleData.id, couple_role: 'owner' })
              .eq('user_id', session.user.id);
            toast.info('Compte couple créé ! Invitez votre partenaire depuis les paramètres.');
          }
        }
      }

      toast.success('Compte créé avec succès !');
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AuthHeader />

      <div className="flex-1 flex items-start justify-center px-5 pb-8 pt-2 overflow-auto">
        <div className="w-full max-w-sm">
          {/* Couple invite banner */}
          {coupleInviteCode && (
            <motion.div
              className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-xl flex items-center gap-2"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Heart className="w-5 h-5 text-primary flex-shrink-0" />
              <p className="text-sm">
                {isLogin ? 'Connectez-vous pour rejoindre le couple' : 'Créez un compte pour rejoindre le couple'}
              </p>
            </motion.div>
          )}

          {/* Google Sign-In */}
          <div className="mb-4">
            <GoogleSignInButton />
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">ou</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Forms */}
          <AnimatePresence mode="wait">
            {isLogin ? (
              <LoginForm
                key="login"
                onSubmit={handleLogin}
                onForgotPassword={(email) => { setForgotEmail(email); setShowForgotPassword(true); }}
                isLoading={isLoading}
              />
            ) : (
              <SignupForm
                key="signup"
                onSubmit={handleSignup}
                isLoading={isLoading}
                defaultReferralCode={defaultReferralCode}
                showCoupleInvite={!!coupleInviteCode}
              />
            )}
          </AnimatePresence>

          {/* Toggle */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isLogin ? (
                <>Pas encore de compte ? <span className="text-primary font-medium">Inscris-toi</span></>
              ) : (
                <>Déjà un compte ? <span className="text-primary font-medium">Connecte-toi</span></>
              )}
            </button>
          </div>

          <ForgotPasswordDialog
            open={showForgotPassword}
            onClose={() => setShowForgotPassword(false)}
            defaultEmail={forgotEmail}
          />
        </div>
      </div>
    </div>
  );
};

export default Auth;

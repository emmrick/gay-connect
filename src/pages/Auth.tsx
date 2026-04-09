import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useChatRooms } from '@/hooks/useChatRooms';
import { ArrowLeft, Mail, Lock, User, MapPin, Loader2, Eye, EyeOff, ChevronDown, AlertTriangle, Calendar, Gift, CheckCircle, X, Heart, Users } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

const Auth = () => {
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [age, setAge] = useState('');
  const [region, setRegion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [referralValidation, setReferralValidation] = useState<{ valid: boolean; message: string } | null>(null);
  const [isValidatingReferral, setIsValidatingReferral] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  // Couple fields
  const [accountType, setAccountType] = useState<'solo' | 'couple'>('solo');
  const [username2, setUsername2] = useState('');
  const [age2, setAge2] = useState('');

  // Join couple via URL
  const [coupleInviteCode, setCoupleInviteCode] = useState('');

  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { data: rooms, isLoading: roomsLoading } = useChatRooms();

  // Check for referral code or couple invite in URL
  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      setReferralCode(refCode.toUpperCase());
      setIsLogin(false);
      validateReferralCode(refCode);
    }
    const coupleCode = searchParams.get('couple');
    if (coupleCode) {
      setCoupleInviteCode(coupleCode);
      setIsLogin(false);
    }
  }, [searchParams]);

  const validateReferralCode = async (code: string) => {
    if (!code.trim()) {
      setReferralValidation(null);
      return;
    }
    setIsValidatingReferral(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-referrals', {
        body: { action: 'validate-code', referralCode: code.trim() }
      });
      if (error) {
        setReferralValidation({ valid: false, message: 'Erreur de validation' });
      } else {
        setReferralValidation(data);
      }
    } catch {
      setReferralValidation({ valid: false, message: 'Erreur de validation' });
    } finally {
      setIsValidatingReferral(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!resetEmail.trim()) {
      toast.error('Veuillez entrer votre adresse email');
      return;
    }
    setIsResetting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
        redirectTo: `${window.location.origin}/auth`,
      });
      if (error) throw error;
      toast.success('Un email de réinitialisation a été envoyé !');
      setShowForgotPassword(false);
      setResetEmail('');
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de l\'envoi');
    } finally {
      setIsResetting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) throw error;

        // If there's a couple invite code, join after login
        if (coupleInviteCode) {
          try {
            const { data } = await supabase.rpc('join_couple_by_code', {
              _invite_code: coupleInviteCode,
            });
            const result = data as { success: boolean; error?: string } | null;
            if (result?.success) {
              toast.success('Vous avez rejoint le compte couple !');
            } else {
              toast.error(result?.error || 'Code couple invalide');
            }
          } catch {
            toast.error('Erreur lors de la jonction au couple');
          }
        }

        toast.success('Connexion réussie !');
        navigate('/');
      } else {
        // Signup validation
        if (!username || !region || !age) {
          toast.error('Veuillez remplir tous les champs');
          setIsLoading(false);
          return;
        }
        const ageNum = parseInt(age);
        if (isNaN(ageNum) || ageNum < 18 || ageNum > 99) {
          toast.error('Vous devez avoir au moins 18 ans');
          setIsLoading(false);
          return;
        }

        if (accountType === 'couple') {
          if (!username2) {
            toast.error('Veuillez entrer le pseudo du partenaire');
            setIsLoading(false);
            return;
          }
          const age2Num = parseInt(age2);
          if (isNaN(age2Num) || age2Num < 18 || age2Num > 99) {
            toast.error('Le partenaire doit avoir au moins 18 ans');
            setIsLoading(false);
            return;
          }
        }

        if (referralValidation?.valid && referralCode) {
          localStorage.setItem('pending_referral_code', referralCode.trim());
        }

        // Create main account
        const { error } = await signUp(email, password, username, region, ageNum);
        if (error) throw error;

        // If couple, create couple account and second profile
        if (accountType === 'couple') {
          // Wait for session to be available
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const age2Num = parseInt(age2);

            // Create couple account
            const { data: coupleData, error: coupleError } = await supabase
              .from('couple_accounts')
              .insert({ owner_user_id: session.user.id })
              .select()
              .single();

            if (coupleError) {
              console.error('Error creating couple account:', coupleError);
            } else {
              // Update owner profile with couple info
              await supabase
                .from('profiles')
                .update({ couple_account_id: coupleData.id, couple_role: 'owner' })
                .eq('user_id', session.user.id);

              // Create second profile (partner will use same auth but different profile)
              const { error: profile2Error } = await supabase
                .from('profiles')
                .insert({
                  user_id: session.user.id, // Same auth user
                  username: username2,
                  region,
                  age: age2Num,
                  is_online: false,
                  couple_account_id: coupleData.id,
                  couple_role: 'partner_pending',
                });

              if (profile2Error) {
                console.error('Error creating partner profile:', profile2Error);
                // The partner profile will need unique user_id, so we'll handle this differently
                // For single-auth couple, we store partner info in the couple_account metadata
                toast.info('Compte créé ! Invitez votre partenaire depuis les paramètres.');
              } else {
                toast.success('Compte couple créé avec succès !');
              }
            }
          }
        }

        toast.success(accountType === 'couple' 
          ? 'Compte couple créé ! Invitez votre partenaire depuis les paramètres.' 
          : 'Compte créé avec succès !');
        navigate('/');
      }
    } catch (error: any) {
      toast.error(error.message || 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* 18+ Warning Banner */}
      <div className="bg-destructive/90 text-destructive-foreground py-3 px-4 text-center">
        <div className="container mx-auto flex items-center justify-center gap-2 flex-wrap">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span className="font-semibold text-sm">
            Site réservé aux adultes (+18 ans) • Hommes uniquement
          </span>
          <Link to="/legal" className="underline hover:no-underline text-sm ml-2">
            Mentions légales
          </Link>
        </div>
      </div>

      {/* Header */}
      <header className="p-4 border-b border-border/50">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="h-9 w-9">
          <ArrowLeft className="w-5 h-5" />
        </Button>
      </header>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm animate-fade-in">
          {/* Logo */}
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl font-bold gradient-text mb-2">GaySocial</h1>
            <p className="text-muted-foreground text-sm">
              {isLogin ? 'Bon retour parmi nous !' : 'Rejoins la communauté'}
            </p>
          </div>

          {/* Couple invite banner */}
          {coupleInviteCode && (
            <div className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-xl flex items-center gap-2">
              <Heart className="w-5 h-5 text-primary flex-shrink-0" />
              <p className="text-sm">
                {isLogin 
                  ? 'Connectez-vous pour rejoindre le compte couple' 
                  : 'Créez un compte pour rejoindre le couple'}
              </p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Account type selector - only for signup */}
            {!isLogin && !coupleInviteCode && (
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Type de compte</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAccountType('solo')}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                      accountType === 'solo'
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/30"
                    )}
                  >
                    <User className={cn("w-6 h-6", accountType === 'solo' ? "text-primary" : "text-muted-foreground")} />
                    <span className={cn("text-sm font-medium", accountType === 'solo' ? "text-primary" : "text-muted-foreground")}>
                      Je suis seul
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccountType('couple')}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                      accountType === 'couple'
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/30"
                    )}
                  >
                    <Users className={cn("w-6 h-6", accountType === 'couple' ? "text-primary" : "text-muted-foreground")} />
                    <span className={cn("text-sm font-medium", accountType === 'couple' ? "text-primary" : "text-muted-foreground")}>
                      Nous sommes un couple
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm text-muted-foreground">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="ton@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 bg-secondary/50 border-border/50 rounded-xl focus:bg-secondary transition-colors"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm text-muted-foreground">Mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-11 bg-secondary/50 border-border/50 rounded-xl focus:bg-secondary transition-colors"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {isLogin && (
                <button
                  type="button"
                  onClick={() => { setResetEmail(email); setShowForgotPassword(true); }}
                  className="text-xs text-primary hover:underline mt-1"
                >
                  Mot de passe oublié ?
                </button>
              )}
            </div>

            {/* Signup fields */}
            {!isLogin && (
              <div className="space-y-4 animate-fade-in">
                {/* Profile 1 header for couple */}
                {accountType === 'couple' && (
                  <div className="flex items-center gap-2 pt-2">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">1</span>
                    </div>
                    <span className="text-sm font-medium text-primary">Profil principal</span>
                  </div>
                )}

                {/* Username */}
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm text-muted-foreground">
                    {accountType === 'couple' ? 'Pseudo (Profil 1)' : 'Pseudo'}
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="username"
                      type="text"
                      placeholder="TonPseudo"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-10 h-11 bg-secondary/50 border-border/50 rounded-xl focus:bg-secondary transition-colors"
                      required
                    />
                  </div>
                </div>

                {/* Age */}
                <div className="space-y-2">
                  <Label htmlFor="age" className="text-sm text-muted-foreground">
                    {accountType === 'couple' ? 'Âge (Profil 1)' : 'Âge (18 ans minimum)'}
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="age"
                      type="number"
                      placeholder="18"
                      min={18}
                      max={99}
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="pl-10 h-11 bg-secondary/50 border-border/50 rounded-xl focus:bg-secondary transition-colors"
                      required
                    />
                  </div>
                </div>

                {/* Partner fields for couple */}
                {accountType === 'couple' && (
                  <>
                    <div className="flex items-center gap-2 pt-2">
                      <div className="w-6 h-6 rounded-full bg-accent/80 flex items-center justify-center">
                        <span className="text-xs font-bold text-accent-foreground">2</span>
                      </div>
                      <span className="text-sm font-medium text-foreground">Profil partenaire</span>
                      <Heart className="w-4 h-4 text-primary ml-auto" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="username2" className="text-sm text-muted-foreground">Pseudo (Profil 2)</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="username2"
                          type="text"
                          placeholder="PseudoPartenaire"
                          value={username2}
                          onChange={(e) => setUsername2(e.target.value)}
                          className="pl-10 h-11 bg-secondary/50 border-border/50 rounded-xl focus:bg-secondary transition-colors"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="age2" className="text-sm text-muted-foreground">Âge (Profil 2)</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="age2"
                          type="number"
                          placeholder="18"
                          min={18}
                          max={99}
                          value={age2}
                          onChange={(e) => setAge2(e.target.value)}
                          className="pl-10 h-11 bg-secondary/50 border-border/50 rounded-xl focus:bg-secondary transition-colors"
                          required
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Region */}
                <div className="space-y-2">
                  <Label htmlFor="region" className="text-sm text-muted-foreground">Région</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                    <select
                      id="region"
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      className={cn(
                        "w-full pl-10 pr-10 h-11 rounded-xl appearance-none cursor-pointer",
                        "bg-secondary/50 border border-border/50 text-foreground",
                        "focus:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring",
                        "transition-colors",
                        !region && "text-muted-foreground"
                      )}
                      required
                    >
                      <option value="">Choisis ta région</option>
                      {roomsLoading ? (
                        <option disabled>Chargement...</option>
                      ) : (
                        rooms?.map((room) => (
                          <option key={room.id} value={room.region_code}>
                            {room.region_code} - {room.region_name}
                          </option>
                        ))
                      )}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>

                {/* Referral Code */}
                <div className="space-y-2">
                  <Label htmlFor="referral" className="text-sm text-muted-foreground flex items-center gap-2">
                    <Gift className="w-4 h-4 text-primary" />
                    Code de parrainage (optionnel)
                  </Label>
                  <div className="relative">
                    <Gift className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="referral"
                      type="text"
                      placeholder="GC-XXXXXXXX"
                      value={referralCode}
                      onChange={(e) => {
                        const value = e.target.value.toUpperCase();
                        setReferralCode(value);
                        setReferralValidation(null);
                        if (value.length >= 11) validateReferralCode(value);
                      }}
                      className="pl-10 pr-10 h-11 bg-secondary/50 border-border/50 rounded-xl focus:bg-secondary transition-colors uppercase"
                    />
                    {isValidatingReferral && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
                    )}
                    {!isValidatingReferral && referralValidation && (
                      referralValidation.valid ? (
                        <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                      ) : (
                        <X className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-destructive" />
                      )
                    )}
                  </div>
                  {referralValidation && (
                    <p className={cn("text-xs", referralValidation.valid ? "text-green-600" : "text-destructive")}>
                      {referralValidation.message}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Submit button */}
            <Button 
              type="submit" 
              variant="hero" 
              size="lg" 
              className="w-full h-12 rounded-xl mt-6"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Chargement...
                </>
              ) : isLogin ? (
                'Se connecter'
              ) : accountType === 'couple' ? (
                <>
                  <Heart className="w-4 h-4 mr-1" />
                  Créer notre compte couple
                </>
              ) : (
                'Créer mon compte'
              )}
            </Button>
          </form>

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

          {/* Forgot Password Modal */}
          {showForgotPassword && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
              <div className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-xl p-6 space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">Réinitialiser le mot de passe</h3>
                  <button onClick={() => setShowForgotPassword(false)} className="p-1 text-muted-foreground hover:text-foreground">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Entre ton adresse email et nous t'enverrons un lien pour réinitialiser ton mot de passe.
                </p>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="ton@email.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="pl-10 h-11 bg-secondary/50 border-border/50 rounded-xl"
                    autoFocus
                  />
                </div>
                <Button
                  onClick={handleForgotPassword}
                  variant="hero"
                  className="w-full h-11 rounded-xl"
                  disabled={isResetting}
                >
                  {isResetting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    'Envoyer le lien'
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;

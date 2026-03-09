import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  User, Mail, Phone, Calendar, Shield, Lock, Unlock, CreditCard, 
  AlertTriangle, MessageSquare, History, FileText, Send, Loader2,
  CheckCircle, XCircle, Ban, ShieldCheck, Eye, KeyRound
} from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

interface ClientDossierPanelProps {
  userId: string;
  ticketId?: string;
  onClose?: () => void;
}

const ClientDossierPanel = ({ userId, ticketId, onClose }: ClientDossierPanelProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [otpId, setOtpId] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpExpiry, setOtpExpiry] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(0);

  // Countdown timer for OTP expiry
  useEffect(() => {
    if (!otpExpiry) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((otpExpiry.getTime() - Date.now()) / 1000));
      setCountdown(remaining);
      if (remaining === 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [otpExpiry]);

  // Fetch user profile (basic info always visible)
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['client-dossier-profile', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  // Fetch user email from auth (only when verified)
  const { data: userEmail } = useQuery({
    queryKey: ['client-dossier-email', userId, isVerified],
    queryFn: async () => {
      // This would need an edge function to fetch from auth.users
      return null;
    },
    enabled: isVerified,
  });

  // Fetch credit balance (only when verified)
  const { data: credits } = useQuery({
    queryKey: ['client-dossier-credits', userId, isVerified],
    queryFn: async () => {
      if (!isVerified) return null;
      const { data, error } = await supabase
        .rpc('get_user_credit_balance', { _user_id: userId });
      if (error) throw error;
      return data as any;
    },
    enabled: isVerified && !!userId,
  });

  // Fetch credit transactions (only when verified)
  const { data: creditTransactions = [] } = useQuery({
    queryKey: ['client-dossier-credit-transactions', userId, isVerified],
    queryFn: async () => {
      if (!isVerified) return [];
      const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: isVerified && !!userId,
  });

  // Fetch verification status
  const { data: verification } = useQuery({
    queryKey: ['client-dossier-verification', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('identity_verifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      return data;
    },
    enabled: !!userId,
  });

  // Fetch reports/infractions
  const { data: reports = [] } = useQuery({
    queryKey: ['client-dossier-reports', userId, isVerified],
    queryFn: async () => {
      if (!isVerified) return [];
      const { data } = await supabase
        .from('reports' as any)
        .select('*')
        .eq('reported_user_id', userId)
        .order('created_at', { ascending: false });
      return (data || []) as any[];
    },
    enabled: isVerified && !!userId,
  });

  // Fetch moderation actions
  const { data: moderationActions = [] } = useQuery({
    queryKey: ['client-dossier-moderation', userId, isVerified],
    queryFn: async () => {
      if (!isVerified) return [];
      const { data } = await supabase
        .from('moderation_actions')
        .select('*')
        .eq('target_user_id', userId)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: isVerified && !!userId,
  });

  // Fetch blocked status
  const { data: blockedStatus } = useQuery({
    queryKey: ['client-dossier-blocked', userId],
    queryFn: async () => {
      const { data: isBlocked } = await supabase.rpc('is_user_blocked', { _user_id: userId });
      const { data: isSuspended } = await supabase.rpc('is_user_suspended', { _user_id: userId });
      return { isBlocked: isBlocked === true, isSuspended: isSuspended === true };
    },
    enabled: !!userId,
  });

  // Send OTP
  const handleSendOTP = async () => {
    if (!profile?.phone_number) {
      toast.error('Ce membre n\'a pas de numéro de téléphone enregistré');
      return;
    }
    setOtpSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await supabase.functions.invoke('send-otp-sms', {
        body: {
          action: 'send',
          target_user_id: userId,
          ticket_id: ticketId,
          phone_number: profile.phone_number,
        },
      });

      if (response.error) throw new Error(response.error.message);
      const result = response.data;
      if (result.success) {
        setOtpId(result.otp_id);
        setOtpExpiry(new Date(result.expires_at));
        toast.success('Code envoyé par SMS au client');
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      toast.error(err.message || 'Erreur envoi SMS');
    } finally {
      setOtpSending(false);
    }
  };

  // Verify OTP
  const handleVerifyOTP = async () => {
    if (!otpId || otpCode.length !== 6) return;
    setOtpVerifying(true);
    try {
      const response = await supabase.functions.invoke('send-otp-sms', {
        body: { action: 'verify', otp_id: otpId, code: otpCode },
      });

      if (response.error) throw new Error(response.error.message);
      const result = response.data;
      if (result.verified) {
        setIsVerified(true);
        toast.success('Accès au dossier client autorisé');
      } else {
        throw new Error(result.error || 'Code incorrect');
      }
    } catch (err: any) {
      toast.error(err.message || 'Vérification échouée');
    } finally {
      setOtpVerifying(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <User className="w-10 h-10 mx-auto mb-3 opacity-50" />
        <p>Profil introuvable</p>
      </div>
    );
  }

  const formatDate = (d: string | null) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-4">
      {/* Header: basic profile info (always visible) */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-14 h-14 rounded-full object-cover" />
              ) : (
                <User className="w-6 h-6 text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-foreground">{profile.username}</h3>
                {profile.is_verified && (
                  <Badge variant="secondary" className="text-[10px] gap-1">
                    <ShieldCheck className="w-3 h-3" /> Vérifié
                  </Badge>
                )}
                {blockedStatus?.isBlocked && (
                  <Badge variant="destructive" className="text-[10px]">Bloqué</Badge>
                )}
                {blockedStatus?.isSuspended && (
                  <Badge variant="destructive" className="text-[10px]">Suspendu</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {profile.first_name} {profile.last_name} · {profile.age ? `${profile.age} ans` : 'Âge inconnu'}
              </p>
              <p className="text-xs text-muted-foreground">
                Inscrit le {formatDate(profile.created_at)} · Région : {profile.region}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* OTP Verification Gate */}
      {!isVerified && (
        <Card className="border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary" />
              Vérification requise
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Pour accéder au dossier complet de ce client et effectuer des modifications, 
              un <strong>code à 6 chiffres</strong> doit être envoyé par SMS au client. 
              Le code est valable <strong>5 minutes</strong>.
            </p>

            {profile.phone_number ? (
              <>
                <div className="flex items-center gap-2 text-sm bg-secondary/50 rounded-lg p-3">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>SMS sera envoyé au : <strong>{profile.phone_number.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 ** ** ** $5')}</strong></span>
                </div>

                {!otpId ? (
                  <Button onClick={handleSendOTP} disabled={otpSending} className="w-full gap-2">
                    {otpSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Envoyer le code de vérification
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <div className="text-center">
                      <p className="text-sm font-medium mb-1">Entrez le code communiqué par le client</p>
                      {countdown > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Expire dans : <span className="font-mono text-primary">{Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}</span>
                        </p>
                      )}
                      {countdown === 0 && otpExpiry && (
                        <p className="text-xs text-destructive">Code expiré</p>
                      )}
                    </div>
                    <div className="flex justify-center">
                      <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode}>
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={handleSendOTP} 
                        disabled={otpSending || countdown > 240}
                        className="flex-1"
                        size="sm"
                      >
                        Renvoyer
                      </Button>
                      <Button 
                        onClick={handleVerifyOTP} 
                        disabled={otpCode.length !== 6 || otpVerifying || countdown === 0}
                        className="flex-1 gap-1"
                        size="sm"
                      >
                        {otpVerifying ? <Loader2 className="w-3 h-3 animate-spin" /> : <KeyRound className="w-3 h-3" />}
                        Vérifier
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-4">
                <Phone className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground">
                  Ce membre n'a pas de numéro de téléphone enregistré.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Demandez-lui de l'ajouter dans ses paramètres de profil.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Verified: Full dossier */}
      {isVerified && (
        <Tabs defaultValue="info" className="w-full">
          <TabsList className="w-full grid grid-cols-5">
            <TabsTrigger value="info" className="text-xs gap-1">
              <User className="w-3 h-3" /> Infos
            </TabsTrigger>
            <TabsTrigger value="credits" className="text-xs gap-1">
              <CreditCard className="w-3 h-3" /> Crédits
            </TabsTrigger>
            <TabsTrigger value="reports" className="text-xs gap-1">
              <AlertTriangle className="w-3 h-3" /> Signalements
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs gap-1">
              <History className="w-3 h-3" /> Historique
            </TabsTrigger>
            <TabsTrigger value="actions" className="text-xs gap-1">
              <Shield className="w-3 h-3" /> Actions
            </TabsTrigger>
          </TabsList>

          {/* Info Tab */}
          <TabsContent value="info" className="mt-3 space-y-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Informations personnelles
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-muted-foreground text-xs">Prénom</span>
                    <p className="font-medium">{profile.first_name || '—'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Nom</span>
                    <p className="font-medium">{profile.last_name || '—'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Date de naissance</span>
                    <p className="font-medium">{formatDate(profile.birth_date)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Âge</span>
                    <p className="font-medium">{profile.age ? `${profile.age} ans` : '—'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Téléphone</span>
                    <p className="font-medium">{profile.phone_number || '—'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Région</span>
                    <p className="font-medium">{profile.region}</p>
                  </div>
                </div>

                <Separator className="my-3" />

                <div>
                  <span className="text-muted-foreground text-xs">Identité vérifiée</span>
                  <div className="flex items-center gap-2 mt-1">
                    {verification?.status === 'approved' ? (
                      <Badge className="bg-green-500/10 text-green-600 gap-1">
                        <CheckCircle className="w-3 h-3" /> Approuvée
                      </Badge>
                    ) : verification?.status === 'pending' ? (
                      <Badge variant="secondary" className="gap-1">
                        <Loader2 className="w-3 h-3" /> En attente
                      </Badge>
                    ) : verification?.status === 'rejected' ? (
                      <Badge variant="destructive" className="gap-1">
                        <XCircle className="w-3 h-3" /> Rejetée
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">Non soumise</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Credits Tab */}
          <TabsContent value="credits" className="mt-3 space-y-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CreditCard className="w-4 h-4" /> Solde de crédits
                </CardTitle>
              </CardHeader>
              <CardContent>
                {credits ? (
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-secondary/50 rounded-lg p-3 text-center">
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="text-lg font-bold text-primary">{credits.total_credits}</p>
                    </div>
                    <div className="bg-secondary/50 rounded-lg p-3 text-center">
                      <p className="text-xs text-muted-foreground">Quotidiens</p>
                      <p className="text-lg font-bold">{credits.daily_credits}</p>
                    </div>
                    <div className="bg-secondary/50 rounded-lg p-3 text-center">
                      <p className="text-xs text-muted-foreground">Bonus</p>
                      <p className="text-lg font-bold">{credits.bonus_credits}</p>
                    </div>
                    <div className="bg-secondary/50 rounded-lg p-3 text-center">
                      <p className="text-xs text-muted-foreground">Achetés</p>
                      <p className="text-lg font-bold">{credits.purchased_credits}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Chargement...</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Dernières transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {creditTransactions.map((tx: any) => (
                      <div key={tx.id} className="flex items-center justify-between text-xs border-b border-border/50 pb-2">
                        <div>
                          <p className="font-medium">{tx.description || tx.transaction_type}</p>
                          <p className="text-muted-foreground">{formatDate(tx.created_at)}</p>
                        </div>
                        <span className={tx.amount > 0 ? 'text-green-600 font-medium' : 'text-destructive font-medium'}>
                          {tx.amount > 0 ? '+' : ''}{tx.amount}
                        </span>
                      </div>
                    ))}
                    {creditTransactions.length === 0 && (
                      <p className="text-center text-muted-foreground py-4">Aucune transaction</p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="mt-3 space-y-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Signalements ({reports.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    {reports.map((r: any) => (
                      <div key={r.id} className="bg-secondary/30 rounded-lg p-3 space-y-1">
                        <div className="flex items-center justify-between">
                          <Badge variant={r.status === 'resolved' ? 'default' : r.status === 'pending' ? 'secondary' : 'destructive'} className="text-[10px]">
                            {r.status}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">{formatDate(r.created_at)}</span>
                        </div>
                        <p className="text-xs">{r.reason}</p>
                        {r.details && <p className="text-[11px] text-muted-foreground">{r.details}</p>}
                      </div>
                    ))}
                    {reports.length === 0 && (
                      <p className="text-center text-muted-foreground py-6">Aucun signalement</p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="mt-3 space-y-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <History className="w-4 h-4" /> Actions de modération
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    {moderationActions.map((a: any) => (
                      <div key={a.id} className="bg-secondary/30 rounded-lg p-3 space-y-1">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-[10px]">{a.action_type}</Badge>
                          <span className="text-[10px] text-muted-foreground">{formatDate(a.created_at)}</span>
                        </div>
                        {a.details && <p className="text-xs text-muted-foreground">{a.details}</p>}
                      </div>
                    ))}
                    {moderationActions.length === 0 && (
                      <p className="text-center text-muted-foreground py-6">Aucune action</p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Actions Tab */}
          <TabsContent value="actions" className="mt-3 space-y-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Shield className="w-4 h-4" /> Actions rapides
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs h-auto py-3">
                    <CreditCard className="w-3.5 h-3.5" />
                    Ajouter crédits
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs h-auto py-3">
                    <CreditCard className="w-3.5 h-3.5" />
                    Retirer crédits
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs h-auto py-3 text-destructive hover:text-destructive">
                    <Ban className="w-3.5 h-3.5" />
                    {blockedStatus?.isBlocked ? 'Débloquer' : 'Bloquer'}
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs h-auto py-3 text-destructive hover:text-destructive">
                    <Shield className="w-3.5 h-3.5" />
                    {blockedStatus?.isSuspended ? 'Réactiver' : 'Suspendre'}
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground text-center mt-2">
                  Toutes les actions sont journalisées dans l'historique de modération.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default ClientDossierPanel;

import { useState } from 'react';
import { Bell, Send, Users, Globe, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const REGIONS = [
  { code: 'FR-IDF', name: 'Île-de-France' },
  { code: 'FR-PAC', name: "Provence-Alpes-Côte d'Azur" },
  { code: 'FR-ARA', name: 'Auvergne-Rhône-Alpes' },
  { code: 'FR-OCC', name: 'Occitanie' },
  { code: 'FR-NAQ', name: 'Nouvelle-Aquitaine' },
  { code: 'FR-BRE', name: 'Bretagne' },
  { code: 'FR-NOR', name: 'Normandie' },
  { code: 'FR-HDF', name: 'Hauts-de-France' },
  { code: 'FR-GES', name: 'Grand Est' },
  { code: 'FR-PDL', name: 'Pays de la Loire' },
  { code: 'FR-CVL', name: 'Centre-Val de Loire' },
  { code: 'FR-BFC', name: 'Bourgogne-Franche-Comté' },
  { code: 'FR-COR', name: 'Corse' },
  { code: 'BE', name: 'Belgique' },
  { code: 'CH', name: 'Suisse' },
  { code: 'LU', name: 'Luxembourg' },
  { code: 'CA-QC', name: 'Québec' },
  { code: 'OTHER', name: 'Autre' },
];

type TargetType = 'all' | 'region' | 'premium';

const BroadcastNotificationPanel = () => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [url, setUrl] = useState('/');
  const [targetType, setTargetType] = useState<TargetType>('all');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [lastResult, setLastResult] = useState<{ sent: number; failed: number } | null>(null);

  const handleSend = async () => {
    if (!title.trim()) {
      toast.error('Le titre est requis');
      return;
    }

    if (targetType === 'region' && !selectedRegion) {
      toast.error('Veuillez sélectionner une région');
      return;
    }

    setIsSending(true);
    setLastResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('broadcast-notification', {
        body: {
          title: title.trim(),
          body: body.trim(),
          url: url.trim() || '/',
          targetType,
          region: targetType === 'region' ? selectedRegion : undefined,
        },
      });

      if (error) throw error;

      setLastResult({
        sent: data.successCount || 0,
        failed: data.failedCount || 0,
      });

      toast.success(`Notifications envoyées: ${data.successCount} réussies, ${data.failedCount} échouées`);
      
      // Reset form
      setTitle('');
      setBody('');
      setUrl('/');
    } catch (error) {
      console.error('Error broadcasting notification:', error);
      toast.error('Erreur lors de l\'envoi des notifications');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Bell className="w-5 h-5" />
        <h2 className="text-lg font-semibold">Diffusion de notifications</h2>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nouvelle notification</CardTitle>
            <CardDescription>
              Envoyez une notification push à tous les utilisateurs ou un groupe spécifique
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titre *</Label>
              <Input
                id="title"
                placeholder="Ex: 🎉 Nouvelle fonctionnalité !"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="body">Message</Label>
              <Textarea
                id="body"
                placeholder="Décrivez votre notification..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={200}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">{body.length}/200 caractères</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">URL de redirection</Label>
              <Input
                id="url"
                placeholder="/"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Page vers laquelle rediriger au clic</p>
            </div>

            <div className="space-y-3">
              <Label>Destinataires</Label>
              <RadioGroup value={targetType} onValueChange={(v) => setTargetType(v as TargetType)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="all" />
                  <Label htmlFor="all" className="flex items-center gap-2 cursor-pointer">
                    <Globe className="w-4 h-4" />
                    Tous les utilisateurs
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="premium" id="premium" />
                  <Label htmlFor="premium" className="flex items-center gap-2 cursor-pointer">
                    <Users className="w-4 h-4 text-amber-500" />
                    Utilisateurs Premium uniquement
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="region" id="region" />
                  <Label htmlFor="region" className="flex items-center gap-2 cursor-pointer">
                    <Users className="w-4 h-4" />
                    Par région
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {targetType === 'region' && (
              <div className="space-y-2">
                <Label>Région</Label>
                <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une région" />
                  </SelectTrigger>
                  <SelectContent>
                    {REGIONS.map((region) => (
                      <SelectItem key={region.code} value={region.code}>
                        {region.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button 
              onClick={handleSend} 
              disabled={isSending || !title.trim()}
              className="w-full"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Envoyer la notification
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Info & Stats */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>• Les notifications sont envoyées uniquement aux utilisateurs ayant activé les notifications push.</p>
              <p>• Les utilisateurs peuvent désactiver certains types de notifications dans leurs paramètres.</p>
              <p>• Le titre est obligatoire, le message est optionnel.</p>
              <p>• Utilisez des emojis pour rendre vos notifications plus visibles ! 🎉</p>
            </CardContent>
          </Card>

          {lastResult && (
            <Card className="border-green-500/50 bg-green-500/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                  <div>
                    <p className="font-medium">Envoi terminé</p>
                    <p className="text-sm text-muted-foreground">
                      {lastResult.sent} notifications envoyées, {lastResult.failed} échouées
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Conseils</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>📱 <strong>Titre court</strong> - Moins de 50 caractères pour être visible sur mobile</p>
              <p>🎯 <strong>Ciblez bien</strong> - N'envoyez pas trop de notifications pour éviter les désabonnements</p>
              <p>⏰ <strong>Timing</strong> - Évitez les heures de nuit</p>
              <p>🔗 <strong>URL pertinente</strong> - Redirigez vers la page concernée</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BroadcastNotificationPanel;

import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Forbidden words extracted from Rules page sections
const FORBIDDEN_WORDS = [
  // Harassment & insults
  'pute', 'salope', 'connard', 'connasse', 'enculé', 'enculer', 'nique', 'niquer',
  'ntm', 'ntm', 'fdp', 'fils de pute', 'ta mère', 'ta mere',
  'pd', 'pédé', 'pédale', 'tapette', 'tarlouze', 'travelo',
  // Racism & discrimination
  'nègre', 'negre', 'bougnoule', 'bougnoul', 'arabe de merde', 'sale noir',
  'sale arabe', 'sale juif', 'youpin', 'chinetoque', 'bridé',
  // Serophobia
  'sidaïque', 'sidaique', 'sale séro', 'sale sero',
  // Transphobia
  'tranny', 'travesti de merde',
  // Fatphobia
  'gros porc', 'grosse vache', 'obèse de merde',
  // Threats & violence
  'je vais te tuer', 'je vais te buter', 'tu vas mourir', 'crève', 'creve',
  'suicide toi', 'suicide-toi', 'va te pendre', 'va mourir',
  // Prostitution
  'escort', 'escorte', 'tarifé', 'combien pour', 'prix pour',
  'pipe gratuite', 'plan tarifé', 'monnayer',
  // Blackmail
  'chantage', 'je balance', 'je diffuse tes photos', 'je montre à tout le monde',
  // Illegal content
  'mineur', 'mineure', 'gamin', 'petit garçon', 'petite fille',
  // Spam-like
  'rejoins mon', 'clique ici', 'lien payant', 'onlyfans', 'mym',
  // Impersonation
  'je suis admin', 'je suis modérateur', 'je suis modo',
];

// Normalize text for matching (remove accents, lowercase)
const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const normalizedForbiddenWords = FORBIDDEN_WORDS.map(normalizeText);

export const detectForbiddenWord = (message: string): string | null => {
  const normalized = normalizeText(message);
  for (let i = 0; i < normalizedForbiddenWords.length; i++) {
    if (normalized.includes(normalizedForbiddenWords[i])) {
      return FORBIDDEN_WORDS[i];
    }
  }
  return null;
};

export const useUserInfractions = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-infractions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('user_infractions' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!user?.id,
  });
};

export const useUserInfractionCount = () => {
  const { data: infractions = [] } = useUserInfractions();
  return infractions.length;
};

export const useForbiddenWords = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const checkMessage = useCallback(async (message: string): Promise<{ blocked: boolean; word?: string; warningCount?: number; sanctioned?: boolean }> => {
    if (!user?.id) return { blocked: false };

    const detectedWord = detectForbiddenWord(message);
    if (!detectedWord) return { blocked: false };

    // Get current infraction count
    const { data: existingInfractions } = await supabase
      .from('user_infractions' as any)
      .select('id')
      .eq('user_id', user.id);

    const currentCount = (existingInfractions || []).length;
    const newWarningNumber = currentCount + 1;
    const isSanctioned = newWarningNumber >= 3;

    let supportTicketId: string | null = null;

    // If sanctioned (3+ warnings), auto-create support ticket
    if (isSanctioned) {
      const { data: ticketData } = await supabase
        .from('support_tickets' as any)
        .insert({
          user_id: user.id,
          ticket_number: '',
          subject: `⚠️ Sanction automatique - ${newWarningNumber} infractions détectées`,
          status: 'open',
          chatbot_history: JSON.stringify([
            { type: 'system', text: `L'utilisateur a accumulé ${newWarningNumber} infractions pour utilisation de mots interdits. Une vérification approfondie est requise avant de débloquer l'accès.` }
          ]),
        })
        .select('id')
        .single();

      if (ticketData) {
        supportTicketId = (ticketData as any).id;

        // Send auto system message in the ticket
        await supabase
          .from('support_messages' as any)
          .insert({
            ticket_id: supportTicketId,
            sender_id: user.id,
            content: `⚠️ **Sanction automatique** : ${newWarningNumber} infractions détectées pour utilisation de mots interdits. Un membre du support va examiner votre dossier. Vous ne pourrez pas quitter cette conversation tant que le problème n'est pas résolu.`,
            message_type: 'system',
          });
      }
    }

    // Record infraction
    await supabase
      .from('user_infractions' as any)
      .insert({
        user_id: user.id,
        detected_word: detectedWord,
        message_content: message.substring(0, 500),
        context: 'chat',
        warning_number: newWarningNumber,
        is_sanctioned: isSanctioned,
        support_ticket_id: supportTicketId,
      });

    queryClient.invalidateQueries({ queryKey: ['user-infractions'] });

    if (isSanctioned) {
      toast.error(`🚫 Vous avez atteint ${newWarningNumber} avertissements. Vous devez discuter avec le support.`);
    } else {
      toast.warning(`⚠️ Avertissement ${newWarningNumber}/3 : Votre message contient un mot interdit. Au bout de 3 avertissements, une sanction sera appliquée.`);
    }

    return {
      blocked: true,
      word: detectedWord,
      warningCount: newWarningNumber,
      sanctioned: isSanctioned,
    };
  }, [user?.id, queryClient]);

  return { checkMessage };
};

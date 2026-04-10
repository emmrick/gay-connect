import { useAuth } from '@/contexts/AuthContext';
import { useActiveProfile } from '@/contexts/ActiveProfileContext';

/**
 * Returns the user_id that should be used for credit operations.
 * In a couple, both profiles share the owner's credit wallet.
 */
export const useCoupleCreditsUserId = (): string | undefined => {
  const { user } = useAuth();
  const { coupleAccount, isCouple } = useActiveProfile();

  if (!user?.id) return undefined;
  if (!isCouple || !coupleAccount) return user.id;

  // Always use the owner's credit wallet
  return coupleAccount.owner_user_id;
};

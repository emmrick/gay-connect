import { supabase } from "@/integrations/supabase/client";

/**
 * Send a transactional email via the send-transactional-email edge function.
 * Fire-and-forget: errors are logged but do not propagate.
 */
const sendEmail = async (
  templateName: string,
  recipientEmail: string,
  idempotencyKey: string,
  templateData?: Record<string, any>
) => {
  try {
    await supabase.functions.invoke("send-transactional-email", {
      body: {
        templateName,
        recipientEmail,
        idempotencyKey,
        ...(templateData ? { templateData } : {}),
      },
    });
  } catch (error) {
    console.error(`[EmailService] Failed to send ${templateName}:`, error);
  }
};

/**
 * Get user email from auth (requires the user to be the current user or admin context).
 * Falls back to profiles table support_tickets email field.
 */
const getUserEmail = async (userId: string): Promise<string | null> => {
  // For current user, we can get it from session
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.id === userId) return user.email ?? null;

  // For admin context, fetch from support_tickets or profiles
  // We need a different approach — use an edge function or RPC
  // For now, we'll try to get it from the user's recent support ticket
  const { data: ticket } = await supabase
    .from("support_tickets")
    .select("email")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return ticket?.email ?? null;
};

/**
 * Get username from profiles table.
 */
const getUsername = async (userId: string): Promise<string | null> => {
  const { data } = await supabase
    .from("profiles")
    .select("username")
    .eq("user_id", userId)
    .maybeSingle();
  return data?.username ?? null;
};

/** Send verification confirmed email */
export const sendVerificationConfirmedEmail = async (userId: string) => {
  const [email, username] = await Promise.all([
    getUserEmail(userId),
    getUsername(userId),
  ]);
  if (!email) {
    console.warn("[EmailService] No email found for user", userId);
    return;
  }
  await sendEmail("verification-confirmed", email, `verification-confirmed-${userId}`, {
    pseudo: username,
  });
};

/** Send verification rejected email */
export const sendVerificationRejectedEmail = async (userId: string, reason: string) => {
  const [email, username] = await Promise.all([
    getUserEmail(userId),
    getUsername(userId),
  ]);
  if (!email) {
    console.warn("[EmailService] No email found for user", userId);
    return;
  }
  await sendEmail("verification-rejected", email, `verification-rejected-${userId}-${Date.now()}`, {
    pseudo: username,
    rejectionReason: reason,
  });
};

/** Send welcome email after signup */
export const sendWelcomeEmail = async (email: string, username: string) => {
  await sendEmail("welcome", email, `welcome-${email}`, {
    pseudo: username,
  });
};

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

// Product IDs for determining subscription tier
const PREMIUM_PRODUCT_ID = "prod_TsdBpnQhprvorT";
const VIP_PRODUCT_ID = "prod_Tt0WC00m6snTh0";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      throw new Error("No stripe-signature header");
    }

    const body = await req.text();
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      logStep("Webhook signature verification failed", { error: err instanceof Error ? err.message : err });
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    logStep("Event verified", { type: event.type, id: event.id });

    // Handle subscription events
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.resumed": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionChange(supabaseClient, stripe, subscription, true);
        break;
      }

      case "customer.subscription.deleted":
      case "customer.subscription.paused": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionChange(supabaseClient, stripe, subscription, false);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription && invoice.customer) {
          // Refresh subscription status on successful payment
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
          await handleSubscriptionChange(supabaseClient, stripe, subscription, subscription.status === "active");
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.customer) {
          // On payment failure, check if subscription is still active
          const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer.id;
          const customer = await stripe.customers.retrieve(customerId);
          
          if (customer && !customer.deleted && customer.email) {
            const subscriptions = await stripe.subscriptions.list({
              customer: customerId,
              status: "active",
              limit: 1,
            });
            
            if (subscriptions.data.length === 0) {
              // No active subscription, remove premium
              await updateUserPremiumStatus(supabaseClient, customer.email, false, false);
            }
          }
        }
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in stripe-webhook", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function handleSubscriptionChange(
  supabaseClient: any,
  stripe: Stripe,
  subscription: Stripe.Subscription,
  isActive: boolean
) {
  const customerId = typeof subscription.customer === 'string' 
    ? subscription.customer 
    : subscription.customer.id;

  logStep("Handling subscription change", { 
    customerId, 
    status: subscription.status,
    isActive 
  });

  // Get customer email
  const customer = await stripe.customers.retrieve(customerId);
  if (!customer || customer.deleted || !customer.email) {
    logStep("Customer not found or deleted", { customerId });
    return;
  }

  // Determine if VIP based on product
  let isVip = false;
  if (isActive && subscription.items.data.length > 0) {
    const productId = subscription.items.data[0].price.product;
    isVip = productId === VIP_PRODUCT_ID;
    logStep("Determined subscription tier", { productId, isVip });
  }

  await updateUserPremiumStatus(supabaseClient, customer.email, isActive, isVip);
}

async function updateUserPremiumStatus(
  supabaseClient: any,
  email: string,
  isPremium: boolean,
  isVip: boolean
) {
  logStep("Updating user premium status", { email, isPremium, isVip });

  // Find user by email
  const { data: userData, error: userError } = await supabaseClient.auth.admin.listUsers();
  
  if (userError) {
    logStep("Error listing users", { error: userError.message });
    return;
  }

  const user = userData.users.find((u: any) => u.email === email);
  if (!user) {
    logStep("User not found by email", { email });
    return;
  }

  // Update profile is_premium field
  const { error: updateError } = await supabaseClient
    .from('profiles')
    .update({ is_premium: isPremium })
    .eq('user_id', user.id);

  if (updateError) {
    logStep("Error updating profile", { error: updateError.message });
    return;
  }

  logStep("Profile updated successfully", { userId: user.id, isPremium, isVip });

  // Create notification for the user
  const notificationTitle = isPremium 
    ? (isVip ? "🌟 Bienvenue dans le club VIP !" : "👑 Bienvenue Premium !")
    : "Abonnement terminé";
  
  const notificationMessage = isPremium
    ? (isVip 
        ? "Vous avez maintenant accès à toutes les fonctionnalités VIP exclusives !"
        : "Vous avez maintenant accès à toutes les fonctionnalités Premium !")
    : "Votre abonnement a pris fin. Réabonnez-vous pour retrouver vos avantages.";

  await supabaseClient.from('notifications').insert({
    user_id: user.id,
    type: isPremium ? 'subscription_activated' : 'subscription_ended',
    title: notificationTitle,
    message: notificationMessage,
    is_read: false,
  });

  logStep("Notification created for user", { userId: user.id });
}

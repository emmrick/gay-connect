import { supabase } from '@/integrations/supabase/client';

/**
 * Screenshot Notification Service
 * When a screenshot is detected:
 * 1. Sends a system message in the private chat visible to both users
 * 2. Auto-reports the user to the moderation team
 */

export const notifyScreenshotInChat = async ({
  screenshotterUserId,
  screenshotterUsername,
  otherUserId,
  context,
}: {
  screenshotterUserId: string;
  screenshotterUsername: string;
  otherUserId: string;
  context: 'chat' | 'ephemeral_media' | 'album' | 'photo' | 'video';
}) => {
  try {
    const contextLabels: Record<string, string> = {
      chat: 'la conversation',
      ephemeral_media: 'un média éphémère',
      album: 'un album',
      photo: 'une photo',
      video: 'une vidéo',
    };

    const contextLabel = contextLabels[context] || 'du contenu';

    // 1. Send system message in the private chat
    const systemMessage = `⚠️ **Capture d'écran détectée** — ${screenshotterUsername} a effectué une capture d'écran de ${contextLabel}.\n\n🚨 Un **avertissement automatique** a été envoyé et l'utilisateur a été **signalé auprès d'un membre de l'équipe** qui prendra contact avec lui.`;

    const { error: msgError } = await supabase
      .from('messages')
      .insert({
        sender_id: screenshotterUserId,
        recipient_id: otherUserId,
        content: systemMessage,
        message_type: 'system_screenshot',
        is_private: true,
      });

    if (msgError) {
      console.error('[ScreenshotNotification] Error sending system message:', msgError);
    }

    // 2. Auto-report the user
    const { error: reportError } = await supabase
      .from('reports')
      .insert({
        reporter_id: screenshotterUserId,
        reported_user_id: screenshotterUserId,
        reason: 'inappropriate_content' as any,
        description: `Capture d'écran automatiquement détectée de ${contextLabel} dans une conversation privée avec un autre utilisateur. Avertissement automatique envoyé.`,
        report_type: 'screenshot_violation',
      });

    if (reportError) {
      console.error('[ScreenshotNotification] Error creating report:', reportError);
    }

    // 3. Create notification for the other user
    const { error: notifError } = await supabase
      .from('notifications')
      .insert({
        user_id: otherUserId,
        title: '📸 Capture d\'écran détectée',
        message: `${screenshotterUsername} a effectué une capture d'écran de ${contextLabel}. Un avertissement lui a été envoyé.`,
        type: 'screenshot_warning',
      });

    if (notifError) {
      console.error('[ScreenshotNotification] Error creating notification:', notifError);
    }

    // 4. Create notification for the screenshotter
    const { error: notifError2 } = await supabase
      .from('notifications')
      .insert({
        user_id: screenshotterUserId,
        title: '⚠️ Avertissement : Capture d\'écran',
        message: `Votre capture d'écran a été détectée et signalée. Un membre de l'équipe prendra contact avec vous. Les captures d'écran répétées peuvent entraîner une suspension de votre compte.`,
        type: 'screenshot_warning',
      });

    if (notifError2) {
      console.error('[ScreenshotNotification] Error creating warning notification:', notifError2);
    }

    console.log('[ScreenshotNotification] Screenshot notification sent successfully');
    return true;
  } catch (error) {
    console.error('[ScreenshotNotification] Unexpected error:', error);
    return false;
  }
};

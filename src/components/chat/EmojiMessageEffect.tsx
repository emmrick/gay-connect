import { motion } from 'framer-motion';
import EmojiParticleOverlay, { detectEmojiCategory } from './EmojiParticleOverlay';

/**
 * Segments text into grapheme clusters for proper emoji splitting,
 * including compound emojis (ZWJ, flags, skin tones).
 */
function getGraphemes(str: string): string[] {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const segmenter = new (Intl as any).Segmenter('fr', { granularity: 'grapheme' });
    return [...segmenter.segment(str)].map((s: any) => s.segment);
  }
  return [...str];
}

/**
 * Detects if a message is emoji-only (1-5 emoji graphemes, no text).
 */
export function isEmojiOnlyMessage(content: string): boolean {
  const trimmed = content.trim();
  if (!trimmed) return false;

  const graphemes = getGraphemes(trimmed);
  if (graphemes.length < 1 || graphemes.length > 5) return false;

  const textPattern = /[\p{L}\p{N}\p{P}\p{Z}]/u;
  return graphemes.every(g => !textPattern.test(g));
}

interface EmojiMessageEffectProps {
  content: string;
  isOwn: boolean;
  messageId?: string;
}

const EmojiMessageEffect = ({ content, isOwn, messageId }: EmojiMessageEffectProps) => {
  const emojis = getGraphemes(content.trim());
  const category = detectEmojiCategory(content);

  return (
    <>
      {/* Particle rain overlay (plays once) */}
      {category && messageId && (
        <EmojiParticleOverlay content={content} triggerId={messageId} />
      )}

      <div className={`flex gap-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
        {emojis.map((emoji, i) => (
          <motion.span
            key={i}
            className="text-4xl leading-none select-none cursor-default"
            initial={{ scale: 0, rotate: -15 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 12,
              delay: i * 0.08,
            }}
            whileHover={{ scale: 1.3, rotate: [0, -10, 10, 0] }}
          >
            {emoji}
          </motion.span>
        ))}
      </div>
    </>
  );
};

export default EmojiMessageEffect;

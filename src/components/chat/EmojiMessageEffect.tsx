import { motion } from 'framer-motion';

/**
 * Detects if a message is emoji-only (1-5 emojis, no text)
 */
const EMOJI_REGEX = /^(?:\p{Emoji_Presentation}|\p{Extended_Pictographic}){1,5}$/u;

export function isEmojiOnlyMessage(content: string): boolean {
  const trimmed = content.trim();
  return EMOJI_REGEX.test(trimmed);
}

interface EmojiMessageEffectProps {
  content: string;
  isOwn: boolean;
}

const EmojiMessageEffect = ({ content, isOwn }: EmojiMessageEffectProps) => {
  const emojis = [...content.trim()];
  
  return (
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
  );
};

export default EmojiMessageEffect;

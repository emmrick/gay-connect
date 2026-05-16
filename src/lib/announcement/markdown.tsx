import React from 'react';

/**
 * Markdown léger sécurisé (sans dangerouslySetInnerHTML) pour les annonces.
 * Supporte : **gras**, *italique*, __souligné__, ~~barré~~, `code`,
 * [texte](url), images ![alt](url), auto-liens https://…
 *
 * Renvoie un tableau de React.ReactNode + une liste d'URLs détectées pour
 * générer des aperçus de lien.
 */

const URL_RE = /\bhttps?:\/\/[^\s<>"')]+/gi;

export interface ParsedAnnouncement {
  blocks: AnnouncementBlock[];
  detectedUrls: string[];
}

export type AnnouncementBlock =
  | { type: 'paragraph'; children: InlineNode[] }
  | { type: 'image'; url: string; alt: string };

export type InlineNode =
  | { type: 'text'; value: string }
  | { type: 'bold'; children: InlineNode[] }
  | { type: 'italic'; children: InlineNode[] }
  | { type: 'underline'; children: InlineNode[] }
  | { type: 'strike'; children: InlineNode[] }
  | { type: 'code'; value: string }
  | { type: 'link'; url: string; children: InlineNode[] }
  | { type: 'mention'; value: string };

const isSafeUrl = (raw: string): boolean => {
  try {
    const u = new URL(raw);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
};

// Parse une ligne en blocs inline (recursif sur emphases)
const parseInline = (input: string): InlineNode[] => {
  const nodes: InlineNode[] = [];
  let i = 0;
  while (i < input.length) {
    // Code inline
    if (input[i] === '`') {
      const end = input.indexOf('`', i + 1);
      if (end !== -1) {
        nodes.push({ type: 'code', value: input.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
    }
    // Markdown link [text](url)
    if (input[i] === '[') {
      const m = input.slice(i).match(/^\[([^\]]+)\]\(([^)\s]+)\)/);
      if (m && isSafeUrl(m[2])) {
        nodes.push({ type: 'link', url: m[2], children: parseInline(m[1]) });
        i += m[0].length;
        continue;
      }
    }
    // Bold **text**
    if (input.startsWith('**', i)) {
      const end = input.indexOf('**', i + 2);
      if (end !== -1) {
        nodes.push({ type: 'bold', children: parseInline(input.slice(i + 2, end)) });
        i = end + 2;
        continue;
      }
    }
    // Strike ~~text~~
    if (input.startsWith('~~', i)) {
      const end = input.indexOf('~~', i + 2);
      if (end !== -1) {
        nodes.push({ type: 'strike', children: parseInline(input.slice(i + 2, end)) });
        i = end + 2;
        continue;
      }
    }
    // Underline __text__
    if (input.startsWith('__', i)) {
      const end = input.indexOf('__', i + 2);
      if (end !== -1) {
        nodes.push({ type: 'underline', children: parseInline(input.slice(i + 2, end)) });
        i = end + 2;
        continue;
      }
    }
    // Italic *text*
    if (input[i] === '*' && input[i + 1] !== '*') {
      const end = input.indexOf('*', i + 1);
      if (end !== -1 && end !== i + 1) {
        nodes.push({ type: 'italic', children: parseInline(input.slice(i + 1, end)) });
        i = end + 1;
        continue;
      }
    }
    // Auto-link
    URL_RE.lastIndex = i;
    const um = URL_RE.exec(input);
    if (um && um.index === i) {
      const url = um[0].replace(/[).,;:!?]+$/, '');
      if (isSafeUrl(url)) {
        nodes.push({ type: 'link', url, children: [{ type: 'text', value: url }] });
        i += url.length;
        continue;
      }
    }
    // Mention @username
    if (input[i] === '@') {
      const m = input.slice(i).match(/^@([a-zA-Z0-9_-]{2,30})/);
      if (m) {
        nodes.push({ type: 'mention', value: m[1] });
        i += m[0].length;
        continue;
      }
    }

    // Texte brut jusqu'au prochain caractère "spécial"
    let j = i + 1;
    while (
      j < input.length &&
      !'*_~`['.includes(input[j]) &&
      input[j] !== '@' &&
      !input.startsWith('http://', j) &&
      !input.startsWith('https://', j)
    ) {
      j++;
    }
    nodes.push({ type: 'text', value: input.slice(i, j) });
    i = j;
  }
  return nodes;
};

export const parseAnnouncement = (content: string): ParsedAnnouncement => {
  const blocks: AnnouncementBlock[] = [];
  const detectedUrls: string[] = [];
  const lines = content.split(/\r?\n/);

  let buffer: string[] = [];
  const flushParagraph = () => {
    if (buffer.length === 0) return;
    const text = buffer.join('\n');
    blocks.push({ type: 'paragraph', children: parseInline(text) });
    const matches = text.match(URL_RE);
    if (matches) {
      for (const m of matches) {
        const u = m.replace(/[).,;:!?]+$/, '');
        if (isSafeUrl(u) && !detectedUrls.includes(u)) detectedUrls.push(u);
      }
    }
    buffer = [];
  };

  for (const line of lines) {
    // Image block: ![alt](url) sur sa propre ligne
    const imgMatch = line.trim().match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/);
    if (imgMatch && isSafeUrl(imgMatch[2])) {
      flushParagraph();
      blocks.push({ type: 'image', url: imgMatch[2], alt: imgMatch[1] });
      continue;
    }
    if (line.trim() === '') {
      flushParagraph();
    } else {
      buffer.push(line);
    }
  }
  flushParagraph();

  return { blocks, detectedUrls };
};

// Rendu React des inlines
export const renderInline = (
  nodes: InlineNode[],
  keyPrefix = ''
): React.ReactNode[] => {
  return nodes.map((n, i) => {
    const k = `${keyPrefix}-${i}`;
    switch (n.type) {
      case 'text':
        return <React.Fragment key={k}>{n.value}</React.Fragment>;
      case 'bold':
        return <strong key={k} className="font-bold">{renderInline(n.children, k)}</strong>;
      case 'italic':
        return <em key={k} className="italic">{renderInline(n.children, k)}</em>;
      case 'underline':
        return <span key={k} className="underline">{renderInline(n.children, k)}</span>;
      case 'strike':
        return <span key={k} className="line-through opacity-80">{renderInline(n.children, k)}</span>;
      case 'code':
        return (
          <code key={k} className="px-1.5 py-0.5 rounded bg-background/60 font-mono text-[0.9em]">
            {n.value}
          </code>
        );
      case 'link':
        return (
          <a
            key={k}
            href={n.url}
            target="_blank"
            rel="noopener noreferrer ugc"
            className="text-primary underline decoration-primary/40 hover:decoration-primary break-all"
          >
            {renderInline(n.children, k)}
          </a>
        );
      case 'mention':
        return <span key={k} className="text-primary font-medium">@{n.value}</span>;
    }
  });
};

import { useRef, useState, useEffect } from 'react';
import { Bold, Italic, Link as LinkIcon, Image as ImageIcon, Send, Loader2, X, Eye, Underline, Strikethrough } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { parseAnnouncement, renderInline } from '@/lib/announcement/markdown';
import LinkPreviewCard from './LinkPreviewCard';

interface AnnouncementComposerProps {
  onSend: (content: string) => Promise<void>;
  disabled?: boolean;
}

const MAX_BYTES = 5 * 1024 * 1024;

const AnnouncementComposer = ({ onSend, disabled }: AnnouncementComposerProps) => {
  const [value, setValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 220) + 'px';
    }
  }, [value]);

  const wrapSelection = (left: string, right = left, placeholder = 'texte') => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const before = value.slice(0, start);
    const selected = value.slice(start, end) || placeholder;
    const after = value.slice(end);
    const next = `${before}${left}${selected}${right}${after}`;
    setValue(next);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = before.length + left.length + selected.length + right.length;
      ta.setSelectionRange(pos, pos);
    });
  };

  const insertAtCursor = (snippet: string) => {
    const ta = textareaRef.current;
    if (!ta) {
      setValue((v) => (v ? v + '\n' + snippet : snippet));
      return;
    }
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const before = value.slice(0, start);
    const after = value.slice(end);
    const sep = before && !before.endsWith('\n') ? '\n' : '';
    const next = `${before}${sep}${snippet}\n${after}`;
    setValue(next);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = before.length + sep.length + snippet.length + 1;
      ta.setSelectionRange(pos, pos);
    });
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Format non supporté');
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error('Image trop volumineuse (max 5 Mo)');
      return;
    }

    setUploading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error('Non authentifié');
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const path = `${uid}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('announcement-media')
        .upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from('announcement-media').getPublicUrl(path);
      insertAtCursor(`![image](${pub.publicUrl})`);
      toast.success('Image ajoutée');
    } catch (err: any) {
      console.error(err);
      toast.error("Échec de l'upload");
    } finally {
      setUploading(false);
    }
  };

  const insertLink = () => {
    const text = linkText.trim() || linkUrl.trim();
    const url = linkUrl.trim();
    if (!url) return;
    try { new URL(url); } catch { toast.error('URL invalide'); return; }
    const snippet = `[${text}](${url})`;
    const ta = textareaRef.current;
    if (ta) {
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      setValue(value.slice(0, start) + snippet + value.slice(end));
    } else {
      setValue((v) => v + snippet);
    }
    setLinkOpen(false);
    setLinkText('');
    setLinkUrl('');
  };

  const handleSend = async () => {
    if (!value.trim() || isSending) return;
    setIsSending(true);
    try {
      await onSend(value);
      setValue('');
    } finally {
      setIsSending(false);
    }
  };

  const preview = parseAnnouncement(value);
  const previewUrls = preview.detectedUrls
    .filter((u) => !preview.blocks.some((b) => b.type === 'image' && (b as any).url === u))
    .slice(0, 3);

  return (
    <div className="border-t border-border bg-card/60 backdrop-blur-lg">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-2 pt-2 overflow-x-auto">
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" title="Gras (Ctrl+B)" onClick={() => wrapSelection('**')}>
          <Bold className="w-4 h-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" title="Italique (Ctrl+I)" onClick={() => wrapSelection('*')}>
          <Italic className="w-4 h-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" title="Souligné" onClick={() => wrapSelection('__')}>
          <Underline className="w-4 h-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" title="Barré" onClick={() => wrapSelection('~~')}>
          <Strikethrough className="w-4 h-4" />
        </Button>
        <div className="w-px h-5 bg-border mx-1" />
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" title="Insérer un lien" onClick={() => setLinkOpen(true)}>
          <LinkIcon className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title="Ajouter une image"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
        </Button>
        <div className="flex-1" />
        <Button
          type="button"
          variant={showPreview ? 'secondary' : 'ghost'}
          size="sm"
          className="h-8 gap-1.5"
          onClick={() => setShowPreview((s) => !s)}
        >
          <Eye className="w-3.5 h-3.5" />
          <span className="text-xs">Aperçu</span>
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageSelect}
        />
      </div>

      {showPreview && value.trim() && (
        <div className="mx-3 mt-2 mb-1 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 max-h-[200px] overflow-y-auto">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-2">Aperçu</p>
          <div className="space-y-2 text-sm">
            {preview.blocks.map((b, i) => {
              if (b.type === 'image') {
                return (
                  <img key={i} src={b.url} alt={b.alt} className="max-h-32 rounded-lg" />
                );
              }
              return (
                <p key={i} className="whitespace-pre-wrap break-words">
                  {renderInline(b.children, `pv-${i}`)}
                </p>
              );
            })}
            {previewUrls.map((u) => <LinkPreviewCard key={u} url={u} />)}
          </div>
        </div>
      )}

      <div className="p-2 flex gap-2 items-end">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Publier une annonce… (gras : **texte**, lien : [titre](url))"
          className="resize-none min-h-[44px] max-h-[220px] text-sm flex-1"
          disabled={disabled || isSending}
          onKeyDown={(e) => {
            const meta = e.metaKey || e.ctrlKey;
            if (meta && e.key.toLowerCase() === 'b') { e.preventDefault(); wrapSelection('**'); return; }
            if (meta && e.key.toLowerCase() === 'i') { e.preventDefault(); wrapSelection('*'); return; }
            if (e.key === 'Enter' && !e.shiftKey && !meta) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <Button
          size="icon"
          onClick={handleSend}
          disabled={!value.trim() || isSending || disabled}
          className="flex-shrink-0 bg-gradient-to-br from-amber-500 to-orange-600 hover:opacity-90 text-white"
        >
          {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>

      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Insérer un lien</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="link-text">Texte affiché (optionnel)</Label>
              <Input id="link-text" value={linkText} onChange={(e) => setLinkText(e.target.value)} placeholder="Ex : Voir l'article" />
            </div>
            <div>
              <Label htmlFor="link-url">URL</Label>
              <Input
                id="link-url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://…"
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); insertLink(); } }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setLinkOpen(false)}>
              <X className="w-4 h-4 mr-1" /> Annuler
            </Button>
            <Button onClick={insertLink} disabled={!linkUrl.trim()}>
              Insérer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AnnouncementComposer;

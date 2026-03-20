import { useState } from 'react';
import { BarChart3, Plus, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface CreatePollDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreatePoll: (question: string, options: string[], isMultipleChoice: boolean) => void;
  isCreating?: boolean;
}

const CreatePollDialog = ({ isOpen, onClose, onCreatePoll, isCreating }: CreatePollDialogProps) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [isMultipleChoice, setIsMultipleChoice] = useState(false);

  const addOption = () => {
    if (options.length < 8) {
      setOptions([...options, '']);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, value: string) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  };

  const handleSubmit = () => {
    const trimmedQuestion = question.trim();
    const validOptions = options.map(o => o.trim()).filter(o => o.length > 0);

    if (!trimmedQuestion || validOptions.length < 2) return;

    onCreatePoll(trimmedQuestion, validOptions, isMultipleChoice);
    setQuestion('');
    setOptions(['', '']);
    setIsMultipleChoice(false);
    onClose();
  };

  const isValid = question.trim().length > 0 &&
    options.filter(o => o.trim().length > 0).length >= 2;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Créer un sondage
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Question */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Question</Label>
            <Input
              placeholder="Pose ta question..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              maxLength={200}
              autoFocus
            />
          </div>

          {/* Options */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Options</Label>
            <div className="space-y-2">
              {options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    placeholder={`Option ${index + 1}`}
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    maxLength={100}
                  />
                  {options.length > 2 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 flex-shrink-0 text-destructive"
                      onClick={() => removeOption(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            {options.length < 8 && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 text-primary"
                onClick={addOption}
              >
                <Plus className="w-4 h-4 mr-1" />
                Ajouter une option
              </Button>
            )}
          </div>

          {/* Multiple choice toggle */}
          <div className="flex items-center justify-between py-2">
            <Label className="text-sm">Choix multiple</Label>
            <Switch
              checked={isMultipleChoice}
              onCheckedChange={setIsMultipleChoice}
            />
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={!isValid || isCreating}
            className="w-full"
          >
            {isCreating ? 'Création...' : 'Créer le sondage'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePollDialog;

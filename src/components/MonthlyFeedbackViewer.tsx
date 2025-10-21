import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Download, FileText, Calendar, User, Trash2, Save } from 'lucide-react';
import type { MonthlyFeedback } from '../../shared/schema';
import ReactMarkdown from 'react-markdown';

interface MonthlyFeedbackViewerProps {
  feedback: MonthlyFeedback | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (id: number) => void;
  isAdmin?: boolean;
}

export function MonthlyFeedbackViewer({
  feedback,
  isOpen,
  onClose,
  onDelete,
  isAdmin = false
}: MonthlyFeedbackViewerProps) {
  const { toast } = useToast();
  const [notes, setNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  if (!feedback) return null;

  // Safe data access with null checks
  const safeFeedback = {
    id: feedback.id || 0,
    school: feedback.school || 'Unknown School',
    month: feedback.month || 'Unknown Month',
    year: feedback.year || new Date().getFullYear(),
    pdfUrl: feedback.pdfUrl || '',
    pdfFileName: feedback.pdfFileName || 'document.pdf',
    extractedText: feedback.extractedText || null,
    notes: feedback.notes || null,
    uploadedBy: feedback.uploadedBy || null,
    fileSize: feedback.fileSize || null,
    createdAt: feedback.createdAt || new Date().toISOString()
  };

  // Focus trap and keyboard handling
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    // Focus the first focusable element when modal opens
    const focusableElements = modalRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements?.[0] as HTMLElement;
    if (firstElement) {
      firstElement.focus();
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = feedback.pdfUrl;
    link.download = feedback.pdfFileName || `feedback-${feedback.month}-${feedback.year}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Download Started",
      description: "PDF download has started."
    });
  };

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    try {
      const response = await fetch(`/api/monthly-feedback/${safeFeedback.id}/notes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });

      if (response.ok) {
        toast({
          title: "Notes Saved",
          description: "Your notes have been saved successfully."
        });
      } else {
        throw new Error('Failed to save notes');
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: "Failed to save notes. Please try again."
      });
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleDelete = () => {
    if (onDelete && confirm(`Are you sure you want to delete feedback for ${safeFeedback.month} ${safeFeedback.year}?`)) {
      onDelete(safeFeedback.id);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent ref={modalRef} className="w-[70vw] h-[70vh] max-w-6xl overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center justify-between text-xl">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {safeFeedback.month} {safeFeedback.year} - {safeFeedback.school}
            </div>
            <Badge>{safeFeedback.school}</Badge>
          </DialogTitle>
          <DialogDescription>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(safeFeedback.createdAt).toLocaleDateString()}
              </span>
              {safeFeedback.uploadedBy && (
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {safeFeedback.uploadedBy}
                </span>
              )}
              {safeFeedback.fileSize && (
                <span>Size: {(safeFeedback.fileSize / 1024 / 1024).toFixed(2)} MB</span>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>

        <Separator />

        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="content" className="w-full h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2 flex-shrink-0">
              <TabsTrigger value="content">Extracted Content</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="flex-1 overflow-y-auto space-y-4">
              <div className="border rounded-lg p-4 bg-muted/50">
                {safeFeedback.extractedText ? (
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>{safeFeedback.extractedText}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Text could not be extracted – download the PDF to view.
                  </p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="notes" className="flex-1 overflow-y-auto space-y-4">
              <Textarea
                value={notes || safeFeedback.notes || ''}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this feedback..."
                rows={10}
                maxLength={5000}
              />
              <Button onClick={handleSaveNotes} disabled={isSavingNotes}>
                {isSavingNotes ? (
                  <>Saving...</>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Notes
                  </>
                )}
              </Button>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="flex justify-between">
          <div className="flex flex-col gap-2">
            <Button onClick={handleDownload} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
            {safeFeedback.fileSize && (
              <p className="text-xs text-muted-foreground">
                Download original PDF – {(safeFeedback.fileSize / 1024 / 1024).toFixed(2)} MB
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && onDelete && (
              <Button onClick={handleDelete} variant="destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            )}
            <Button onClick={onClose}>Close</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

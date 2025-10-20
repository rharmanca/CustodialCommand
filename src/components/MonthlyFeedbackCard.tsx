import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Download, Eye, Calendar } from 'lucide-react';
import type { MonthlyFeedback } from '../../shared/schema';

interface MonthlyFeedbackCardProps {
  feedback: MonthlyFeedback;
  onView: (feedback: MonthlyFeedback) => void;
  onDownload: (feedback: MonthlyFeedback) => void;
}

export function MonthlyFeedbackCard({ feedback, onView, onDownload }: MonthlyFeedbackCardProps) {
  // Safe excerpt generation with null checks
  const getExcerpt = () => {
    if (!feedback.extractedText) return 'No text content available';
    const text = feedback.extractedText.trim();
    if (text.length === 0) return 'No text content available';
    return text.length > 200 ? text.substring(0, 200) + '...' : text;
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            <span>{feedback.month} {feedback.year}</span>
          </div>
          <Badge>{feedback.school}</Badge>
        </CardTitle>
        <CardDescription className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          {new Date(feedback.createdAt).toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground line-clamp-3">
            {getExcerpt()}
          </p>
          <div className="flex gap-2">
            <Button onClick={() => onView(feedback)} size="sm" variant="default">
              <Eye className="w-4 h-4 mr-2" />
              View Details
            </Button>
            <Button onClick={() => onDownload(feedback)} size="sm" variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

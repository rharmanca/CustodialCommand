import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Download, Eye, Calendar, User, File } from 'lucide-react';
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

  // Get school name for tooltips (keeping abbreviations as-is)
  const getSchoolFullName = (code: string) => {
    return code; // Keep abbreviations as they are
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between leading-7">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            <span>{feedback.month} {feedback.year}</span>
          </div>
          <Badge title={getSchoolFullName(feedback.school)}>{feedback.school}</Badge>
        </CardTitle>
        <CardDescription className="flex items-center gap-2 mt-2">
          <Calendar className="w-4 h-4" />
          {new Date(feedback.createdAt).toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Uploader and file size info */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {feedback.uploadedBy && (
              <div className="flex items-center gap-1">
                <User className="w-3 h-3" />
                <span>{feedback.uploadedBy}</span>
              </div>
            )}
            {feedback.fileSize && (
              <div className="flex items-center gap-1">
                <File className="w-3 h-3" />
                <span>{(feedback.fileSize / 1024 / 1024).toFixed(2)} MB</span>
              </div>
            )}
          </div>
          
          <p className="text-sm text-muted-foreground line-clamp-3">
            {getExcerpt()}
          </p>
          <div className="flex gap-2">
            <Button onClick={() => onView(feedback)} size="sm" variant="default">
              <Eye className="w-4 h-4 mr-2" />
              View Details
            </Button>
            <Button 
              onClick={() => onDownload(feedback)} 
              size="sm" 
              variant="outline"
              aria-label={`Download PDF for ${feedback.month} ${feedback.year} ${feedback.school}`}
            >
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

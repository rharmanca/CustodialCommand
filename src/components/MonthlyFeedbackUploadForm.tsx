import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, CheckCircle } from 'lucide-react';

const schoolOptions = [
  { value: "ASA", label: "ASA" },
  { value: "LCA", label: "LCA" },
  { value: "GWC", label: "GWC" },
  { value: "OA", label: "OA" },
  { value: "CBR", label: "CBR" },
  { value: "WLC", label: "WLC" },
];

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

interface MonthlyFeedbackUploadFormProps {
  onUploadSuccess: () => void;
}

export function MonthlyFeedbackUploadForm({ onUploadSuccess }: MonthlyFeedbackUploadFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    school: '',
    month: '',
    year: new Date().getFullYear().toString(),
    notes: '',
    uploadedBy: ''
  });
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (file.type !== 'application/pdf') {
        toast({
          variant: "destructive",
          title: "Invalid File Type",
          description: "Only PDF files are allowed."
        });
        e.target.value = '';
        return;
      }

      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "File Too Large",
          description: "PDF file must be less than 10MB."
        });
        e.target.value = '';
        return;
      }

      setPdfFile(file);
      toast({
        title: "PDF Selected",
        description: `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.school || !formData.month || !formData.year || !pdfFile) {
      toast({
        variant: "destructive",
        title: "Missing Required Fields",
        description: "Please fill in School, Month, Year, and select a PDF file."
      });
      return;
    }

    // Validate year
    const yearNum = parseInt(formData.year);
    if (isNaN(yearNum) || yearNum < 2020 || yearNum > 2100) {
      toast({
        variant: "destructive",
        title: "Invalid Year",
        description: "Please enter a valid year between 2020 and 2100."
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('school', formData.school);
      formDataToSend.append('month', formData.month);
      formDataToSend.append('year', formData.year);
      formDataToSend.append('pdf', pdfFile);
      if (formData.notes) formDataToSend.append('notes', formData.notes);
      if (formData.uploadedBy) formDataToSend.append('uploadedBy', formData.uploadedBy);

      const response = await fetch('/api/monthly-feedback', {
        method: 'POST',
        body: formDataToSend,
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "✅ Upload Successful!",
          description: `Monthly feedback for ${formData.month} ${formData.year} has been uploaded.${result.hasExtractedText ? ' Text extracted successfully.' : ' (Text extraction unavailable)'}`,
          duration: 5000
        });

        // Reset form
        setFormData({
          school: '',
          month: '',
          year: new Date().getFullYear().toString(),
          notes: '',
          uploadedBy: ''
        });
        setPdfFile(null);
        const fileInput = document.getElementById('pdfFile') as HTMLInputElement;
        if (fileInput) fileInput.value = '';

        onUploadSuccess();
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        toast({
          variant: "destructive",
          title: "Upload Failed",
          description: errorData.message || 'Failed to upload monthly feedback.'
        });
      }
    } catch (error) {
      console.error('Error uploading feedback:', error);
      toast({
        variant: "destructive",
        title: "Network Error",
        description: "Unable to connect to the server. Please check your connection."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Upload Monthly Feedback</CardTitle>
          <CardDescription>Upload a monthly custodial feedback email PDF</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="school">School <span className="text-red-500">*</span></Label>
              <Select value={formData.school} onValueChange={(value) => setFormData(prev => ({ ...prev, school: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select school" />
                </SelectTrigger>
                <SelectContent>
                  {schoolOptions.map(school => (
                    <SelectItem key={school.value} value={school.value}>
                      {school.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="month">Month <span className="text-red-500">*</span></Label>
              <Select value={formData.month} onValueChange={(value) => setFormData(prev => ({ ...prev, month: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map(month => (
                    <SelectItem key={month} value={month}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Year <span className="text-red-500">*</span></Label>
              <Input
                id="year"
                type="number"
                min="2020"
                max="2100"
                value={formData.year}
                onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pdfFile">PDF File <span className="text-red-500">*</span></Label>
            <Input
              id="pdfFile"
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              required
            />
            {pdfFile && (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                {pdfFile.name} ({(pdfFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="uploadedBy">Uploaded By (Optional)</Label>
            <Input
              id="uploadedBy"
              value={formData.uploadedBy}
              onChange={(e) => setFormData(prev => ({ ...prev, uploadedBy: e.target.value }))}
              placeholder="Your name"
              maxLength={255}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes or context about this feedback..."
              rows={4}
              maxLength={5000}
            />
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload Feedback
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MonthlyFeedbackUploadForm } from '@/components/MonthlyFeedbackUploadForm';
import { MonthlyFeedbackCard } from '@/components/MonthlyFeedbackCard';
import { MonthlyFeedbackViewer } from '@/components/MonthlyFeedbackViewer';
import { useToast } from '@/hooks/use-toast';
import { FileText, Search, Filter } from 'lucide-react';
import type { MonthlyFeedback } from '../../shared/schema';

const schoolOptions = ["ASA", "LCA", "GWC", "OA", "CBR", "WLC"];
const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

interface MonthlyFeedbackPageProps {
  onBack?: () => void;
}

export default function MonthlyFeedbackPage({ onBack }: MonthlyFeedbackPageProps) {
  const { toast } = useToast();
  const [feedbackList, setFeedbackList] = useState<MonthlyFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState<MonthlyFeedback | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Filters
  const [searchText, setSearchText] = useState('');
  const [filterSchool, setFilterSchool] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>('all');

  useEffect(() => {
    fetchFeedback();
    checkAdminStatus();
  }, []);

  const checkAdminStatus = () => {
    const sessionToken = localStorage.getItem('admin-session-token');
    setIsAdmin(!!sessionToken);
  };

  const fetchFeedback = async () => {
    try {
      // Add timeout to prevent hanging (15 second timeout)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch('/api/monthly-feedback', {
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        // Validate data is an array
        if (Array.isArray(data)) {
          setFeedbackList(data);
        } else {
          console.error('Invalid data format from API');
          toast({
            variant: "destructive",
            title: "Data Error",
            description: "Received invalid data format from server.",
            duration: 5000
          });
        }
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || 'Failed to fetch feedback');
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);

      let errorTitle = "Failed to Load";
      let errorDescription = "Unable to load monthly feedback. Please try again.";

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorTitle = "Request Timeout";
          errorDescription = "The request took too long. Please check your connection and try again.";
        } else if (error.message.includes('fetch')) {
          errorTitle = "Connection Error";
          errorDescription = "Unable to connect to the server. Please check your internet connection.";
        }
      }

      toast({
        variant: "destructive",
        title: errorTitle,
        description: errorDescription,
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtered feedback with data validation
  const filteredFeedback = useMemo(() => {
    if (!Array.isArray(feedbackList)) return [];
    
    return feedbackList.filter(feedback => {
      // Validate feedback object
      if (!feedback || typeof feedback !== 'object') return false;
      
      // School filter
      if (filterSchool !== 'all' && feedback.school !== filterSchool) return false;
      
      // Year filter
      if (filterYear !== 'all' && feedback.year !== parseInt(filterYear)) return false;
      
      // Month filter
      if (filterMonth !== 'all' && feedback.month !== filterMonth) return false;
      
      // Search filter
      if (searchText) {
        const searchLower = searchText.toLowerCase();
        const matchesSearch = 
          feedback.school?.toLowerCase().includes(searchLower) ||
          feedback.month?.toLowerCase().includes(searchLower) ||
          feedback.year?.toString().includes(searchLower) ||
          feedback.extractedText?.toLowerCase().includes(searchLower) ||
          feedback.notes?.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
      }
      
      return true;
    });
  }, [feedbackList, filterSchool, filterYear, filterMonth, searchText]);

  // Clear all filters
  const clearFilters = () => {
    setSearchText('');
    setFilterSchool('all');
    setFilterYear('all');
    setFilterMonth('all');
  };

  // Get school name for tooltips (keeping abbreviations as-is)
  const getSchoolFullName = (code: string) => {
    return code; // Keep abbreviations as they are
  };

  // Get unique years from feedback
  const availableYears = useMemo(() => {
    if (!Array.isArray(feedbackList)) return [];
    const years = feedbackList
      .map(f => f.year)
      .filter((year): year is number => typeof year === 'number')
      .sort((a, b) => b - a);
    return Array.from(new Set(years));
  }, [feedbackList]);

  const handleView = (feedback: MonthlyFeedback) => {
    setSelectedFeedback(feedback);
    setIsViewerOpen(true);
  };

  const handleDownload = (feedback: MonthlyFeedback) => {
    const link = document.createElement('a');
    link.href = feedback.pdfUrl;
    link.download = feedback.pdfFileName || `feedback-${feedback.month}-${feedback.year}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async (id: number) => {
    try {
      const sessionToken = localStorage.getItem('admin-session-token');
      const response = await fetch(`/api/monthly-feedback/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      });

      if (response.ok) {
        toast({
          title: "Deleted Successfully",
          description: "Monthly feedback has been deleted."
        });
        setIsViewerOpen(false);
        fetchFeedback();
      } else {
        throw new Error('Delete failed');
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: "Failed to delete feedback. Please try again."
      });
    }
  };

  const handleUploadSuccess = () => {
    fetchFeedback();
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {onBack && (
        <Button onClick={onBack} variant="outline" className="mb-4 back-button">
          ← Back to Home
        </Button>
      )}

      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground mb-2">Monthly Feedback Reports</h1>
        <p className="text-muted-foreground">Upload and manage monthly custodial feedback emails</p>
      </div>

      <Tabs defaultValue="browse" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="browse">
            <FileText className="w-4 h-4 mr-2" />
            Browse Feedback
          </TabsTrigger>
          <TabsTrigger value="upload">Upload New Feedback</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-6">
          {/* Filters */}
          <div className="space-y-4" role="search">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Input
                  placeholder="Search by title, uploader, notes or month…"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="w-full"
                  aria-label="Search feedback by title, uploader, notes or month"
                />
              </div>

            <Select value={filterSchool} onValueChange={setFilterSchool}>
              <SelectTrigger aria-label="Filter by school">
                <SelectValue placeholder="All Schools" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Schools</SelectItem>
                {schoolOptions.map(school => (
                  <SelectItem key={school} value={school} title={getSchoolFullName(school)}>{school}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger aria-label="Filter by year">
                <SelectValue placeholder="All Years" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {availableYears.map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterMonth} onValueChange={setFilterMonth}>
              <SelectTrigger aria-label="Filter by month">
                <SelectValue placeholder="All Months" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
                {months.map(month => (
                  <SelectItem key={month} value={month}>{month}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            </div>
            
            {/* Clear Filters Button */}
            <div className="flex justify-end">
              <Button 
                onClick={clearFilters} 
                variant="outline" 
                size="sm"
                className="flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Clear Filters
              </Button>
            </div>
          </div>

          {/* Results */}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading feedback...</p>
            </div>
          ) : filteredFeedback.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Feedback Found</h3>
              <p className="text-muted-foreground">
                {feedbackList.length === 0 
                  ? "No monthly feedback has been uploaded yet."
                  : "No feedback matches your search criteria."}
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Showing {filteredFeedback.length} of {feedbackList.length} feedback report{feedbackList.length !== 1 ? 's' : ''}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredFeedback.map(feedback => (
                  <MonthlyFeedbackCard
                    key={feedback.id}
                    feedback={feedback}
                    onView={handleView}
                    onDownload={handleDownload}
                  />
                ))}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="upload">
          <MonthlyFeedbackUploadForm onUploadSuccess={handleUploadSuccess} />
        </TabsContent>
      </Tabs>

      <MonthlyFeedbackViewer
        feedback={selectedFeedback}
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        onDelete={handleDelete}
        isAdmin={isAdmin}
      />
    </div>
  );
}

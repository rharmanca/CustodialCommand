import { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Calendar,
  MapPin,
  Camera,
  FileText,
  Eye,
  Trash2,
  AlertCircle,
  Building2,
  Clock,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { PendingInspection } from '@/hooks/usePendingInspections';

interface PendingInspectionListProps {
  inspections: PendingInspection[];
  isLoading: boolean;
  error: string | null;
  onReview: (inspection: PendingInspection) => void;
  onDiscard: (id: number) => void;
  selectedId?: number | null;
}

const schoolOptions = [
  { value: 'all', label: 'All Schools' },
  { value: 'ASA', label: 'ASA' },
  { value: 'LCA', label: 'LCA' },
  { value: 'GWC', label: 'GWC' },
  { value: 'OA', label: 'OA' },
  { value: 'CBR', label: 'CBR' },
  { value: 'WLC', label: 'WLC' },
];

export function PendingInspectionList({
  inspections,
  isLoading,
  error,
  onReview,
  onDiscard,
  selectedId,
}: PendingInspectionListProps) {
  const { toast } = useToast();
  const [schoolFilter, setSchoolFilter] = useState<string>('all');
  const [discardingId, setDiscardingId] = useState<number | null>(null);

  // Filter and sort inspections
  const filteredInspections = useMemo(() => {
    let filtered = [...inspections];

    // Filter by school
    if (schoolFilter !== 'all') {
      filtered = filtered.filter(insp => insp.school === schoolFilter);
    }

    // Sort by capture date (newest first)
    filtered.sort((a, b) => {
      const dateA = a.captureTimestamp ? new Date(a.captureTimestamp).getTime() : 0;
      const dateB = b.captureTimestamp ? new Date(b.captureTimestamp).getTime() : 0;
      return dateB - dateA;
    });

    return filtered;
  }, [inspections, schoolFilter]);

  const handleDiscard = async (id: number) => {
    setDiscardingId(id);
    try {
      await onDiscard(id);
    } finally {
      setDiscardingId(null);
    }
  };

  const formatDate = (dateString: string | Date | null | undefined) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string | Date | null | undefined) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const truncateNotes = (notes: string | null | undefined, maxLength: number = 60) => {
    if (!notes) return null;
    if (notes.length <= maxLength) return notes;
    return notes.substring(0, maxLength) + '...';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Inspections</CardTitle>
          <CardDescription>Loading pending inspections...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-4 p-4 border rounded-lg">
              <Skeleton className="h-20 w-20 rounded-md" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Inspections</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-4 bg-destructive/10 rounded-lg">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <div>
              <p className="font-medium text-destructive">Error loading inspections</p>
              <p className="text-sm text-destructive/80">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Pending Inspections</CardTitle>
            <CardDescription>
              {filteredInspections.length} inspection{filteredInspections.length !== 1 ? 's' : ''} waiting for review
            </CardDescription>
          </div>
          <Select value={schoolFilter} onValueChange={setSchoolFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by school" />
            </SelectTrigger>
            <SelectContent>
              {schoolOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {filteredInspections.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <Building2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No pending inspections</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              {schoolFilter !== 'all'
                ? `No pending inspections found for ${schoolFilter}. Try selecting a different school.`
                : 'All caught up! There are no inspections waiting for review at this time.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredInspections.map(inspection => {
              const isSelected = selectedId === inspection.id;
              const photoCount = inspection.images?.length || 0;
              const thumbnailUrl = inspection.thumbnailUrl || (inspection.images?.[0] ? `${inspection.images[0]}?thumb=1` : null);

              return (
                <div
                  key={inspection.id}
                  className={`group relative flex gap-4 p-4 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50 hover:bg-accent/50'
                  }`}
                  onClick={() => onReview(inspection)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onReview(inspection);
                    }
                  }}
                >
                  {/* Thumbnail */}
                  <div className="flex-shrink-0">
                    {thumbnailUrl ? (
                      <div className="relative w-20 h-20 rounded-md overflow-hidden bg-muted">
                        <img
                          src={thumbnailUrl}
                          alt={`Inspection at ${inspection.locationDescription}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        {photoCount > 1 && (
                          <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                            +{photoCount - 1}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-md bg-muted flex items-center justify-center">
                        <Camera className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="secondary" className="font-semibold">
                            {inspection.school}
                          </Badge>
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(inspection.captureTimestamp || inspection.createdAt)}
                          </span>
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTime(inspection.captureTimestamp || inspection.createdAt)}
                          </span>
                        </div>
                        <h4 className="font-medium mt-1 truncate">
                          {inspection.locationDescription || 'Unknown location'}
                        </h4>
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {inspection.roomNumber || 'No room specified'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Camera className="h-3 w-3" />
                            {photoCount} photo{photoCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                        {inspection.quickNotes && (
                          <p className="text-sm text-muted-foreground mt-2 flex items-start gap-1">
                            <FileText className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            <span className="line-clamp-2">{truncateNotes(inspection.quickNotes)}</span>
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        <Button
                          size="sm"
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            onReview(inspection);
                          }}
                          className="gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          Review
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            handleDiscard(inspection.id);
                          }}
                          disabled={discardingId === inspection.id}
                        >
                          <Trash2 className="h-4 w-4" />
                          {discardingId === inspection.id ? 'Discarding...' : 'Discard'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default PendingInspectionList;

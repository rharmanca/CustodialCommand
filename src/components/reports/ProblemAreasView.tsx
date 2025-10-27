import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, AlertCircle, FileText, Building, Calendar, Star, Download, Eye } from 'lucide-react';
import type { Inspection, CustodialNote } from '../../../shared/schema';
import { 
  analyzeProblemAreas, 
  identifyUrgentCustodialNotes, 
  getSeverityBadgeProps, 
  getUrgentNoteBadgeProps,
  type ProblemArea,
  type UrgentCustodialNote
} from '../../utils/problemAnalysis';
import ExportDialog from './ExportDialog';

interface ProblemAreasViewProps {
  inspections: Inspection[];
  custodialNotes: CustodialNote[];
  onInspectionClick?: (inspection: Inspection) => void;
  onExportReport?: () => void;
}

const ProblemAreasView: React.FC<ProblemAreasViewProps> = ({
  inspections,
  custodialNotes,
  onInspectionClick,
  onExportReport
}) => {
  const problemAnalysis = useMemo(() => {
    const analysis = analyzeProblemAreas(inspections);
    const urgentNotes = identifyUrgentCustodialNotes(custodialNotes);
    
    return {
      ...analysis,
      urgentNotes,
      summary: {
        ...analysis.summary,
        urgentNotesCount: urgentNotes.length
      }
    };
  }, [inspections, custodialNotes]);

  const renderProblemCard = (problem: ProblemArea, index: number) => {
    const badgeProps = getSeverityBadgeProps(problem.severity);
    
    return (
      <Card key={`${problem.inspection.id}-${index}`} className="hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {problem.severity === 'critical' ? (
                <AlertTriangle className="w-5 h-5 text-red-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-orange-600" />
              )}
              <CardTitle className="text-lg">{problem.school}</CardTitle>
            </div>
            <Badge {...badgeProps}>
              {badgeProps.text}
            </Badge>
          </div>
          <CardDescription className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1">
              <Building className="w-4 h-4" />
              {problem.location}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {new Date(problem.date).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1">
              <Star className="w-4 h-4" />
              {problem.rating}/5
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {problem.severity === 'critical' 
                ? 'Immediate attention required' 
                : 'Needs improvement'
              }
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onInspectionClick?.(problem.inspection)}
              >
                <Eye className="w-4 h-4 mr-1" />
                View Details
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderUrgentNote = (urgentNote: UrgentCustodialNote, index: number) => {
    const badgeProps = getUrgentNoteBadgeProps(urgentNote.severity);
    const note = urgentNote.note;
    
    return (
      <Card key={`note-${note.id}-${index}`} className="border-l-4 border-l-red-500 hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600 animate-pulse" />
              <CardTitle className="text-lg">{note.school}</CardTitle>
            </div>
            <Badge {...badgeProps}>
              {badgeProps.text}
            </Badge>
          </div>
          <CardDescription className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1">
              <Building className="w-4 h-4" />
              {note.location}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {new Date(note.date).toLocaleDateString()}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            <p className="text-sm text-foreground">{note.notes}</p>
            {urgentNote.keywords.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {urgentNote.keywords.map((keyword, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {keyword}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{problemAnalysis.summary.criticalCount}</div>
            <p className="text-xs text-muted-foreground">Rating &lt; 2.0</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Needs Attention</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{problemAnalysis.summary.needsAttentionCount}</div>
            <p className="text-xs text-muted-foreground">Rating 2.0-3.0</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgent Notes</CardTitle>
            <FileText className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{problemAnalysis.summary.urgentNotesCount}</div>
            <p className="text-xs text-muted-foreground">High priority reports</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Affected Schools</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{problemAnalysis.summary.affectedSchools.length}</div>
            <p className="text-xs text-muted-foreground">Schools with issues</p>
          </CardContent>
        </Card>
      </div>

      {/* Export Button */}
      <div className="flex justify-end">
        <ExportDialog
          inspections={inspections}
          custodialNotes={custodialNotes}
          trigger={
            <Button className="bg-primary hover:bg-primary/90">
              <Download className="w-4 h-4 mr-2" />
              Export Problem Areas Report
            </Button>
          }
        />
      </div>

      {/* Urgent Custodial Notes */}
      {problemAnalysis.urgentNotes.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <h3 className="text-xl font-bold text-red-600">🚨 URGENT FACILITY ISSUES</h3>
          </div>
          <div className="grid gap-4">
            {problemAnalysis.urgentNotes.map((urgentNote, index) => 
              renderUrgentNote(urgentNote, index)
            )}
          </div>
        </div>
      )}

      {/* Critical Performance Issues */}
      {problemAnalysis.critical.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <h3 className="text-xl font-bold text-red-600">🔴 CRITICAL PERFORMANCE ISSUES</h3>
            <Badge variant="destructive" className="ml-2">
              Rating &lt; 2.0
            </Badge>
          </div>
          <div className="grid gap-4">
            {problemAnalysis.critical.map((problem, index) => 
              renderProblemCard(problem, index)
            )}
          </div>
        </div>
      )}

      {/* Needs Attention Issues */}
      {problemAnalysis.needsAttention.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-orange-600" />
            <h3 className="text-xl font-bold text-orange-600">🟠 NEEDS ATTENTION</h3>
            <Badge variant="secondary" className="ml-2">
              Rating 2.0-3.0
            </Badge>
          </div>
          <div className="grid gap-4">
            {problemAnalysis.needsAttention.map((problem, index) => 
              renderProblemCard(problem, index)
            )}
          </div>
        </div>
      )}

      {/* No Problems State */}
      {problemAnalysis.critical.length === 0 && 
       problemAnalysis.needsAttention.length === 0 && 
       problemAnalysis.urgentNotes.length === 0 && (
        <Card className="text-center py-8">
          <CardContent>
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <Star className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-600">No Problem Areas Found</h3>
                <p className="text-muted-foreground">
                  All inspections are performing at acceptable levels. Great job!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Information */}
      {problemAnalysis.summary.totalProblems > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Problem Areas Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><strong>Most Problematic School:</strong> {problemAnalysis.summary.mostProblematicSchool || 'N/A'}</p>
              <p><strong>Affected Schools:</strong> {problemAnalysis.summary.affectedSchools.join(', ')}</p>
              <p><strong>Total Issues:</strong> {problemAnalysis.summary.totalProblems} problems across {problemAnalysis.summary.affectedSchools.length} schools</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProblemAreasView;

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Star, Loader2, AlertCircle, CheckCircle2, Building2, Coffee, Wrench, Shield, ChevronDown, Tag } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TagSelector } from '@/components/tags';
import { ratingDescriptions, inspectionCategories } from '@shared/custodial-criteria';
import * as Accordion from '@radix-ui/react-accordion';

// Rating groups configuration for accordion sections
const RATING_GROUPS = [
  {
    id: 'physical',
    label: 'Physical Environment',
    icon: Building2,
    fields: ['floors', 'verticalHorizontalSurfaces', 'ceiling']
  },
  {
    id: 'service',
    label: 'Service Areas',
    icon: Coffee,
    fields: ['restrooms']
  },
  {
    id: 'maintenance',
    label: 'Maintenance & Operations',
    icon: Wrench,
    fields: ['trash', 'projectCleaning', 'activitySupport', 'equipment']
  },
  {
    id: 'compliance',
    label: 'Compliance & Satisfaction',
    icon: Shield,
    fields: ['safetyCompliance', 'monitoring', 'customerSatisfaction']
  }
] as const;
import type { PendingInspection } from '@/hooks/usePendingInspections';
import type { CompleteInspectionData } from '@/hooks/usePendingInspections';

// Zod schema for form validation
const inspectionCompletionSchema = z.object({
  floors: z.number().min(1).max(5),
  verticalHorizontalSurfaces: z.number().min(1).max(5),
  ceiling: z.number().min(1).max(5),
  restrooms: z.number().min(1).max(5),
  customerSatisfaction: z.number().min(1).max(5),
  trash: z.number().min(1).max(5),
  projectCleaning: z.number().min(1).max(5),
  activitySupport: z.number().min(1).max(5),
  safetyCompliance: z.number().min(1).max(5),
  equipment: z.number().min(1).max(5),
  monitoring: z.number().min(1).max(5),
  notes: z.string().optional(),
});

type InspectionCompletionFormData = z.infer<typeof inspectionCompletionSchema>;

interface InspectionCompletionFormProps {
  inspection: PendingInspection;
  onComplete: (data: CompleteInspectionData) => void;
  isSubmitting: boolean;
  error: string | null;
  initialTags?: string[];
  onTagsChange?: (tags: string[]) => void;
}

interface StarRatingFieldProps {
  name: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  criteria?: Record<number, string>;
}

function StarRatingField({ name, label, value, onChange, criteria }: StarRatingFieldProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const displayValue = hoverValue ?? value ?? -1;
  const ratingDescription = displayValue > 0 ? ratingDescriptions[displayValue - 1] : null;

  return (
    <div className="space-y-3">
      <Label htmlFor={name}>{label}</Label>

      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHoverValue(star)}
            onMouseLeave={() => setHoverValue(null)}
            className="p-1 hover:scale-110 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
            aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
          >
            <Star
              className={`w-6 h-6 transition-colors ${
                star <= displayValue
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300 hover:text-yellow-200'
              }`}
            />
          </button>
        ))}
      </div>

      {ratingDescription && (
        <div className="space-y-1">
          <p className="text-sm font-medium text-yellow-600">{ratingDescription.label}</p>
          <p className="text-sm text-muted-foreground">{ratingDescription.description}</p>
        </div>
      )}

      {criteria && displayValue > 0 && criteria[displayValue] && (
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
          <p className="text-sm font-medium text-blue-900 mb-1">Detailed Criteria:</p>
          <p className="text-sm text-blue-800">{criteria[displayValue]}</p>
        </div>
      )}
    </div>
  );
}

export function InspectionCompletionForm({
  inspection,
  onComplete,
  isSubmitting,
  error,
  initialTags = [],
  onTagsChange,
}: InspectionCompletionFormProps) {
  const [showSuccess, setShowSuccess] = useState(false);

  const form = useForm<InspectionCompletionFormData>({
    resolver: zodResolver(inspectionCompletionSchema),
    defaultValues: {
      floors: inspection.floors || undefined,
      verticalHorizontalSurfaces: inspection.verticalHorizontalSurfaces || undefined,
      ceiling: inspection.ceiling || undefined,
      restrooms: inspection.restrooms || undefined,
      customerSatisfaction: inspection.customerSatisfaction || undefined,
      trash: inspection.trash || undefined,
      projectCleaning: inspection.projectCleaning || undefined,
      activitySupport: inspection.activitySupport || undefined,
      safetyCompliance: inspection.safetyCompliance || undefined,
      equipment: inspection.equipment || undefined,
      monitoring: inspection.monitoring || undefined,
      notes: inspection.notes || '',
    },
  });

  // Pre-populate with existing data if available
  useEffect(() => {
    if (inspection) {
      form.reset({
        floors: inspection.floors || undefined,
        verticalHorizontalSurfaces: inspection.verticalHorizontalSurfaces || undefined,
        ceiling: inspection.ceiling || undefined,
        restrooms: inspection.restrooms || undefined,
        customerSatisfaction: inspection.customerSatisfaction || undefined,
        trash: inspection.trash || undefined,
        projectCleaning: inspection.projectCleaning || undefined,
        activitySupport: inspection.activitySupport || undefined,
        safetyCompliance: inspection.safetyCompliance || undefined,
        equipment: inspection.equipment || undefined,
        monitoring: inspection.monitoring || undefined,
        notes: inspection.notes || inspection.quickNotes || '',
      });
    }
  }, [inspection, form]);

  const onSubmit = (data: InspectionCompletionFormData) => {
    onComplete(data as CompleteInspectionData);
  };

  // Get criteria for a category if available
  const getCriteria = (categoryKey: string): Record<number, string> | undefined => {
    const category = inspectionCategories.find(c => c.key === categoryKey);
    return category?.criteria;
  };

  // Quick notes display if present
  const hasQuickNotes = inspection.quickNotes && inspection.quickNotes.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Complete Inspection</CardTitle>
        <CardDescription>
          Review the photos and rate all categories for this inspection.
        </CardDescription>
      </CardHeader>

      {showSuccess && (
        <div className="px-6 pb-4">
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Inspection completed successfully!
            </AlertDescription>
          </Alert>
        </div>
      )}

      {error && (
        <div className="px-6 pb-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Quick Notes Section */}
      {hasQuickNotes && (
        <div className="px-6 pb-4">
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <h4 className="text-sm font-medium text-amber-900 mb-2">Quick Notes (from field capture)</h4>
            <p className="text-sm text-amber-800">{inspection.quickNotes}</p>
          </div>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-8">
            {/* Location Info */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Inspection Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">School:</span>{' '}
                  <span className="font-medium">{inspection.school}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Location:</span>{' '}
                  <span className="font-medium">{inspection.locationDescription}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Room:</span>{' '}
                  <span className="font-medium">{inspection.roomNumber || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Captured:</span>{' '}
                  <span className="font-medium">
                    {inspection.captureTimestamp
                      ? new Date(inspection.captureTimestamp).toLocaleDateString()
                      : new Date(inspection.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Issue Tags */}
            <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-muted-foreground" />
                <h3 className="font-medium">Issue Tags</h3>
              </div>
              <TagSelector
                selected={initialTags}
                onChange={onTagsChange || (() => {})}
                maxSelection={3}
                disabled={isSubmitting}
              />
            </div>

            {/* Rating Categories - Grouped by Accordion */}
            <div className="space-y-4">
              <h3 className="font-medium text-lg border-b pb-2">Ratings</h3>

              <Accordion.Root type="multiple" defaultValue={RATING_GROUPS.map(g => g.id)} className="space-y-3">
                {RATING_GROUPS.map((group) => {
                  const Icon = group.icon;
                  const ratings = form.watch();
                  const ratedCount = group.fields.filter(f => ratings[f as keyof typeof ratings] !== undefined).length;
                  const isComplete = ratedCount === group.fields.length;

                  return (
                    <Accordion.Item
                      key={group.id}
                      value={group.id}
                      className="border rounded-lg overflow-hidden bg-card"
                    >
                      <Accordion.Header>
                        <Accordion.Trigger className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors group">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isComplete ? 'bg-green-100' : 'bg-muted'}`}>
                              <Icon className={`w-4 h-4 ${isComplete ? 'text-green-600' : 'text-muted-foreground'}`} />
                            </div>
                            <div className="text-left">
                              <span className="font-medium">{group.label}</span>
                              <span className={`ml-2 text-sm ${isComplete ? 'text-green-600' : 'text-muted-foreground'}`}>
                                {ratedCount}/{group.fields.length} rated
                              </span>
                            </div>
                          </div>
                          <ChevronDown className="w-5 h-5 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                        </Accordion.Trigger>
                      </Accordion.Header>
                      <Accordion.Content className="px-4 pb-4 space-y-6 data-[state=open]:animate-slideDown data-[state=closed]:animate-slideUp">
                        {group.fields.map((fieldName) => {
                          const category = inspectionCategories.find(c => c.key === fieldName);
                          return (
                            <StarRatingField
                              key={fieldName}
                              name={fieldName}
                              label={category?.label || fieldName}
                              value={(form.watch(fieldName as keyof InspectionCompletionFormData) as number) || -1}
                              onChange={(value) => form.setValue(fieldName as keyof InspectionCompletionFormData, value, { shouldValidate: true })}
                              criteria={getCriteria(fieldName)}
                            />
                          );
                        })}
                      </Accordion.Content>
                    </Accordion.Item>
                  );
                })}
              </Accordion.Root>
            </div>

            {/* Notes */}
            <div className="space-y-3">
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Detailed Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter any additional notes or observations..."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>

          <CardFooter className="flex justify-end gap-3 border-t pt-6">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="min-w-[140px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Complete Inspection'
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

export default InspectionCompletionForm;

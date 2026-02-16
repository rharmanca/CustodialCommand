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
import { Star, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ratingDescriptions, inspectionCategories } from '@shared/custodial-criteria';
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

            {/* Rating Categories */}
            <div className="space-y-8">
              <h3 className="font-medium text-lg border-b pb-2">Ratings</h3>

              <StarRatingField
                name="floors"
                label="Floors"
                value={form.watch('floors') || -1}
                onChange={(value) => form.setValue('floors', value, { shouldValidate: true })}
                criteria={getCriteria('floors')}
              />

              <StarRatingField
                name="verticalHorizontalSurfaces"
                label="Vertical and Horizontal Surfaces"
                value={form.watch('verticalHorizontalSurfaces') || -1}
                onChange={(value) => form.setValue('verticalHorizontalSurfaces', value, { shouldValidate: true })}
                criteria={getCriteria('verticalHorizontalSurfaces')}
              />

              <StarRatingField
                name="ceiling"
                label="Ceiling"
                value={form.watch('ceiling') || -1}
                onChange={(value) => form.setValue('ceiling', value, { shouldValidate: true })}
                criteria={getCriteria('ceiling')}
              />

              <StarRatingField
                name="restrooms"
                label="Restrooms"
                value={form.watch('restrooms') || -1}
                onChange={(value) => form.setValue('restrooms', value, { shouldValidate: true })}
                criteria={getCriteria('restrooms')}
              />

              <StarRatingField
                name="customerSatisfaction"
                label="Customer Satisfaction"
                value={form.watch('customerSatisfaction') || -1}
                onChange={(value) => form.setValue('customerSatisfaction', value, { shouldValidate: true })}
                criteria={getCriteria('customerSatisfaction')}
              />

              <StarRatingField
                name="trash"
                label="Trash"
                value={form.watch('trash') || -1}
                onChange={(value) => form.setValue('trash', value, { shouldValidate: true })}
                criteria={getCriteria('trash')}
              />

              <StarRatingField
                name="projectCleaning"
                label="Project Cleaning"
                value={form.watch('projectCleaning') || -1}
                onChange={(value) => form.setValue('projectCleaning', value, { shouldValidate: true })}
                criteria={getCriteria('projectCleaning')}
              />

              <StarRatingField
                name="activitySupport"
                label="Activity Support"
                value={form.watch('activitySupport') || -1}
                onChange={(value) => form.setValue('activitySupport', value, { shouldValidate: true })}
                criteria={getCriteria('activitySupport')}
              />

              <StarRatingField
                name="safetyCompliance"
                label="Safety Compliance"
                value={form.watch('safetyCompliance') || -1}
                onChange={(value) => form.setValue('safetyCompliance', value, { shouldValidate: true })}
                criteria={getCriteria('safetyCompliance')}
              />

              <StarRatingField
                name="equipment"
                label="Equipment"
                value={form.watch('equipment') || -1}
                onChange={(value) => form.setValue('equipment', value, { shouldValidate: true })}
                criteria={getCriteria('equipment')}
              />

              <StarRatingField
                name="monitoring"
                label="Monitoring"
                value={form.watch('monitoring') || -1}
                onChange={(value) => form.setValue('monitoring', value, { shouldValidate: true })}
                criteria={getCriteria('monitoring')}
              />
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

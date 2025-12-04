import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, TrendingUp, AlertTriangle, AlertCircle } from 'lucide-react';

// Screen-reader-only styles for accessible data table
const srOnlyStyles: React.CSSProperties = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
};

interface SchoolComparisonChartProps {
  data: Array<{
    school: string;
    averageRating: number;
    totalInspections: number;
    singleRoomCount: number;
    wholeBuildingCount: number;
  }>;
  title?: string;
  description?: string;
  showThresholds?: boolean;
}

const SchoolComparisonChart: React.FC<SchoolComparisonChartProps> = ({ 
  data, 
  title = "School Performance Comparison", 
  description = "Average ratings and inspection counts by school",
  showThresholds = true
}) => {
  // Generate accessible chart description for screen readers
  const accessibleDescription = useMemo(() => {
    if (!data || data.length === 0) return `${title}: No data available.`;
    
    const ratings = data.map(d => d.averageRating);
    const bestSchool = data.reduce((best, current) => 
      current.averageRating > best.averageRating ? current : best
    );
    const worstSchool = data.reduce((worst, current) => 
      current.averageRating < worst.averageRating ? current : worst
    );
    const criticalSchools = data.filter(d => d.averageRating < 2.0);
    const needsAttention = data.filter(d => d.averageRating >= 2.0 && d.averageRating < 3.0);
    
    let summary = `${title}. Bar chart comparing ${data.length} schools. `;
    summary += `Best performing: ${bestSchool.school} with ${bestSchool.averageRating.toFixed(1)} rating. `;
    summary += `Lowest: ${worstSchool.school} with ${worstSchool.averageRating.toFixed(1)} rating. `;
    if (criticalSchools.length > 0) {
      summary += `${criticalSchools.length} school${criticalSchools.length > 1 ? 's' : ''} below critical threshold. `;
    }
    if (needsAttention.length > 0) {
      summary += `${needsAttention.length} school${needsAttention.length > 1 ? 's' : ''} need${needsAttention.length === 1 ? 's' : ''} attention.`;
    }
    
    return summary;
  }, [data, title]);

  // Custom tooltip matching your theme
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">{entry.name}:</span>
              <span className="font-medium text-foreground">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="w-full offscreen-content layout-contained">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Building className="w-5 h-5 text-primary" />
          {title}
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Accessible chart container with ARIA attributes */}
        <div 
          className="h-80 w-full"
          role="img"
          aria-label={accessibleDescription}
          tabIndex={0}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="hsl(var(--border))" 
                opacity={0.3}
              />
              <XAxis 
                dataKey="school" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {showThresholds && (
                <>
                  <ReferenceLine 
                    y={3.0} 
                    stroke="#10B981" 
                    strokeDasharray="5 5" 
                    strokeWidth={2}
                    label={{ value: "Acceptable (3.0)", position: "top" }}
                  />
                  <ReferenceLine 
                    y={2.0} 
                    stroke="#EF4444" 
                    strokeDasharray="5 5" 
                    strokeWidth={2}
                    label={{ value: "Critical (2.0)", position: "top" }}
                  />
                </>
              )}
              <Bar 
                dataKey="averageRating" 
                fill="hsl(var(--chart-1))" 
                name="Average Rating"
                radius={[2, 2, 0, 0]}
              />
              <Bar 
                dataKey="totalInspections" 
                fill="hsl(var(--chart-2))" 
                name="Total Inspections"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {showThresholds && (
          <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-green-500 border-dashed border-t-2"></div>
              <span>Acceptable Threshold (3.0)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-red-500 border-dashed border-t-2"></div>
              <span>Critical Threshold (2.0)</span>
            </div>
          </div>
        )}
        
        {/* Screen-reader-only data table for full accessibility */}
        <table style={srOnlyStyles} aria-label={`Data table for ${title}`}>
          <caption>{title} - {description}</caption>
          <thead>
            <tr>
              <th scope="col">School</th>
              <th scope="col">Average Rating</th>
              <th scope="col">Status</th>
              <th scope="col">Total Inspections</th>
              <th scope="col">Single Room</th>
              <th scope="col">Whole Building</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => {
              const status = row.averageRating < 2.0 ? 'Critical' : 
                           row.averageRating < 3.0 ? 'Needs Attention' : 'Acceptable';
              return (
                <tr key={index}>
                  <td>{row.school}</td>
                  <td>{row.averageRating.toFixed(2)}</td>
                  <td>{status}</td>
                  <td>{row.totalInspections}</td>
                  <td>{row.singleRoomCount}</td>
                  <td>{row.wholeBuildingCount}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
};

export default React.memo(SchoolComparisonChart);

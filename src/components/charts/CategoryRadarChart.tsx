import React, { useMemo } from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Star, AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';

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

interface CategoryRadarChartProps {
  data: Array<{
    category: string;
    rating: number;
    fullMark?: number;
  }>;
  title?: string;
  description?: string;
  showProblemHighlighting?: boolean;
}

const CategoryRadarChart: React.FC<CategoryRadarChartProps> = ({ 
  data, 
  title = "Category Performance Analysis", 
  description = "Performance ratings across all inspection categories",
  showProblemHighlighting = true
}) => {
  // Determine performance level and color for each category
  const getPerformanceLevel = (rating: number) => {
    if (rating < 2.0) return { level: 'critical', color: '#EF4444', icon: AlertTriangle, label: 'Critical' };
    if (rating < 3.0) return { level: 'needs-attention', color: '#F59E0B', icon: AlertCircle, label: 'Needs Attention' };
    return { level: 'acceptable', color: '#10B981', icon: CheckCircle, label: 'Acceptable' };
  };

  // Generate accessible chart description for screen readers
  const accessibleDescription = useMemo(() => {
    if (!data || data.length === 0) return `${title}: No data available.`;
    
    const criticalCategories = data.filter(d => d.rating < 2.0);
    const needsAttentionCategories = data.filter(d => d.rating >= 2.0 && d.rating < 3.0);
    const acceptableCategories = data.filter(d => d.rating >= 3.0);
    const avgRating = (data.reduce((sum, d) => sum + d.rating, 0) / data.length).toFixed(1);
    
    let summary = `${title}. Radar chart showing ${data.length} inspection categories with an overall average of ${avgRating}. `;
    
    if (criticalCategories.length > 0) {
      summary += `Critical issues in: ${criticalCategories.map(c => `${c.category} (${c.rating.toFixed(1)})`).join(', ')}. `;
    }
    if (needsAttentionCategories.length > 0) {
      summary += `Needs attention: ${needsAttentionCategories.map(c => `${c.category} (${c.rating.toFixed(1)})`).join(', ')}. `;
    }
    if (acceptableCategories.length > 0) {
      summary += `${acceptableCategories.length} categories are acceptable.`;
    }
    
    return summary;
  }, [data, title]);

  // Custom tick component with problem highlighting
  const CustomTick = (props: any) => {
    const { payload, x, y, textAnchor } = props;
    const categoryData = data.find(d => d.category === payload.value);
    const performance = categoryData ? getPerformanceLevel(categoryData.rating) : null;
    const Icon = performance?.icon || Star;
    
    return (
      <g transform={`translate(${x},${y})`}>
        <text 
          x={0} 
          y={0} 
          dy={16} 
          textAnchor={textAnchor} 
          fontSize={12} 
          fill={performance?.color || 'hsl(var(--muted-foreground))'}
          fontWeight={showProblemHighlighting && performance?.level !== 'acceptable' ? 'bold' : 'normal'}
        >
          {payload.value}
        </text>
        {showProblemHighlighting && performance?.level !== 'acceptable' && (
          <circle 
            cx={-20} 
            cy={0} 
            r={4} 
            fill={performance?.color || '#EF4444'}
          />
        )}
      </g>
    );
  };
  return (
    <Card className="w-full offscreen-content layout-contained">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Target className="w-5 h-5 text-primary" />
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
            <RadarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <PolarGrid 
                stroke="hsl(var(--border))" 
                opacity={0.3}
              />
              <PolarAngleAxis 
                dataKey="category" 
                tick={<CustomTick />}
              />
              <PolarRadiusAxis 
                domain={[0, 5]} 
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
              />
              <Radar 
                name="Performance" 
                dataKey="rating" 
                stroke="hsl(var(--chart-1))" 
                fill="hsl(var(--chart-1))" 
                fillOpacity={0.2}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        {showProblemHighlighting && (
          <div className="mt-4 space-y-3">
            {/* Problem Categories Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
              {data.map((item) => {
                const performance = getPerformanceLevel(item.rating);
                if (performance.level === 'acceptable') return null;
                
                return (
                  <div key={item.category} className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                    <performance.icon className="w-4 h-4" style={{ color: performance.color }} />
                    <span className="font-medium">{item.category}</span>
                    <span className="text-muted-foreground">({item.rating.toFixed(1)})</span>
                  </div>
                );
              })}
            </div>
            
            {/* Legend */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span>Critical (&lt; 2.0)</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-orange-500" />
                <span>Needs Attention (2.0-3.0)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Acceptable (&gt; 3.0)</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Screen-reader-only data table for full accessibility */}
        <table style={srOnlyStyles} aria-label={`Data table for ${title}`}>
          <caption>{title} - {description}</caption>
          <thead>
            <tr>
              <th scope="col">Category</th>
              <th scope="col">Rating</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => {
              const performance = getPerformanceLevel(row.rating);
              return (
                <tr key={index}>
                  <td>{row.category}</td>
                  <td>{row.rating.toFixed(2)}</td>
                  <td>{performance.label}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
};

export default React.memo(CategoryRadarChart);

import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Calendar } from 'lucide-react';

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

interface PerformanceTrendChartProps {
  data: Array<{
    date: string;
    averageRating: number;
    totalInspections: number;
    school?: string;
  }>;
  title?: string;
  description?: string;
}

const PerformanceTrendChart: React.FC<PerformanceTrendChartProps> = ({ 
  data, 
  title = "Performance Trends", 
  description = "Average ratings over time" 
}) => {
  // Generate accessible chart description for screen readers
  const accessibleDescription = useMemo(() => {
    if (!data || data.length === 0) return `${title}: No data available.`;
    
    const ratings = data.map(d => d.averageRating);
    const minRating = Math.min(...ratings).toFixed(1);
    const maxRating = Math.max(...ratings).toFixed(1);
    const avgRating = (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1);
    const totalInspections = data.reduce((sum, d) => sum + d.totalInspections, 0);
    
    return `${title}. Line chart showing ${data.length} data points from ${data[0]?.date} to ${data[data.length - 1]?.date}. Average rating ranges from ${minRating} to ${maxRating}, with an overall average of ${avgRating}. Total inspections: ${totalInspections}.`;
  }, [data, title]);

  // Custom tooltip to match your theme
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
          <TrendingUp className="w-5 h-5 text-primary" />
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
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="hsl(var(--border))" 
                opacity={0.3}
              />
              <XAxis 
                dataKey="date" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                domain={[1, 5]} 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="averageRating" 
                stroke="hsl(var(--chart-1))" 
                strokeWidth={3}
                dot={{ fill: "hsl(var(--chart-1))", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: "hsl(var(--chart-1))", strokeWidth: 2 }}
              />
              <Line 
                type="monotone" 
                dataKey="totalInspections" 
                stroke="hsl(var(--chart-2))" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: "hsl(var(--chart-2))", strokeWidth: 2, r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Screen-reader-only data table for full accessibility */}
        <table style={srOnlyStyles} aria-label={`Data table for ${title}`}>
          <caption>{title} - {description}</caption>
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Average Rating</th>
              <th scope="col">Total Inspections</th>
              {data[0]?.school && <th scope="col">School</th>}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index}>
                <td>{row.date}</td>
                <td>{row.averageRating.toFixed(2)}</td>
                <td>{row.totalInspections}</td>
                {row.school && <td>{row.school}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
};

export default React.memo(PerformanceTrendChart);

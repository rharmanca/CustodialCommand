import React from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Star } from 'lucide-react';

interface CategoryRadarChartProps {
  data: Array<{
    category: string;
    rating: number;
    fullMark?: number;
  }>;
  title?: string;
  description?: string;
}

const CategoryRadarChart: React.FC<CategoryRadarChartProps> = ({ 
  data, 
  title = "Category Performance Analysis", 
  description = "Performance ratings across all inspection categories" 
}) => {
  return (
    <Card className="w-full">
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
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <PolarGrid 
                stroke="hsl(var(--border))" 
                opacity={0.3}
              />
              <PolarAngleAxis 
                dataKey="category" 
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
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
      </CardContent>
    </Card>
  );
};

export default CategoryRadarChart;

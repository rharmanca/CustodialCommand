import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: {
    value: number;
    period: string;
  };
  icon?: LucideIcon;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'destructive';
  className?: string;
}

const KPICard: React.FC<KPICardProps> = ({ 
  title, 
  value, 
  description, 
  trend, 
  icon: Icon, 
  color = 'primary',
  className = ''
}) => {
  const getColorClasses = (color: string) => {
    switch (color) {
      case 'primary':
        return {
          text: 'text-primary',
          bg: 'bg-primary/10',
          border: 'border-primary/20'
        };
      case 'secondary':
        return {
          text: 'text-secondary',
          bg: 'bg-secondary/10',
          border: 'border-secondary/20'
        };
      case 'success':
        return {
          text: 'text-green-600',
          bg: 'bg-green-50',
          border: 'border-green-200'
        };
      case 'warning':
        return {
          text: 'text-yellow-600',
          bg: 'bg-yellow-50',
          border: 'border-yellow-200'
        };
      case 'destructive':
        return {
          text: 'text-destructive',
          bg: 'bg-destructive/10',
          border: 'border-destructive/20'
        };
      default:
        return {
          text: 'text-primary',
          bg: 'bg-primary/10',
          border: 'border-primary/20'
        };
    }
  };

  const colorClasses = getColorClasses(color);

  const getTrendIcon = (trendValue: number) => {
    if (trendValue > 0) return <TrendingUp className="w-4 h-4" />;
    if (trendValue < 0) return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  const getTrendColor = (trendValue: number) => {
    if (trendValue > 0) return 'text-green-600';
    if (trendValue < 0) return 'text-red-600';
    return 'text-muted-foreground';
  };

  return (
    <Card className={`hover:shadow-lg transition-all duration-200 ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && (
          <div className={`p-2 rounded-lg ${colorClasses.bg} ${colorClasses.border} border`}>
            <Icon className={`w-4 h-4 ${colorClasses.text}`} />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-2xl font-bold text-foreground">
            {value}
          </div>
          {description && (
            <p className="text-xs text-muted-foreground">
              {description}
            </p>
          )}
          {trend && (
            <div className={`flex items-center gap-1 text-sm ${getTrendColor(trend.value)}`}>
              {getTrendIcon(trend.value)}
              <span className="font-medium">
                {trend.value > 0 ? '+' : ''}{trend.value}%
              </span>
              <span className="text-muted-foreground">
                {trend.period}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default KPICard;

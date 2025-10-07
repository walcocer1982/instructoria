/**
 * Card de estadística/métrica para dashboard del profesor
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  value?: string | number;
  buttonLabel?: string;
  onButtonClick?: () => void;
  variant?: 'default' | 'success' | 'warning' | 'info';
}

export function StatCard({
  title,
  description,
  icon: Icon,
  value,
  buttonLabel,
  onButtonClick,
  variant = 'default',
}: StatCardProps) {
  const variantStyles = {
    default: 'border-border',
    success: 'border-green-500/50 bg-green-50/50 dark:bg-green-950/20',
    warning: 'border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-950/20',
    info: 'border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/20',
  };

  const iconStyles = {
    default: 'text-muted-foreground',
    success: 'text-green-600 dark:text-green-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    info: 'text-blue-600 dark:text-blue-400',
  };

  return (
    <Card className={variantStyles[variant]}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          <Icon className={`h-5 w-5 ${iconStyles[variant]}`} />
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {value !== undefined && (
          <div className="text-3xl font-bold mb-4">{value}</div>
        )}
        {buttonLabel && onButtonClick && (
          <Button onClick={onButtonClick} className="w-full">
            {buttonLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

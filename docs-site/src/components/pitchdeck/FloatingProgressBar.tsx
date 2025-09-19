import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface FloatingProgressBarProps {
  show: boolean;
  pageNumber: number;
  numPages: number;
  progress: number;
}

export const FloatingProgressBar = ({
  show,
  pageNumber,
  numPages,
  progress
}: FloatingProgressBarProps) => {
  if (!show) return null;

  return (
    <div className={cn(
      "fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 transition-all duration-300",
      show ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
    )}>
      <Card className="glass-effect border shadow-lg">
        <CardContent className="px-6 py-3">
          <div className="flex items-center space-x-4">
            <Badge variant="secondary" className="text-sm font-medium bg-muted text-foreground-secondary border-border">
              {pageNumber} / {numPages}
            </Badge>
            <Progress value={progress} className="w-48 h-2 bg-muted" />
            <span className="text-sm font-medium text-foreground-secondary">
              {Math.round(progress)}%
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2
} from 'lucide-react';

interface PDFControlsProps {
  pageNumber: number;
  numPages: number;
  scale: number;
  onPrevPage: () => void;
  onNextPage: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onRotate: () => void;
  onFullscreen: () => void;
}

export const PDFControls = ({
  pageNumber,
  numPages,
  scale,
  onPrevPage,
  onNextPage,
  onZoomIn,
  onZoomOut,
  onRotate,
  onFullscreen
}: PDFControlsProps) => {
  return (
    <Card className="mb-2">
      <CardContent className="p-2 sm:p-3">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
          {/* Navigation Controls */}
          <div className="flex items-center space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={onPrevPage}
              disabled={pageNumber <= 1}
              className="h-8 w-8 p-0 border-2 border-border bg-surface-secondary hover:border-border-hover hover:bg-background-hover disabled:opacity-50"
            >
              <ChevronLeft className="h-3 w-3 text-foreground-secondary" />
            </Button>
            <span className="px-2 py-1 text-xs font-medium min-w-[60px] text-center border border-border rounded bg-muted text-foreground-secondary">
              {pageNumber} / {numPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={onNextPage}
              disabled={pageNumber >= numPages}
              className="h-8 w-8 p-0 border-2 border-border bg-surface-secondary hover:border-border-hover hover:bg-background-hover disabled:opacity-50"
            >
              <ChevronRight className="h-3 w-3 text-foreground-secondary" />
            </Button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={onZoomOut}
              disabled={scale <= 0.5}
              className="h-8 w-8 p-0 border-2 border-border bg-surface-secondary hover:border-border-hover hover:bg-background-hover disabled:opacity-50"
            >
              <ZoomOut className="h-3 w-3 text-foreground-secondary" />
            </Button>
            <span className="px-2 py-1 text-xs font-medium min-w-[45px] text-center border border-border rounded bg-muted text-foreground-secondary">
              {Math.round(scale * 100)}%
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={onZoomIn}
              disabled={scale >= 3}
              className="h-8 w-8 p-0 border-2 border-border bg-surface-secondary hover:border-border-hover hover:bg-background-hover disabled:opacity-50"
            >
              <ZoomIn className="h-3 w-3 text-foreground-secondary" />
            </Button>
          </div>

          {/* Action Controls */}
          <div className="flex items-center space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={onRotate}
              className="h-8 w-8 p-0 border-2 border-border bg-surface-secondary hover:border-border-hover hover:bg-background-hover"
            >
              <RotateCw className="h-3 w-3 text-foreground-secondary" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onFullscreen}
              className="h-8 w-8 p-0 border-2 border-border bg-surface-secondary hover:border-border-hover hover:bg-background-hover"
            >
              <Maximize2 className="h-3 w-3 text-foreground-secondary" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
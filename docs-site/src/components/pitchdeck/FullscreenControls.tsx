import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Minimize2
} from 'lucide-react';

interface FullscreenControlsProps {
  pageNumber: number;
  numPages: number;
  progress: number;
  scale: number;
  onPrevPage: () => void;
  onNextPage: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onRotate: () => void;
  onExitFullscreen: () => void;
}

export const FullscreenControls = ({
  pageNumber,
  numPages,
  progress,
  scale,
  onPrevPage,
  onNextPage,
  onZoomIn,
  onZoomOut,
  onRotate,
  onExitFullscreen
}: FullscreenControlsProps) => {
  return (
    <div className="bg-black/90 border-b border-white/20 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Badge variant="secondary" className="bg-white/10 text-white border-white/20">
            {pageNumber} / {numPages}
          </Badge>
          <Progress value={progress} className="w-48 bg-white/20" />
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onPrevPage}
            disabled={pageNumber <= 1}
            className="border-white/20 text-white hover:bg-white/10 disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onNextPage}
            disabled={pageNumber >= numPages}
            className="border-white/20 text-white hover:bg-white/10 disabled:opacity-50"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onZoomOut}
            disabled={scale <= 0.5}
            className="border-white/20 text-white hover:bg-white/10 disabled:opacity-50"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-white text-sm min-w-[60px] text-center bg-white/10 px-2 py-1 rounded border border-white/20">
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={onZoomIn}
            disabled={scale >= 3}
            className="border-white/20 text-white hover:bg-white/10 disabled:opacity-50"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onRotate}
            className="border-white/20 text-white hover:bg-white/10"
          >
            <RotateCw className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onExitFullscreen}
            className="border-white/20 text-white hover:bg-white/10"
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
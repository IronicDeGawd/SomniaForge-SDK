import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Home } from 'lucide-react';
import { FloatingProgressBar } from '@/components/pitchdeck/FloatingProgressBar';
import { PDFControls } from '@/components/pitchdeck/PDFControls';
import { FullscreenControls } from '@/components/pitchdeck/FullscreenControls';
import { PDFViewer } from '@/components/pitchdeck/PDFViewer';
import { PDFSkeleton } from '@/components/pitchdeck/PDFSkeleton';
import { useIsMobile } from '@/hooks/use-mobile';

const PitchDeck = () => {
  const isMobile = useIsMobile();
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(isMobile ? 1.1 : 0.8);
  const [rotation, setRotation] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [showFloatingProgress, setShowFloatingProgress] = useState<boolean>(false);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
  }, []);

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('Error loading PDF:', error);
    setLoading(false);
  }, []);

  const goToPrevPage = useCallback(() => {
    if (pageNumber > 1) {
      setIsTransitioning(true);
      setTimeout(() => {
        setPageNumber(page => Math.max(1, page - 1));
        setShowFloatingProgress(true);
        setIsTransitioning(false);
      }, 150);
    }
  }, [pageNumber]);

  const goToNextPage = useCallback(() => {
    if (pageNumber < numPages) {
      setIsTransitioning(true);
      setTimeout(() => {
        setPageNumber(page => Math.min(numPages, page + 1));
        setShowFloatingProgress(true);
        setIsTransitioning(false);
      }, 150);
    }
  }, [pageNumber, numPages]);

  const zoomIn = useCallback(() => setScale(scale => Math.min(3, scale + 0.1)), []);
  const zoomOut = useCallback(() => setScale(scale => Math.max(0.5, scale - 0.1)), []);
  const rotate = useCallback(() => setRotation(rotation => (rotation + 90) % 360), []);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      try {
        await document.documentElement.requestFullscreen();
      } catch (err) {
        console.error('Error attempting to enable fullscreen:', err);
      }
    } else {
      try {
        await document.exitFullscreen();
      } catch (err) {
        console.error('Error attempting to exit fullscreen:', err);
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (showFloatingProgress) {
      const timer = setTimeout(() => {
        setShowFloatingProgress(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [showFloatingProgress]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowLeft':
        case 'ArrowUp':
          event.preventDefault();
          goToPrevPage();
          break;
        case 'ArrowRight':
        case 'ArrowDown':
          event.preventDefault();
          goToNextPage();
          break;
        case ' ':
          event.preventDefault();
          goToNextPage();
          break;
        case 'f':
        case 'F':
          event.preventDefault();
          toggleFullscreen();
          break;
        case '+':
        case '=':
          event.preventDefault();
          zoomIn();
          break;
        case '-':
        case '_':
          event.preventDefault();
          zoomOut();
          break;
        case 'Escape':
          if (isFullscreen) {
            event.preventDefault();
            document.exitFullscreen();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [goToPrevPage, goToNextPage, zoomIn, zoomOut, rotate, isFullscreen]);

  const progress = numPages > 0 ? (pageNumber / numPages) * 100 : 0;

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col">
        <FullscreenControls
          pageNumber={pageNumber}
          numPages={numPages}
          progress={progress}
          scale={scale}
          onPrevPage={goToPrevPage}
          onNextPage={goToNextPage}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onRotate={rotate}
          onExitFullscreen={toggleFullscreen}
        />

        <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
          {loading ? (
            <PDFSkeleton />
          ) : (
            <PDFViewer
              pageNumber={pageNumber}
              scale={scale}
              rotation={rotation}
              isTransitioning={isTransitioning}
              loading={false}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background overflow-hidden">
      <div className="h-full pt-20">
        <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-4 h-full flex flex-col">

          <PDFControls
            pageNumber={pageNumber}
            numPages={numPages}
            scale={scale}
            onPrevPage={goToPrevPage}
            onNextPage={goToNextPage}
            onZoomIn={zoomIn}
            onZoomOut={zoomOut}
            onRotate={rotate}
            onFullscreen={toggleFullscreen}
          />

          <div className="flex-1 overflow-auto">
            <PDFViewer
              pageNumber={pageNumber}
              scale={scale}
              rotation={rotation}
              isTransitioning={isTransitioning}
              loading={loading}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
            />
          </div>

        </div>
      </div>

      <FloatingProgressBar
        show={showFloatingProgress && !isFullscreen}
        pageNumber={pageNumber}
        numPages={numPages}
        progress={progress}
      />
    </div>
  );
};

export default PitchDeck;
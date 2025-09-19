import { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { cn } from '@/lib/utils';
import { PDFSkeleton } from './PDFSkeleton';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  pageNumber: number;
  scale: number;
  rotation: number;
  isTransitioning: boolean;
  loading: boolean;
  onLoadSuccess: ({ numPages }: { numPages: number }) => void;
  onLoadError: (error: Error) => void;
}

export const PDFViewer = ({
  pageNumber,
  scale,
  rotation,
  isTransitioning,
  loading,
  onLoadSuccess,
  onLoadError
}: PDFViewerProps) => {
  const [windowWidth, setWindowWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1024);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const maxWidth = windowWidth < 640 ? windowWidth - 32 : undefined;

  return (
    <div className="flex justify-center w-full">
      <div className="relative max-w-full">
        {loading && (
          <div className="absolute inset-0 z-10">
            <PDFSkeleton />
          </div>
        )}

        <div className={cn(
          "shadow-lg rounded-lg overflow-hidden bg-card transition-all duration-150 max-w-full",
          isTransitioning && "blur-sm scale-95 opacity-75",
          loading && "opacity-0"
        )}>
          <Document
            file="/pitchdeck/SomniaForge-PitchDeck.pdf"
            onLoadSuccess={onLoadSuccess}
            onLoadError={onLoadError}
            loading=""
            className="max-w-full"
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              rotate={rotation}
              loading=""
              renderTextLayer={false}
              renderAnnotationLayer={false}
              className="max-w-full h-auto"
              width={maxWidth}
            />
          </Document>
        </div>
      </div>
    </div>
  );
};
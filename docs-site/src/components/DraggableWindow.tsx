import React, { useState, useRef, useEffect } from "react";
import Draggable from "react-draggable";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface DraggableWindowProps {
  id: string;
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  initialPosition?: { x: number; y: number };
  onClose: (id: string) => void;
  zIndex: number;
  onFocus: (id: string) => void;
  sidebarWidth?: number;
}

const DraggableWindow: React.FC<DraggableWindowProps> = ({
  id,
  title,
  icon,
  children,
  initialPosition = { x: 100, y: 100 },
  onClose,
  zIndex,
  onFocus,
  sidebarWidth = 320,
}) => {
  // Window sizes for tablet and larger screens only
  const getInitialSize = () => {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const availableWidth = screenWidth - sidebarWidth - 40; // Account for sidebar + margins

    return {
      width: Math.min(720, availableWidth),
      height: Math.min(520, screenHeight - 150),
    };
  };

  const [size, setSize] = useState(getInitialSize());
  const windowRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);
  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      // Update size if needed on resize
      const newSize = getInitialSize();
      setSize(newSize);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Handle resize functionality
  const handleMouseDown = (e: React.MouseEvent, direction: string) => {
    e.preventDefault();
    e.stopPropagation();

    isResizing.current = true;
    onFocus(id);

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = size.width;
    const startHeight = size.height;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;

      let newWidth = startWidth;
      let newHeight = startHeight;

      if (direction.includes("right")) {
        newWidth = Math.max(
          400, // Minimum width
          startWidth + (e.clientX - startX)
        );
      }
      if (direction.includes("bottom")) {
        newHeight = Math.max(
          300, // Minimum height
          startHeight + (e.clientY - startY)
        );
      }

      setSize({ width: newWidth, height: newHeight });
    };

    const handleMouseUp = () => {
      isResizing.current = false;
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };


  const getDragBounds = () => {
    const actualNavbarHeight = 40;
    const desiredGap = 45;
    const layoutPaddingTop = 80;
    const topOffset = -(layoutPaddingTop - actualNavbarHeight - desiredGap);

    const screenWidth = window.innerWidth;
    const responsiveMargin = screenWidth < 768 ? 5 : screenWidth < 1024 ? 8 : 10;

    return {
      left: 0,
      top: topOffset,
      right: window.innerWidth - sidebarWidth - size.width - responsiveMargin,
      bottom: window.innerHeight - actualNavbarHeight - 60,
    };
  };

  return (
    <Draggable
      handle=".drag-handle"
      defaultPosition={initialPosition}
      onStart={() => onFocus(id)}
      bounds={getDragBounds()}
      nodeRef={windowRef}
    >
      <Card
        ref={windowRef}
        className="absolute glass-effect shadow-window border-border/30 overflow-hidden flex flex-col"
        style={{
          width: size.width,
          height: size.height,
          zIndex,
        }}
        onClick={() => onFocus(id)}
      >
        {/* Window Header */}
        <div className="drag-handle bg-foreground p-3 flex items-center justify-between border-b border-border/20">
          <div className="flex items-center space-x-2">
            {icon && <span className="text-background">{icon}</span>}
            <span className="font-medium text-background text-sm">
              {title}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-background hover:bg-destructive/20"
              onClick={() => onClose(id)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Window Content */}
        <div className="flex-1 overflow-hidden bg-card/95">
          <div className="h-full overflow-auto p-4">
            {children}
          </div>
        </div>

        {/* Resize Handles */}
        {(
          <>
            <div
              className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
              onMouseDown={(e) => handleMouseDown(e, "bottom-right")}
            >
              <div className="absolute bottom-1 right-1 w-2 h-2 border-r-2 border-b-2 border-muted-foreground/50" />
            </div>
            <div
              className="absolute bottom-0 left-0 right-4 h-2 cursor-s-resize"
              onMouseDown={(e) => handleMouseDown(e, "bottom")}
            />
            <div
              className="absolute top-0 bottom-0 right-0 w-2 cursor-e-resize"
              onMouseDown={(e) => handleMouseDown(e, "right")}
            />
          </>
        )}
      </Card>
    </Draggable>
  );
};

export default DraggableWindow;

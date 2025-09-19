import React, { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import WindowedSidebar from "@/components/WindowedSidebar";
import DocumentationSidebar from "@/components/DocumentationSidebar";
import DraggableWindow from "@/components/DraggableWindow";
import DocumentationRenderer from "@/components/DocumentationRenderer";
import MobileWindowedWarning from "@/components/MobileWindowedWarning";
import documentationData from "@/data/documentation.json";
import { Card } from "@/components/ui/card";
import { Monitor } from "lucide-react";
import { useMobileDetection } from "@/hooks/useMobileDetection";

interface DocSection {
  id: string;
  title: string;
  icon: string;
  description: string;
  items: DocItem[];
}

interface DocItem {
  id: string;
  title: string;
  description: string;
  content: any;
  tags: string[];
}

interface WindowData {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
  position: { x: number; y: number };
}

interface DocsLayoutProps {
  sidebarOpen?: boolean;
  setSidebarOpen?: (open: boolean) => void;
}

const DocsLayout: React.FC<DocsLayoutProps> = ({ sidebarOpen: propSidebarOpen, setSidebarOpen: propSetSidebarOpen }) => {
  const location = useLocation();
  const isWindowedMode = location.pathname.includes('windowed');
  const { isMobile, isAndroid } = useMobileDetection();

  // Shared state
  const [searchQuery, setSearchQuery] = useState("");
  const [localSidebarOpen, setLocalSidebarOpen] = useState(true);
  
  // Use props if provided, otherwise use local state
  const sidebarOpen = propSidebarOpen !== undefined ? propSidebarOpen : localSidebarOpen;
  const setSidebarOpen = propSetSidebarOpen || setLocalSidebarOpen;

  // Documentation mode state
  const [selectedSection, setSelectedSection] = useState("getting-started");
  const [selectedItem, setSelectedItem] = useState("quick-start");

  // Windowed mode state
  const [openWindows, setOpenWindows] = useState<WindowData[]>([]);
  const [windowCounter, setWindowCounter] = useState(0);
  const [focusedWindow, setFocusedWindow] = useState<string | null>(null);
  const [selectedWindowItem, setSelectedWindowItem] = useState<string | null>(null);

  // Show mobile warning for windowed mode
  if (isWindowedMode && isMobile) {
    return <MobileWindowedWarning isAndroid={isAndroid} />;
  }

  const docSections: DocSection[] = documentationData.sections as DocSection[];
  const sidebarWidth = 320;

  const filteredSections = searchQuery
    ? docSections.map(section => ({
        ...section,
        items: section.items.filter(item =>
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
        ),
      })).filter(section => section.items.length > 0)
    : docSections;

  const handleSectionItemClick = (sectionId: string, itemId?: string) => {
    setSelectedSection(sectionId);

    if (itemId) {
      setSelectedItem(itemId);
    } else {
      const section = docSections.find(s => s.id === sectionId);
      if (section && section.items.length > 0) {
        setSelectedItem(section.items[0].id);
      }
    }
  };

  const renderSectionIcon = (iconName: string) => {
    return <Monitor className="h-4 w-4" />;
  };

  const openDocumentWindow = (section: DocSection, item: DocItem) => {
    const itemKey = `${section.id}-${item.id}`;
    const existingWindow = openWindows.find(w => w.id === itemKey);

    setSelectedWindowItem(itemKey);

    if (existingWindow) {
      handleFocusWindow(existingWindow.id);
      return;
    }

    const newWindow: WindowData = {
      id: itemKey,
      title: item.title,
      icon: renderSectionIcon(section.icon),
      content: <DocumentationRenderer content={item.content} />,
      position: {
        x: 150 + (windowCounter * 30),
        y: 120 + (windowCounter * 30),
      },
    };

    setOpenWindows([...openWindows, newWindow]);
    setWindowCounter(windowCounter + 1);
    setFocusedWindow(newWindow.id);
  };

  const closeWindow = (windowId: string) => {
    setOpenWindows(openWindows.filter(w => w.id !== windowId));

    if (selectedWindowItem === windowId) {
      setSelectedWindowItem(null);
    }

    if (focusedWindow === windowId) {
      const remainingWindows = openWindows.filter(w => w.id !== windowId);
      setFocusedWindow(
        remainingWindows.length > 0 ? remainingWindows[remainingWindows.length - 1].id : null
      );
    }
  };

  const handleFocusWindow = (windowId: string) => {
    setFocusedWindow(windowId);
  };

  const getWindowZIndex = (windowId: string) => {
    if (windowId === focusedWindow) {
      return 1000 + openWindows.length;
    }
    const index = openWindows.findIndex(w => w.id === windowId);
    return 1000 + index;
  };

  return (
    <div className={`min-h-screen bg-background pt-[3.5rem] ${isWindowedMode ? 'relative' : ''}`}>
      <div className="flex">
        {isWindowedMode ? (
          <WindowedSidebar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedItem={selectedWindowItem}
            openWindows={openWindows}
            focusedWindow={focusedWindow}
            filteredSections={filteredSections}
            onOpenDocumentWindow={openDocumentWindow}
            onFocusWindow={handleFocusWindow}
            onCloseWindow={closeWindow}
          />
        ) : (
          <DocumentationSidebar
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedSection={selectedSection}
            selectedItem={selectedItem}
            filteredSections={filteredSections}
            onSectionItemClick={handleSectionItemClick}
          />
        )}

        <main className="flex-1 min-w-0 relative">
          {isWindowedMode ? (
            <>
              {openWindows.length === 0 && (
                <div className="flex items-center justify-center h-[calc(100vh-200px)]">
                  <Card className="professional-card p-8 text-center max-w-md">
                    <Monitor className="h-12 w-12 text-foreground-tertiary mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      Desktop-Style Documentation
                    </h3>
                    <p className="text-foreground-secondary mb-4">
                      Click any documentation item from the sidebar to open it in a draggable window.
                      Experience documentation like a desktop application!
                    </p>
                    <div className="flex flex-col space-y-2 text-sm text-foreground-tertiary">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-brand-primary rounded-full"></div>
                        Drag windows by their title bar
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-brand-secondary rounded-full"></div>
                        Resize from corners and edges
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-brand-accent rounded-full"></div>
                        Multiple windows can be open simultaneously
                      </div>
                    </div>
                  </Card>
                </div>
              )}

              {openWindows.map((window) => (
                <DraggableWindow
                  key={window.id}
                  id={window.id}
                  title={window.title}
                  icon={window.icon}
                  initialPosition={window.position}
                  onClose={closeWindow}
                  onFocus={handleFocusWindow}
                  zIndex={getWindowZIndex(window.id)}
                  sidebarWidth={sidebarWidth}
                >
                  {window.content}
                </DraggableWindow>
              ))}
            </>
          ) : (
            <Outlet context={{
              selectedSection,
              selectedItem,
              filteredSections,
              docSections,
              onInternalLinkClick: handleSectionItemClick
            }} />
          )}
        </main>
      </div>

    </div>
  );
};

export default DocsLayout;
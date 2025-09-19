import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  X,
  Monitor,
  FileText,
  Play,
  Code2,
  Database,
  Gamepad2,
} from "lucide-react";

const sectionIconMap = {
  Play,
  Code2,
  Database,
  Gamepad2,
};

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

interface WindowedSidebarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedItem: string | null;
  openWindows: WindowData[];
  focusedWindow: string | null;
  filteredSections: DocSection[];
  onOpenDocumentWindow: (section: DocSection, item: DocItem) => void;
  onFocusWindow: (windowId: string) => void;
  onCloseWindow: (windowId: string) => void;
}

const WindowedSidebar: React.FC<WindowedSidebarProps> = ({
  searchQuery,
  setSearchQuery,
  selectedItem,
  openWindows,
  focusedWindow,
  filteredSections,
  onOpenDocumentWindow,
  onFocusWindow,
  onCloseWindow,
}) => {
  const renderSectionIcon = (iconName: string) => {
    const IconComponent = sectionIconMap[iconName as keyof typeof sectionIconMap];
    return IconComponent ? <IconComponent className="h-4 w-4" /> : <FileText className="h-4 w-4" />;
  };

  return (
    <aside className="w-80 h-[calc(100vh-80px)] bg-surface border-r border-border">
      <div className="p-6 h-full flex flex-col">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-foreground-tertiary" />
          <Input
            placeholder="Search documentation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-background-secondary border-border-secondary"
          />
        </div>

        <ScrollArea className="flex-1 min-h-0">
          <nav className="space-y-6">
            {filteredSections.map((section) => (
              <div key={section.id}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="text-foreground">{renderSectionIcon(section.icon)}</div>
                  <h3 className="font-semibold text-foreground">{section.title}</h3>
                </div>
                <div className="space-y-1 ml-7">
                  {section.items.map((item) => {
                    const itemKey = `${section.id}-${item.id}`;
                    const isSelected = selectedItem === itemKey;

                    return (
                      <button
                        key={item.id}
                        onClick={() => onOpenDocumentWindow(section, item)}
                        className={`w-full text-left p-2 rounded-md text-sm transition-colors ${
                          isSelected
                            ? "bg-background-hover border-l-2 border-brand-primary text-foreground"
                            : "text-foreground-secondary hover:text-foreground hover:bg-background-hover"
                        }`}
                      >
                        <div className="font-medium">{item.title}</div>
                        <div className="text-xs text-foreground-tertiary">
                          {item.description}
                        </div>
                        <div className="flex gap-1 mt-1">
                          {item.tags.slice(0, 2).map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="text-xs py-0 px-1 h-4"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </ScrollArea>

        {openWindows.length > 0 && (
          <div className="mt-6 pt-6 border-t border-border flex-shrink-0">
            <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              Open Windows ({openWindows.length})
            </h4>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {openWindows.map((window) => (
                <div
                  key={window.id}
                  className={`flex items-center justify-between p-2 rounded text-sm ${
                    focusedWindow === window.id
                      ? 'bg-brand-primary/10 text-brand-primary'
                      : 'text-foreground-secondary hover:bg-background-hover'
                  }`}
                >
                  <button
                    onClick={() => onFocusWindow(window.id)}
                    className="flex items-center gap-2 flex-1 text-left"
                  >
                    {window.icon}
                    <span className="truncate">{window.title}</span>
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => onCloseWindow(window.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default WindowedSidebar;
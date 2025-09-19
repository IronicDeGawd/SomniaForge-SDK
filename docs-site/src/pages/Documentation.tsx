import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Book } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import DocumentationRenderer from "@/components/DocumentationRenderer";

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

interface OutletContext {
  selectedSection: string;
  selectedItem: string;
  filteredSections: DocSection[];
  docSections: DocSection[];
  onInternalLinkClick: (sectionId: string, itemId?: string) => void;
}

const Documentation = () => {
  const { selectedSection, selectedItem, docSections, onInternalLinkClick } = useOutletContext<OutletContext>();

  const currentSection = docSections.find(s => s.id === selectedSection);
  const currentItem = currentSection?.items.find(i => i.id === selectedItem);

  // Create a flat list of all items with section context for navigation
  const allItems = docSections.flatMap(section =>
    section.items.map(item => ({
      ...item,
      sectionId: section.id,
      sectionTitle: section.title
    }))
  );

  const currentItemIndex = allItems.findIndex(
    item => item.sectionId === selectedSection && item.id === selectedItem
  );

  const previousItem = currentItemIndex > 0 ? allItems[currentItemIndex - 1] : null;
  const nextItem = currentItemIndex < allItems.length - 1 ? allItems[currentItemIndex + 1] : null;

  const handlePrevious = () => {
    if (previousItem) {
      onInternalLinkClick(previousItem.sectionId, previousItem.id);
    }
  };

  const handleNext = () => {
    if (nextItem) {
      onInternalLinkClick(nextItem.sectionId, nextItem.id);
    }
  };

  return (
    <div className="container mx-auto px-6 py-8 max-w-4xl">
      {currentItem ? (
        <div>
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-foreground-secondary mb-6">
            <span>Documentation</span>
            <span>/</span>
            <span>{currentSection?.title}</span>
            <span>/</span>
            <span className="text-foreground">{currentItem.title}</span>
          </nav>

          {/* Content */}
          <div className="prose prose-neutral max-w-none">
            <DocumentationRenderer
              content={currentItem.content}
              onInternalLinkClick={onInternalLinkClick}
            />
          </div>

          {/* Footer Navigation */}
          <div className="mt-12 pt-8 border-t border-border">
            <div className="flex justify-between items-center">
              {previousItem ? (
                <Button
                  variant="outline"
                  className="btn-secondary"
                  onClick={handlePrevious}
                >
                  <ArrowRight className="mr-2 h-4 w-4 rotate-180" />
                  <div className="text-left">
                    <div className="text-xs text-gray-500">Previous</div>
                    <div>{previousItem.title}</div>
                  </div>
                </Button>
              ) : (
                <div></div>
              )}

              {nextItem ? (
                <Button
                  variant="outline"
                  className="btn-secondary"
                  onClick={handleNext}
                >
                  <div className="text-right">
                    <div className="text-xs text-gray-500">Next</div>
                    <div>{nextItem.title}</div>
                  </div>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <div></div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <Book className="h-12 w-12 text-foreground-tertiary mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">
            No documentation found
          </h3>
          <p className="text-foreground-secondary">
            Try adjusting your search query or browse the sections.
          </p>
        </div>
      )}
    </div>
  );
};

export default Documentation;
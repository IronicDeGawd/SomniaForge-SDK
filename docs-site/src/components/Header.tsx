import { NavLink, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Gamepad2, Monitor, Menu, X, FileText, Home, BookOpen, AlignJustify } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { useMobileDetection } from "@/hooks/useMobileDetection";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  sidebarOpen?: boolean;
  setSidebarOpen?: (open: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const { isMobile } = useMobileDetection();
  const location = useLocation();

  const isDocsPage = location.pathname.includes('/docs') || location.pathname.includes('/windowed');
  const showMobileMenu = isMobile && isDocsPage;
  
  return (
    <header className="fixed top-0 w-full z-50 glass-effect border-b">
      <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between w-full max-w-full overflow-hidden">
        <div className="flex items-center space-x-2 sm:space-x-3">
          {isMobile && (
            <div className="md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9 transition-colors hover:bg-accent hover:text-accent-foreground">
                    <AlignJustify className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48 glass-effect border">
                  <DropdownMenuItem asChild>
                    <NavLink to="/" className="w-full flex items-center gap-2 hover:bg-brand-deep/10">
                      <Home className="h-4 w-4 text-brand-deep" />
                      <span className="text-brand-deep">Home</span>
                    </NavLink>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <NavLink to="/docs" className="w-full flex items-center gap-2 hover:bg-brand-secondary/10">
                      <BookOpen className="h-4 w-4 text-brand-secondary" />
                      <span className="text-brand-secondary">Documentation</span>
                    </NavLink>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <NavLink to="/demo" className="w-full flex items-center gap-2 hover:bg-brand-purple/10">
                      <Gamepad2 className="h-4 w-4 text-brand-purple" />
                      <span className="text-brand-purple">Demo</span>
                    </NavLink>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <NavLink to="/pitchdeck" className="w-full flex items-center gap-2 hover:bg-brand-primary/10">
                      <FileText className="h-4 w-4 text-brand-primary" />
                      <span className="text-brand-primary">Pitch Deck</span>
                    </NavLink>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          <NavLink to="/" className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-shrink hover:opacity-80 transition-opacity">
            <img
              src="/logo-transparent-noname.png"
              alt="SomniaForge"
              className="h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0"
            />
            <span className="text-sm sm:text-display-sm brand-gradient truncate">SomniaForge</span>
            <span className="text-xs sm:text-label-lg text-muted-foreground hidden xs:inline">SDK</span>
          </NavLink>
        </div>

        <nav className="hidden md:flex items-center space-x-8">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `text-body-md font-medium transition-all duration-200 px-3 py-2 rounded-md ${
                isActive
                  ? 'text-brand-deep bg-brand-deep/10'
                  : 'text-muted-foreground hover:text-brand-deep hover:bg-brand-deep/5'
              }`
            }
          >
            Home
          </NavLink>
          <NavLink
            to="/docs"
            className={({ isActive }) =>
              `text-body-md font-medium transition-all duration-200 px-3 py-2 rounded-md ${
                isActive
                  ? 'text-brand-secondary bg-brand-secondary/10'
                  : 'text-muted-foreground hover:text-brand-secondary hover:bg-brand-secondary/5'
              }`
            }
          >
            Documentation
          </NavLink>
          {!isMobile && (
            <NavLink
              to="/windowed-docs"
              className={({ isActive }) =>
                `text-body-md font-medium transition-all duration-200 px-3 py-2 rounded-md flex items-center gap-1 ${
                  isActive
                    ? 'text-brand-accent bg-brand-accent/10'
                    : 'text-muted-foreground hover:text-brand-accent hover:bg-brand-accent/5'
                }`
              }
            >
              <Monitor className="h-4 w-4" />
              Windowed
            </NavLink>
          )}
          <NavLink
            to="/demo"
            className={({ isActive }) =>
              `text-body-md font-medium transition-all duration-200 px-3 py-2 rounded-md ${
                isActive
                  ? 'text-brand-purple bg-brand-purple/10'
                  : 'text-muted-foreground hover:text-brand-purple hover:bg-brand-purple/5'
              }`
            }
          >
            Demo
          </NavLink>
          <NavLink
            to="/pitchdeck"
            className={({ isActive }) =>
              `text-body-md font-medium transition-all duration-200 px-3 py-2 rounded-md flex items-center gap-1 ${
                isActive
                  ? 'text-brand-deep bg-brand-deep/10'
                  : 'text-muted-foreground hover:text-brand-deep hover:bg-brand-deep/5'
              }`
            }
          >
            <FileText className="h-4 w-4" />
            Pitch Deck
          </NavLink>
        </nav>

        <div className="flex items-center space-x-1 sm:space-x-3 flex-shrink-0">
          <ThemeToggle />
          {showMobileMenu ? (
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSidebarOpen?.(!sidebarOpen)}
              className={`lg:hidden transition-colors hover:bg-accent hover:text-accent-foreground ${sidebarOpen ? 'bg-accent/50 border-accent' : ''}`}
            >
              <BookOpen className="h-4 w-4" />
              <span className="sr-only">{sidebarOpen ? 'Close sidebar' : 'Open sidebar'}</span>
            </Button>
          ) : (
            <NavLink to="/docs">
              <Button className="btn-brand-primary text-xs sm:text-base px-2 sm:px-4 py-1 sm:py-2">
                <span className="hidden sm:inline">Get Started</span>
                <span className="sm:hidden">Start</span>
              </Button>
            </NavLink>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
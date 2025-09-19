import { NavLink, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Gamepad2, Monitor, Menu, X } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { useMobileDetection } from "@/hooks/useMobileDetection";

interface HeaderProps {
  sidebarOpen?: boolean;
  setSidebarOpen?: (open: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const { isMobile } = useMobileDetection();
  const location = useLocation();
  
  const isDocsPage = location.pathname.includes('/docs') || location.pathname.includes('/windowed');
  const showMobileMenu = isMobile && isDocsPage && setSidebarOpen;
  
  return (
    <header className="fixed top-0 w-full z-50 glass-effect border-b border-border/50">
      <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between w-full max-w-full overflow-hidden">
        <NavLink to="/" className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-shrink hover:opacity-80 transition-opacity">
          <img
            src="/logo-transparent-noname.png"
            alt="SomniaForge"
            className="h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0"
          />
          <span className="text-sm sm:text-display-sm brand-gradient truncate">SomniaForge</span>
          <span className="text-xs sm:text-label-lg text-muted-foreground hidden xs:inline">SDK</span>
        </NavLink>

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
        </nav>

        <div className="flex items-center space-x-1 sm:space-x-3 flex-shrink-0">
          <ThemeToggle />
          {showMobileMenu ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen?.(!sidebarOpen)}
              className="lg:hidden flex items-center gap-1 px-2 sm:px-3"
            >
              {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              <span className="text-xs hidden sm:inline">{sidebarOpen ? 'Close' : 'Menu'}</span>
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
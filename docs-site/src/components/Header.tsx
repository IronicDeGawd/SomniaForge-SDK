import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Gamepad2, Monitor } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

const Header = () => {
  return (
    <header className="fixed top-0 w-full z-50 glass-effect border-b border-border/50">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <img
            src="/logo-transparent-noname.png"
            alt="SomniaForge"
            className="h-8 w-8"
          />
          <span className="text-display-sm brand-gradient">SomniaForge</span>
          <span className="text-label-lg text-muted-foreground">SDK</span>
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

        <div className="flex items-center space-x-3">
          <ThemeToggle />
          <Button className="btn-brand-primary">
            Get Started
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
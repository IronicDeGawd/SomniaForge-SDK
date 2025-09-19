import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Monitor, Smartphone, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MobileWindowedWarningProps {
  isAndroid?: boolean;
}

const MobileWindowedWarning: React.FC<MobileWindowedWarningProps> = ({ isAndroid = false }) => {
  const navigate = useNavigate();

  const handleGoToDocs = () => {
    navigate('/docs');
  };

  return (
    <div className="min-h-screen bg-background pt-20 flex items-center justify-center px-4">
      <Card className="professional-card p-8 text-center max-w-md w-full">
        <div className="flex justify-center items-center gap-3 mb-6">
          <Smartphone className="h-8 w-8 text-brand-secondary" />
          <Monitor className="h-8 w-8 text-foreground-tertiary opacity-50" />
        </div>
        
        <h2 className="text-2xl font-bold text-foreground mb-4">
          Desktop Mode Only
        </h2>
        
        <p className="text-foreground-secondary mb-6 leading-relaxed">
          The windowed documentation mode is designed for desktop experiences and is not available on mobile devices.
          {isAndroid && " We've detected you're using an Android device."}
        </p>
        
        <div className="bg-background-secondary rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            Desktop Features
          </h3>
          <ul className="text-sm text-foreground-secondary space-y-1 text-left">
            <li>• Draggable documentation windows</li>
            <li>• Multi-window support</li>
            <li>• Resizable content areas</li>
            <li>• Desktop-style interactions</li>
          </ul>
        </div>
        
        <Button 
          onClick={handleGoToDocs}
          className="btn-brand-primary w-full flex items-center justify-center gap-2"
        >
          View Mobile Documentation
          <ArrowRight className="h-4 w-4" />
        </Button>
        
        <p className="text-xs text-foreground-tertiary mt-4">
          Access this page from a desktop computer to experience the windowed mode.
        </p>
      </Card>
    </div>
  );
};

export default MobileWindowedWarning;

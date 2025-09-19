import { Card } from "@/components/ui/card";

export default function Tools() {
  return (
    <div className="min-h-screen py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold font-geist mb-4 brand-gradient">
            Developer Tools
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Essential tools for building with SomniaForge SDK
          </p>
        </div>

        <div className="desktop-grid">
          <Card className="p-6 hover-lift">
            <h3 className="text-xl font-semibold mb-3">Contract Registry</h3>
            <p className="text-muted-foreground">
              Deployed contract addresses and verification status
            </p>
          </Card>

          <Card className="p-6 hover-lift">
            <h3 className="text-xl font-semibold mb-3">Gas Calculator</h3>
            <p className="text-muted-foreground">
              Estimate transaction costs on Somnia Network
            </p>
          </Card>

          <Card className="p-6 hover-lift">
            <h3 className="text-xl font-semibold mb-3">Network Monitor</h3>
            <p className="text-muted-foreground">
              Real-time network status and performance metrics
            </p>
          </Card>

          <Card className="p-6 hover-lift">
            <h3 className="text-xl font-semibold mb-3">Code Generator</h3>
            <p className="text-muted-foreground">
              Generate boilerplate code for common patterns
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
import { Card } from "@/components/ui/card";

export default function Showcase() {
  return (
    <div className="min-h-screen py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold font-geist mb-4 brand-gradient">
            Showcase
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Games and applications built with SomniaForge SDK
          </p>
        </div>

        <div className="desktop-grid">
          <Card className="p-6 hover-lift">
            <h3 className="text-xl font-semibold mb-3">Rock Paper Scissors</h3>
            <p className="text-muted-foreground mb-4">
              Real-time multiplayer game demonstrating WebSocket integration
            </p>
            <div className="flex gap-2">
              <span className="px-2 py-1 bg-brand-primary/10 text-brand-primary text-sm rounded">Demo</span>
              <span className="px-2 py-1 bg-success/10 text-success text-sm rounded">Live</span>
            </div>
          </Card>

          <Card className="p-6 hover-lift">
            <h3 className="text-xl font-semibold mb-3">Community Games</h3>
            <p className="text-muted-foreground mb-4">
              Discover games built by the community
            </p>
            <div className="flex gap-2">
              <span className="px-2 py-1 bg-muted text-muted-foreground text-sm rounded">Coming Soon</span>
            </div>
          </Card>

          <Card className="p-6 hover-lift">
            <h3 className="text-xl font-semibold mb-3">Performance Benchmarks</h3>
            <p className="text-muted-foreground mb-4">
              See how SomniaForge SDK performs in production
            </p>
            <div className="flex gap-2">
              <span className="px-2 py-1 bg-brand-accent/10 text-brand-accent text-sm rounded">Metrics</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
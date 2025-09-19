import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  ExternalLink,
  Gamepad2,
  Clock,
  Users,
  Zap,
  Code2,
  ChevronRight,
  Timer,
  Activity,
} from "lucide-react";

const Demo = () => {
  const projects = [
    {
      id: "rock-paper-scissors",
      title: "Rock Paper Scissors",
      description: "Real-time multiplayer Rock Paper Scissors with WebSocket events and commit-reveal mechanics for fair play.",
      status: "live",
      tags: ["Multiplayer", "Real-time", "WebSocket"],
      features: ["Sub-second transactions", "Fair play mechanics", "Live event updates"],
      githubUrl: "https://github.com/IronicDeGawd/SomniaForge-SDK/tree/main/apps/rock-paper-scissors",
      demoUrl: "https://rockpaperscissors.somniaforge.com",
      thumbnail: "/api/placeholder/400/240",
      tech: ["React", "Viem", "Somnia Network"],
      lastUpdated: "2 days ago"
    },
    {
      id: "turn-based-strategy",
      title: "Turn-Based Strategy",
      description: "Strategic board game with complex game state management and player turn coordination.",
      status: "coming-soon",
      tags: ["Strategy", "Turn-based", "Complex"],
      features: ["Strategic gameplay", "State management", "Player coordination"],
      estimatedLaunch: "Q2 2024",
      tech: ["React", "Viem", "Smart Contracts"],
    },
    {
      id: "realtime-racing",
      title: "Real-time Racing",
      description: "Fast-paced racing game showcasing ultra-low latency capabilities of Somnia Network.",
      status: "coming-soon",
      tags: ["Racing", "Real-time", "High-speed"],
      features: ["Ultra-low latency", "Real-time physics", "Multiplayer racing"],
      estimatedLaunch: "Q3 2024",
      tech: ["React", "WebGL", "Somnia Network"],
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "live":
        return <Badge className="bg-success/10 text-success border-success/20">Live</Badge>;
      case "coming-soon":
        return <Badge variant="outline" className="text-foreground-secondary">Coming Soon</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background pt-20">
      {/* Hero Section */}
      <section className="py-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 via-brand-secondary/5 to-brand-accent/5"></div>
        <div className="container mx-auto relative z-10">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Gamepad2 className="h-8 w-8 text-brand-primary" />
              <Badge variant="outline" className="bg-brand-primary/10 text-brand-primary border-brand-primary/20">
                <Activity className="h-3 w-3 mr-1" />
                Interactive Demos
              </Badge>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold font-geist text-foreground leading-tight mb-6">
              Experience <span className="brand-gradient">SomniaForge</span>
              <br />
              In Action
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
              Explore real Somnia Network games built with SomniaForge SDK.
              See the power of sub-second transactions and real-time gameplay.
            </p>
          </div>
        </div>
      </section>

      {/* Projects Grid */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {projects.map((project) => (
              <Card key={project.id} className="professional-card overflow-hidden hover-lift">
                {/* Project Header */}
                <div className="p-6 border-b border-border">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-foreground text-background p-2 rounded-lg">
                        <Gamepad2 className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-foreground">{project.title}</h3>
                        {project.lastUpdated && (
                          <div className="flex items-center gap-1 text-xs text-foreground-tertiary">
                            <Timer className="h-3 w-3" />
                            Updated {project.lastUpdated}
                          </div>
                        )}
                      </div>
                    </div>
                    {getStatusBadge(project.status)}
                  </div>

                  <p className="text-foreground-secondary mb-4">{project.description}</p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Features */}
                <div className="p-6 border-b border-border">
                  <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Key Features
                  </h4>
                  <div className="space-y-2">
                    {project.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-foreground-secondary">
                        <div className="w-1.5 h-1.5 bg-brand-primary rounded-full"></div>
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tech Stack & Actions */}
                <div className="p-6">
                  <div className="mb-4">
                    <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                      <Code2 className="h-4 w-4" />
                      Technology
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {project.tech.map((tech) => (
                        <Badge key={tech} variant="outline" className="text-xs py-0 px-2 h-5">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  {project.status === "live" ? (
                    <div className="flex gap-2">
                      <a href={project.demoUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
                        <Button className="btn-primary w-full">
                          <Play className="mr-2 h-4 w-4" />
                          Play Demo
                        </Button>
                      </a>
                      {project.githubUrl && (
                        <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="icon" className="btn-secondary">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </a>
                      )}
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 text-sm text-foreground-secondary mb-3">
                        <Clock className="h-4 w-4" />
                        {project.estimatedLaunch && `Expected ${project.estimatedLaunch}`}
                      </div>
                      <Button variant="outline" className="btn-secondary" disabled>
                        Coming Soon
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="container mx-auto">
          <Card className="professional-card p-8 max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold font-geist mb-4 text-foreground">
              Build Your Own Game
            </h2>
            <p className="text-xl text-foreground-secondary mb-8">
              Ready to create the next breakthrough Somnia Network game? Start with SomniaForge SDK.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/docs">
                <Button className="btn-primary">
                  <Code2 className="mr-2 h-5 w-5" />
                  Start Building
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </a>
              <a href="/docs">
                <Button variant="outline" className="btn-secondary">
                  <ExternalLink className="mr-2 h-5 w-5" />
                  View Documentation
                </Button>
              </a>
            </div>

            <div className="mt-8 pt-8 border-t border-border">
              <div className="flex items-center justify-center gap-6 text-sm text-foreground-secondary">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Join Developer Community
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Real-time Support
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Demo;
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Code,
  Gamepad2,
  Zap,
  Globe,
  Play,
  Copy,
  ExternalLink,
  CheckCircle,
  Users,
  MessageCircle,
  GitBranch,
  Wallet,
  Network,
  Timer,
  Blocks,
  Activity,
  Rocket,
  Shield,
  Smartphone,
  FileText,
  Monitor,
} from "lucide-react";
import { Link } from "react-router-dom";

const Landing = () => {
  const features = [
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Sub-second Transactions",
      description: "Experience lightning-fast gameplay with Somnia's 1M+ TPS capability"
    },
    {
      icon: <Code className="h-6 w-6" />,
      title: "Zero Configuration",
      description: "Get started with one line of code - no complex setup required"
    },
    {
      icon: <Network className="h-6 w-6" />,
      title: "WebSocket Integration",
      description: "Real-time game events with built-in WebSocket support"
    },
    {
      icon: <Wallet className="h-6 w-6" />,
      title: "Ultra-low Costs",
      description: "Leverage Somnia's efficiency for cost-effective gaming"
    },
    {
      icon: <Gamepad2 className="h-6 w-6" />,
      title: "Complete Examples",
      description: "Ready-to-deploy games including Rock Paper Scissors"
    },
    {
      icon: <Smartphone className="h-6 w-6" />,
      title: "Cross-platform",
      description: "Works seamlessly on web, mobile, and desktop"
    }
  ];

  const stats = [
    { label: "Transaction Speed", value: "<1s" },
    { label: "Network TPS", value: "1M+" },
    { label: "Examples Ready", value: "3+" }
  ];

  const quickStartCode = `import { SomniaForgeSDK } from '@somniaforge/sdk';

const sdk = new SomniaForgeSDK();
const gameSession = await sdk.createGameSession();

`;

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 via-brand-secondary/5 to-brand-accent/5"></div>
        <div className="container mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column */}
            <div className="space-y-8">
              <div className="flex items-center gap-3 mb-6">
                <img
                  src="/logo-transparent-noname.png"
                  alt="SomniaForge"
                  className="h-12 w-12"
                />
                <Badge variant="outline" className="bg-brand-secondary/10 text-brand-secondary border-brand-secondary/20">
                  <Activity className="h-3 w-3 mr-1" />
                  Real-time Gaming SDK
                </Badge>
              </div>

              <h1 className="text-display-lg md:text-display-xl text-foreground">
                Build <span className="brand-gradient">Real-time</span>
                <br />
                Somnia Network Games
              </h1>

              <p className="text-body-lg md:text-heading-lg text-muted-foreground">
                Create instant Somnia Network games with SomniaForge SDK.
                Zero-config setup, WebSocket events, and ultra-low transaction costs on Somnia Network.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="btn-brand-primary"
                >
                  Start Building Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>

                <div className="flex gap-2">
                  <Link to="/docs">
                    <Button variant="outline" size="lg" className="btn-secondary">
                      <FileText className="mr-2 h-5 w-5" />
                      Documentation
                    </Button>
                  </Link>
                  <Link to="/windowed-docs">
                    <Button variant="outline" size="lg" className="btn-secondary">
                      <Monitor className="mr-2 h-5 w-5" />
                      Windowed
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Quick Start Preview */}
              <Card className="p-4 glass-effect">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-label-lg flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    Quick Start
                  </span>
                  <Button size="sm" variant="ghost">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <pre className="text-code-md text-muted-foreground overflow-x-auto">
                  npm install @somniaforge/sdk
                </pre>
              </Card>
            </div>

            {/* Right Column - Stats & Demo */}
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4">
                {stats.map((stat, index) => (
                  <Card key={index} className="professional-card p-4 text-center hover-lift">
                    <div className="text-2xl font-bold text-foreground mb-1">
                      {stat.value}
                    </div>
                    <div className="text-xs text-foreground-secondary">
                      {stat.label}
                    </div>
                  </Card>
                ))}
              </div>

              {/* Live Demo Card */}
              <Card className="professional-card p-6 hover-lift">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-semibold flex items-center gap-2 text-foreground">
                    <Play className="h-5 w-5" />
                    Rock Paper Scissors Demo
                  </span>
                  <Badge className="bg-success/10 text-success border-success/20">
                    Live
                  </Badge>
                </div>
                <p className="text-foreground-secondary mb-4">
                  Experience real-time multiplayer gaming with WebSocket events
                </p>
                <Link to="/demo">
                  <Button variant="outline" className="w-full btn-outline-brand">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Try Demo
                  </Button>
                </Link>
              </Card>

              {/* Network Status */}
              <Card className="professional-card p-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2 text-foreground">
                  <Blocks className="h-4 w-4" />
                  Somnia Network Status
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="flex items-center gap-2 text-foreground-secondary">
                      <div className="h-2 w-2 bg-success rounded-full"></div>
                      Network Status
                    </span>
                    <span className="text-success">Online</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-foreground-secondary">Chain ID</span>
                    <span className="font-mono text-foreground">50312</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-foreground-secondary">Block Time</span>
                    <span className="text-foreground">~1s</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold font-geist mb-4 text-foreground">
              Why Choose SomniaForge?
            </h2>
            <p className="text-body-lg text-muted-foreground max-w-3xl mx-auto">
              Everything you need to build real-time Somnia Network games
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <Card key={index} className="professional-card p-6 hover-lift">
                <div className="bg-foreground text-background p-3 rounded-xl w-fit mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-heading-lg mb-3 text-foreground">{feature.title}</h3>
                <p className="text-body-md text-foreground-secondary">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Code Example Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold font-geist mb-4 text-foreground">
              Get Started in Minutes
            </h2>
            <p className="text-xl text-muted-foreground">
              Three simple steps to your first Somnia Network game
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Code Example */}
            <Card className="professional-card p-6 professional-shadow">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <GitBranch className="h-5 w-5 text-foreground-secondary" />
                  <span className="font-mono text-sm text-foreground-secondary">
                    quickstart.ts
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="btn-secondary">
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </Button>
                  <Button size="sm" className="btn-primary">
                    <Play className="mr-2 h-4 w-4" />
                    Run
                  </Button>
                </div>
              </div>

              <pre className="code-block overflow-x-auto">
                {quickStartCode}
              </pre>
            </Card>

            {/* Steps */}
            <div className="space-y-6">
              <Card className="professional-card p-6">
                <div className="flex items-start gap-4">
                  <div className="bg-foreground text-background w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2 text-foreground">Install SDK</h3>
                    <p className="text-foreground-secondary text-sm">
                      Add SomniaForge SDK to your project with npm
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="professional-card p-6">
                <div className="flex items-start gap-4">
                  <div className="bg-foreground text-background w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2 text-foreground">Initialize SDK</h3>
                    <p className="text-foreground-secondary text-sm">
                      Create a new SomniaForge SDK instance
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="professional-card p-6">
                <div className="flex items-start gap-4">
                  <div className="bg-foreground text-background w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2 text-foreground">Create Game</h3>
                    <p className="text-foreground-secondary text-sm">
                      Build your first real-time Somnia Network game
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-brand-primary/10 via-brand-secondary/5 to-brand-accent/10 relative overflow-hidden">
        <div className="container mx-auto relative z-10">
          <Card className="professional-card p-8 professional-shadow max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-4xl md:text-5xl font-bold font-geist mb-4 text-foreground">
                Ready to Build?
              </h2>
              <p className="text-xl text-foreground-secondary">
                Join developers building the future of Somnia Network gaming
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              <Card className="professional-card p-6 text-center">
                <Link to="/docs">
                  <Button
                    size="lg"
                    className="btn-primary w-full mb-4"
                  >
                    <FileText className="mr-2 h-5 w-5" />
                    Read Documentation
                  </Button>
                </Link>
                <div className="flex items-center justify-center gap-2 text-sm text-foreground-secondary">
                  <Code className="h-4 w-4" />
                  Complete API reference & guides
                </div>
              </Card>

              <Card className="professional-card p-6 text-center">
                <Link to="/demo">
                  <Button variant="outline" size="lg" className="w-full mb-4 btn-outline-brand">
                    <ExternalLink className="mr-2 h-5 w-5" />
                    Try Live Demo
                  </Button>
                </Link>
                <div className="flex items-center justify-center gap-2 text-sm text-foreground-secondary">
                  <Globe className="h-4 w-4" />
                  Interactive Rock Paper Scissors
                </div>
              </Card>
            </div>

            {/* Community Section */}
            <div className="mt-8 text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Users className="h-5 w-5" />
                <span className="font-semibold">Join the SomniaForge Community</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Connect with developers building real-time Somnia Network games
              </p>
              <div className="flex gap-2 justify-center">
                <Button size="sm" variant="outline">
                  <MessageCircle className="mr-1 h-4 w-4" />
                  Discord
                </Button>
                <Button size="sm" variant="outline">
                  <GitBranch className="mr-1 h-4 w-4" />
                  GitHub
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Landing;
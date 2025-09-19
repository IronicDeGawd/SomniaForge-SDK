import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Copy,
  Play,
  CheckCircle,
  ArrowRight,
  ExternalLink,
  Terminal,
  Code2,
  Shield,
  Database,
  Gamepad2,
  Network,
  Globe,
  AlertTriangle,
  Wrench,
  CheckCircle2,
  Layers,
  Palette,
  Type,
} from "lucide-react";
import { Link } from "react-router-dom";

const iconMap = {
  Terminal,
  Code2,
  CheckCircle,
  Shield,
  Database,
  Gamepad2,
  Network,
  Globe,
  Play,
  Layers,
  Palette,
  Type,
};

interface ContentSection {
  title: string;
  icon?: string;
  type: string;
  description?: string;
  code?: string;
  actions?: Array<{ type: string; label: string }>;
  links?: Array<{ to: string; label: string }>;
  items?: Array<{ title: string; code: string }>;
  methods?: Array<{ name: string; description: string; signature?: string; code?: string }>;
  properties?: Array<{ name: string; description: string }>;
  features?: Array<{ title: string; items: string[] }>;
  address?: string;
  explorer?: string;
  verified?: boolean;
  content?: string;
  link?: string;
  status?: 'functional' | 'under-development' | 'untested';
  statusMessage?: string;
  // New component documentation props
  tokens?: {
    colors?: Record<string, string>;
    typography?: Record<string, string>;
  };
  component?: string;
  demo?: {
    component: string;
    props: Record<string, unknown>;
  };
  interface?: string;
  props?: Array<{
    name: string;
    type: string;
    required: boolean;
    default?: string;
    description: string;
  }>;
  variants?: Array<{
    name: string;
    props: Record<string, unknown>;
    description: string;
  }>;
  components?: Array<{
    name: string;
    description: string;
    link: string;
  }>;
}

interface DocumentationContent {
  title: string;
  description: string;
  sections: ContentSection[];
}

interface DocumentationRendererProps {
  content: DocumentationContent;
  onInternalLinkClick?: (sectionId: string, itemId?: string) => void;
}

const DocumentationRenderer: React.FC<DocumentationRendererProps> = ({ content, onInternalLinkClick }) => {
  const renderIcon = (iconName?: string) => {
    if (!iconName) return null;
    const IconComponent = iconMap[iconName as keyof typeof iconMap];
    return IconComponent ? <IconComponent className="h-4 w-4" /> : null;
  };

  // Mock component system for component previews
  const renderComponentPreview = (componentName: string, props: Record<string, unknown>) => {
    const defaultProps = {
      className: "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    };

    switch (componentName) {
      case 'SomniaButton': {
        const buttonVariantStyles = {
          primary: "bg-gradient-to-r from-[#fe54ff] to-[#a064ff] text-white hover:from-[#e048e6] hover:to-[#8f56e6] shadow-lg shadow-[#fe54ff]/25",
          secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
          outline: "border border-[#fe54ff] text-[#fe54ff] hover:bg-[#fe54ff]/10",
          ghost: "hover:bg-accent hover:text-accent-foreground"
        };
        const buttonSizeStyles = {
          sm: "h-9 px-3",
          md: "h-10 px-4 py-2",
          lg: "h-11 px-8"
        };
        const variant = (props.variant as string) || 'primary';
        const size = (props.size as string) || 'md';
        return (
          <button
            className={`${defaultProps.className} ${buttonVariantStyles[variant as keyof typeof buttonVariantStyles]} ${buttonSizeStyles[size as keyof typeof buttonSizeStyles]}`}
            disabled={props.loading as boolean || props.disabled as boolean}
          >
            {props.loading && <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent" />}
            {props.icon && <span className="mr-2">{props.icon}</span>}
            {props.children}
            {props.iconPosition === 'right' && props.icon && <span className="ml-2">{props.icon}</span>}
          </button>
        );
      }

      case 'GameCard': {
        const statusColors = {
          waiting: "bg-yellow-100 text-yellow-800 border-yellow-200",
          active: "bg-green-100 text-green-800 border-green-200",
          finished: "bg-gray-100 text-gray-800 border-gray-200"
        };
        const status = (props.status as string) || 'waiting';
        return (
          <div className="w-full max-w-sm mx-auto bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{props.title as string}</h3>
                <Badge className={statusColors[status as keyof typeof statusColors]}>
                  {status}
                </Badge>
              </div>
              {props.description && (
                <p className="text-sm text-gray-600 mb-4">{props.description as string}</p>
              )}
              <div className="space-y-2 text-sm">
                {props.playerCount !== undefined && (
                  <div className="flex justify-between">
                    <span>Players:</span>
                    <span>{props.playerCount}/{props.maxPlayers}</span>
                  </div>
                )}
                {props.entryFee && (
                  <div className="flex justify-between">
                    <span>Entry Fee:</span>
                    <span>{props.entryFee} STT</span>
                  </div>
                )}
                {props.timeRemaining && (
                  <div className="flex justify-between">
                    <span>Time Remaining:</span>
                    <span>{props.timeRemaining}</span>
                  </div>
                )}
                {props.prizePool && (
                  <div className="flex justify-between">
                    <span>Prize Pool:</span>
                    <span>{props.prizePool} STT</span>
                  </div>
                )}
              </div>
              <div className="mt-4 flex gap-2">
                <Button size="sm" className="flex-1 bg-gradient-to-r from-[#fe54ff] to-[#a064ff] hover:from-[#e048e6] hover:to-[#8f56e6]">
                  Join Game
                </Button>
                <Button size="sm" variant="outline" className="border-[#fe54ff] text-[#fe54ff]">
                  View
                </Button>
              </div>
            </div>
          </div>
        );
      }

      case 'PlayerProfile': {
        const variant = (props.variant as string) || 'card';
        const stats = props.stats as Record<string, unknown> || {};
        const isInline = variant === 'inline';
        return (
          <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${isInline ? 'p-4' : 'p-6'} ${isInline ? 'flex items-center gap-4' : ''}`}>
            <div className={`${isInline ? 'flex items-center gap-3' : 'flex items-center gap-3 mb-4'}`}>
              <div className="w-12 h-12 bg-gradient-to-r from-[#fe54ff] to-[#a064ff] rounded-full flex items-center justify-center text-white font-bold">
                {(props.playerName as string)?.charAt(0) || 'P'}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{props.playerName || 'Player'}</h3>
                <p className="text-sm text-gray-500">{props.playerAddress || '0x1234...5678'}</p>
              </div>
            </div>
            {!isInline && stats && (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Total Games:</span>
                  <div className="font-semibold">{stats.totalGames || 0}</div>
                </div>
                <div>
                  <span className="text-gray-500">Win Rate:</span>
                  <div className="font-semibold">{stats.winRate || 0}%</div>
                </div>
                <div>
                  <span className="text-gray-500">Level:</span>
                  <div className="font-semibold">{stats.level || 1}</div>
                </div>
                <div>
                  <span className="text-gray-500">Earnings:</span>
                  <div className="font-semibold">{stats.totalEarnings || '0'} STT</div>
                </div>
              </div>
            )}
          </div>
        );
      }

      case 'GameStats': {
        const layout = (props.variant as string) || 'dashboard';
        const statsData = [
          { label: 'Total Games', value: props.totalGames },
          { label: 'Active Games', value: props.activeGames },
          { label: 'Total Players', value: props.totalPlayers },
          { label: 'Prize Pool', value: `${props.totalPrizePool} STT` },
          { label: 'Avg Game Time', value: props.averageGameTime }
        ];
        return (
          <div className={`bg-white rounded-lg border border-gray-200 shadow-sm p-6 ${layout === 'compact' ? 'flex gap-6' : 'grid grid-cols-2 md:grid-cols-3 gap-4'}`}>
            {statsData.map((stat, index) => (
              <div key={index} className={`${layout === 'compact' ? 'text-center' : ''}`}>
                <div className="text-sm text-gray-500">{stat.label}</div>
                <div className="text-xl font-bold text-gray-900">{stat.value}</div>
              </div>
            ))}
          </div>
        );
      }

      case 'WalletConnectButton': {
        const isConnected = props.isConnected as boolean;
        const isConnecting = props.isConnecting as boolean;
        const account = props.account as string;

        if (isConnected && account) {
          return (
            <button className={`${defaultProps.className} bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2`}>
              {account}
            </button>
          );
        }

        if (isConnecting) {
          return (
            <button className={`${defaultProps.className} bg-gradient-to-r from-[#fe54ff] to-[#a064ff] text-white h-10 px-4 py-2`} disabled>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent" />
              Connecting...
            </button>
          );
        }

        return (
          <button className={`${defaultProps.className} bg-gradient-to-r from-[#fe54ff] to-[#a064ff] text-white hover:from-[#e048e6] hover:to-[#8f56e6] shadow-lg shadow-[#fe54ff]/25 h-10 px-4 py-2`}>
            Connect Wallet
          </button>
        );
      }

      default:
        return (
          <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 text-center text-gray-500">
            Component "{componentName}" preview not available
          </div>
        );
    }
  };

  const formatCodeWithComments = (code: string) => {
    const lines = code.split('\n');
    return lines.map((line, index) => {
      const commentMatch = line.match(/^(\s*)(\/\/.*)|(.*)(\s*\/\/.*)/);

      if (commentMatch) {
        if (commentMatch[1] !== undefined) {
          return (
            <div key={index}>
              {commentMatch[1]}<span className="comment">{commentMatch[2]}</span>
            </div>
          );
        } else if (commentMatch[4] !== undefined) {
          return (
            <div key={index}>
              {commentMatch[3]}<span className="comment">{commentMatch[4]}</span>
            </div>
          );
        }
      }

      return <div key={index}>{line}</div>;
    });
  };

  const renderStatusBanner = (status?: string, message?: string) => {
    if (!status) return null;

    const statusConfig = {
      'functional': {
        icon: CheckCircle2,
        className: 'bg-success/10 border-success/20 text-success',
        label: 'Functional'
      },
      'under-development': {
        icon: Wrench,
        className: 'bg-warning/10 border-warning/20 text-warning',
        label: 'Under Development'
      },
      'untested': {
        icon: AlertTriangle,
        className: 'bg-warning/10 border-warning/20 text-warning',
        label: 'Untested Feature'
      }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return null;

    const StatusIcon = config.icon;

    return (
      <div className={`flex items-center gap-2 p-3 rounded-lg border mb-4 ${config.className}`}>
        <StatusIcon className="h-4 w-4 flex-shrink-0" />
        <div className="text-sm">
          <span className="font-medium">{config.label}</span>
          {message && <span className="ml-2">{message}</span>}
        </div>
      </div>
    );
  };

  const renderSection = (section: ContentSection, index: number) => {
    const SectionIcon = renderIcon(section.icon);

    switch (section.type) {
      case "code":
        return (
          <Card key={index} className="professional-card p-6">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              {SectionIcon}
              {section.title}
            </h4>
            {renderStatusBanner(section.status, section.statusMessage)}
            {section.description && (
              <p className="text-sm text-foreground-secondary mb-3">
                {section.description}
              </p>
            )}
            <div className="space-y-3">
              <pre className="code-block">
                {formatCodeWithComments(section.code || '')}
              </pre>
              {section.actions && (
                <div className="flex gap-2">
                  {section.actions.map((action, actionIndex) => (
                    <Button
                      key={actionIndex}
                      size="sm"
                      variant={action.type === "demo" ? "default" : "outline"}
                      className={action.type === "demo" ? "btn-primary" : "btn-secondary"}
                    >
                      {action.type === "copy" && <Copy className="mr-2 h-4 w-4" />}
                      {action.type === "demo" && <Play className="mr-2 h-4 w-4" />}
                      {action.label}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </Card>
        );

      case "multi-code":
        return (
          <Card key={index} className="professional-card p-6">
            <h4 className="font-semibold mb-4">{section.title}</h4>
            <div className="space-y-4">
              {section.items?.map((item, itemIndex) => (
                <div key={itemIndex}>
                  <h5 className="font-medium mb-2">{item.title}</h5>
                  <pre className="code-block text-sm">
                    {formatCodeWithComments(item.code || '')}
                  </pre>
                </div>
              ))}
            </div>
          </Card>
        );

      case "links":
        return (
          <Card key={index} className="professional-card p-6">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              {SectionIcon}
              {section.title}
            </h4>
            <div className="space-y-3">
              <div className="grid gap-3">
                {section.links?.map((link, linkIndex) => {
                  const isInternalDocLink = link.to.startsWith('/docs/') && link.to !== '/docs/examples';

                  if (isInternalDocLink && onInternalLinkClick) {
                    const sectionId = link.to.replace('/docs/', '');

                    return (
                      <button
                        key={linkIndex}
                        onClick={() => onInternalLinkClick(sectionId)}
                        className="text-sm hover:text-brand-primary transition-colors w-full text-left"
                      >
                        <div className="flex items-center justify-between p-3 border border-border-secondary rounded-lg hover:bg-background-hover">
                          <span>{link.label}</span>
                          <ArrowRight className="h-4 w-4" />
                        </div>
                      </button>
                    );
                  }

                  return (
                    <Link
                      key={linkIndex}
                      to={link.to}
                      className="text-sm hover:text-brand-primary transition-colors"
                    >
                      <div className="flex items-center justify-between p-3 border border-border-secondary rounded-lg hover:bg-background-hover">
                        <span>{link.label}</span>
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </Card>
        );

      case "api-methods":
        return (
          <Card key={index} className="professional-card p-6">
            <h4 className="font-semibold mb-4">{section.title}</h4>
            <div className="space-y-4">
              {section.methods?.map((method, methodIndex) => (
                <div key={methodIndex}>
                  <h5 className="font-medium mb-2">{method.name}</h5>
                  <p className="text-sm text-foreground-secondary mb-2">{method.description}</p>
                  <pre className="code-block text-xs">
                    {formatCodeWithComments(method.signature || method.code || '')}
                  </pre>
                </div>
              ))}
            </div>
          </Card>
        );

      case "property-list":
        return (
          <Card key={index} className="professional-card p-6">
            <h4 className="font-semibold mb-4">{section.title}</h4>
            <div className="space-y-3">
              {section.properties?.map((property, propertyIndex) => (
                <div key={propertyIndex} className="p-3 bg-background-secondary rounded-lg">
                  <h5 className="font-medium">{property.name}</h5>
                  <p className="text-sm text-foreground-secondary">{property.description}</p>
                </div>
              ))}
            </div>
          </Card>
        );

      case "feature-list":
        return (
          <Card key={index} className="professional-card p-6">
            <h4 className="font-semibold mb-4">{section.title}</h4>
            <div className="space-y-4">
              {section.features?.map((feature, featureIndex) => (
                <div key={featureIndex}>
                  <h5 className="font-medium mb-2">{feature.title}</h5>
                  <ul className="text-sm text-foreground-secondary space-y-1 list-disc list-inside">
                    {feature.items.map((item, itemIndex) => (
                      <li key={itemIndex}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Card>
        );

      case "address":
        return (
          <Card key={index} className="professional-card p-6">
            <h4 className="font-semibold mb-4">{section.title}</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground-secondary">Contract Address</span>
                {section.verified && (
                  <Badge className="bg-success/10 text-success border-success/20">
                    Verified
                  </Badge>
                )}
              </div>
              <div className="p-3 bg-background-secondary rounded-lg">
                <div className="text-xs font-mono text-foreground-secondary break-all">
                  {section.address}
                </div>
              </div>
              {section.explorer && (
                <Button
                  size="sm"
                  variant="outline"
                  className="btn-secondary"
                  onClick={() => window.open(section.explorer, '_blank')}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View on Explorer
                </Button>
              )}
            </div>
          </Card>
        );

      case "text":
        return (
          <Card key={index} className="professional-card p-6">
            <h4 className="font-semibold mb-4">{section.title}</h4>
            <p className="text-foreground-secondary">{section.content}</p>
          </Card>
        );

      case "demo-link":
        return (
          <Card key={index} className="professional-card p-6 text-center">
            <h4 className="font-semibold mb-4">{section.title}</h4>
            <p className="text-foreground-secondary mb-4">{section.description}</p>
            <Link to={section.link || "#"}>
              <Button className="btn-brand">
                <Play className="mr-2 h-4 w-4" />
                Try Live Demo
              </Button>
            </Link>
          </Card>
        );

      case "design-tokens":
        return (
          <Card key={index} className="professional-card p-6">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <Palette className="h-4 w-4" />
              {section.title}
            </h4>
            <div className="space-y-6">
              {section.tokens?.colors && (
                <div>
                  <h5 className="font-medium mb-3 flex items-center gap-2">
                    <Palette className="h-3 w-3" />
                    Brand Colors
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(section.tokens.colors).map(([name, value]) => (
                      <div key={name} className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full border border-gray-200"
                          style={{ backgroundColor: value }}
                        />
                        <div>
                          <div className="font-medium text-sm">{name}</div>
                          <div className="text-xs text-gray-500 font-mono">{value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {section.tokens?.typography && (
                <div>
                  <h5 className="font-medium mb-3 flex items-center gap-2">
                    <Type className="h-3 w-3" />
                    Typography
                  </h5>
                  <div className="space-y-3">
                    {Object.entries(section.tokens.typography).map(([name, value]) => (
                      <div key={name} className="flex items-center justify-between">
                        <span className="font-medium">{name}</span>
                        <span className="text-sm text-gray-500 font-mono">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        );

      case "component-demo":
        return (
          <Card key={index} className="professional-card p-6">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              {SectionIcon}
              {section.title}
            </h4>
            <div className="space-y-4">
              <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
                {section.demo && renderComponentPreview(section.demo.component, section.demo.props)}
              </div>
              <div>
                <h5 className="font-medium mb-2">Code</h5>
                <pre className="code-block text-sm">
                  {formatCodeWithComments(section.code || '')}
                </pre>
              </div>
              {section.actions && (
                <div className="flex gap-2">
                  {section.actions.map((action, actionIndex) => (
                    <Button
                      key={actionIndex}
                      size="sm"
                      variant={action.type === "demo" ? "default" : "outline"}
                      className={action.type === "demo" ? "btn-primary" : "btn-secondary"}
                    >
                      {action.type === "copy" && <Copy className="mr-2 h-4 w-4" />}
                      {action.type === "demo" && <Play className="mr-2 h-4 w-4" />}
                      {action.label}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </Card>
        );

      case "props-table":
        return (
          <Card key={index} className="professional-card p-6">
            <h4 className="font-semibold mb-4">{section.title}</h4>
            {section.interface && (
              <p className="text-sm text-gray-500 mb-4">Interface: {section.interface}</p>
            )}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Required</TableHead>
                    <TableHead>Default</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {section.props?.map((prop, propIndex) => (
                    <TableRow key={propIndex}>
                      <TableCell className="font-mono text-sm">{prop.name}</TableCell>
                      <TableCell className="font-mono text-xs text-gray-500">{prop.type}</TableCell>
                      <TableCell>
                        {prop.required ? (
                          <Badge className="bg-red-100 text-red-800">Required</Badge>
                        ) : (
                          <Badge variant="outline">Optional</Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {prop.default || '-'}
                      </TableCell>
                      <TableCell className="text-sm">{prop.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        );

      case "variant-showcase":
        return (
          <Card key={index} className="professional-card p-6">
            <h4 className="font-semibold mb-4">{section.title}</h4>
            <div className="space-y-6">
              {section.variants?.map((variant, variantIndex) => (
                <div key={variantIndex} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="font-medium">{variant.name}</h5>
                    <p className="text-sm text-gray-500">{variant.description}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center">
                    {section.component && renderComponentPreview(section.component, variant.props)}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        );

      case "component-grid":
        return (
          <Card key={index} className="professional-card p-6">
            <h4 className="font-semibold mb-4">{section.title}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {section.components?.map((component, componentIndex) => {
                const isInternalLink = component.link.startsWith('/docs/') && onInternalLinkClick;

                const content = (
                  <div className="p-4 border border-gray-200 rounded-lg hover:border-[#fe54ff] hover:shadow-md transition-all">
                    <div className="flex items-center gap-3 mb-2">
                      <Layers className="h-5 w-5 text-[#fe54ff]" />
                      <h5 className="font-medium">{component.name}</h5>
                    </div>
                    <p className="text-sm text-gray-600">{component.description}</p>
                    <div className="mt-3 flex items-center text-sm text-[#fe54ff]">
                      View Documentation
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </div>
                  </div>
                );

                if (isInternalLink) {
                  // Parse the component link to extract the proper item ID
                  // e.g., /docs/components/somnia-button -> somnia-button
                  const linkParts = component.link.split('/');
                  const itemId = linkParts[linkParts.length - 1];
                  return (
                    <button
                      key={componentIndex}
                      onClick={() => onInternalLinkClick('components', itemId)}
                      className="text-left w-full"
                    >
                      {content}
                    </button>
                  );
                }

                return (
                  <Link key={componentIndex} to={component.link}>
                    {content}
                  </Link>
                );
              })}
            </div>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-foreground mb-4 font-geist">
          {content.title}
        </h3>
        <p className="text-foreground-secondary mb-6">
          {content.description}
        </p>
      </div>

      {content.sections.map((section, index) => renderSection(section, index))}
    </div>
  );
};

export default DocumentationRenderer;
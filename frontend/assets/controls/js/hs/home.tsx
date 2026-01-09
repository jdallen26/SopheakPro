import { useEffect, useRef, useState } from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Check, Moon, Sun, Code2, Zap, Package, Keyboard, Smartphone, Palette, Clock, Plus, Users, Globe, Layers, BookOpen } from 'lucide-react';

// Sample data sets
const countries = [
  { id: 'us', label: 'United States', value: 'US', icon: 'flag-usa', description: 'North America' },
  { id: 'ca', label: 'Canada', value: 'CA', icon: 'leaf', description: 'North America' },
  { id: 'uk', label: 'United Kingdom', value: 'UK', icon: 'crown', description: 'Europe' },
  { id: 'de', label: 'Germany', value: 'DE', icon: 'industry', description: 'Europe' },
  { id: 'fr', label: 'France', value: 'FR', icon: 'wine-glass', description: 'Europe' },
  { id: 'jp', label: 'Japan', value: 'JP', icon: 'torii-gate', description: 'Asia' },
  { id: 'au', label: 'Australia', value: 'AU', icon: 'globe', description: 'Oceania' },
  { id: 'br', label: 'Brazil', value: 'BR', icon: 'futbol', description: 'South America' },
];

const users = [
  { recid: 1001, label: 'Alice Johnson', value: 'alice', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice', description: 'Product Manager', badge: 'Admin', badgeColor: 'primary' },
  { recid: 1002, label: 'Bob Smith', value: 'bob', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob', description: 'Senior Developer' },
  { recid: 1003, label: 'Carol White', value: 'carol', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carol', description: 'UX Designer', badge: 'New', badgeColor: 'success' },
  { recid: 1004, label: 'David Brown', value: 'david', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David', description: 'DevOps Engineer' },
  { recid: 1005, label: 'Eve Davis', value: 'eve', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Eve', description: 'QA Lead' },
];

const products = [
  { id: 'mbp16', label: 'MacBook Pro 16"', value: 'mbp16', icon: 'laptop', description: 'M3 Max, 36GB RAM', badge: '$2,499', group: 'Laptops' },
  { id: 'mba', label: 'MacBook Air M3', value: 'mba', icon: 'laptop', description: 'M3, 16GB RAM', badge: '$1,099', group: 'Laptops' },
  { id: 'ipad', label: 'iPad Pro 12.9"', value: 'ipad', icon: 'tablet', description: 'M2 chip, 256GB', badge: '$1,099', group: 'Tablets' },
  { id: 'iphone', label: 'iPhone 15 Pro', value: 'iphone', icon: 'mobile', description: 'A17 Pro, 256GB', badge: '$999', group: 'Phones' },
  { id: 'watch', label: 'Apple Watch Ultra', value: 'watch', icon: 'clock', description: 'Out of Stock', disabled: true, badge: 'Sold Out', badgeColor: 'danger', group: 'Wearables' },
  { id: 'airpods', label: 'AirPods Pro 2', value: 'airpods', icon: 'headphones', description: 'USB-C, MagSafe', badge: '$249', group: 'Audio' },
];

const skills = [
  { label: 'JavaScript', value: 'js', icon: 'js', description: 'Web scripting language' },
  { label: 'TypeScript', value: 'ts', icon: 'code', description: 'Typed JavaScript superset' },
  { label: 'React', value: 'react', icon: 'atom', description: 'UI component library' },
  { label: 'Vue.js', value: 'vue', icon: 'vuejs', description: 'Progressive framework' },
  { label: 'Angular', value: 'angular', icon: 'angular', description: 'Enterprise framework' },
  { label: 'Node.js', value: 'node', icon: 'node', description: 'Server-side JavaScript' },
  { label: 'Python', value: 'python', icon: 'python', description: 'General purpose language' },
  { label: 'Go', value: 'go', icon: 'golang', description: 'Systems programming' },
  { label: 'Rust', value: 'rust', icon: 'rust', description: 'Memory safe systems lang' },
  { label: 'SQL', value: 'sql', icon: 'database', description: 'Database query language' },
];

const groupedCountries = [
  { id: 'us', label: 'United States', value: 'US', group: 'North America' },
  { id: 'ca', label: 'Canada', value: 'CA', group: 'North America' },
  { id: 'mx', label: 'Mexico', value: 'MX', group: 'North America' },
  { id: 'uk', label: 'United Kingdom', value: 'UK', group: 'Europe' },
  { id: 'de', label: 'Germany', value: 'DE', group: 'Europe' },
  { id: 'fr', label: 'France', value: 'FR', group: 'Europe' },
  { id: 'es', label: 'Spain', value: 'ES', group: 'Europe' },
  { id: 'jp', label: 'Japan', value: 'JP', group: 'Asia' },
  { id: 'cn', label: 'China', value: 'CN', group: 'Asia' },
  { id: 'kr', label: 'South Korea', value: 'KR', group: 'Asia' },
];

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'hybrid-select': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        name?: string;
        label?: string;
        placeholder?: string;
        disabled?: boolean;
        required?: boolean;
        searchable?: boolean;
        clearable?: boolean;
        multiple?: boolean;
        error?: string;
        helper?: string;
        size?: 'small' | 'sm' | 'medium' | 'large' | 'lg';
        'id-field'?: string;
        'label-field'?: string;
        'value-field'?: string;
        'group-field'?: string;
        'empty-text'?: string;
        'search-placeholder'?: string;
        'dark-mode'?: boolean;
        'allow-create'?: boolean;
        'create-text'?: string;
        'show-recent'?: boolean;
        'data-url'?: string;
        'min-search-length'?: string;
        'use-fa'?: boolean;
        mode?: 'combobox' | 'enhanced';
        ref?: React.RefObject<HTMLElement>;
      };
    }
  }
}

function CodeBlock({ code, language = 'html' }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group mt-4">
      <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm font-mono">
        <code className="text-foreground">{code}</code>
      </pre>
      <Button
        size="icon"
        variant="ghost"
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={copyToClipboard}
        data-testid="button-copy-code"
      >
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      </Button>
    </div>
  );
}

function EventLog({ events }: { events: Array<{ type: string; detail: string; time: string }> }) {
  return (
    <div className="bg-muted rounded-md p-4 h-48 overflow-y-auto font-mono text-sm">
      {events.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">Events will appear here...</p>
      ) : (
        <div className="space-y-2">
          {events.map((event, i) => (
            <div key={i} className="flex gap-2 items-start">
              <Badge variant="outline" className="shrink-0 text-xs">
                {event.time}
              </Badge>
              <span className="text-primary font-medium">{event.type}</span>
              <span className="text-muted-foreground truncate">{event.detail}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) {
        return saved === 'dark';
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });
  const [events, setEvents] = useState<Array<{ type: string; detail: string; time: string }>>([]);
  const [createdTags, setCreatedTags] = useState<string[]>([]);
  
  // Refs for the hybrid-select elements
  const basicSelectRef = useRef<HTMLElement>(null);
  const iconsSelectRef = useRef<HTMLElement>(null);
  const imagesSelectRef = useRef<HTMLElement>(null);
  const groupedSelectRef = useRef<HTMLElement>(null);
  const multiSelectRef = useRef<HTMLElement>(null);
  const createSelectRef = useRef<HTMLElement>(null);
  const recentSelectRef = useRef<HTMLElement>(null);
  const eventsSelectRef = useRef<HTMLElement>(null);

  const addEvent = (type: string, detail: string) => {
    const time = new Date().toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
    setEvents(prev => [{ type, detail, time }, ...prev].slice(0, 20));
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
    // Sync theme with all hybrid-select components
    document.querySelectorAll('hybrid-select').forEach((el) => {
      if (darkMode) {
        el.setAttribute('dark-mode', '');
        el.removeAttribute('light-mode');
      } else {
        el.setAttribute('light-mode', '');
        el.removeAttribute('dark-mode');
      }
    });
  }, [darkMode]);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = '/hybrid-select.js';
    script.async = true;
    document.head.appendChild(script);

    script.onload = () => {
      setTimeout(() => {
        if (basicSelectRef.current) {
          (basicSelectRef.current as any).options = countries;
        }
        if (iconsSelectRef.current) {
          (iconsSelectRef.current as any).options = products;
        }
        if (imagesSelectRef.current) {
          (imagesSelectRef.current as any).options = users;
        }
        if (groupedSelectRef.current) {
          (groupedSelectRef.current as any).options = groupedCountries;
        }
        if (multiSelectRef.current) {
          (multiSelectRef.current as any).options = skills;
        }
        if (createSelectRef.current) {
          (createSelectRef.current as any).options = [
            { label: 'Bug', value: 'bug', icon: 'bug' },
            { label: 'Feature', value: 'feature', icon: 'lightbulb' },
            { label: 'Documentation', value: 'docs', icon: 'book' },
          ];
        }
        if (recentSelectRef.current) {
          (recentSelectRef.current as any).options = countries;
        }
        if (eventsSelectRef.current) {
          (eventsSelectRef.current as any).options = countries;
        }
      }, 100);
    };

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  useEffect(() => {
    const eventsSelect = eventsSelectRef.current;
    if (!eventsSelect) return;

    const handleChange = (e: CustomEvent) => {
      addEvent('change', JSON.stringify(e.detail.value));
    };
    const handleOpen = () => addEvent('open', 'Dropdown opened');
    const handleClose = () => addEvent('close', 'Dropdown closed');
    const handleInput = (e: CustomEvent) => {
      addEvent('input', `Search: "${e.detail.searchValue}"`);
    };

    eventsSelect.addEventListener('hybrid-select:change', handleChange as EventListener);
    eventsSelect.addEventListener('hybrid-select:open', handleOpen);
    eventsSelect.addEventListener('hybrid-select:close', handleClose);
    eventsSelect.addEventListener('hybrid-select:input', handleInput as EventListener);

    return () => {
      eventsSelect.removeEventListener('hybrid-select:change', handleChange as EventListener);
      eventsSelect.removeEventListener('hybrid-select:open', handleOpen);
      eventsSelect.removeEventListener('hybrid-select:close', handleClose);
      eventsSelect.removeEventListener('hybrid-select:input', handleInput as EventListener);
    };
  }, []);

  useEffect(() => {
    const createSelect = createSelectRef.current;
    if (!createSelect) return;

    const handleCreate = (e: CustomEvent) => {
      setCreatedTags(prev => [...prev, e.detail.label]);
    };

    createSelect.addEventListener('hybrid-select:create', handleCreate as EventListener);

    return () => {
      createSelect.removeEventListener('hybrid-select:create', handleCreate as EventListener);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-primary flex items-center justify-center">
              <Code2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-semibold text-lg leading-tight">HybridSelect</h1>
              <p className="text-xs text-muted-foreground">Web Component v2.0</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="hidden sm:inline-flex">v2.0.0</Badge>
            <Link href="/docs">
              <Button variant="ghost" size="sm" data-testid="link-docs">
                <BookOpen className="w-4 h-4 mr-2" />
                Docs
              </Button>
            </Link>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setDarkMode(!darkMode)}
              data-testid="button-theme-toggle"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 md:py-24 border-b">
        <div className="container mx-auto px-4 text-center">
          <Badge variant="outline" className="mb-4">Framework Agnostic</Badge>
          <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
            The Input+Select Control
            <br />
            <span className="text-primary">Done Right</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            A robust, accessible, and customizable hybrid control with icons, images, 
            groups, async data, and more. Works with any website, any framework.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <div className="flex items-center gap-2 text-sm">
              <Zap className="w-4 h-4 text-primary" />
              <span>Zero Dependencies</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Package className="w-4 h-4 text-primary" />
              <span>~15KB Minified</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Keyboard className="w-4 h-4 text-primary" />
              <span>Full Keyboard Support</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Smartphone className="w-4 h-4 text-primary" />
              <span>Mobile Optimized</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Palette className="w-4 h-4 text-primary" />
              <span>Dark Mode Ready</span>
            </div>
          </div>

          {/* Quick Demo */}
          <div className="max-w-md mx-auto">
            <hybrid-select
              ref={basicSelectRef}
              label="Try it out"
              placeholder="Select a country..."
              searchable
              clearable
              data-testid="select-hero-demo"
            />
          </div>
        </div>
      </section>

      {/* New Features Section */}
      <section className="py-16 border-b bg-muted/30">
        <div className="container mx-auto px-4">
          <h3 className="text-2xl font-bold mb-4 text-center">New in v2.0</h3>
          <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
            Major update with powerful new features for rich, interactive dropdowns
          </p>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <h4 className="font-semibold mb-2">Icons & Images</h4>
                <p className="text-sm text-muted-foreground">Font Awesome icons and avatar images per option</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Layers className="w-6 h-6 text-primary" />
                </div>
                <h4 className="font-semibold mb-2">Option Groups</h4>
                <p className="text-sm text-muted-foreground">Organize options with sticky group headers</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Globe className="w-6 h-6 text-primary" />
                </div>
                <h4 className="font-semibold mb-2">Async Data</h4>
                <p className="text-sm text-muted-foreground">Remote data loading with debounced search</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-6 h-6 text-primary" />
                </div>
                <h4 className="font-semibold mb-2">Create New</h4>
                <p className="text-sm text-muted-foreground">Add new options on the fly with tagging</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Installation Section */}
      <section className="py-16 border-b">
        <div className="container mx-auto px-4">
          <h3 className="text-2xl font-bold mb-8 text-center">Quick Start</h3>
          
          <div className="max-w-3xl mx-auto">
            <Tabs defaultValue="script" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="script" data-testid="tab-script">Script Tag</TabsTrigger>
                <TabsTrigger value="npm" data-testid="tab-npm">NPM</TabsTrigger>
                <TabsTrigger value="esm" data-testid="tab-esm">ES Module</TabsTrigger>
              </TabsList>
              
              <TabsContent value="script">
                <CodeBlock code={`<!-- Include Font Awesome (optional, for icons) -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">

<!-- Include the component -->
<script src="hybrid-select.js"></script>

<!-- Use the component -->
<hybrid-select
  label="Select User"
  placeholder="Choose..."
  searchable
  clearable
  use-fa
></hybrid-select>

<script>
  const select = document.querySelector('hybrid-select');
  select.options = [
    { id: 1, label: 'Alice', value: 'alice', icon: 'user', description: 'Admin' },
    { id: 2, label: 'Bob', value: 'bob', image: 'avatar.jpg' }
  ];
  
  select.addEventListener('hybrid-select:change', (e) => {
    console.log('Selected:', e.detail);
  });
</script>`} />
              </TabsContent>
              
              <TabsContent value="npm">
                <CodeBlock code={`# Install (when published to npm)
npm install hybrid-select

# Import in your project
import 'hybrid-select';

# Use in HTML
<hybrid-select 
  name="country"
  searchable
  allow-create
  show-recent
></hybrid-select>`} />
              </TabsContent>
              
              <TabsContent value="esm">
                <CodeBlock code={`<script type="module">
  import 'https://cdn.example.com/hybrid-select.js';
</script>

<hybrid-select
  name="country"
  label="Country"
  data-url="/api/countries"
  searchable
></hybrid-select>`} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 border-b">
        <div className="container mx-auto px-4">
          <h3 className="text-2xl font-bold mb-12 text-center">Features & Examples</h3>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Icons */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Icons & Descriptions
                </CardTitle>
                <CardDescription>Rich options with Font Awesome icons, descriptions, and badges</CardDescription>
              </CardHeader>
              <CardContent>
                <hybrid-select
                  ref={iconsSelectRef}
                  label="Product"
                  placeholder="Search products..."
                  searchable
                  clearable
                  use-fa
                  data-testid="select-icons"
                />
                <CodeBlock code={`select.options = [
  { 
    label: 'MacBook Pro', 
    value: 'mbp',
    icon: 'laptop',           // FA icon name
    description: 'M3 Max, 36GB',
    badge: '$2,499',
    badgeColor: 'primary'     // primary|success|warning|danger
  }
];`} />
              </CardContent>
            </Card>

            {/* Images / Avatars */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Avatar Images
                </CardTitle>
                <CardDescription>User picker with profile images and descriptions</CardDescription>
              </CardHeader>
              <CardContent>
                <hybrid-select
                  ref={imagesSelectRef}
                  label="Assign to"
                  placeholder="Select team member..."
                  id-field="recid"
                  searchable
                  clearable
                  data-testid="select-images"
                />
                <CodeBlock code={`select.options = [
  { 
    recid: 1001,
    label: 'Alice Johnson',
    value: 'alice',
    image: 'https://example.com/alice.jpg',
    description: 'Product Manager',
    badge: 'Admin',
    badgeColor: 'primary'
  }
];`} />
              </CardContent>
            </Card>

            {/* Grouped Options */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Layers className="w-5 h-5 text-primary" />
                  Grouped Options
                </CardTitle>
                <CardDescription>Organize options with sticky group headers</CardDescription>
              </CardHeader>
              <CardContent>
                <hybrid-select
                  ref={groupedSelectRef}
                  label="Country"
                  placeholder="Select country..."
                  searchable
                  clearable
                  data-testid="select-grouped"
                />
                <CodeBlock code={`select.options = [
  { label: 'United States', value: 'US', group: 'North America' },
  { label: 'Canada', value: 'CA', group: 'North America' },
  { label: 'Germany', value: 'DE', group: 'Europe' },
  { label: 'France', value: 'FR', group: 'Europe' },
];`} />
              </CardContent>
            </Card>

            {/* Multi-Select */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  Multi-Select with Icons
                </CardTitle>
                <CardDescription>Select multiple options with chip display</CardDescription>
              </CardHeader>
              <CardContent>
                <hybrid-select
                  ref={multiSelectRef}
                  label="Skills"
                  placeholder="Select skills..."
                  multiple
                  searchable
                  clearable
                  use-fa
                  data-testid="select-multi"
                />
                <CodeBlock code={`<hybrid-select
  label="Skills"
  multiple
  searchable
  clearable
  use-fa
></hybrid-select>`} />
              </CardContent>
            </Card>

            {/* Create New */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Plus className="w-5 h-5 text-primary" />
                  Create New Option
                </CardTitle>
                <CardDescription>Add new tags/options on the fly</CardDescription>
              </CardHeader>
              <CardContent>
                <hybrid-select
                  ref={createSelectRef}
                  name="tags"
                  label="Tags"
                  placeholder="Select or create..."
                  searchable
                  clearable
                  multiple
                  allow-create
                  create-text="Add tag"
                  use-fa
                  data-testid="select-create"
                />
                {createdTags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="text-sm text-muted-foreground">Created:</span>
                    {createdTags.map((tag, i) => (
                      <Badge key={i} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                )}
                <CodeBlock code={`<hybrid-select
  allow-create
  create-text="Add tag"
></hybrid-select>

select.addEventListener('hybrid-select:create', (e) => {
  console.log('Created:', e.detail.label);
  // Save to your backend...
});`} />
              </CardContent>
            </Card>

            {/* Enhanced Mode */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" />
                  Enhanced Mode
                </CardTitle>
                <CardDescription>Auto-open dropdown with dedicated search box (classic behavior)</CardDescription>
              </CardHeader>
              <CardContent>
                <hybrid-select
                  ref={recentSelectRef}
                  name="enhanced-demo"
                  label="Country"
                  placeholder="Select country..."
                  mode="enhanced"
                  searchable
                  clearable
                  show-recent
                  data-testid="select-enhanced"
                />
                <CodeBlock code={`<hybrid-select
  mode="enhanced"
  searchable
  show-recent
></hybrid-select>

<!-- Enhanced mode: auto-open on focus -->
<!-- Includes search box inside dropdown -->
<!-- show-recent displays recent selections -->`} />
              </CardContent>
            </Card>

            {/* Event Handling */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Event Handling</CardTitle>
                <CardDescription>Listen to component events for full control</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <hybrid-select
                      ref={eventsSelectRef}
                      label="Interactive Demo"
                      placeholder="Try me..."
                      searchable
                      clearable
                      data-testid="select-events"
                    />
                    <EventLog events={events} />
                  </div>
                  <div>
                    <CodeBlock code={`// Selection changed
select.addEventListener('hybrid-select:change', (e) => {
  console.log('Value:', e.detail.value);
  console.log('Option:', e.detail.selectedOption);
});

// Dropdown opened/closed
select.addEventListener('hybrid-select:open', () => {...});
select.addEventListener('hybrid-select:close', () => {...});

// Search input
select.addEventListener('hybrid-select:input', (e) => {
  console.log('Search:', e.detail.searchValue);
});

// New option created
select.addEventListener('hybrid-select:create', (e) => {
  console.log('Created:', e.detail.label);
});

// Remote data loaded
select.addEventListener('hybrid-select:load', (e) => {
  console.log('Options:', e.detail.options);
});`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* API Reference Section */}
      <section className="py-16 border-b">
        <div className="container mx-auto px-4">
          <h3 className="text-2xl font-bold mb-8 text-center">API Reference</h3>
          
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Attributes */}
            <Card>
              <CardHeader>
                <CardTitle>Attributes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-2 font-medium">Attribute</th>
                        <th className="text-left py-3 px-2 font-medium">Type</th>
                        <th className="text-left py-3 px-2 font-medium">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      <tr>
                        <td className="py-3 px-2 font-mono text-primary">searchable</td>
                        <td className="py-3 px-2 text-muted-foreground">boolean</td>
                        <td className="py-3 px-2">Enable type-ahead filtering</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-2 font-mono text-primary">clearable</td>
                        <td className="py-3 px-2 text-muted-foreground">boolean</td>
                        <td className="py-3 px-2">Show clear button when value selected</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-2 font-mono text-primary">multiple</td>
                        <td className="py-3 px-2 text-muted-foreground">boolean</td>
                        <td className="py-3 px-2">Allow multiple selections with chips</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-2 font-mono text-primary">allow-create</td>
                        <td className="py-3 px-2 text-muted-foreground">boolean</td>
                        <td className="py-3 px-2">Allow creating new options</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-2 font-mono text-primary">show-recent</td>
                        <td className="py-3 px-2 text-muted-foreground">boolean</td>
                        <td className="py-3 px-2">Show recently selected at top</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-2 font-mono text-primary">mode</td>
                        <td className="py-3 px-2 text-muted-foreground">"combobox" | "enhanced"</td>
                        <td className="py-3 px-2">Combobox (default): type to filter, click chevron to open. Enhanced: auto-open with search box</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-2 font-mono text-primary">use-fa</td>
                        <td className="py-3 px-2 text-muted-foreground">boolean</td>
                        <td className="py-3 px-2">Use Font Awesome for icons</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-2 font-mono text-primary">data-url</td>
                        <td className="py-3 px-2 text-muted-foreground">string</td>
                        <td className="py-3 px-2">URL for async data loading</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-2 font-mono text-primary">id-field</td>
                        <td className="py-3 px-2 text-muted-foreground">string</td>
                        <td className="py-3 px-2">Custom field for unique ID (default: "id")</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-2 font-mono text-primary">group-field</td>
                        <td className="py-3 px-2 text-muted-foreground">string</td>
                        <td className="py-3 px-2">Field for option grouping (default: "group")</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-2 font-mono text-primary">size</td>
                        <td className="py-3 px-2 text-muted-foreground">sm | md | lg</td>
                        <td className="py-3 px-2">Bootstrap-compatible sizing</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Option Schema */}
            <Card>
              <CardHeader>
                <CardTitle>Option Object Schema</CardTitle>
              </CardHeader>
              <CardContent>
                <CodeBlock code={`{
  id: string | number,       // Unique identifier (auto-generated if missing)
  label: string,             // Display text (required)
  value: any,                // Value to return on selection
  
  // Visual enhancements
  icon: string,              // Font Awesome icon name (e.g., "user", "laptop")
  image: string,             // URL for avatar/image
  description: string,       // Secondary text below label
  badge: string,             // Badge text (e.g., "New", "$99")
  badgeColor: string,        // primary | success | warning | danger
  
  // Grouping & state
  group: string,             // Group name for headers
  disabled: boolean,         // Disable this option
  
  // Custom data
  meta: object               // Any additional data you need
}`} />
              </CardContent>
            </Card>

            {/* Events */}
            <Card>
              <CardHeader>
                <CardTitle>Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-2 font-medium">Event</th>
                        <th className="text-left py-3 px-2 font-medium">Detail</th>
                        <th className="text-left py-3 px-2 font-medium">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      <tr>
                        <td className="py-3 px-2 font-mono text-primary">hybrid-select:change</td>
                        <td className="py-3 px-2 text-muted-foreground font-mono text-xs">value, selectedOption(s)</td>
                        <td className="py-3 px-2">Selection changed</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-2 font-mono text-primary">hybrid-select:create</td>
                        <td className="py-3 px-2 text-muted-foreground font-mono text-xs">label, option</td>
                        <td className="py-3 px-2">New option created</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-2 font-mono text-primary">hybrid-select:load</td>
                        <td className="py-3 px-2 text-muted-foreground font-mono text-xs">options, searchTerm</td>
                        <td className="py-3 px-2">Remote data loaded</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-2 font-mono text-primary">hybrid-select:input</td>
                        <td className="py-3 px-2 text-muted-foreground font-mono text-xs">searchValue</td>
                        <td className="py-3 px-2">Search input changed</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-2 font-mono text-primary">hybrid-select:open</td>
                        <td className="py-3 px-2 text-muted-foreground">-</td>
                        <td className="py-3 px-2">Dropdown opened</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-2 font-mono text-primary">hybrid-select:close</td>
                        <td className="py-3 px-2 text-muted-foreground">-</td>
                        <td className="py-3 px-2">Dropdown closed</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* CSS Custom Properties */}
            <Card>
              <CardHeader>
                <CardTitle>CSS Custom Properties (Theming)</CardTitle>
              </CardHeader>
              <CardContent>
                <CodeBlock code={`hybrid-select {
  /* Typography */
  --hs-font-family: -apple-system, sans-serif;
  --hs-font-size: 16px;
  
  /* Colors */
  --hs-bg: #ffffff;
  --hs-bg-hover: #f8f9fa;
  --hs-bg-selected: #e9ecef;
  --hs-text: #1a1a1a;
  --hs-text-secondary: #6c757d;
  
  /* Borders */
  --hs-border: #d1d5db;
  --hs-border-focus: #3b82f6;
  --hs-border-error: #ef4444;
  
  /* Sizing */
  --hs-radius: 8px;
  --hs-height: 48px;
  --hs-icon-size: 18px;
  --hs-avatar-size: 32px;
  
  /* Effects */
  --hs-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
}`} />
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>HybridSelect Web Component v2.0 - Built with modern Web Components standards</p>
          <p className="mt-2">Works with React, Vue, Angular, Svelte, or plain HTML/JS</p>
        </div>
      </footer>
    </div>
  );
}

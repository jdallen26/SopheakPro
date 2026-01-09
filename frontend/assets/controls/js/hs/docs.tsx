import { useEffect, useRef, useState } from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Copy, Check, Moon, Sun, ArrowLeft, Search, Database, Palette, 
  Settings, Zap, Tag, Clock, Layers, Users, FileCode, Hash
} from 'lucide-react';

function CodeBlock({ code, language = 'javascript' }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-4">
      <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm font-mono border">
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

function AttributeTable({ attributes }: { attributes: Array<{ name: string; type: string; default?: string; description: string }> }) {
  return (
    <div className="overflow-x-auto my-4">
      <table className="w-full text-sm border rounded-md">
        <thead>
          <tr className="bg-muted">
            <th className="text-left py-3 px-4 font-semibold border-b">Attribute</th>
            <th className="text-left py-3 px-4 font-semibold border-b">Type</th>
            <th className="text-left py-3 px-4 font-semibold border-b">Default</th>
            <th className="text-left py-3 px-4 font-semibold border-b">Description</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {attributes.map((attr, i) => (
            <tr key={i} className="hover:bg-muted/50">
              <td className="py-3 px-4 font-mono text-primary">{attr.name}</td>
              <td className="py-3 px-4 text-muted-foreground font-mono text-xs">{attr.type}</td>
              <td className="py-3 px-4 text-muted-foreground">{attr.default || '-'}</td>
              <td className="py-3 px-4">{attr.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Section({ id, title, icon: Icon, children }: { id: string; title: string; icon: any; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20 py-8 border-b last:border-b-0">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
        <Icon className="w-6 h-6 text-primary" />
        {title}
      </h2>
      {children}
    </section>
  );
}

function Subsection({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <div id={id} className="scroll-mt-20 mt-8 first:mt-0">
      <h3 className="text-xl font-semibold mb-4 pb-2 border-b">{title}</h3>
      {children}
    </div>
  );
}

const navItems = [
  { id: 'quick-start', label: 'Quick Start', icon: Zap },
  { id: 'core-features', label: 'Core Features', icon: Settings },
  { id: 'data-loading', label: 'Data Loading', icon: Database },
  { id: 'visual-features', label: 'Visual Features', icon: Palette },
  { id: 'tagging', label: 'Tagging & Create', icon: Tag },
  { id: 'events', label: 'Events Reference', icon: FileCode },
  { id: 'theming', label: 'CSS Theming', icon: Palette },
];

export default function Docs() {
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });
  const [activeSection, setActiveSection] = useState('quick-start');
  const demoRef = useRef<HTMLElement>(null);

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
      if (demoRef.current) {
        (demoRef.current as any).options = [
          { id: 1, label: 'United States', value: 'US', icon: 'flag-usa' },
          { id: 2, label: 'Canada', value: 'CA', icon: 'leaf' },
          { id: 3, label: 'Germany', value: 'DE', icon: 'industry' },
        ];
      }
    };

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-100px 0px -66%' }
    );

    navItems.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" data-testid="link-back-home">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Demo
              </Button>
            </Link>
            <div className="hidden sm:block h-6 w-px bg-border" />
            <h1 className="font-semibold hidden sm:block">HybridSelect Documentation</h1>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">v2.0</Badge>
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

      <div className="container mx-auto px-4 flex">
        {/* Sidebar Navigation */}
        <aside className="hidden lg:block w-64 shrink-0">
          <nav className="sticky top-20 py-8 pr-4">
            <p className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wide">Documentation</p>
            <ul className="space-y-1">
              {navItems.map(({ id, label, icon: Icon }) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                      activeSection === id 
                        ? 'bg-primary/10 text-primary font-medium' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                    data-testid={`nav-${id}`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 py-8 lg:pl-8 lg:border-l">
          {/* Quick Start */}
          <Section id="quick-start" title="Quick Start" icon={Zap}>
            <p className="text-muted-foreground mb-6">
              Get started with HybridSelect in under a minute. The component works with any website or framework.
            </p>

            <Subsection id="installation" title="Installation">
              <p className="mb-4">Include the script in your HTML:</p>
              <CodeBlock code={`<!-- Add to your HTML -->
<script src="hybrid-select.js"></script>

<!-- Optional: Font Awesome for icons -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">`} />
            </Subsection>

            <Subsection id="basic-usage" title="Basic Usage">
              <CodeBlock code={`<hybrid-select
  name="country"
  label="Select Country"
  placeholder="Choose a country..."
  searchable
  clearable
></hybrid-select>

<script>
  const select = document.querySelector('hybrid-select[name="country"]');
  
  // Set options
  select.options = [
    { id: 1, label: 'United States', value: 'US' },
    { id: 2, label: 'Canada', value: 'CA' },
    { id: 3, label: 'Germany', value: 'DE' }
  ];
  
  // Listen for changes
  select.addEventListener('hybrid-select:change', (e) => {
    console.log('Selected:', e.detail.value);
    console.log('Full option:', e.detail.selectedOption);
  });
</script>`} />
            </Subsection>
          </Section>

          {/* Core Features */}
          <Section id="core-features" title="Core Features" icon={Settings}>
            <p className="text-muted-foreground mb-6">
              Essential attributes for configuring the component behavior.
            </p>

            <AttributeTable attributes={[
              { name: 'name', type: 'string', description: 'Form field name. Required for recent selections feature.' },
              { name: 'label', type: 'string', description: 'Label text displayed above the control.' },
              { name: 'placeholder', type: 'string', default: 'Select an option...', description: 'Placeholder text when no value selected.' },
              { name: 'searchable', type: 'boolean', default: 'false', description: 'Enable type-ahead filtering of options.' },
              { name: 'clearable', type: 'boolean', default: 'false', description: 'Show clear button when value is selected.' },
              { name: 'multiple', type: 'boolean', default: 'false', description: 'Allow multiple selections with chip display.' },
              { name: 'disabled', type: 'boolean', default: 'false', description: 'Disable the control.' },
              { name: 'required', type: 'boolean', default: 'false', description: 'Mark field as required (adds asterisk to label).' },
              { name: 'size', type: 'sm | md | lg', default: 'md', description: 'Bootstrap-compatible sizing.' },
            ]} />

            <Subsection id="searchable" title="Searchable">
              <p className="mb-4">Enable type-ahead filtering to let users quickly find options by typing.</p>
              <CodeBlock code={`<hybrid-select
  searchable
  search-placeholder="Type to filter..."
></hybrid-select>`} />
              <Card className="mt-4 bg-muted/50">
                <CardContent className="pt-4">
                  <p className="text-sm"><strong>Behavior:</strong> Options are filtered client-side as the user types. 
                  Matching is case-insensitive against both <code>label</code> and <code>description</code> fields.</p>
                </CardContent>
              </Card>
            </Subsection>

            <Subsection id="multiple" title="Multi-Select">
              <p className="mb-4">Allow users to select multiple values. Selected items display as chips.</p>
              <CodeBlock code={`<hybrid-select
  multiple
  searchable
  clearable
></hybrid-select>

<script>
  select.addEventListener('hybrid-select:change', (e) => {
    // Returns array of values
    console.log('Selected values:', e.detail.value);  // ['US', 'CA']
    
    // Full option objects
    console.log('Options:', e.detail.selectedOptions);
  });
</script>`} />
            </Subsection>

            <Subsection id="sizing" title="Bootstrap Sizing">
              <p className="mb-4">Match Bootstrap form control sizes for consistent layouts.</p>
              <CodeBlock code={`<!-- Small -->
<hybrid-select size="sm"></hybrid-select>

<!-- Medium (default) -->
<hybrid-select size="md"></hybrid-select>

<!-- Large -->
<hybrid-select size="lg"></hybrid-select>`} />
            </Subsection>
          </Section>

          {/* Data Loading */}
          <Section id="data-loading" title="Data Loading" icon={Database}>
            <p className="text-muted-foreground mb-6">
              Configure how options are loaded - statically or from remote endpoints.
            </p>

            <Subsection id="static-options" title="Static Options">
              <p className="mb-4">Set options directly via the <code>options</code> property.</p>
              <CodeBlock code={`// Minimal option structure (id auto-generated)
select.options = [
  { label: 'Option 1', value: 'opt1' },
  { label: 'Option 2', value: 'opt2' }
];

// Full option structure
select.options = [
  {
    id: 'unique-id',        // Optional: auto-generated if missing
    label: 'Display Text',  // Required: shown in dropdown
    value: 'submit-value',  // Optional: defaults to id
    disabled: false,        // Optional: disable selection
    
    // Visual enhancements
    icon: 'user',           // Font Awesome icon name
    image: 'url/to/img',    // Avatar/thumbnail URL
    description: 'Helper',  // Secondary text
    badge: 'New',           // Badge text
    badgeColor: 'success',  // primary|success|warning|danger
    
    // Grouping
    group: 'Category A',    // Group header name
    
    // Custom data
    meta: { ... }           // Any extra data you need
  }
];`} />

              <Card className="mt-4 border-primary/20 bg-primary/5">
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium">Option Schema</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <AttributeTable attributes={[
                    { name: 'id', type: 'string | number', description: 'Unique identifier. Auto-generated using crypto.randomUUID() if not provided.' },
                    { name: 'label', type: 'string', description: 'Display text shown in the dropdown. Required.' },
                    { name: 'value', type: 'any', description: 'Value returned on selection. Defaults to id if not set.' },
                    { name: 'icon', type: 'string', description: 'Font Awesome icon name (e.g., "user", "laptop"). Requires use-fa attribute.' },
                    { name: 'image', type: 'string', description: 'URL for avatar/thumbnail image. Displayed as circular.' },
                    { name: 'description', type: 'string', description: 'Secondary text displayed below the label.' },
                    { name: 'badge', type: 'string', description: 'Badge text displayed on the right side.' },
                    { name: 'badgeColor', type: 'string', description: 'Badge color: primary, success, warning, danger.' },
                    { name: 'group', type: 'string', description: 'Group name for sticky header grouping.' },
                    { name: 'disabled', type: 'boolean', description: 'Prevent selection of this option.' },
                    { name: 'meta', type: 'object', description: 'Store any custom data needed for your app.' },
                  ]} />
                </CardContent>
              </Card>
            </Subsection>

            <Subsection id="async-data" title="Async / Remote Data">
              <p className="mb-4">Load options from an API endpoint with debounced search.</p>
              
              <Card className="mb-6 border-primary/20">
                <CardHeader className="py-3 bg-primary/5">
                  <CardTitle className="text-sm font-mono flex items-center gap-2">
                    <Badge variant="outline">GET</Badge>
                    data-url
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-sm mb-4">Configure remote data fetching with the <code>data-url</code> attribute.</p>
                  
                  <AttributeTable attributes={[
                    { name: 'data-url', type: 'string', description: 'URL endpoint for fetching options. Receives ?q= and ?search= query params.' },
                    { name: 'min-search-length', type: 'number', default: '0', description: 'Minimum characters before triggering fetch.' },
                  ]} />
                </CardContent>
              </Card>

              <h4 className="font-semibold mb-2">Request Format</h4>
              <p className="text-sm text-muted-foreground mb-2">The component appends search parameters to your URL:</p>
              <CodeBlock code={`GET /api/users?q=alice&search=alice

// Both "q" and "search" params are sent
// Use whichever your API expects`} />

              <h4 className="font-semibold mt-6 mb-2">Expected Response</h4>
              <p className="text-sm text-muted-foreground mb-2">Return JSON in one of these formats:</p>
              <CodeBlock code={`// Direct array (preferred)
[
  { "id": 1, "label": "Alice", "value": "alice" },
  { "id": 2, "label": "Bob", "value": "bob" }
]

// Wrapped object (auto-detected)
{
  "results": [...],  // or "items", or "data"
  "total": 100
}`} />

              <h4 className="font-semibold mt-6 mb-2">Example Implementation</h4>
              <CodeBlock code={`<hybrid-select
  data-url="/api/search/users"
  min-search-length="2"
  searchable
></hybrid-select>`} />
              <CodeBlock code={`// Express.js endpoint example
app.get('/api/search/users', (req, res) => {
  const query = (req.query.q || '').toLowerCase();
  
  const results = users.filter(user => 
    user.name.toLowerCase().includes(query)
  );
  
  res.json(results);
});`} />

              <Card className="mt-4 bg-muted/50">
                <CardContent className="pt-4">
                  <p className="text-sm"><strong>Debouncing:</strong> Requests are debounced by 300ms to prevent excessive API calls. 
                  Previous in-flight requests are automatically cancelled using AbortController.</p>
                </CardContent>
              </Card>
            </Subsection>

            <Subsection id="custom-fields" title="Custom Field Mapping">
              <p className="mb-4">Map your API response fields to the component's expected structure.</p>
              <CodeBlock code={`<hybrid-select
  id-field="recid"
  label-field="name"
  value-field="code"
  group-field="category"
></hybrid-select>

// Your API returns:
// { recid: 123, name: 'John', code: 'john_123', category: 'Admin' }

// Component normalizes to:
// { id: '123', label: 'John', value: 'john_123', group: 'Admin' }`} />
              
              <AttributeTable attributes={[
                { name: 'id-field', type: 'string', default: 'id', description: 'Field name for unique identifier.' },
                { name: 'label-field', type: 'string', default: 'label', description: 'Field name for display text.' },
                { name: 'value-field', type: 'string', default: 'value', description: 'Field name for submitted value.' },
                { name: 'group-field', type: 'string', default: 'group', description: 'Field name for grouping.' },
              ]} />
            </Subsection>

            <Subsection id="option-groups" title="Option Groups">
              <p className="mb-4">Organize options with sticky group headers.</p>
              <CodeBlock code={`select.options = [
  { label: 'United States', value: 'US', group: 'North America' },
  { label: 'Canada', value: 'CA', group: 'North America' },
  { label: 'Mexico', value: 'MX', group: 'North America' },
  { label: 'Germany', value: 'DE', group: 'Europe' },
  { label: 'France', value: 'FR', group: 'Europe' },
  { label: 'Spain', value: 'ES', group: 'Europe' },
];

// Groups are displayed with sticky headers that remain
// visible while scrolling through that group's options`} />
            </Subsection>
          </Section>

          {/* Visual Features */}
          <Section id="visual-features" title="Visual Features" icon={Palette}>
            <p className="text-muted-foreground mb-6">
              Rich visual options including icons, images, badges, and search highlighting.
            </p>

            <Subsection id="icons" title="Font Awesome Icons">
              <p className="mb-4">Display icons next to options using Font Awesome.</p>
              <CodeBlock code={`<hybrid-select use-fa></hybrid-select>

<script>
  select.options = [
    { label: 'Settings', value: 'settings', icon: 'gear' },
    { label: 'Profile', value: 'profile', icon: 'user' },
    { label: 'Notifications', value: 'notif', icon: 'bell' },
    { label: 'Logout', value: 'logout', icon: 'right-from-bracket' }
  ];
</script>`} />
              <Card className="mt-4 bg-muted/50">
                <CardContent className="pt-4">
                  <p className="text-sm"><strong>Note:</strong> The <code>use-fa</code> attribute must be present on the component. 
                  Icon names are Font Awesome icon names without the "fa-" prefix. The component automatically prefixes with "fa-solid fa-".</p>
                </CardContent>
              </Card>
            </Subsection>

            <Subsection id="images" title="Avatar Images">
              <p className="mb-4">Display user avatars or thumbnails.</p>
              <CodeBlock code={`select.options = [
  { 
    label: 'Alice Johnson',
    value: 'alice',
    image: 'https://example.com/alice.jpg',
    description: 'Product Manager'
  },
  { 
    label: 'Bob Smith',
    value: 'bob',
    image: 'https://example.com/bob.jpg',
    description: 'Senior Developer'
  }
];

// Images are displayed as 32x32 circles (adjusts with size attribute)`} />
            </Subsection>

            <Subsection id="descriptions" title="Descriptions">
              <p className="mb-4">Add secondary text below option labels.</p>
              <CodeBlock code={`select.options = [
  { 
    label: 'MacBook Pro 16"',
    value: 'mbp16',
    description: 'M3 Max, 36GB RAM, 1TB SSD'
  },
  { 
    label: 'MacBook Air M3',
    value: 'mba',
    description: 'M3, 16GB RAM, 512GB SSD'
  }
];`} />
            </Subsection>

            <Subsection id="badges" title="Badges">
              <p className="mb-4">Display status badges with color variants.</p>
              <CodeBlock code={`select.options = [
  { label: 'Active User', value: 1, badge: 'Online', badgeColor: 'success' },
  { label: 'Pending User', value: 2, badge: 'Pending', badgeColor: 'warning' },
  { label: 'Banned User', value: 3, badge: 'Banned', badgeColor: 'danger' },
  { label: 'Premium User', value: 4, badge: 'Pro', badgeColor: 'primary' }
];`} />
              <div className="flex gap-2 mt-4">
                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">primary</Badge>
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">success</Badge>
                <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">warning</Badge>
                <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">danger</Badge>
              </div>
            </Subsection>

            <Subsection id="highlighting" title="Search Highlighting">
              <p className="mb-4">Matching text is automatically highlighted when searching.</p>
              <CodeBlock code={`// When user types "mac", the label "MacBook Pro" displays as:
// [Mac]Book Pro
// with "Mac" highlighted in yellow

// Highlighting works on both label and description fields
// No configuration needed - enabled automatically with searchable`} />
            </Subsection>
          </Section>

          {/* Tagging */}
          <Section id="tagging" title="Tagging & Create" icon={Tag}>
            <p className="text-muted-foreground mb-6">
              Allow users to create new options and track recent selections.
            </p>

            <Subsection id="allow-create" title="Create New Options">
              <p className="mb-4">Let users add new options that don't exist in the list.</p>
              <CodeBlock code={`<hybrid-select
  allow-create
  create-text="Add new tag"
  searchable
></hybrid-select>`} />

              <Card className="my-4 border-primary/20">
                <CardHeader className="py-3 bg-primary/5">
                  <CardTitle className="text-sm font-mono">hybrid-select:create</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-sm mb-4">Fired when user creates a new option.</p>
                  <CodeBlock code={`select.addEventListener('hybrid-select:create', (e) => {
  console.log('New label:', e.detail.label);  // User-typed text
  console.log('Option:', e.detail.option);    // { id, label, value, _isNew: true }
  
  // Save to your backend
  fetch('/api/tags', {
    method: 'POST',
    body: JSON.stringify({ name: e.detail.label })
  });
});`} />
                </CardContent>
              </Card>

              <AttributeTable attributes={[
                { name: 'allow-create', type: 'boolean', default: 'false', description: 'Show "Create new" option when search has no matches.' },
                { name: 'create-text', type: 'string', default: 'Create', description: 'Text shown before the new option name.' },
              ]} />
            </Subsection>

            <Subsection id="show-recent" title="Recently Selected">
              <p className="mb-4">Track and display recently selected options at the top of the dropdown.</p>
              <CodeBlock code={`<hybrid-select
  name="my-field"
  show-recent
></hybrid-select>

<!-- Recent selections are stored in localStorage -->
<!-- Key: "hybrid-select-recent-{name}" -->
<!-- Max 5 items per field -->`} />

              <Card className="mt-4 bg-muted/50">
                <CardContent className="pt-4">
                  <p className="text-sm"><strong>Storage Key:</strong> <code>hybrid-select-recent-{'{name}'}</code></p>
                  <p className="text-sm mt-2"><strong>Behavior:</strong></p>
                  <ul className="text-sm list-disc list-inside mt-1 space-y-1">
                    <li>Stores up to 5 most recent selections per control</li>
                    <li>Persists across page reloads and sessions</li>
                    <li>Requires <code>name</code> attribute to be set</li>
                    <li>Hidden when user is actively searching</li>
                    <li>Displayed with a clock icon header</li>
                  </ul>
                </CardContent>
              </Card>
            </Subsection>
          </Section>

          {/* Events */}
          <Section id="events" title="Events Reference" icon={FileCode}>
            <p className="text-muted-foreground mb-6">
              All events are CustomEvents with detailed payloads for full integration.
            </p>

            <Card className="mb-6">
              <CardContent className="pt-6 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 font-semibold">Event</th>
                      <th className="text-left py-3 px-2 font-semibold">When</th>
                      <th className="text-left py-3 px-2 font-semibold">Payload</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr>
                      <td className="py-3 px-2 font-mono text-primary">hybrid-select:change</td>
                      <td className="py-3 px-2">Selection changed</td>
                      <td className="py-3 px-2 font-mono text-xs">value, selectedOption, selectedOptions, cleared</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-2 font-mono text-primary">hybrid-select:input</td>
                      <td className="py-3 px-2">Search input changed</td>
                      <td className="py-3 px-2 font-mono text-xs">searchValue</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-2 font-mono text-primary">hybrid-select:open</td>
                      <td className="py-3 px-2">Dropdown opened</td>
                      <td className="py-3 px-2 font-mono text-xs">-</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-2 font-mono text-primary">hybrid-select:close</td>
                      <td className="py-3 px-2">Dropdown closed</td>
                      <td className="py-3 px-2 font-mono text-xs">-</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-2 font-mono text-primary">hybrid-select:create</td>
                      <td className="py-3 px-2">New option created</td>
                      <td className="py-3 px-2 font-mono text-xs">label, option</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-2 font-mono text-primary">hybrid-select:load</td>
                      <td className="py-3 px-2">Remote data loaded</td>
                      <td className="py-3 px-2 font-mono text-xs">options, searchTerm</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-2 font-mono text-primary">hybrid-select:error</td>
                      <td className="py-3 px-2">Fetch error occurred</td>
                      <td className="py-3 px-2 font-mono text-xs">error</td>
                    </tr>
                  </tbody>
                </table>
              </CardContent>
            </Card>

            <Subsection id="event-change" title="change Event">
              <CodeBlock code={`select.addEventListener('hybrid-select:change', (e) => {
  // Single select
  console.log(e.detail.value);          // 'US' or null
  console.log(e.detail.selectedOption); // Full option object
  
  // Multi-select
  console.log(e.detail.value);           // ['US', 'CA']
  console.log(e.detail.selectedOptions); // Array of option objects
  
  // Was this a clear action?
  console.log(e.detail.cleared);         // true if .clear() was called
  
  // All events include:
  console.log(e.detail.target);          // The hybrid-select element
  console.log(e.detail.name);            // The 'name' attribute value
});`} />
            </Subsection>

            <Subsection id="event-load" title="load Event">
              <CodeBlock code={`select.addEventListener('hybrid-select:load', (e) => {
  console.log('Search term:', e.detail.searchTerm);
  console.log('Results:', e.detail.options);
  console.log('Count:', e.detail.options.length);
});`} />
            </Subsection>
          </Section>

          {/* Theming */}
          <Section id="theming" title="CSS Theming" icon={Palette}>
            <p className="text-muted-foreground mb-6">
              Customize the component appearance using CSS custom properties.
            </p>

            <CodeBlock code={`hybrid-select {
  /* Typography */
  --hs-font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  --hs-font-size: 16px;
  --hs-font-size-label: 14px;
  --hs-font-size-helper: 12px;
  
  /* Light mode colors */
  --hs-bg: #ffffff;
  --hs-bg-hover: #f8f9fa;
  --hs-bg-selected: #e9ecef;
  --hs-bg-dropdown: #ffffff;
  --hs-text: #1a1a1a;
  --hs-text-secondary: #6c757d;
  --hs-text-placeholder: #9ca3af;
  
  /* Borders */
  --hs-border: #d1d5db;
  --hs-border-hover: #9ca3af;
  --hs-border-focus: #3b82f6;
  --hs-border-error: #ef4444;
  
  /* Focus ring */
  --hs-ring: rgba(59, 130, 246, 0.15);
  
  /* Sizing */
  --hs-radius: 8px;
  --hs-height: 48px;
  --hs-height-sm: 40px;
  --hs-height-lg: 56px;
  --hs-padding-x: 16px;
  --hs-icon-size: 18px;
  --hs-avatar-size: 32px;
  
  /* Effects */
  --hs-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  --hs-transition: 0.2s ease;
}`} />

            <Subsection id="dark-mode" title="Dark Mode">
              <p className="mb-4">The component automatically detects dark mode via CSS media query or explicit attribute.</p>
              <CodeBlock code={`<!-- Auto-detect from system preference -->
<hybrid-select></hybrid-select>

<!-- Force dark mode -->
<hybrid-select dark-mode></hybrid-select>

<!-- Force light mode (override system dark) -->
<hybrid-select light-mode></hybrid-select>`} />
            </Subsection>
          </Section>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>HybridSelect Web Component v2.0</p>
            <p className="mt-1">Works with React, Vue, Angular, Svelte, or plain HTML/JS</p>
          </div>
        </main>
      </div>
    </div>
  );
}

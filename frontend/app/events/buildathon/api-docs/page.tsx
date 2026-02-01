'use client';

import { useEffect, useState } from 'react';

// TypeScript interfaces for data structures
interface CustomerSchema {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  industry: string;
  joinedAt: string;
}

interface OrderItem {
  productId: number;
  quantity: number;
  price: number;
}

interface OrderSchema {
  id: number;
  customerId: number;
  orderDate: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  totalAmount: number;
  items: OrderItem[];
}

interface ProductSchema {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  rating: number;
  description: string;
}

// Example data for documentation
const customerExample: CustomerSchema = {
  id: 1,
  name: 'Acme Corp',
  email: 'contact@acme.com',
  phone: '+1-555-0101',
  address: '123 Innovation Drive, Tech City, TC 10001',
  industry: 'Technology',
  joinedAt: '2024-01-15',
};

const orderExample: OrderSchema = {
  id: 1,
  customerId: 1,
  orderDate: '2025-01-10',
  status: 'delivered',
  totalAmount: 1250.0,
  items: [
    { productId: 1, quantity: 2, price: 500.0 },
    { productId: 3, quantity: 1, price: 250.0 },
  ],
};

const productExample: ProductSchema = {
  id: 1,
  name: 'Pro Laptop X1',
  category: 'Electronics',
  price: 500.0,
  stock: 150,
  rating: 4.5,
  description: 'High-performance laptop for professionals',
};

type ActiveTab = 'overview' | 'customers' | 'orders' | 'products' | 'dashboard';

export default function BuildathonApiDocsPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);
  const [baseUrl, setBaseUrl] = useState('https://xianze.tech');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin);
    }
  }, []);

  const apiBase = `${baseUrl}/api/buildathon`;

  const copyToClipboard = (text: string, endpoint: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEndpoint(endpoint);
    setTimeout(() => setCopiedEndpoint(null), 2000);
  };

  const tabs: { key: ActiveTab; label: string; icon: string }[] = [
    { key: 'overview', label: 'Overview', icon: '📋' },
    { key: 'customers', label: 'Customers', icon: '👥' },
    { key: 'orders', label: 'Orders', icon: '📦' },
    { key: 'products', label: 'Products', icon: '🏷️' },
    { key: 'dashboard', label: 'Dashboard', icon: '📊' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-lg border-b border-purple-500/20">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">API Documentation</h1>
              <p className="text-purple-300 text-sm mt-1">Analytics Dashboard Challenge</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded-full border border-green-500/30">
                ● API LIVE
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="sticky top-[73px] z-40 bg-slate-900/90 backdrop-blur-md border-b border-purple-500/10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex overflow-x-auto scrollbar-hide gap-1 py-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                  activeTab === tab.key
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6 pb-20">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Challenge Brief */}
            <section className="bg-gradient-to-r from-purple-900/50 to-indigo-900/50 rounded-2xl p-6 border border-purple-500/20">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                Challenge Overview
              </h2>
              <div className="prose prose-invert max-w-none">
                <p className="text-gray-300 leading-relaxed">
                  Build a <strong className="text-purple-300">real-time analytics dashboard</strong>{' '}
                  that fetches data from our live API endpoints and presents meaningful insights
                  about an e-commerce platform. Your dashboard should demonstrate your ability to
                  work with APIs, process data, and create compelling visualizations.
                </p>
              </div>
            </section>

            {/* Time & Rules */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  Time Limit
                </h3>
                <p className="text-3xl font-bold text-purple-400">2 Hours</p>
                <p className="text-gray-400 text-sm mt-2">
                  Build and submit your dashboard within the time limit
                </p>
              </div>

              <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  Team Size
                </h3>
                <p className="text-3xl font-bold text-purple-400">1-4 Members</p>
                <p className="text-gray-400 text-sm mt-2">Solo or team participation allowed</p>
              </div>
            </div>

            {/* API Endpoints Summary */}
            <section className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                Available Endpoints
              </h2>
              <div className="space-y-3">
                {[
                  {
                    method: 'GET',
                    path: '/data/customers',
                    desc: 'Fetch customer records',
                  },
                  { method: 'GET', path: '/data/orders', desc: 'Fetch order data with items' },
                  { method: 'GET', path: '/data/products', desc: 'Fetch product catalog' },
                ].map((endpoint) => (
                  <div
                    key={endpoint.path}
                    className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 bg-slate-900/50 rounded-lg border border-slate-700/50"
                  >
                    <span className="inline-flex items-center px-2.5 py-1 bg-green-500/20 text-green-400 text-xs font-mono font-bold rounded w-fit">
                      {endpoint.method}
                    </span>
                    <code className="text-purple-300 font-mono text-sm break-all">
                      {apiBase}
                      {endpoint.path}
                    </code>
                    <span className="text-gray-500 text-sm sm:ml-auto">{endpoint.desc}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Constraints */}
            <section className="bg-red-950/30 rounded-2xl p-6 border border-red-500/20">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                Constraints & Rules
              </h2>
              <ul className="space-y-3">
                {[
                  'Rate limit: 60 requests per minute per endpoint',
                  'All endpoints are read-only (GET requests only)',
                  'No authentication required for data endpoints',
                  'Data is static but endpoints may be toggled on/off by admins',
                  'CORS is enabled - you can call from any origin',
                  'Response format is always JSON with { success: true, data: [...] }',
                ].map((rule, i) => (
                  <li key={i} className="flex items-start gap-3 text-gray-300">
                    <span className="text-red-400 mt-0.5">•</span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Tech Stack Suggestions */}
            <section className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                Suggested Tech Stack
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { name: 'React', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
                  { name: 'Vue.js', color: 'bg-green-500/20 text-green-300 border-green-500/30' },
                  {
                    name: 'Vanilla JS',
                    color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
                  },
                  { name: 'Chart.js', color: 'bg-pink-500/20 text-pink-300 border-pink-500/30' },
                  {
                    name: 'Tailwind CSS',
                    color: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
                  },
                  { name: 'D3.js', color: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
                  { name: 'Next.js', color: 'bg-white/10 text-white border-white/20' },
                  {
                    name: 'Recharts',
                    color: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
                  },
                ].map((tech) => (
                  <div
                    key={tech.name}
                    className={`px-3 py-2 rounded-lg text-sm font-medium text-center border ${tech.color}`}
                  >
                    {tech.name}
                  </div>
                ))}
              </div>
              <p className="text-gray-400 text-sm mt-4">
                You can use any frontend framework or vanilla JavaScript. Focus on data
                visualization and user experience.
              </p>
            </section>
          </div>
        )}

        {/* Customers Tab */}
        {activeTab === 'customers' && (
          <div className="space-y-6">
            <EndpointCard
              method="GET"
              path="/data/customers"
              baseUrl={apiBase}
              description="Retrieve all customer records from the e-commerce platform."
              onCopy={copyToClipboard}
              copied={copiedEndpoint === 'customers'}
            />

            <section className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
              <h3 className="text-lg font-semibold text-white mb-4">📊 Response Schema</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="py-3 px-4 text-purple-300 font-semibold">Field</th>
                      <th className="py-3 px-4 text-purple-300 font-semibold">Type</th>
                      <th className="py-3 px-4 text-purple-300 font-semibold">Description</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-300">
                    <tr className="border-b border-slate-700/50">
                      <td className="py-3 px-4 font-mono text-cyan-300">id</td>
                      <td className="py-3 px-4 text-yellow-300">number</td>
                      <td className="py-3 px-4">Unique customer identifier</td>
                    </tr>
                    <tr className="border-b border-slate-700/50">
                      <td className="py-3 px-4 font-mono text-cyan-300">name</td>
                      <td className="py-3 px-4 text-yellow-300">string</td>
                      <td className="py-3 px-4">Customer/company name</td>
                    </tr>
                    <tr className="border-b border-slate-700/50">
                      <td className="py-3 px-4 font-mono text-cyan-300">email</td>
                      <td className="py-3 px-4 text-yellow-300">string</td>
                      <td className="py-3 px-4">Contact email address</td>
                    </tr>
                    <tr className="border-b border-slate-700/50">
                      <td className="py-3 px-4 font-mono text-cyan-300">phone</td>
                      <td className="py-3 px-4 text-yellow-300">string</td>
                      <td className="py-3 px-4">Contact phone number</td>
                    </tr>
                    <tr className="border-b border-slate-700/50">
                      <td className="py-3 px-4 font-mono text-cyan-300">address</td>
                      <td className="py-3 px-4 text-yellow-300">string</td>
                      <td className="py-3 px-4">Full address with city and zip</td>
                    </tr>
                    <tr className="border-b border-slate-700/50">
                      <td className="py-3 px-4 font-mono text-cyan-300">industry</td>
                      <td className="py-3 px-4 text-yellow-300">string</td>
                      <td className="py-3 px-4">
                        Business sector (Technology, Retail, Healthcare, etc.)
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-mono text-cyan-300">joinedAt</td>
                      <td className="py-3 px-4 text-yellow-300">string (date)</td>
                      <td className="py-3 px-4">Customer registration date (YYYY-MM-DD)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <ExampleResponseCard example={customerExample} title="Example Customer Object" />

            <InsightsCard
              title="Dashboard Ideas for Customers"
              ideas={[
                'Customer distribution by industry (pie/bar chart)',
                'Customer acquisition timeline (line chart by joinedAt)',
                'Geographic distribution based on addresses',
                'Total customer count KPI card',
                'Searchable customer directory table',
              ]}
            />
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <EndpointCard
              method="GET"
              path="/data/orders"
              baseUrl={apiBase}
              description="Retrieve all orders with their items and status information."
              onCopy={copyToClipboard}
              copied={copiedEndpoint === 'orders'}
            />

            <section className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
              <h3 className="text-lg font-semibold text-white mb-4">📊 Response Schema</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="py-3 px-4 text-purple-300 font-semibold">Field</th>
                      <th className="py-3 px-4 text-purple-300 font-semibold">Type</th>
                      <th className="py-3 px-4 text-purple-300 font-semibold">Description</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-300">
                    <tr className="border-b border-slate-700/50">
                      <td className="py-3 px-4 font-mono text-cyan-300">id</td>
                      <td className="py-3 px-4 text-yellow-300">number</td>
                      <td className="py-3 px-4">Unique order identifier</td>
                    </tr>
                    <tr className="border-b border-slate-700/50">
                      <td className="py-3 px-4 font-mono text-cyan-300">customerId</td>
                      <td className="py-3 px-4 text-yellow-300">number</td>
                      <td className="py-3 px-4">Reference to customer who placed the order</td>
                    </tr>
                    <tr className="border-b border-slate-700/50">
                      <td className="py-3 px-4 font-mono text-cyan-300">orderDate</td>
                      <td className="py-3 px-4 text-yellow-300">string (date)</td>
                      <td className="py-3 px-4">Date when order was placed (YYYY-MM-DD)</td>
                    </tr>
                    <tr className="border-b border-slate-700/50">
                      <td className="py-3 px-4 font-mono text-cyan-300">status</td>
                      <td className="py-3 px-4 text-yellow-300">enum</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex flex-wrap gap-1">
                          {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(
                            (s) => (
                              <code key={s} className="px-1.5 py-0.5 bg-slate-700 rounded text-xs">
                                {s}
                              </code>
                            )
                          )}
                        </span>
                      </td>
                    </tr>
                    <tr className="border-b border-slate-700/50">
                      <td className="py-3 px-4 font-mono text-cyan-300">totalAmount</td>
                      <td className="py-3 px-4 text-yellow-300">number</td>
                      <td className="py-3 px-4">Total order value in USD</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-mono text-cyan-300">items</td>
                      <td className="py-3 px-4 text-yellow-300">array</td>
                      <td className="py-3 px-4">
                        Array of order items with{' '}
                        <code className="text-xs bg-slate-700 px-1 rounded">productId</code>,{' '}
                        <code className="text-xs bg-slate-700 px-1 rounded">quantity</code>,{' '}
                        <code className="text-xs bg-slate-700 px-1 rounded">price</code>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <ExampleResponseCard example={orderExample} title="Example Order Object" />

            <InsightsCard
              title="Dashboard Ideas for Orders"
              ideas={[
                'Total revenue and average order value KPIs',
                'Order status distribution (pie chart)',
                'Revenue over time (line/area chart by orderDate)',
                'Top customers by order value',
                'Order fulfillment funnel (pending → delivered)',
                'Items per order analysis',
              ]}
            />
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <EndpointCard
              method="GET"
              path="/data/products"
              baseUrl={apiBase}
              description="Retrieve the complete product catalog with pricing and stock info."
              onCopy={copyToClipboard}
              copied={copiedEndpoint === 'products'}
            />

            <section className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
              <h3 className="text-lg font-semibold text-white mb-4">Response Schema</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="py-3 px-4 text-purple-300 font-semibold">Field</th>
                      <th className="py-3 px-4 text-purple-300 font-semibold">Type</th>
                      <th className="py-3 px-4 text-purple-300 font-semibold">Description</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-300">
                    <tr className="border-b border-slate-700/50">
                      <td className="py-3 px-4 font-mono text-cyan-300">id</td>
                      <td className="py-3 px-4 text-yellow-300">number</td>
                      <td className="py-3 px-4">Unique product identifier</td>
                    </tr>
                    <tr className="border-b border-slate-700/50">
                      <td className="py-3 px-4 font-mono text-cyan-300">name</td>
                      <td className="py-3 px-4 text-yellow-300">string</td>
                      <td className="py-3 px-4">Product name</td>
                    </tr>
                    <tr className="border-b border-slate-700/50">
                      <td className="py-3 px-4 font-mono text-cyan-300">category</td>
                      <td className="py-3 px-4 text-yellow-300">string</td>
                      <td className="py-3 px-4">
                        Product category (Electronics, Accessories, Audio, etc.)
                      </td>
                    </tr>
                    <tr className="border-b border-slate-700/50">
                      <td className="py-3 px-4 font-mono text-cyan-300">price</td>
                      <td className="py-3 px-4 text-yellow-300">number</td>
                      <td className="py-3 px-4">Unit price in USD</td>
                    </tr>
                    <tr className="border-b border-slate-700/50">
                      <td className="py-3 px-4 font-mono text-cyan-300">stock</td>
                      <td className="py-3 px-4 text-yellow-300">number</td>
                      <td className="py-3 px-4">Available inventory count</td>
                    </tr>
                    <tr className="border-b border-slate-700/50">
                      <td className="py-3 px-4 font-mono text-cyan-300">rating</td>
                      <td className="py-3 px-4 text-yellow-300">number</td>
                      <td className="py-3 px-4">Average customer rating (1.0 - 5.0)</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-mono text-cyan-300">description</td>
                      <td className="py-3 px-4 text-yellow-300">string</td>
                      <td className="py-3 px-4">Product description text</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <ExampleResponseCard example={productExample} title="Example Product Object" />

            <InsightsCard
              title="Dashboard Ideas for Products"
              ideas={[
                'Products by category (pie/bar chart)',
                'Price range distribution (histogram)',
                'Stock level alerts (low stock warnings)',
                'Top rated products leaderboard',
                'Inventory value by category',
                'Product catalog with search/filter',
              ]}
            />
          </div>
        )}

        {/* Dashboard Requirements Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Scoring Criteria */}
            <section className="bg-gradient-to-r from-purple-900/50 to-indigo-900/50 rounded-2xl p-6 border border-purple-500/20">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                Judging Criteria
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  {
                    title: 'Data Integration',
                    points: 25,
                    desc: 'Successfully fetch and display data from all 3 endpoints',
                  },
                  {
                    title: 'Visualizations',
                    points: 25,
                    desc: 'Creative and meaningful charts/graphs that tell a story',
                  },
                  {
                    title: 'UI/UX Design',
                    points: 20,
                    desc: 'Clean, responsive, and user-friendly interface',
                  },
                  {
                    title: 'Insights & Analysis',
                    points: 15,
                    desc: 'Derive meaningful insights from the data',
                  },
                  {
                    title: 'Code Quality',
                    points: 10,
                    desc: 'Clean, organized, and readable code structure',
                  },
                  {
                    title: 'Innovation',
                    points: 5,
                    desc: 'Unique features or creative approaches',
                  },
                ].map((criteria) => (
                  <div
                    key={criteria.title}
                    className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-white">{criteria.title}</h4>
                      <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-sm font-bold rounded">
                        {criteria.points} pts
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm">{criteria.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Required Features */}
            <section className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                Required Features
              </h2>
              <ul className="space-y-3">
                {[
                  'Display at least 3 different visualizations (charts/graphs)',
                  'Show key KPIs: Total Revenue, Total Customers, Total Orders, Total Products',
                  'Implement data from all 3 API endpoints',
                  'Responsive design that works on mobile and desktop',
                  'Loading states while fetching data',
                  'Error handling for API failures',
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-gray-300">
                    <span className="text-green-400 mt-0.5">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Bonus Features */}
            <section className="bg-amber-950/30 rounded-2xl p-6 border border-amber-500/20">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                Bonus Features (Extra Points)
              </h2>
              <ul className="space-y-3">
                {[
                  'Real-time data refresh with auto-polling',
                  'Interactive filters (date range, category, status)',
                  'Dark/Light theme toggle',
                  'Export data or charts functionality',
                  'Customer-Order-Product relationship analysis',
                  'Animated transitions and micro-interactions',
                  'Performance optimizations (caching, lazy loading)',
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-gray-300">
                    <span className="text-amber-400 mt-0.5">★</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Sample Dashboard Layout */}
            <section className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                Sample Dashboard Layout
              </h2>
              <div className="grid grid-cols-4 gap-2 text-xs">
                {/* KPI Row */}
                <div className="col-span-4 grid grid-cols-4 gap-2">
                  {['Revenue', 'Customers', 'Orders', 'Products'].map((kpi) => (
                    <div
                      key={kpi}
                      className="p-3 bg-purple-900/30 rounded-lg border border-purple-500/20 text-center"
                    >
                      <div className="text-purple-300 font-medium">{kpi}</div>
                      <div className="text-white font-bold mt-1">KPI Card</div>
                    </div>
                  ))}
                </div>
                {/* Charts Row */}
                <div className="col-span-4 sm:col-span-2 p-4 bg-blue-900/20 rounded-lg border border-blue-500/20 min-h-[100px] flex items-center justify-center">
                  <span className="text-blue-300">Revenue Chart</span>
                </div>
                <div className="col-span-4 sm:col-span-2 p-4 bg-green-900/20 rounded-lg border border-green-500/20 min-h-[100px] flex items-center justify-center">
                  <span className="text-green-300">Status Pie Chart</span>
                </div>
                {/* Table Row */}
                <div className="col-span-4 p-4 bg-slate-700/30 rounded-lg border border-slate-600/30 min-h-[80px] flex items-center justify-center">
                  <span className="text-gray-400">Data Table (Orders/Customers)</span>
                </div>
              </div>
              <p className="text-gray-400 text-sm mt-4">
                This is just a suggestion. Feel free to be creative with your layout!
              </p>
            </section>

            {/* Submission Instructions */}
            <section className="bg-green-950/30 rounded-2xl p-6 border border-green-500/20">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                Submission Instructions
              </h2>
              <ol className="space-y-3 list-decimal list-inside text-gray-300">
                <li>Ensure your dashboard is running and accessible</li>
                <li>Prepare a brief demo (2-3 minutes) explaining your approach</li>
                <li>Be ready to show your code and explain key decisions</li>
                <li>Submit before the timer ends - late submissions won&apos;t be accepted</li>
              </ol>
            </section>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-t border-purple-500/20 py-3 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-sm">
          <span className="text-gray-400">XIANZE - Buildathon 2026</span>
          <span className="text-purple-400 font-medium">Good luck!</span>
        </div>
      </footer>
    </div>
  );
}

// Reusable Components

interface EndpointCardProps {
  method: string;
  path: string;
  baseUrl: string;
  description: string;
  onCopy: (text: string, id: string) => void;
  copied: boolean;
}

function EndpointCard({ method, path, baseUrl, description, onCopy, copied }: EndpointCardProps) {
  const fullUrl = `${baseUrl}${path}`;
  const id = path.split('/').pop() || path;

  return (
    <section className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <span className="inline-flex items-center px-3 py-1.5 bg-green-500/20 text-green-400 text-sm font-mono font-bold rounded-lg w-fit">
          {method}
        </span>
        <code className="text-purple-300 font-mono text-sm sm:text-base break-all">{fullUrl}</code>
      </div>
      <p className="text-gray-400 mb-4">{description}</p>
      <button
        onClick={() => onCopy(fullUrl, id)}
        className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
          copied
            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
            : 'bg-purple-600 text-white hover:bg-purple-700'
        }`}
      >
        {copied ? '✓ Copied!' : '📋 Copy URL'}
      </button>
    </section>
  );
}

interface ExampleResponseCardProps {
  example: CustomerSchema | OrderSchema | ProductSchema;
  title: string;
}

function ExampleResponseCard({ example, title }: ExampleResponseCardProps) {
  const response = {
    success: true,
    data: [example],
  };

  return (
    <section className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      <div className="bg-slate-900 rounded-xl p-4 overflow-x-auto">
        <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap break-words">
          {JSON.stringify(response, null, 2)}
        </pre>
      </div>
    </section>
  );
}

interface InsightsCardProps {
  title: string;
  ideas: string[];
}

function InsightsCard({ title, ideas }: InsightsCardProps) {
  return (
    <section className="bg-indigo-950/30 rounded-2xl p-6 border border-indigo-500/20">
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      <ul className="space-y-2">
        {ideas.map((idea, i) => (
          <li key={i} className="flex items-start gap-3 text-gray-300">
            <span className="text-indigo-400 mt-0.5">→</span>
            <span>{idea}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

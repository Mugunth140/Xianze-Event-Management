import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Buildathon Challenge Docs | Xianze 2026',
  description:
    'Documentation and requirements for the Xianze 2026 Buildathon Challenge: Trendy Threads Business Dashboard.',
};

export default function BuildathonDocs() {
  const baseUrl = "xianze.tech";
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans text-gray-900 mt-10">
      <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="bg-indigo-600 px-8 py-10 text-white">
          <h1 className="text-4xl font-bold mb-2">Buildathon Challenge</h1>
          <h2 className="text-2xl font-light opacity-90">Trendy Threads – Business Dashboard</h2>
        </div>

        <div className="p-8 space-y-12">
          {/* Rules & Regulations */}
          <section>
            <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <span className="bg-indigo-100 text-indigo-600 p-2 rounded-lg mr-3">📜</span>
              Rules & Regulations
            </h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 leading-relaxed">
              <li>
                Each team must consist of <strong>2 to 4 members</strong>.
              </li>
              <li>
                The prototype must be completed within the <strong>2-hour time limit</strong>.
              </li>
              <li>
                Use of pre-existing projects, templates, or modules is <strong>not allowed</strong>.
              </li>
              <li>All work must be done during the buildathon period.</li>
            </ul>
          </section>

          {/* Instructions */}
          <section>
            <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <span className="bg-indigo-100 text-indigo-600 p-2 rounded-lg mr-3">🛠️</span>
              Instructions
            </h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 leading-relaxed">
              <li>
                Participants must build a prototype using <strong>only the provided APIs</strong>.
              </li>
              <li>The solution should follow the given problem scenario and required pages.</li>
            </ul>

            <div className="mt-6 bg-indigo-50 p-6 rounded-xl border border-indigo-100">
              <h4 className="font-semibold text-indigo-800 mb-3">Judging Criteria</h4>
              <div className="grid grid-cols-2 gap-4 text-indigo-900">
                <div className="flex items-center">✨ Creativity</div>
                <div className="flex items-center">🎨 UI/UX design</div>
                <div className="flex items-center">✅ Correct implementation</div>
                <div className="flex items-center">📊 Clarity of data</div>
              </div>
            </div>
          </section>

          {/* Scenario */}
          <section>
            <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <span className="bg-indigo-100 text-indigo-600 p-2 rounded-lg mr-3">📖</span>
              Scenario
            </h3>
            <div className="prose text-gray-700 leading-relaxed">
              <p className="mb-4">
                <strong>Ravi</strong> is the owner of <strong>Trendy Threads</strong>, a growing
                costume store. He wants a simple website that helps him:
              </p>
              <ul className="list-disc pl-6 space-y-1 mb-4">
                <li>See which products are selling well</li>
                <li>Identify loyal customers</li>
                <li>Track pending and delayed orders</li>
                <li>Monitor low stock items</li>
              </ul>
              <p className="bg-yellow-50 p-4 border-l-4 border-yellow-400 rounded-r-md">
                <strong>Your task:</strong> Build a 3-page web application that gives Ravi a clear
                overview of his business. All data will be provided through APIs.
              </p>
            </div>
          </section>

          {/* Mandatory Pages */}
          <section>
            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <span className="bg-indigo-100 text-indigo-600 p-2 rounded-lg mr-3">📄</span>
              Pages to Build (Mandatory)
            </h3>

            <div className="space-y-8">
              {/* Landing Page */}
              <div className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                <h4 className="text-xl font-bold text-indigo-700 mb-2">1️⃣ Landing Page</h4>
                <p className="text-sm text-gray-500 mb-4 uppercase tracking-wide font-semibold">
                  Purpose: Introduce the store
                </p>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h5 className="font-semibold text-gray-900 mb-2">Must Contain:</h5>
                    <ul className="list-disc pl-5 space-y-1 text-gray-700 text-sm">
                      <li>
                        Store name: <strong>Trendy Threads</strong>
                      </li>
                      <li>A short welcome message / tagline</li>
                      <li>
                        Section for <strong>3–5 trending products</strong>
                      </li>
                      <li>Navigation buttons (Product Page, Dashboard Page)</li>
                    </ul>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600 flex items-center justify-center italic">
                    &quot;This page should feel simple, friendly, and professional.&quot;
                  </div>
                </div>
              </div>

              {/* Product Page */}
              <div className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                <h4 className="text-xl font-bold text-indigo-700 mb-2">2️⃣ Product Page</h4>
                <p className="text-sm text-gray-500 mb-4 uppercase tracking-wide font-semibold">
                  Purpose: Show all products
                </p>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h5 className="font-semibold text-gray-900 mb-2">Must Contain:</h5>
                    <ul className="list-disc pl-5 space-y-1 text-gray-700 text-sm">
                      <li>List of all products</li>
                      <li>Product name, Price, Stock available</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-semibold text-green-700 mb-2">Optional (Extra Credit):</h5>
                    <div className="flex gap-2">
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        Search
                      </span>
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        Filter
                      </span>
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        Sort
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dashboard Page */}
              <div className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                <h4 className="text-xl font-bold text-indigo-700 mb-2">3️⃣ Dashboard Page</h4>
                <p className="text-sm text-gray-500 mb-4 uppercase tracking-wide font-semibold">
                  Purpose: Business Overview
                </p>

                <h5 className="font-semibold text-gray-900 mb-3">Must verify these 6 sections:</h5>
                <div className="grid grid-cols-1 gap-4 text-sm">
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="font-bold text-gray-800 mb-1">
                      1. Total Products Sold per Product
                    </div>
                    <p className="text-gray-600 mb-1">
                      Shows how many units of each product have been sold so far.
                    </p>
                    <p className="text-xs text-indigo-600 font-medium">
                      Helps Ravi understand which products are performing well.
                    </p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="font-bold text-gray-800 mb-1">2. Revenue per Product</div>
                    <p className="text-gray-600 mb-1">
                      Shows how much money each product has generated.
                    </p>
                    <p className="text-xs text-indigo-600 font-medium">
                      Helps Ravi identify high-earning products.
                    </p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="font-bold text-gray-800 mb-1">
                      3. Pending vs Completed Orders
                    </div>
                    <p className="text-gray-600 mb-1">
                      Shows the total number of orders that are still pending and those that are
                      completed.
                    </p>
                    <p className="text-xs text-indigo-600 font-medium">
                      Helps Ravi track order fulfillment status.
                    </p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="font-bold text-gray-800 mb-1">4. Low Stock Products</div>
                    <p className="text-gray-600 mb-1">
                      Shows products that are running low on available stock.
                    </p>
                    <p className="text-xs text-indigo-600 font-medium">
                      Helps Ravi know when to restock items.
                    </p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="font-bold text-gray-800 mb-1">5. Delayed Orders</div>
                    <p className="text-gray-600 mb-1">
                      Shows orders that have crossed their expected delivery date but are still not
                      completed.
                    </p>
                    <p className="text-xs text-indigo-600 font-medium">
                      Helps Ravi identify delivery issues.
                    </p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="font-bold text-gray-800 mb-1">6. Top Customers by Revenue</div>
                    <p className="text-gray-600 mb-1">
                      Shows the customers who have spent the most money.
                    </p>
                    <p className="text-xs text-indigo-600 font-medium">
                      Helps Ravi recognize his most valuable customers.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* General Guidelines & Not Required */}
          <div className="grid md:grid-cols-2 gap-8">
            <section>
              <h3 className="text-lg font-bold text-gray-800 mb-3">General Guidelines</h3>
              <ul className="list-disc pl-5 space-y-1 text-gray-700 text-sm">
                <li>
                  Use data from provided APIs <strong>only</strong>.
                </li>
                <li>UI should be clean, easy to read, business-oriented.</li>
                <li>Use tables, cards, or charts.</li>
                <li>
                  Focus on <strong>clarity</strong> over decoration.
                </li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-bold text-red-600 mb-3">What is NOT Required</h3>
              <ul className="list-disc pl-5 space-y-1 text-gray-700 text-sm">
                <li>❌ No authentication</li>
                <li>❌ No payment system</li>
                <li>❌ No backend development</li>
                <li>❌ No complex animations</li>
              </ul>
            </section>
          </div>

          <section className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white text-center">
            <h3 className="text-xl font-bold mb-2">Goal of the Challenge</h3>
            <p className="opacity-90 max-w-2xl mx-auto">
              By the end, Ravi should be able to open the dashboard, instantly understand his
              store&apos;s performance, and spot problems without digging through raw data. <br />
              <strong>Turn data into insight.</strong>
            </p>
          </section>

          {/* APIs */}
          <section>
            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <span className="bg-indigo-100 text-indigo-600 p-2 rounded-lg mr-3">🔌</span>
              Provided APIs
            </h3>

            <div className="space-y-6">
              {/* Customers API */}
              <div className="bg-slate-900 text-slate-50 rounded-lg overflow-hidden shadow-lg border border-slate-800">
                <div className="p-4 border-b border-slate-700 bg-slate-800/50 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                  <div>
                    <div className="text-slate-400 text-xs uppercase mb-1 font-bold tracking-wider">
                      API 1: Customers
                    </div>
                    <div className="flex items-center font-mono text-sm bg-slate-950/50 px-3 py-1.5 rounded-md border border-slate-700/50">
                      <span className="text-green-400 mr-3 font-bold">GET</span>
                      <span className="text-slate-200 select-all">
                        {baseUrl}/api/buildathon/data/customers
                      </span>
                    </div>
                  </div>
                  <div className="self-start sm:self-center">
                    <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-1 rounded border border-slate-600">
                      JSON Array
                    </span>
                  </div>
                </div>
                <div className="p-4 bg-slate-900 overflow-x-auto relative group">
                  <div className="absolute top-2 right-2 text-[10px] text-slate-500 font-mono uppercase tracking-widest pointer-events-none group-hover:text-slate-400 transition-colors">
                    Structure
                  </div>
                  <pre className="text-xs sm:text-sm text-blue-300 font-mono leading-relaxed">
                    {`[
  {
    "id": "number",
    "name": "string",
    "city": "string",
    "mobile": "string",
    "address": "string",
    "joinedAt": "string (YYYY-MM-DD)"
  },
  ...
]`}
                  </pre>
                </div>
              </div>

              {/* Products API */}
              <div className="bg-slate-900 text-slate-50 rounded-lg overflow-hidden shadow-lg border border-slate-800">
                <div className="p-4 border-b border-slate-700 bg-slate-800/50 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                  <div>
                    <div className="text-slate-400 text-xs uppercase mb-1 font-bold tracking-wider">
                      API 2: Products
                    </div>
                    <div className="flex items-center font-mono text-sm bg-slate-950/50 px-3 py-1.5 rounded-md border border-slate-700/50">
                      <span className="text-green-400 mr-3 font-bold">GET</span>
                      <span className="text-slate-200 select-all">
                        {baseUrl}/api/buildathon/data/products
                      </span>
                    </div>
                  </div>
                  <div className="self-start sm:self-center">
                    <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-1 rounded border border-slate-600">
                      JSON Array
                    </span>
                  </div>
                </div>
                <div className="p-4 bg-slate-900 overflow-x-auto relative group">
                  <div className="absolute top-2 right-2 text-[10px] text-slate-500 font-mono uppercase tracking-widest pointer-events-none group-hover:text-slate-400 transition-colors">
                    Structure
                  </div>
                  <pre className="text-xs sm:text-sm text-blue-300 font-mono leading-relaxed">
                    {`[
  {
    "id": "number",
    "name": "string",
    "price": "number",
    "stock": "number",
    "sold": "number",
    "image": "string (URL)"
  },
  ...
]`}
                  </pre>
                </div>
              </div>

              {/* Orders API */}
              <div className="bg-slate-900 text-slate-50 rounded-lg overflow-hidden shadow-lg border border-slate-800">
                <div className="p-4 border-b border-slate-700 bg-slate-800/50 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                  <div>
                    <div className="text-slate-400 text-xs uppercase mb-1 font-bold tracking-wider">
                      API 3: Orders
                    </div>
                    <div className="flex items-center font-mono text-sm bg-slate-950/50 px-3 py-1.5 rounded-md border border-slate-700/50">
                      <span className="text-green-400 mr-3 font-bold">GET</span>
                      <span className="text-slate-200 select-all">
                        {baseUrl}/api/buildathon/data/orders
                      </span>
                    </div>
                  </div>
                  <div className="self-start sm:self-center">
                    <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-1 rounded border border-slate-600">
                      JSON Array
                    </span>
                  </div>
                </div>
                <div className="p-4 bg-slate-900 overflow-x-auto relative group">
                  <div className="absolute top-2 right-2 text-[10px] text-slate-500 font-mono uppercase tracking-widest pointer-events-none group-hover:text-slate-400 transition-colors">
                    Structure
                  </div>
                  <pre className="text-xs sm:text-sm text-blue-300 font-mono leading-relaxed">
                    {`[
  {
    "orderId": "number",
    "customerId": "number",
    "productId": "number",
    "orderDate": "string (YYYY-MM-DD)",
    "deliveryDate": "string (YYYY-MM-DD)",
    "status": "string ('Pending' | 'Completed')"
  },
  ...
]`}
                  </pre>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="bg-gray-50 px-8 py-6 border-t border-gray-100 text-center text-sm text-gray-500">
          Good luck teams! 🚀
        </div>
      </div>
    </div>
  );
}

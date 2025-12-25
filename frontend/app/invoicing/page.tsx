'use client'
import React from 'react'
import dynamic from 'next/dynamic'
import { FileText, CheckCircle, Clock, AlertCircle, Plus } from 'lucide-react'

const ApexChart = dynamic(() => import('../components/ApexChart'), { ssr: false })

const invoiceChartOptions = {
  chart: {
    type: 'area' as const,
    toolbar: { show: false },
    zoom: { enabled: false },
  },
  dataLabels: { enabled: false },
  stroke: { curve: 'smooth' as const, width: 2 },
  fill: {
    type: 'gradient',
    gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.1 }
  },
  colors: ['#348fe2', '#00acac'],
  xaxis: {
    categories: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    labels: { style: { colors: '#929ba1' } },
  },
  yaxis: { labels: { style: { colors: '#929ba1' } } },
  legend: { position: 'top' as const, horizontalAlign: 'right' as const },
  grid: { borderColor: '#e5e5e5', strokeDashArray: 3 },
}

const invoiceSeries = [
  { name: 'Sent', data: [45, 52, 48, 55, 60, 65] },
  { name: 'Paid', data: [42, 48, 45, 50, 54, 58] },
]

export default function InvoicingPage() {
  const stats = [
    { label: 'TOTAL INVOICES', value: '185', icon: <FileText size={36} />, change: 'This month', bg: 'bg-teal' },
    { label: 'PAID', value: '145', icon: <CheckCircle size={36} />, change: '$234,500', bg: 'bg-green' },
    { label: 'PENDING', value: '32', icon: <Clock size={36} />, change: '$67,800', bg: 'bg-orange' },
    { label: 'OVERDUE', value: '8', icon: <AlertCircle size={36} />, change: '$12,400', bg: 'bg-red' },
  ]

  const invoices = [
    { id: 'INV-001', customer: 'Acme Corporation', amount: '$2,450', status: 'Paid', date: 'Dec 20, 2024', dueDate: 'Dec 25, 2024' },
    { id: 'INV-002', customer: 'Global Industries', amount: '$5,800', status: 'Pending', date: 'Dec 19, 2024', dueDate: 'Jan 05, 2025' },
    { id: 'INV-003', customer: 'Tech Solutions', amount: '$1,200', status: 'Paid', date: 'Dec 18, 2024', dueDate: 'Dec 23, 2024' },
    { id: 'INV-004', customer: 'City Plaza', amount: '$3,600', status: 'Overdue', date: 'Dec 01, 2024', dueDate: 'Dec 15, 2024' },
    { id: 'INV-005', customer: 'Metro Apartments', amount: '$4,200', status: 'Pending', date: 'Dec 17, 2024', dueDate: 'Jan 01, 2025' },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold" style={{ color: 'var(--foreground)' }}>Invoicing</h1>
          <span className="text-sm" style={{ color: 'var(--foreground-muted)' }}>Manage invoices and payments</span>
        </div>
        <button className="btn btn-primary flex items-center gap-2">
          <Plus size={16} />
          Create Invoice
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className={`widget ${stat.bg} text-white rounded overflow-hidden`}>
            <div className="widget-stats relative p-4">
              <div className="stats-icon absolute right-4 top-1/2 -translate-y-1/2 opacity-30">
                {stat.icon}
              </div>
              <div className="stats-info">
                <h4 className="text-xs font-semibold opacity-80 mb-1">{stat.label}</h4>
                <p className="text-2xl font-light">{stat.value}</p>
              </div>
            </div>
            <div className="stats-link">
              <a href="#" className="block px-4 py-2 text-xs bg-black/20 hover:bg-black/30 text-white/80 hover:text-white">
                {stat.change} <span className="ml-1">→</span>
              </a>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 panel">
          <div className="panel-heading flex items-center justify-between">
            <span>Invoice Trend</span>
            <div className="flex gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-orange-400"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
            </div>
          </div>
          <div className="panel-body">
            <ApexChart
              options={invoiceChartOptions}
              series={invoiceSeries}
              type="area"
              height={280}
            />
          </div>
        </div>

        <div className="panel">
          <div className="panel-heading">Invoice Summary</div>
          <div className="panel-body space-y-3">
            {[
              { label: 'Total Revenue', value: '$314,700', color: 'var(--foreground)' },
              { label: 'Collected', value: '$234,500', color: '#00acac' },
              { label: 'Outstanding', value: '$80,200', color: '#f59c1a' },
              { label: 'Overdue', value: '$12,400', color: '#ff5b57' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between p-3 rounded" style={{ background: 'var(--background-secondary)' }}>
                <span className="text-sm" style={{ color: 'var(--foreground-muted)' }}>{item.label}</span>
                <span className="font-semibold" style={{ color: item.color }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-heading flex items-center justify-between">
          <span>Recent Invoices</span>
          <div className="flex gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-orange-400"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
          </div>
        </div>
        <div className="panel-body p-0">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice ID</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Due Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td style={{ color: 'var(--teal)', fontWeight: 500 }}>{invoice.id}</td>
                  <td>{invoice.customer}</td>
                  <td style={{ fontWeight: 500 }}>{invoice.amount}</td>
                  <td style={{ color: 'var(--foreground-muted)' }}>{invoice.date}</td>
                  <td style={{ color: 'var(--foreground-muted)' }}>{invoice.dueDate}</td>
                  <td>
                    <span className={`badge ${
                      invoice.status === 'Paid' ? 'badge-teal' :
                      invoice.status === 'Pending' ? 'badge-orange' : 'badge-red'
                    }`}>
                      {invoice.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

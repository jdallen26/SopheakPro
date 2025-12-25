'use client'
import React from 'react'
import dynamic from 'next/dynamic'
import { BarChart3, TrendingUp, FileBarChart, Download } from 'lucide-react'

const ApexChart = dynamic(() => import('../components/ApexChart'), { ssr: false })

const revenueChartOptions = {
  chart: { type: 'line' as const, toolbar: { show: false } },
  dataLabels: { enabled: false },
  stroke: { curve: 'smooth' as const, width: 3 },
  colors: ['#348fe2'],
  xaxis: {
    categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    labels: { style: { colors: '#929ba1' } },
  },
  yaxis: {
    labels: {
      style: { colors: '#929ba1' },
      formatter: (value: number) => `$${(value / 1000).toFixed(0)}k`,
    },
  },
  grid: { borderColor: '#e5e5e5', strokeDashArray: 3 },
}

const revenueSeries = [{ name: 'Revenue', data: [45000, 52000, 48000, 61000, 55000, 67000, 72000, 69000, 74000, 78000, 82000, 88000] }]

const performanceChartOptions = {
  chart: { type: 'bar' as const, toolbar: { show: false } },
  plotOptions: { bar: { horizontal: false, borderRadius: 4 } },
  dataLabels: { enabled: false },
  colors: ['#348fe2', '#929ba1'],
  xaxis: {
    categories: ['Cleaning', 'Maintenance', 'Security', 'Admin'],
    labels: { style: { colors: '#929ba1' } },
  },
  yaxis: { labels: { style: { colors: '#929ba1' } } },
  legend: { position: 'top' as const },
  grid: { borderColor: '#e5e5e5' },
}

const performanceSeries = [
  { name: 'Efficiency', data: [94, 88, 96, 91] },
  { name: 'Target', data: [90, 90, 90, 90] },
]

export default function ReportsPage() {
  const reports = [
    { name: 'Monthly Revenue Report', type: 'Financial', lastRun: 'Dec 20, 2024', icon: <TrendingUp size={20} /> },
    { name: 'Payroll Summary', type: 'HR', lastRun: 'Dec 19, 2024', icon: <FileBarChart size={20} /> },
    { name: 'Customer Analysis', type: 'Sales', lastRun: 'Dec 18, 2024', icon: <BarChart3 size={20} /> },
    { name: 'Route Efficiency', type: 'Operations', lastRun: 'Dec 17, 2024', icon: <BarChart3 size={20} /> },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-semibold" style={{ color: 'var(--foreground)' }}>Reports</h1>
        <span className="text-sm" style={{ color: 'var(--foreground-muted)' }}>View and generate business reports</span>
      </div>

      <div className="panel">
        <div className="panel-heading flex items-center justify-between">
          <span>Available Reports</span>
          <div className="flex gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-orange-400"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
          </div>
        </div>
        <div className="panel-body">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {reports.map((report) => (
              <div
                key={report.name}
                className="p-4 rounded cursor-pointer transition-colors"
                style={{ background: 'var(--background-secondary)', border: '1px solid var(--border-color)' }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--teal)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 rounded" style={{ background: 'var(--active-bg)' }}>
                    <span style={{ color: 'var(--teal)' }}>{report.icon}</span>
                  </div>
                  <button className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700">
                    <Download size={16} style={{ color: 'var(--foreground-muted)' }} />
                  </button>
                </div>
                <div className="font-medium text-sm" style={{ color: 'var(--foreground)' }}>{report.name}</div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs" style={{ color: 'var(--foreground-muted)' }}>{report.type}</span>
                  <span className="text-xs" style={{ color: 'var(--foreground-muted)' }}>{report.lastRun}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="panel">
          <div className="panel-heading flex items-center justify-between">
            <span>Revenue Trend</span>
            <div className="flex gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-orange-400"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
            </div>
          </div>
          <div className="panel-body">
            <ApexChart
              options={revenueChartOptions}
              series={revenueSeries}
              type="line"
              height={280}
            />
          </div>
        </div>

        <div className="panel">
          <div className="panel-heading flex items-center justify-between">
            <span>Department Performance</span>
            <div className="flex gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-orange-400"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
            </div>
          </div>
          <div className="panel-body">
            <ApexChart
              options={performanceChartOptions}
              series={performanceSeries}
              type="bar"
              height={280}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

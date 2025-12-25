'use client'
import React from 'react'
import dynamic from 'next/dynamic'
import { Route, MapPin, Truck, Clock } from 'lucide-react'

const ApexChart = dynamic(() => import('../components/ApexChart'), { ssr: false })

const routeChartOptions = {
  chart: { type: 'donut' as const },
  labels: ['Route A', 'Route B', 'Route C', 'Route D', 'Route E'],
  colors: ['#00acac', '#348fe2', '#f59c1a', '#727cb6', '#ff5b57'],
  legend: { position: 'right' as const },
  dataLabels: { enabled: false },
  plotOptions: {
    pie: {
      donut: {
        size: '70%',
      },
    },
  },
}

const routeSeries = [25, 22, 18, 15, 20]

export default function RoutingPage() {
  const stats = [
    { label: 'ACTIVE ROUTES', value: '12', icon: <Route size={36} />, change: '100% operational', bg: 'bg-teal' },
    { label: 'SITES COVERED', value: '312', icon: <MapPin size={36} />, change: 'All areas', bg: 'bg-blue' },
    { label: 'DRIVERS ON DUTY', value: '28', icon: <Truck size={36} />, change: '4 on break', bg: 'bg-orange' },
    { label: 'AVG ROUTE TIME', value: '4.2 hrs', icon: <Clock size={36} />, change: '-12 min', bg: 'bg-green' },
  ]

  const routes = [
    { name: 'Route A', driver: 'Mike Johnson', sites: 25, status: 'In Progress', efficiency: 98 },
    { name: 'Route B', driver: 'Sarah Williams', sites: 22, status: 'Completed', efficiency: 95 },
    { name: 'Route C', driver: 'Tom Anderson', sites: 18, status: 'In Progress', efficiency: 92 },
    { name: 'Route D', driver: 'Lisa Chen', sites: 15, status: 'Not Started', efficiency: 88 },
    { name: 'Route E', driver: 'James Brown', sites: 20, status: 'Completed', efficiency: 96 },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-semibold" style={{ color: 'var(--foreground)' }}>Routing</h1>
        <span className="text-sm" style={{ color: 'var(--foreground-muted)' }}>Manage routes and drivers</span>
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
            <span>Route Performance</span>
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
                  <th>Route</th>
                  <th>Driver</th>
                  <th>Sites</th>
                  <th>Status</th>
                  <th>Efficiency</th>
                </tr>
              </thead>
              <tbody>
                {routes.map((route) => (
                  <tr key={route.name}>
                    <td style={{ color: 'var(--teal)', fontWeight: 500 }}>{route.name}</td>
                    <td>{route.driver}</td>
                    <td>{route.sites}</td>
                    <td>
                      <span className={`badge ${
                        route.status === 'Completed' ? 'badge-teal' :
                        route.status === 'In Progress' ? 'badge-blue' : 'badge-orange'
                      }`}>
                        {route.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full" style={{ background: 'var(--border-color)' }}>
                          <div
                            className="h-1.5 rounded-full"
                            style={{
                              width: `${route.efficiency}%`,
                              background: route.efficiency >= 95 ? '#00acac' : route.efficiency >= 90 ? '#348fe2' : '#f59c1a'
                            }}
                          />
                        </div>
                        <span className="text-xs" style={{ color: 'var(--foreground-muted)' }}>{route.efficiency}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <div className="panel-heading flex items-center justify-between">
            <span>Route Distribution</span>
            <div className="flex gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-orange-400"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
            </div>
          </div>
          <div className="panel-body flex items-center justify-center">
            <ApexChart
              options={routeChartOptions}
              series={routeSeries}
              type="donut"
              height={220}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

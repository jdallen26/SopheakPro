'use client'
import React from 'react'
import { Building2, MapPin, Star, Phone, Search, Plus } from 'lucide-react'

export default function CustomersPage() {
  const stats = [
    { label: 'TOTAL CUSTOMERS', value: '248', icon: <Building2 size={36} />, change: '+12 this month', bg: 'bg-teal' },
    { label: 'ACTIVE SITES', value: '312', icon: <MapPin size={36} />, change: '98% active', bg: 'bg-blue' },
    { label: 'AVG RATING', value: '4.8', icon: <Star size={36} />, change: 'Out of 5.0', bg: 'bg-orange' },
    { label: 'CONTACT REQUESTS', value: '15', icon: <Phone size={36} />, change: 'Pending', bg: 'bg-red' },
  ]

  const customers = [
    { id: 'C001', name: 'Acme Corporation', type: 'Commercial', sites: 12, status: 'Active', contact: 'John Smith' },
    { id: 'C002', name: 'Global Industries', type: 'Industrial', sites: 8, status: 'Active', contact: 'Sarah Johnson' },
    { id: 'C003', name: 'City Plaza Mall', type: 'Commercial', sites: 5, status: 'Pending', contact: 'Mike Davis' },
    { id: 'C004', name: 'Tech Solutions Inc', type: 'Commercial', sites: 3, status: 'Active', contact: 'Lisa Wong' },
    { id: 'C005', name: 'Metro Apartments', type: 'Residential', sites: 15, status: 'Active', contact: 'Tom Brown' },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold" style={{ color: 'var(--foreground)' }}>Customers</h1>
          <span className="text-sm" style={{ color: 'var(--foreground-muted)' }}>Manage your customer database</span>
        </div>
        <button className="btn btn-primary flex items-center gap-2">
          <Plus size={16} />
          Add Customer
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

      <div className="panel">
        <div className="panel-heading flex items-center justify-between">
          <span>Customer List</span>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded" style={{ background: 'var(--background-secondary)' }}>
              <Search size={14} style={{ color: 'var(--foreground-muted)' }} />
              <input
                type="text"
                placeholder="Search..."
                className="bg-transparent border-none outline-none text-sm"
                style={{ color: 'var(--foreground)', width: '120px' }}
              />
            </div>
            <div className="flex gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-orange-400"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
            </div>
          </div>
        </div>
        <div className="panel-body p-0">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Company Name</th>
                <th>Type</th>
                <th>Sites</th>
                <th>Contact</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id}>
                  <td style={{ color: 'var(--teal)', fontWeight: 500 }}>{customer.id}</td>
                  <td style={{ fontWeight: 500 }}>{customer.name}</td>
                  <td>
                    <span className="badge badge-blue">{customer.type}</span>
                  </td>
                  <td>{customer.sites}</td>
                  <td style={{ color: 'var(--foreground-muted)' }}>{customer.contact}</td>
                  <td>
                    <span className={`badge ${customer.status === 'Active' ? 'badge-teal' : 'badge-orange'}`}>
                      {customer.status}
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

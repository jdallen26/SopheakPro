'use client'
import React from 'react'
import { Users, UserPlus, Clock, Award, Briefcase } from 'lucide-react'

export default function HRPage() {
  const stats = [
    { label: 'TOTAL EMPLOYEES', value: '156', icon: <Users size={36} />, change: '+3 this month', bg: 'bg-teal' },
    { label: 'NEW HIRES', value: '8', icon: <UserPlus size={36} />, change: 'Last 30 days', bg: 'bg-blue' },
    { label: 'AVG TENURE', value: '2.4 yrs', icon: <Clock size={36} />, change: '+0.2 yrs', bg: 'bg-orange' },
    { label: 'TRAINING COMPLETE', value: '94%', icon: <Award size={36} />, change: '+2%', bg: 'bg-green' },
  ]

  const departments = [
    { name: 'Cleaning', employees: 65, manager: 'John Smith' },
    { name: 'Maintenance', employees: 42, manager: 'Sarah Johnson' },
    { name: 'Security', employees: 28, manager: 'Mike Davis' },
    { name: 'Administration', employees: 21, manager: 'Lisa Wong' },
  ]

  const recentHires = [
    { name: 'Alex Thompson', position: 'Cleaning Technician', department: 'Cleaning', startDate: 'Dec 18, 2024' },
    { name: 'Maria Garcia', position: 'Maintenance Worker', department: 'Maintenance', startDate: 'Dec 15, 2024' },
    { name: 'James Wilson', position: 'Security Guard', department: 'Security', startDate: 'Dec 10, 2024' },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-semibold" style={{ color: 'var(--foreground)' }}>Human Resources</h1>
        <span className="text-sm" style={{ color: 'var(--foreground-muted)' }}>Manage employees and departments</span>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="panel">
          <div className="panel-heading flex items-center justify-between">
            <span>Departments</span>
            <div className="flex gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-orange-400"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
            </div>
          </div>
          <div className="panel-body space-y-3">
            {departments.map((dept) => (
              <div
                key={dept.name}
                className="flex items-center justify-between p-3 rounded"
                style={{ background: 'var(--background-secondary)' }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded flex items-center justify-center bg-teal text-white">
                    <Briefcase size={18} />
                  </div>
                  <div>
                    <div className="font-medium" style={{ color: 'var(--foreground)' }}>{dept.name}</div>
                    <div className="text-xs" style={{ color: 'var(--foreground-muted)' }}>Manager: {dept.manager}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold" style={{ color: 'var(--teal)' }}>{dept.employees}</div>
                  <div className="text-xs" style={{ color: 'var(--foreground-muted)' }}>employees</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-heading flex items-center justify-between">
            <span>Recent Hires</span>
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
                  <th>Name</th>
                  <th>Position</th>
                  <th>Start Date</th>
                </tr>
              </thead>
              <tbody>
                {recentHires.map((hire) => (
                  <tr key={hire.name}>
                    <td style={{ fontWeight: 500 }}>{hire.name}</td>
                    <td>
                      <div>{hire.position}</div>
                      <div className="text-xs" style={{ color: 'var(--foreground-muted)' }}>{hire.department}</div>
                    </td>
                    <td style={{ color: 'var(--foreground-muted)' }}>{hire.startDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

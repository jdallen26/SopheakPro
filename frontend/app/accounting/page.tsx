'use client'
import React from 'react'
import { Calculator, TrendingUp, TrendingDown, FileText, DollarSign } from 'lucide-react'

export default function AccountingPage() {
  const stats = [
    { label: 'TOTAL ASSETS', value: '$1.2M', icon: <Calculator size={36} />, change: '+5.2%', bg: 'bg-teal' },
    { label: 'LIABILITIES', value: '$450K', icon: <TrendingDown size={36} />, change: '-2.1%', bg: 'bg-blue' },
    { label: 'REVENUE YTD', value: '$890K', icon: <TrendingUp size={36} />, change: '+12.8%', bg: 'bg-orange' },
    { label: 'OPEN INVOICES', value: '45', icon: <FileText size={36} />, change: '+8 new', bg: 'bg-red' },
  ]

  const transactions = [
    { id: 'TXN-001', description: 'Service Payment - Acme Corp', type: 'Income', amount: '+$2,450', date: 'Dec 20, 2024' },
    { id: 'TXN-002', description: 'Payroll Processing', type: 'Expense', amount: '-$15,200', date: 'Dec 19, 2024' },
    { id: 'TXN-003', description: 'Equipment Purchase', type: 'Expense', amount: '-$3,500', date: 'Dec 18, 2024' },
    { id: 'TXN-004', description: 'Client Invoice - Tech Solutions', type: 'Income', amount: '+$5,800', date: 'Dec 17, 2024' },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-semibold" style={{ color: 'var(--foreground)' }}>Accounting</h1>
        <span className="text-sm" style={{ color: 'var(--foreground-muted)' }}>Manage your financial records</span>
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
          <span>Recent Transactions</span>
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
                <th>Transaction ID</th>
                <th>Description</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((txn) => (
                <tr key={txn.id}>
                  <td style={{ color: 'var(--teal)', fontWeight: 500 }}>{txn.id}</td>
                  <td>{txn.description}</td>
                  <td>
                    <span className={`badge ${txn.type === 'Income' ? 'badge-teal' : 'badge-orange'}`}>
                      {txn.type}
                    </span>
                  </td>
                  <td style={{ color: txn.amount.startsWith('+') ? '#00acac' : '#ff5b57', fontWeight: 500 }}>
                    {txn.amount}
                  </td>
                  <td style={{ color: 'var(--foreground-muted)' }}>{txn.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

'use client'
import React, { useState } from 'react'
import { User, Bell, Shield, CreditCard, Truck, Image, Globe, Sliders, RotateCcw } from 'lucide-react'

const tabs = [
  { id: 'general', label: 'General', icon: <User size={16} /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell size={16} /> },
  { id: 'privacy', label: 'Privacy and security', icon: <Shield size={16} /> },
  { id: 'payment', label: 'Payment', icon: <CreditCard size={16} /> },
  { id: 'shipping', label: 'Shipping', icon: <Truck size={16} /> },
  { id: 'media', label: 'Media and Files', icon: <Image size={16} /> },
  { id: 'languages', label: 'Languages', icon: <Globe size={16} /> },
  { id: 'system', label: 'System', icon: <Sliders size={16} /> },
  { id: 'reset', label: 'Reset settings', icon: <RotateCcw size={16} /> },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general')
  const [formData, setFormData] = useState({
    name: 'Sean Ngu',
    username: '@seantheme',
    phone: '+1-203-555-0183',
    email: 'support@seantheme.com',
    password: '••••••••••',
  })

  const [notifications, setNotifications] = useState({
    comments: true,
    tags: false,
    reminders: true,
    newOrders: true,
  })

  const [privacy, setPrivacy] = useState({
    futurePostsVisibility: 'friends',
    photoTagging: true,
    locationInfo: false,
  })

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-semibold" style={{ color: 'var(--foreground)' }}>Settings Page</h1>
        <span className="text-sm" style={{ color: 'var(--foreground-muted)' }}>header small text goes here...</span>
      </div>

      <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--foreground-muted)' }}>
        <span>Home</span> / <span>Extra</span> / <span style={{ color: 'var(--foreground)' }}>Settings Page</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        <div className="lg:col-span-1">
          <div className="panel">
            <div className="panel-body p-0">
              <nav className="flex flex-col">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="flex items-center gap-3 px-4 py-3 text-left text-sm transition-colors"
                    style={{
                      background: activeTab === tab.id ? 'var(--active-bg)' : 'transparent',
                      color: activeTab === tab.id ? 'var(--teal)' : 'var(--foreground)',
                      borderLeft: activeTab === tab.id ? '3px solid var(--teal)' : '3px solid transparent',
                    }}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          {activeTab === 'general' && (
            <div className="panel">
              <div className="panel-heading">
                <span className="font-semibold">General</span>
                <p className="text-xs mt-1" style={{ color: 'var(--foreground-muted)' }}>
                  View and update your general account information and settings.
                </p>
              </div>
              <div className="panel-body space-y-4">
                {[
                  { label: 'Name', key: 'name', value: formData.name },
                  { label: 'Username', key: 'username', value: formData.username },
                  { label: 'Phone', key: 'phone', value: formData.phone },
                  { label: 'Email address', key: 'email', value: formData.email },
                  { label: 'Password', key: 'password', value: formData.password },
                ].map((field) => (
                  <div
                    key={field.key}
                    className="flex items-center justify-between py-3"
                    style={{ borderBottom: '1px solid var(--border-color)' }}
                  >
                    <div>
                      <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{field.label}</div>
                      <div className="text-sm" style={{ color: 'var(--foreground-muted)' }}>{field.value}</div>
                    </div>
                    <button className="btn btn-default text-sm">Edit</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="panel">
              <div className="panel-heading">
                <span className="font-semibold">Notifications</span>
                <p className="text-xs mt-1" style={{ color: 'var(--foreground-muted)' }}>
                  Enable or disable what notifications you want to receive.
                </p>
              </div>
              <div className="panel-body space-y-4">
                {[
                  { key: 'comments', label: 'Comments', desc: 'Enabled (Push, SMS)' },
                  { key: 'tags', label: 'Tags', desc: 'Disabled' },
                  { key: 'reminders', label: 'Reminders', desc: 'Enabled (Push, Email, SMS)' },
                  { key: 'newOrders', label: 'New orders', desc: 'Enabled (Push, Email, SMS)' },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between py-3"
                    style={{ borderBottom: '1px solid var(--border-color)' }}
                  >
                    <div>
                      <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{item.label}</div>
                      <div className="text-xs flex items-center gap-1" style={{ color: 'var(--foreground-muted)' }}>
                        <span className={`w-2 h-2 rounded-full ${notifications[item.key as keyof typeof notifications] ? 'bg-teal' : 'bg-gray-400'}`}></span>
                        {item.desc}
                      </div>
                    </div>
                    <button className="btn btn-default text-sm">Edit</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="panel">
              <div className="panel-heading">
                <span className="font-semibold">Privacy and security</span>
                <p className="text-xs mt-1" style={{ color: 'var(--foreground-muted)' }}>
                  Limit the account visibility and the security settings for your website.
                </p>
              </div>
              <div className="panel-body space-y-4">
                <div
                  className="flex items-center justify-between py-3"
                  style={{ borderBottom: '1px solid var(--border-color)' }}
                >
                  <div>
                    <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Who can see your future posts?</div>
                    <div className="text-xs" style={{ color: 'var(--foreground-muted)' }}>Friends only</div>
                  </div>
                  <button className="btn btn-default text-sm">Edit</button>
                </div>
                <div
                  className="flex items-center justify-between py-3"
                  style={{ borderBottom: '1px solid var(--border-color)' }}
                >
                  <div>
                    <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Photo tagging</div>
                    <div className="text-xs flex items-center gap-1" style={{ color: 'var(--foreground-muted)' }}>
                      <span className="w-2 h-2 rounded-full bg-teal"></span>
                      Enabled
                    </div>
                  </div>
                  <button className="btn btn-default text-sm">Edit</button>
                </div>
                <div
                  className="flex items-center justify-between py-3"
                  style={{ borderBottom: '1px solid var(--border-color)' }}
                >
                  <div>
                    <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Location information</div>
                    <div className="text-xs flex items-center gap-1" style={{ color: 'var(--foreground-muted)' }}>
                      <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                      Disabled
                    </div>
                  </div>
                  <button className="btn btn-default text-sm">Edit</button>
                </div>
              </div>
            </div>
          )}

          {!['general', 'notifications', 'privacy'].includes(activeTab) && (
            <div className="panel">
              <div className="panel-heading">
                <span className="font-semibold">{tabs.find(t => t.id === activeTab)?.label}</span>
              </div>
              <div className="panel-body">
                <div className="text-center py-10" style={{ color: 'var(--foreground-muted)' }}>
                  <p>This section is coming soon.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

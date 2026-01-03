'use client'
import React from 'react'
import dynamic from 'next/dynamic'
import {DollarSign, Users, TrendingUp, Clock} from 'lucide-react'
import WeatherWidget from './components/WeatherWidget';

const ApexChart = dynamic(() => import('./components/ApexChart'), {ssr: false})

const areaChartOptions = {
    chart: {
        type: 'area' as const,
        toolbar: {show: false},
        zoom: {enabled: false},
    },
    dataLabels: {enabled: false},
    stroke: {curve: 'smooth' as const, width: 2},
    fill: {
        type: 'gradient',
        gradient: {
            shadeIntensity: 1,
            opacityFrom: 0.4,
            opacityTo: 0.1,
        }
    },
    colors: ['#348fe2', '#00acac'],
    xaxis: {
        categories: ['May 16', 'May 19', 'May 22', 'May 25', 'May 28', 'May 31'],
        labels: {style: {colors: '#929ba1'}},
    },
    yaxis: {
        labels: {style: {colors: '#929ba1'}},
    },
    legend: {position: 'top' as const, horizontalAlign: 'right' as const},
    grid: {borderColor: '#e5e5e5', strokeDashArray: 3},
    tooltip: {theme: 'light'},
}

const areaSeries = [
    {name: 'Page Views', data: [45, 52, 38, 75, 62, 80]},
    {name: 'Visitors', data: [35, 41, 55, 45, 48, 55]},
]

const donutChartOptions = {
    chart: {type: 'donut' as const},
    labels: ['Chrome', 'Firefox', 'Safari', 'Opera', 'IE'],
    colors: ['#348fe2', '#f59c1a', '#00acac', '#727cb6', '#ff5b57'],
    legend: {position: 'right' as const},
    dataLabels: {enabled: false},
    plotOptions: {
        pie: {
            donut: {
                size: '70%',
                labels: {
                    show: true,
                    total: {
                        show: true,
                        label: 'Total',
                        formatter: () => '54%',
                    },
                },
            },
        },
    },
}

const donutSeries = [30, 25, 20, 15, 10]

const barChartOptions = {
    chart: {type: 'bar' as const, toolbar: {show: false}},
    plotOptions: {bar: {horizontal: true, borderRadius: 4}},
    dataLabels: {enabled: false},
    colors: ['#00acac'],
    xaxis: {
        categories: ['Direct', 'Organic', 'Referral', 'Social'],
        labels: {style: {colors: '#929ba1'}},
    },
    yaxis: {labels: {style: {colors: '#929ba1'}}},
    grid: {borderColor: '#e5e5e5'},
}

const barSeries = [{name: 'Traffic', data: [28.2, 40.5, 8.1, 23.2]}]

export default function DashboardPage() {
    const sources = [
        {name: 'Direct', percent: 28.2, trend: 'up'},
        {name: 'Organic', percent: 40.5, trend: 'up'},
        {name: 'Referral', percent: 8.1, trend: 'down'},
        {name: 'Social', percent: 23.2, trend: 'up'},
    ]

    return (
        <div className="space-y-5">
            <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold" style={{color: 'var(--foreground)'}}>Dashboard</h1>
                <span className="text-sm"
                      style={{color: 'var(--foreground-muted)'}}>header small text goes here...</span>
            </div>

            <div className="flex items-center gap-2">
                <WeatherWidget />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5"
                style={{marginTop: '4px'}}
            >
                <div className="lg:col-span-2 panel">
                    <div className="panel-heading flex items-center justify-between">
                        <span>Website Analytics (Last 7 Days)</span>
                        <div className="flex gap-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                            <span className="w-2.5 h-2.5 rounded-full bg-orange-400"></span>
                            <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                        </div>
                    </div>
                    <div className="panel-body">
                        <ApexChart
                            options={areaChartOptions}
                            series={areaSeries}
                            type="area"
                            height={280}
                        />
                    </div>
                </div>

                <div className="panel">
                    <div className="panel-heading flex items-center justify-between">
                        <span>Analytics Details</span>
                        <div className="flex gap-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                            <span className="w-2.5 h-2.5 rounded-full bg-orange-400"></span>
                            <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                        </div>
                    </div>
                    <div className="panel-body">
                        <table className="w-full text-sm">
                            <thead>
                            <tr style={{borderBottom: '1px solid var(--border-color)'}}>
                                <th className="text-left py-2 font-semibold" style={{color: 'var(--foreground)'}}>Source
                                </th>
                                <th className="text-right py-2 font-semibold" style={{color: 'var(--foreground)'}}>Total
                                </th>
                                <th className="text-right py-2 font-semibold" style={{color: 'var(--foreground)'}}>Trend
                                </th>
                            </tr>
                            </thead>
                            <tbody>
                            {sources.map((s) => (
                                <tr key={s.name} style={{borderBottom: '1px solid var(--border-color)'}}>
                                    <td className="py-2" style={{color: 'var(--foreground-secondary)'}}>{s.name}</td>
                                    <td className="py-2 text-right" style={{color: 'var(--foreground)'}}>{s.percent}%
                                    </td>
                                    <td className="py-2 text-right">
                      <span style={{color: s.trend === 'up' ? '#00acac' : '#ff5b57'}}>
                        {s.trend === 'up' ? '↑' : '↓'}
                      </span>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>

                        <div className="mt-4 grid grid-cols-2 gap-3">
                            <div className="p-3 rounded" style={{background: 'var(--background-secondary)'}}>
                                <div className="text-xs font-semibold" style={{color: 'var(--foreground-muted)'}}>Total
                                    Page Views
                                </div>
                                <div className="text-lg font-semibold" style={{color: 'var(--foreground)'}}>1,230,000
                                </div>
                            </div>
                            <div className="p-3 rounded" style={{background: 'var(--background-secondary)'}}>
                                <div className="text-xs font-semibold" style={{color: 'var(--foreground-muted)'}}>Avg
                                    Time
                                    On Site
                                </div>
                                <div className="text-lg font-semibold" style={{color: 'var(--foreground)'}}>00:03:45
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5"
                style={{marginTop: '4px'}}
            >
                <div className="panel">
                    <div className="panel-heading flex items-center justify-between">
                        <span>Traffic Sources</span>
                        <div className="flex gap-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                            <span className="w-2.5 h-2.5 rounded-full bg-orange-400"></span>
                            <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                        </div>
                    </div>
                    <div className="panel-body">
                        <ApexChart
                            options={barChartOptions}
                            series={barSeries}
                            type="bar"
                            height={220}
                        />
                    </div>
                </div>

                <div className="panel">
                    <div className="panel-heading flex items-center justify-between">
                        <span>Visitors User Agent</span>
                        <div className="flex gap-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                            <span className="w-2.5 h-2.5 rounded-full bg-orange-400"></span>
                            <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                        </div>
                    </div>
                    <div className="panel-body flex items-center justify-center">
                        <ApexChart
                            options={donutChartOptions}
                            series={donutSeries}
                            type="donut"
                            height={220}
                        />
                    </div>
                </div>
            </div>

            <div className="panel"
            style={{marginTop: '4px'}}
            >
                <div className="panel-heading flex items-center justify-between">
                    <span>Todo List</span>
                    <div className="flex gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-orange-400"></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                    </div>
                </div>
                <div className="panel-body">
                    <div className="space-y-2">
                        {[
                            {
                                text: 'Donec vehiculum pretium nisl, id lacinia nisl condimentum id',
                                done: true,
                                color: 'bg-teal'
                            },
                            {text: 'Duis a ullamcorper massa', done: false, color: 'bg-blue'},
                            {
                                text: 'Phasellus bibendum, odio nec vestibulum ullamcorper',
                                done: false,
                                color: 'bg-orange'
                            },
                            {text: 'Duis pharetra mi sit amet dictum cursus', done: false, color: 'bg-red'},
                        ].map((todo, i) => (
                            <div key={i} className="flex items-center gap-3 p-2 rounded"
                                 style={{background: 'var(--background-secondary)'}}>
                                <span className={`w-1.5 h-8 rounded ${todo.color}`}></span>
                                <input type="checkbox" checked={todo.done} readOnly className="w-4 h-4"/>
                                <span className={`flex-1 text-sm ${todo.done ? 'line-through opacity-50' : ''}`}
                                      style={{color: 'var(--foreground)'}}>
                  {todo.text}
                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

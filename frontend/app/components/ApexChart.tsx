'use client'
import dynamic from 'next/dynamic'
import type { ApexOptions } from 'apexcharts'

const ReactApexChart = dynamic(() => import('react-apexcharts').then(mod => mod.default), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full"><span>Loading chart...</span></div>
})

interface ApexChartProps {
  options: ApexOptions
  series: any
  type: 'line' | 'area' | 'bar' | 'pie' | 'donut' | 'radialBar' | 'scatter' | 'bubble' | 'heatmap' | 'candlestick' | 'boxPlot' | 'radar' | 'polarArea' | 'rangeBar' | 'rangeArea' | 'treemap'
  height?: number | string
  width?: number | string
}

export default function ApexChart({ options, series, type, height = 350, width = '100%' }: ApexChartProps) {
  return (
    <ReactApexChart
      options={options}
      series={series}
      type={type}
      height={height}
      width={width}
    />
  )
}

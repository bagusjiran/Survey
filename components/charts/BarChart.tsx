'use client'

import { Bar } from 'react-chartjs-2'
import { defaultBarOptions, chartColors } from '@/lib/chart-config'

interface BarChartProps {
  labels: string[]
  data: number[]
  title?: string
  horizontal?: boolean
}

export default function BarChart({ labels, data, title, horizontal }: BarChartProps) {
  const chartData = {
    labels,
    datasets: [{
      label: title || 'Data',
      data,
      backgroundColor: chartColors.slice(0, data.length),
      borderRadius: 6,
      borderSkipped: false,
    }],
  }

  const options = {
    ...defaultBarOptions,
    indexAxis: horizontal ? 'y' as const : 'x' as const,
  }

  return (
    <div style={{ height: horizontal ? Math.max(200, labels.length * 40) : 250 }}>
      <Bar data={chartData} options={options} />
    </div>
  )
}

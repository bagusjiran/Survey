'use client'

import { Pie, Doughnut } from 'react-chartjs-2'
import { defaultPieOptions, chartColors } from '@/lib/chart-config'

interface PieChartProps {
  labels: string[]
  data: number[]
  doughnut?: boolean
}

export default function PieChart({ labels, data, doughnut }: PieChartProps) {
  const chartData = {
    labels,
    datasets: [{
      data,
      backgroundColor: chartColors.slice(0, data.length),
      borderWidth: 2,
      borderColor: '#ffffff',
    }],
  }

  return (
    <div style={{ height: 280 }}>
      {doughnut
        ? <Doughnut data={chartData} options={defaultPieOptions} />
        : <Pie data={chartData} options={defaultPieOptions} />
      }
    </div>
  )
}

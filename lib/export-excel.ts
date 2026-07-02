import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

interface ExportColumn {
  header: string
  key: string
  width?: number
}

export function exportToExcel(
  data: any[],
  columns: ExportColumn[],
  filename: string
) {
  const worksheet = XLSX.utils.json_to_sheet(
    data.map(row => {
      const obj: any = {}
      columns.forEach(col => {
        obj[col.header] = row[col.key] ?? '-'
      })
      return obj
    })
  )

  // Set column widths
  const colWidths = columns.map(col => ({ wch: col.width || 20 }))
  worksheet['!cols'] = colWidths

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data')

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  saveAs(blob, filename + '.xlsx')
}

export function exportToCSV(data: any[], columns: ExportColumn[], filename: string) {
  const headers = columns.map(c => c.header).join(',')
  const rows = data.map(row =>
    columns.map(c => {
      const val = String(row[c.key] ?? '-')
      // Escape commas and quotes
      return val.includes(',') || val.includes('"')
        ? '"' + val.replace(/"/g, '""') + '"'
        : val
    }).join(',')
  )

  const csv = [headers, ...rows].join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  saveAs(blob, filename + '.csv')
}

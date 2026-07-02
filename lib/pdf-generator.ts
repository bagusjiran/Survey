import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface VoteDetail {
  voter: { full_name: string; nim: string }
  voted_for: { full_name: string; nim: string }
}

interface VoteCandidate {
  full_name: string
  nim: string
  vote_count: number
}

function addHeader(doc: jsPDF, title: string, subtitle: string) {
  doc.setFillColor(16, 185, 129)
  doc.rect(0, 0, 210, 35, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('Survey UKM Kerohanian Islam', 14, 15)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Universitas Teknologi Ronggolawe - Cepu', 14, 22)

  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text(title, 14, 30)

  doc.setTextColor(100, 100, 100)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(subtitle + '  |  Dicetak: ' + new Date().toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
  }), 14, 42)

  doc.setDrawColor(226, 232, 240)
  doc.line(14, 45, 196, 45)
}

function addFooter(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(148, 163, 184)
    doc.text('UKM Kerohanian Islam UTR Cepu - Halaman ' + i + ' dari ' + pageCount, 14, 290)
    doc.text('Dokumen ini bersifat rahasia', 196, 290, { align: 'right' })
  }
}

// PDF 1: Survey Anonim — fetch data langsung dari API (view=member)
export async function generateSurveyAnonymousPDF(agendaId: string, agendaTitle: string) {
  // Fetch anonymous data from API
  const res = await fetch('/api/responses?agendaId=' + agendaId + '&view=member')
  if (!res.ok) throw new Error('Gagal mengambil data survey')
  const data = await res.json()

  const responses: { question: { question_text: string; question_type: string }; answers: string[] }[] = data.responses || []
  const totalResponden: number = data.totalResponden || 0

  if (responses.length === 0) {
    alert('Belum ada jawaban survey untuk agenda ini')
    return
  }

  const doc = new jsPDF()
  addHeader(doc, 'Jawaban Survey - Anonim', 'Agenda: ' + agendaTitle + '  |  ' + totalResponden + ' responden')

  let y = 55

  responses.forEach((item, i) => {
    if (y > 250) {
      doc.addPage()
      y = 20
    }

    // Question
    doc.setFillColor(236, 253, 245)
    doc.roundedRect(14, y, 182, 8, 1, 1, 'F')
    doc.setTextColor(5, 150, 105)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text((i + 1) + '. ' + item.question.question_text, 18, y + 5.5)
    y += 12

    if (item.question.question_type === 'rating') {
      const ratings = item.answers.map((a: string) => parseInt(a)).filter((n: number) => !isNaN(n))
      const avg = ratings.length > 0 ? (ratings.reduce((s: number, n: number) => s + n, 0) / ratings.length).toFixed(1) : '-'
      doc.setTextColor(51, 65, 85)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.text('Rating rata-rata: ' + avg + ' / 5  (' + ratings.length + ' responden)', 18, y)
      y += 6

      for (let s = 5; s >= 1; s--) {
        const count = ratings.filter((n: number) => n === s).length
        const pct = ratings.length > 0 ? Math.round((count / ratings.length) * 100) : 0
        doc.text(s + ' bintang: ' + count + ' orang (' + pct + '%)', 18, y)
        y += 5
      }
    } else {
      if (item.answers.length === 0) {
        doc.setTextColor(148, 163, 184)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'italic')
        doc.text('Belum ada jawaban', 18, y)
        y += 6
      } else {
        const tableData = item.answers.map((ans: string, j: number) => [String(j + 1), ans || '-'])
        autoTable(doc, {
          startY: y,
          head: [['#', 'Jawaban']],
          body: tableData,
          margin: { left: 14, right: 14 },
          styles: { fontSize: 9, cellPadding: 3 },
          headStyles: { fillColor: [16, 185, 129], textColor: 255 },
          alternateRowStyles: { fillColor: [248, 250, 252] },
          columnStyles: { 0: { cellWidth: 10 } },
        })
        y = (doc as any).lastAutoTable.finalY + 8
      }
    }

    y += 4
  })

  addFooter(doc)
  doc.save('survey-anonim-' + agendaTitle.replace(/\s+/g, '-').toLowerCase() + '.pdf')
}

// PDF 2: Survey Lengkap (dengan nama pemberi jawaban)
export function generateSurveyFullPDF(
  agendaTitle: string,
  responses: any[],
  totalResponden: number
) {
  if (responses.length === 0) {
    alert('Belum ada jawaban survey untuk agenda ini')
    return
  }

  const doc = new jsPDF()
  addHeader(doc, 'Jawaban Survey - Lengkap', 'Agenda: ' + agendaTitle + '  |  ' + totalResponden + ' responden')

  const tableData: string[][] = []
  responses.forEach((entry: any) => {
    const name = entry.member?.full_name || 'Unknown'
    const nim = entry.member?.nim || '-'
    entry.answers.forEach((a: any) => {
      const answerText = a.question.question_type === 'rating'
        ? a.response_text + ' / 5'
        : (a.response_text || '-')
      tableData.push([name, nim, a.question.question_text, answerText])
    })
  })

  autoTable(doc, {
    startY: 55,
    head: [['Nama', 'NIM', 'Pertanyaan', 'Jawaban']],
    body: tableData,
    margin: { left: 14, right: 14 },
    styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak' },
    headStyles: { fillColor: [16, 185, 129], textColor: 255 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 22 },
      2: { cellWidth: 50 },
      3: { cellWidth: 79 },
    },
  })

  addFooter(doc)
  doc.save('survey-lengkap-' + agendaTitle.replace(/\s+/g, '-').toLowerCase() + '.pdf')
}

// PDF 3: Vote Anonim (hanya hasil perolehan)
export function generateVoteAnonymousPDF(
  agendaTitle: string,
  candidates: VoteCandidate[],
  totalVotes: number
) {
  if (candidates.length === 0) {
    alert('Belum ada vote untuk agenda ini')
    return
  }

  const doc = new jsPDF()
  addHeader(doc, 'Hasil Vote - Anonim', 'Agenda: ' + agendaTitle + '  |  ' + totalVotes + ' total vote')

  const maxVotes = candidates.length > 0 ? candidates[0].vote_count : 0

  const tableData = candidates.map((c, i) => {
    const pct = totalVotes > 0 ? ((c.vote_count / totalVotes) * 100).toFixed(1) : '0'
    const marker = c.vote_count === maxVotes && maxVotes > 0 ? ' *' : ''
    return [String(i + 1) + marker, c.full_name, String(c.vote_count), pct + '%']
  })

  autoTable(doc, {
    startY: 55,
    head: [['Peringkat', 'Nama Mahasiswa', 'Jumlah Vote', 'Persentase']],
    body: tableData,
    margin: { left: 14, right: 14 },
    styles: { fontSize: 10, cellPadding: 4 },
    headStyles: { fillColor: [16, 185, 129], textColor: 255 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 22, halign: 'center' },
      2: { cellWidth: 30, halign: 'center' },
      3: { cellWidth: 28, halign: 'center' },
    },
  })

  addFooter(doc)
  doc.save('vote-anonim-' + agendaTitle.replace(/\s+/g, '-').toLowerCase() + '.pdf')
}

// PDF 4: Vote Lengkap (siapa vote siapa)
export function generateVoteFullPDF(
  agendaTitle: string,
  votes: VoteDetail[],
  candidates: VoteCandidate[],
  totalVotes: number
) {
  const doc = new jsPDF()
  addHeader(doc, 'Hasil Vote - Detail Lengkap', 'Agenda: ' + agendaTitle + '  |  ' + totalVotes + ' total vote')

  // Section 1: Summary
  doc.setTextColor(30, 41, 59)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Ringkasan Perolehan Vote', 14, 55)

  const summaryData = candidates.map((c, i) => {
    const pct = totalVotes > 0 ? ((c.vote_count / totalVotes) * 100).toFixed(1) : '0'
    return [String(i + 1), c.full_name, c.nim, String(c.vote_count), pct + '%']
  })

  autoTable(doc, {
    startY: 59,
    head: [['#', 'Nama', 'NIM', 'Vote', '%']],
    body: summaryData,
    margin: { left: 14, right: 14 },
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [16, 185, 129], textColor: 255 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      3: { cellWidth: 18, halign: 'center' },
      4: { cellWidth: 18, halign: 'center' },
    },
  })

  // Section 2: Detail
  const detailY = (doc as any).lastAutoTable.finalY + 12
  doc.setTextColor(30, 41, 59)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Detail: Siapa Vote Siapa', 14, detailY)

  const detailData = votes.map((v, i) => [
    String(i + 1),
    v.voter.full_name,
    v.voter.nim,
    '->',
    v.voted_for.full_name,
    v.voted_for.nim,
  ])

  autoTable(doc, {
    startY: detailY + 4,
    head: [['#', 'Pemilih', 'NIM Pemilih', '', 'Dipilih', 'NIM Dipilih']],
    body: detailData,
    margin: { left: 14, right: 14 },
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [30, 41, 59], textColor: 255 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      3: { cellWidth: 10, halign: 'center', fontStyle: 'bold' },
    },
  })

  addFooter(doc)
  doc.save('vote-lengkap-' + agendaTitle.replace(/\s+/g, '-').toLowerCase() + '.pdf')
}
